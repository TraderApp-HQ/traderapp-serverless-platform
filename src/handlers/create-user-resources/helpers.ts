import log from "@dazn/lambda-powertools-logger";
import mongoose from "mongoose";
import { IQueueMessageBody } from "src/config/interfaces";
import { ICreateUserResourcesInput } from "src/types/wallets-service";
import WalletsService from "src/services/WalletsService";
// import { TradingEngineService } from "src/services/TradingEngineService";
import { MongoDBClient } from "src/clients/MongoDBClient";
import { TradingEngineServiceCollections } from "src/clients/MongoDBClient/constants";
import {
    ITradingRule,
    IUserTradingRule,
} from "src/services/TradingEngineService/interfaces";
import { SecretLocation } from "src/config/secrets/enums";
import { getSecrets } from "src/config/secrets/helpers";
import { ITradingEngineServiceSecrets } from "src/config/secrets/interfaces";

interface ICreateUserResourcesResult {
    successMessageIds: string[];
    failedMessageIds: string[];
}

/**
 * Creates default user trading rules based on platform trading rules
 */
async function createUserTradingRules(
    connection: mongoose.Connection,
    userId: string
): Promise<void> {
    try {
        const tradingRulesCollection = new MongoDBClient<ITradingRule>(
            connection,
            TradingEngineServiceCollections.tradingRules
        );

        const userTradingRulesCollection = new MongoDBClient<IUserTradingRule>(
            connection,
            TradingEngineServiceCollections.userTradingRules
        );

        // Get all platform trading rules
        const platformTradingRules = await tradingRulesCollection.findAll();

        if (platformTradingRules.length === 0) {
            log.warn("No platform trading rules found");
            return;
        }

        // Upsert user trading rules (insert if not exists, update if exists)
        await Promise.all(
            platformTradingRules.map(async (rule) => {
                const ruleId = (rule._id as mongoose.Types.ObjectId).toString();
                const userRuleData: Partial<IUserTradingRule> = {
                    userId,
                    ruleId,
                    name: rule.name,
                    description: rule.description,
                    tooltip: rule.tooltip,
                    category: rule.category,
                    type: rule.type,
                    value: rule.value,
                    isEnabled: rule.isEnabled,
                    updatedAt: new Date().toISOString(),
                };

                // Upsert: only update non-customized rules
                await userTradingRulesCollection.updateOne(
                    { userId, ruleId },
                    {
                        $set: userRuleData,
                        $setOnInsert: {
                            isCustomized: false,
                            lastResetToDefault: null,
                            createdAt: new Date().toISOString(),
                        },
                    },
                    { upsert: true }
                );
            })
        );

        log.info(`Upserted ${platformTradingRules.length} trading rules for user ${userId}`);
    } catch (error) {
        log.error("Error creating user trading rules:", { error, userId });
        throw error;
    }
}

/**
 * Creates all user resources: wallet and trading rules
 */
export async function createUserResources(
    queueMessages: IQueueMessageBody<ICreateUserResourcesInput>[]
): Promise<ICreateUserResourcesResult> {
    let tradingEngineConnection: mongoose.Connection | null = null;

    try {
        // Initialize trading engine connection for trading rules
        const env = process.env.ENV;
        const secrets = await getSecrets<ITradingEngineServiceSecrets>(
            `${SecretLocation.tradingEngineServiceSecrets}/${env}`
        );

        tradingEngineConnection = mongoose.createConnection(
            secrets.TRADING_ENGINE_SERVICE_DB_URL
        );

        // Wait for connection to be ready
        await new Promise<void>((resolve, reject) => {
            tradingEngineConnection!.on("connected", resolve);
            tradingEngineConnection!.on("error", reject);
        });

        const successMessageIds: string[] = [];
        const failedMessageIds: string[] = [];

        // Step 1: Create user wallets
        log.info("Creating user wallets...");
        const walletCreationResult = await WalletsService.createUserWallet(
            queueMessages
        );

        // Track wallet creation results
        const walletSuccessIds = new Set(walletCreationResult.successMessageIds);
        const walletFailedIds = new Set(walletCreationResult.failedMessageIds);

        log.info("Wallet creation completed", {
            success: walletSuccessIds.size,
            failed: walletFailedIds.size,
        });

        // Step 2: Create trading rules only for users whose wallets were created successfully
        const successfulUserMessages = queueMessages.filter((qm) =>
            walletSuccessIds.has(qm.messageId)
        );

        if (successfulUserMessages.length === 0) {
            log.warn("No successful wallet creations, skipping trading rules creation");
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((qm) => qm.messageId),
            };
        }

        log.info(`Creating trading rules for ${successfulUserMessages.length} users...`);

        // Create trading rules for each user in parallel
        const tradingRulesResults = await Promise.allSettled(
            successfulUserMessages.map(async (qm) => {
                try {
                    await createUserTradingRules(
                        tradingEngineConnection!,
                        qm.body.userId
                    );
                    return {
                        success: true,
                        messageId: qm.messageId,
                        userId: qm.body.userId,
                    };
                } catch (error) {
                    log.error("Failed to create trading rules for user", {
                        userId: qm.body.userId,
                        messageId: qm.messageId,
                        error,
                    });
                    return {
                        success: false,
                        messageId: qm.messageId,
                        userId: qm.body.userId,
                    };
                }
            })
        );

        // Process results
        tradingRulesResults.forEach((result) => {
            if (result.status === "fulfilled") {
                if (result.value.success) {
                    successMessageIds.push(result.value.messageId);
                } else {
                    failedMessageIds.push(result.value.messageId);
                }
            } else {
                log.error("Unexpected error in trading rules creation", {
                    error: result.reason,
                });
            }
        });

        // Add any messages that failed wallet creation
        walletFailedIds.forEach((id) => {
            if (!failedMessageIds.includes(id)) {
                failedMessageIds.push(id);
            }
        });

        log.info("User resources creation completed", {
            totalMessages: queueMessages.length,
            successfulResources: successMessageIds.length,
            failedResources: failedMessageIds.length,
        });

        return {
            successMessageIds,
            failedMessageIds,
        };
    } catch (error) {
        log.error("General error in createUserResources:", { error });
        return {
            successMessageIds: [],
            failedMessageIds: queueMessages.map((qm) => qm.messageId),
        };
    } finally {
        // Clean up connection
        if (tradingEngineConnection) {
            await tradingEngineConnection.close();
        }
    }
}