import log from "@dazn/lambda-powertools-logger";
import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { Currency, TradingPlatform } from "src/config/enums";
import { IQueueMessageBody } from "src/config/interfaces";
import { SecretLocation } from "src/config/secrets/enums";
import { getSecrets } from "src/config/secrets/helpers";
import { ITradingEngineServiceSecrets } from "src/config/secrets/interfaces";
import { IUserTradeAllocation } from "src/services/TradingEngineService/interfaces";
import { WalletsService } from "src/services/WalletsService";
import { IUserWallet, WalletType } from "src/types/wallets-service";

export const mapUserConnectedTradingPlatformToQueueUrl = async (
    platformName: string
) => {
    // Get secrets
    const env = process.env.ENV ?? "";
    const tradingEngineServiceSecrets =
        await getSecrets<ITradingEngineServiceSecrets>(
            `${SecretLocation.tradingEngineServiceSecrets}/${env}`
        );

    // Get process binance orders queue url
    const processBinanceOrdersQueue =
        tradingEngineServiceSecrets.PROCESS_BINANCE_ORDERS_QUEUE ?? "";

    // Map platform name to queue url
    switch (platformName) {
        case TradingPlatform.BINANCE:
            return processBinanceOrdersQueue;
        default:
            throw new Error(`Unsupported trading platform: ${platformName}`);
    }
};

export const processUserTrades = async (
    queueMessages: IQueueMessageBody<IUserTradeAllocation>[]
) => {
    try {
        const successMessageIds: string[] = [];
        const failedMessageIds: string[] = [];
        const insufficientBalanceUsers: Array<{
            userTrade: IUserTradeAllocation;
            wallet?: IUserWallet | null;
        }> = [];
        const walletsService = new WalletsService();

        // Process all queue messages in parallel
        const userTradeProcessingResults = await Promise.allSettled(
            queueMessages.map(async (queueMessage) => {
                try {
                    const userTrade = queueMessage.body;

                    // Compute total amount to lock
                    const { totalAmountToLock } =
                        walletsService.computeTotalAmountToLock({
                            entryPrice: userTrade.entryPrice,
                            takeProfitPrice: userTrade.takeProfitPrice,
                            tradeSide: userTrade.tradeSide,
                            tradeAmount: userTrade.tradeAmount,
                        });

                    // Get user wallet
                    const userWallet = await walletsService.getUserWallet({
                        userId: userTrade.userId,
                        currency: Currency.USDT,
                        walletType: WalletType.MAIN,
                    });

                    // If user wallet is not found or insufficient balance, push to insufficient balance array
                    if (
                        !userWallet ||
                        userWallet.availableBalance < totalAmountToLock
                    ) {
                        insufficientBalanceUsers.push({
                            userTrade,
                            wallet: userWallet,
                        });

                        return {
                            messageId: queueMessage.messageId,
                            userTrade,
                            isSuccess: false,
                        };
                    }

                    // Lock the balance if sufficient
                    const lockUserBalanceResult =
                        await walletsService.lockUserBalance({
                            userId: userTrade.userId,
                            amount: totalAmountToLock,
                            currency: Currency.USDT,
                            walletType: WalletType.MAIN,
                        });

                    // If lockUserBalanceResult is not successful, push to insufficient balance array
                    if (!lockUserBalanceResult.success) {
                        insufficientBalanceUsers.push({
                            userTrade,
                            wallet: lockUserBalanceResult.wallet,
                        });

                        return {
                            messageId: queueMessage.messageId,
                            userTrade,
                            isSuccess: false,
                        };
                    }
                    // TODO: Add a check to see if user has over 3 outstanding/unpaid invoices
                    // If so, push to insufficient balance array
                    // If not, publish message to queue

                    // Get queue url for user connected trading platform
                    const queueUrl =
                        await mapUserConnectedTradingPlatformToQueueUrl(
                            userTrade.platformName
                        );

                    // Publish message to queue to process binance orders
                    await publishMessageToQueue({
                        queueUrl,
                        message: JSON.stringify(userTrade),
                    });

                    return {
                        messageId: queueMessage.messageId,
                        userTrade,
                        isSuccess: true,
                    };
                } catch (error) {
                    log.error("Error processing user trade", {
                        error,
                        userId: queueMessage.body.userId,
                        masterTradeId: queueMessage.body.masterTradeId,
                    });

                    // This is a real error, should be marked as failed for retry
                    throw error;
                }
            })
        );

        // Process results
        userTradeProcessingResults.forEach((result) => {
            if (result.status === "fulfilled") {
                successMessageIds.push(result.value.messageId);
            } else {
                // Real errors should be retried
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        });

        // Send notifications for users with insufficient balance
        if (insufficientBalanceUsers.length > 0) {
            log.info("Users with insufficient balance found", {
                count: insufficientBalanceUsers.length,
                users: insufficientBalanceUsers,
            });

            // TODO: Send notification to users about insufficient balance
        }

        log.info("User trades processing completed", {
            totalProcessed: queueMessages.length,
            successful: successMessageIds.length,
            failed: failedMessageIds.length,
            insufficientBalance: insufficientBalanceUsers.length,
        });

        return { successMessageIds, failedMessageIds };
    } catch (error) {
        log.error("Critical error in processUserTrades", { error });
        return {
            successMessageIds: [],
            failedMessageIds: queueMessages.map((qm) => qm.messageId),
        };
    }
};
