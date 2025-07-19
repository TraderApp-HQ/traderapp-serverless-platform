// trade engine service

import mongoose from "mongoose";
import log from "@dazn/lambda-powertools-logger";
import { MongoDBClient } from "src/clients/MongoDBClient";
import { TradingEngineServiceCollections } from "src/clients/MongoDBClient/constants";
import {
    ITrade,
    // IOrder,
    // IOrderBatch,
    // ITradingRule,
    IUserTradingRule,
    IUserTradingAccount,
    IUserTradingAccountBalance,
    IProcessUserTradingWithActiveSignalEvent,
} from "./interfaces";
import {
    // OrderStatus,
    OrderType,
    OrderPlacementType,
    TradeStatus,
    TradeSide,
    // OrderBatchStatus,
    TradingRuleCategory,
    Exchange,
    AccountConnectionStatus,
    TradingRuleName,
} from "./enums";
import { SecretLocation } from "src/config/secrets/enums";
import { getSecrets } from "src/config/secrets/helpers";
import { ITradingEngineServiceSecrets } from "src/config/secrets/interfaces";
import {
    Currency,
    AccountType,
    TradingPlatform,
    // Exchange,
} from "src/config/enums";
import "dotenv/config";
import { IQueueMessageBody } from "src/config/interfaces";
// import { AccountConnectionStatus } from "src/config/enums";

// Validation result interfaces
export interface ITradingRuleValidationResult {
    isValid: boolean;
    violations: ITradingRuleViolation[];
    warnings: ITradingRuleWarning[];
}

export interface ITradingRuleViolation {
    ruleId: string;
    ruleName: string;
    category: TradingRuleCategory;
    message: string;
    currentValue: number | string;
    allowedValue: number | string;
}

export interface ITradingRuleWarning {
    ruleId: string;
    ruleName: string;
    category: TradingRuleCategory;
    message: string;
}

export interface ITradeInput {
    userId: string;
    signalId: string;
    baseAsset: string;
    quoteCurrency: string;
    baseQuantity: number;
    quoteTotal: number;
    side: TradeSide;
    tradingAccountId: mongoose.Types.ObjectId;
    leverage: number;
    price: number;
}

export interface IOrderInput {
    userId: string;
    tradeId: mongoose.Types.ObjectId;
    baseAsset: string;
    baseQuantity: number;
    type: OrderType;
    placementType: OrderPlacementType;
    price: number;
    quoteCurrency: string;
    tradingAccountId: mongoose.Types.ObjectId;
}

export interface IUserTradeAllocation {
    userId: string;
    tradingAccountId: mongoose.Types.ObjectId;
    tradeAmount: number;
    baseQuantity: number;
    platformName: TradingPlatform;
    apiKey: string;
    apiSecret: string;
    passphrase?: string;
    leverage: number;
    riskPercentage: number;
    availableBalance: number;
}

export interface IProcessUserTradingResult {
    successMessageIds: string[];
    failedMessageIds: string[];
    userTradeAllocations: IUserTradeAllocation[];
    totalAllocatedAmount: number;
    signalDetails: IProcessUserTradingWithActiveSignalEvent | null;
}

// Consolidated interface for user with trading account and balance
interface IUserTradingAccountWithBalance {
    userId: string;
    tradingAccount: IUserTradingAccount;
    balance: IUserTradingAccountBalance;
}

interface IValidateTradingRulesInput {
    userId: string;
    proposedTrade: ITradeInput;
    tradingAccount: IUserTradingAccount;
    accountBalance: IUserTradingAccountBalance;
    userTradingRules: IUserTradingRule[];
    activeTrades: ITrade[];
}

interface IUserProcessingResult {
    success: boolean;
    userId: string;
    reason?: string;
    violations?: ITradingRuleViolation[];
    tradingAccountId?: mongoose.Types.ObjectId;
    tradeAmount?: number;
    baseQuantity?: number;
    platformName?: TradingPlatform;
    apiKey?: string;
    apiSecret?: string;
    passphrase?: string;
    leverage?: number;
    riskPercentage?: number;
    availableBalance?: number;
}

export class TradingEngineService {
    private connection: mongoose.Connection | null = null;
    private secrets: ITradingEngineServiceSecrets | null = null;
    private initialized: boolean = false;
    private initializationPromise: Promise<void> | null = null;

    constructor() {}

    // Initialize the service once
    private async initialize(): Promise<void> {
        if (this.initialized) return;

        // If initialization is already in progress, wait for it
        if (this.initializationPromise) {
            await this.initializationPromise;
            return;
        }

        // Set up initialization promise
        this.initializationPromise = (async () => {
            try {
                // Fetch secrets once
                const env = process.env.ENV;
                console.log(
                    `=============== Getting secrets for ${SecretLocation.tradingEngineServiceSecrets}/${env} =====================`
                );
                this.secrets = await getSecrets<ITradingEngineServiceSecrets>(
                    `${SecretLocation.tradingEngineServiceSecrets}/${env}`
                );

                // Create connection
                this.connection = mongoose.createConnection(
                    this.secrets.TRADING_ENGINE_SERVICE_DB_URL
                );

                this.initialized = true;
            } catch (error) {
                log.error("Failed to initialize TradingEngineService:", {
                    error,
                });
                throw error;
            } finally {
                this.initializationPromise = null;
            }
        })();

        await this.initializationPromise;
    }

    // Close resources
    private async closeResources(): Promise<void> {
        if (this.connection) {
            await this.connection.close();
            this.connection = null;
        }
    }

    // For cleanup, especially in testing
    public async cleanup(): Promise<void> {
        await this.closeResources();
        this.initialized = false;
    }

    // Get connection (ensures initialization first)
    private async getConnection(): Promise<mongoose.Connection> {
        await this.initialize();
        if (!this.connection) {
            throw new Error("Database connection not available");
        }
        return this.connection;
    }

    // Get secrets (ensures initialization first)
    private async getSecrets(): Promise<ITradingEngineServiceSecrets> {
        await this.initialize();
        if (!this.secrets) {
            throw new Error("Secrets not available");
        }
        return this.secrets;
    }

    // MAIN VALIDATION METHOD - Validate user trading rules before entering a trade
    public async validateTradingRules({
        userId,
        proposedTrade,
        tradingAccount,
        accountBalance,
        userTradingRules,
        activeTrades,
    }: IValidateTradingRulesInput): Promise<ITradingRuleValidationResult> {
        try {
            await this.initialize();

            const violations: ITradingRuleViolation[] = [];
            const warnings: ITradingRuleWarning[] = [];

            // Validate trading account
            if (!tradingAccount) {
                violations.push({
                    ruleId: "trading-account",
                    ruleName: "Trading Account",
                    category: TradingRuleCategory.RISK_MANAGEMENT,
                    message: "Trading account not found or not accessible",
                    currentValue: "Not Found",
                    allowedValue: "Valid Account Required",
                });
                return { isValid: false, violations, warnings };
            }

            // Validate account balance
            if (!accountBalance) {
                violations.push({
                    ruleId: "account-balance",
                    ruleName: "Account Balance",
                    category: TradingRuleCategory.RISK_MANAGEMENT,
                    message: `No balance found for ${proposedTrade.quoteCurrency} in the selected trading account`,
                    currentValue: "0",
                    allowedValue: "> 0",
                });
            }

            // Calculate proposed trade value
            // const availableBalance = accountBalance?.availableBalance || 0;
            // const proposedTradeValue = this.calculateTradeAmount(
            //     availableBalance,
            //     userTradingRules.riskPercentage,
            //     proposedTrade.leverage
            // );

            // Validate each rule
            for (const rule of userTradingRules) {
                if (!rule.isEnabled) continue;

                switch (rule.name) {
                    // case TradingRuleName.RISK_PERCENTAGE_PER_TRADE:
                    //     await this.validateRiskPercentage(
                    //         rule,
                    //         proposedTradeValue,
                    //         availableBalance,
                    //         violations
                    //     );
                    //     break;

                    // case TradingRuleName.MAXIMUM_RISK_AMOUNT_PER_TRADE:
                    //     await this.validateMaxRiskAmount(
                    //         rule,
                    //         proposedTradeValue,
                    //         violations
                    //     );
                    //     break;

                    // case TradingRuleName.MAXIMUM_LEVERAGE:
                    //     await this.validateMaxLeverage(
                    //         rule,
                    //         proposedTrade,
                    //         violations
                    //     );
                    //     break;

                    // case TradingRuleName.MINIMUM_RISK_REWARD_RATIO:
                    //     await this.validateRiskRewardRatio(
                    //         rule,
                    //         proposedTrade,
                    //         warnings
                    //     );
                    //     break;

                    case TradingRuleName.MAXIMUM_CONCURRENT_TRADES:
                        await this.validateMaxConcurrentTrades(
                            rule,
                            activeTrades,
                            violations
                        );
                        break;

                    case TradingRuleName.DIRECTION_BALANCE_LIMIT:
                        await this.validateDirectionBalance(
                            rule,
                            activeTrades,
                            proposedTrade,
                            violations
                        );
                        break;
                }
            }

            // Validate sufficient balance
            // if (proposedTradeValue > availableBalance) {
            //     violations.push({
            //         ruleId: "insufficient-balance",
            //         ruleName: "Sufficient Balance",
            //         category: TradingRuleCategory.RISK_MANAGEMENT,
            //         message: "Insufficient balance for this trade",
            //         currentValue: availableBalance.toString(),
            //         allowedValue: proposedTradeValue.toString(),
            //     });
            // }

            return {
                isValid: violations.length === 0,
                violations,
                warnings,
            };
        } catch (error) {
            log.error("Error validating trading rules:", { error, userId });
            throw error;
        }
    }

    // Helper validation methods
    private async validateRiskPercentage(
        rule: IUserTradingRule,
        proposedTradeValue: number,
        availableBalance: number,
        violations: ITradingRuleViolation[]
    ): Promise<void> {
        const maxRiskPercentage = Number(rule.value);
        const maxAllowedRisk = (availableBalance * maxRiskPercentage) / 100;

        if (proposedTradeValue > maxAllowedRisk) {
            violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                category: rule.category,
                message: `Trade value exceeds maximum risk percentage of ${maxRiskPercentage}%`,
                currentValue: `${((proposedTradeValue / availableBalance) * 100).toFixed(2)}%`,
                allowedValue: `${maxRiskPercentage}%`,
            });
        }
    }

    private async validateMaxRiskAmount(
        rule: IUserTradingRule,
        proposedTradeValue: number,
        violations: ITradingRuleViolation[]
    ): Promise<void> {
        const maxRiskAmount = Number(rule.value);
        if (maxRiskAmount > 0 && proposedTradeValue > maxRiskAmount) {
            violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                category: rule.category,
                message: `Trade value exceeds maximum risk amount`,
                currentValue: proposedTradeValue.toString(),
                allowedValue: maxRiskAmount.toString(),
            });
        }
    }

    private async validateMaxLeverage(
        rule: IUserTradingRule,
        proposedTrade: ITradeInput,
        violations: ITradingRuleViolation[]
    ): Promise<void> {
        const maxLeverage = Number(rule.value);
        // Leverage validation would depend on the specific trading platform
        // For now, we'll add a placeholder that can be extended
        if (proposedTrade.leverage && proposedTrade.leverage > maxLeverage) {
            violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                category: rule.category,
                message: `Leverage exceeds maximum allowed`,
                currentValue: proposedTrade.leverage,
                allowedValue: maxLeverage.toString(),
            });
        }
    }

    private async validateRiskRewardRatio(
        rule: IUserTradingRule,
        proposedTrade: ITradeInput,
        warnings: ITradingRuleWarning[]
    ): Promise<void> {
        const minRiskReward = rule.value.toString();
        // This would typically require stop-loss and take-profit levels
        // For now, we'll add it as a warning
        warnings.push({
            ruleId: rule.id,
            ruleName: rule.name,
            category: rule.category,
            message: `Ensure trade meets minimum risk-reward ratio of ${minRiskReward}`,
        });
    }

    private async validateMaxConcurrentTrades(
        rule: IUserTradingRule,
        activeTrades: ITrade[],
        violations: ITradingRuleViolation[]
    ): Promise<void> {
        const maxConcurrentTrades = Number(rule.value);
        const currentActiveCount = activeTrades.filter(
            (trade) =>
                trade.status === TradeStatus.ACTIVE ||
                trade.status === TradeStatus.PENDING
        ).length;

        if (currentActiveCount >= maxConcurrentTrades) {
            violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                category: rule.category,
                message: `Maximum concurrent trades limit reached`,
                currentValue: currentActiveCount + 1,
                allowedValue: maxConcurrentTrades,
            });
        }
    }

    private async validateDirectionBalance(
        rule: IUserTradingRule,
        activeTrades: ITrade[],
        proposedTrade: ITradeInput,
        violations: ITradingRuleViolation[]
    ): Promise<void> {
        const maxDirectionDifference = Number(rule.value);

        const longTrades = activeTrades.filter(
            (trade) => trade.side === TradeSide.LONG
        ).length;
        const shortTrades = activeTrades.filter(
            (trade) => trade.side === TradeSide.SHORT
        ).length;

        let newLongCount = longTrades;
        let newShortCount = shortTrades;

        if (proposedTrade.side === TradeSide.LONG) {
            newLongCount++;
        } else {
            newShortCount++;
        }

        const directionDifference = Math.abs(newLongCount - newShortCount);

        if (directionDifference > maxDirectionDifference) {
            violations.push({
                ruleId: rule.id,
                ruleName: rule.name,
                category: rule.category,
                message: `Direction balance limit exceeded`,
                currentValue: directionDifference,
                allowedValue: maxDirectionDifference,
            });
        }
    }

    // Get user's trading rules
    private async getUserTradingRules(
        userId: string
    ): Promise<IUserTradingRule[]> {
        try {
            const connection = await this.getConnection();
            const userTradingRulesCollection =
                new MongoDBClient<IUserTradingRule>(
                    connection,
                    TradingEngineServiceCollections.userTradingRules
                );

            return userTradingRulesCollection.find({ userId });
        } catch (error) {
            log.error("Error fetching user trading rules:", { error, userId });
            throw error;
        }
    }

    // Get user's active trades
    private async getUserActiveTrades(userId: string): Promise<ITrade[]> {
        try {
            const connection = await this.getConnection();
            const tradesCollection = new MongoDBClient<ITrade>(
                connection,
                TradingEngineServiceCollections.trades
            );

            return tradesCollection.find({
                userId,
                status: { $in: [TradeStatus.ACTIVE, TradeStatus.PENDING] },
            });
        } catch (error) {
            log.error("Error fetching user active trades:", { error, userId });
            throw error;
        }
    }

    // Consolidated method to get users with trading accounts and their balances
    private async getUsersTradingAccountsAndBalances(
        platform: TradingPlatform,
        currency: Currency,
        accountType: AccountType = AccountType.FUTURES
    ): Promise<IUserTradingAccountWithBalance[]> {
        try {
            const connection = await this.getConnection();

            const accountsCollection = new MongoDBClient<IUserTradingAccount>(
                connection,
                TradingEngineServiceCollections.userTradingAccounts
            );

            const balancesCollection =
                new MongoDBClient<IUserTradingAccountBalance>(
                    connection,
                    TradingEngineServiceCollections.userTradingAccountBalances
                );

            // Get trading accounts for the platform
            const tradingAccounts = await accountsCollection.find({
                platformName: platform,
                connectionStatus: AccountConnectionStatus.CONNECTED,
                // isFuturesTradingEnabled: accountType === AccountType.FUTURES,
                // isSpotTradingEnabled: accountType === AccountType.SPOT,
                // apiKey: { $exists: true, $ne: "" },
                // apiSecret: { $exists: true, $ne: "" },
            });

            if (tradingAccounts.length === 0) {
                return [];
            }

            // Get balances for these accounts
            const tradingAccountIds = tradingAccounts.map(
                (acc) => acc._id as mongoose.Types.ObjectId
            );
            const balances = await balancesCollection.find({
                tradingAccountId: { $in: tradingAccountIds },
                currency: currency,
                accountType: accountType,
                availableBalance: { $gt: 0 },
            });

            // Combine accounts with their balances
            const results: IUserTradingAccountWithBalance[] = [];
            for (const account of tradingAccounts) {
                const balance = balances.find(
                    (b) =>
                        b.tradingAccountId.toString() ===
                        (account._id as mongoose.Types.ObjectId).toString()
                );

                if (balance) {
                    results.push({
                        userId: account.userId,
                        tradingAccount: account,
                        balance: balance,
                    });
                }
            }

            return results;
        } catch (error) {
            log.error(
                "Error fetching users with trading accounts and balances:",
                {
                    error,
                    platform,
                    currency,
                    accountType,
                }
            );
            throw error;
        }
    }

    // Helper method to calculate trade amount based on risk percentage
    private calculateTradeAmount(
        availableBalance: number,
        riskPercentage: number
    ): number {
        const riskAmount = (availableBalance * riskPercentage) / 100;
        return riskAmount;
    }

    // Consolidated method to map Exchange to TradingPlatform
    private mapExchangeToTradingPlatform(exchange: Exchange): TradingPlatform {
        switch (exchange) {
            case Exchange.binance:
                return TradingPlatform.BINANCE;
            case Exchange.kucoin:
                return TradingPlatform.KUCOIN;
            default:
                throw new Error(`Unsupported exchange: ${exchange}`);
        }
    }

    // Consolidated method to process user trading with active signal
    public async processUserTradingWithActiveSignal(
        queueMessages: IQueueMessageBody<IProcessUserTradingWithActiveSignalEvent>[]
    ): Promise<IProcessUserTradingResult> {
        try {
            const successMessageIds: string[] = [];
            const failedMessageIds: string[] = [];
            const userTradeAllocations: IUserTradeAllocation[] = [];
            let totalAllocatedAmount = 0;
            let signalDetails: IProcessUserTradingWithActiveSignalEvent | null =
                null;

            await this.initialize();

            // Step 1: Process each queue message
            for (const queueMessage of queueMessages) {
                try {
                    const signalData = queueMessage.body;
                    signalDetails = signalData;

                    // Check if signal is still valid
                    if (new Date(signalData.validUntil) < new Date()) {
                        log.info(
                            `Signal ${signalData.signalId} has expired, skipping`
                        );
                        successMessageIds.push(queueMessage.messageId);
                        continue;
                    }

                    // Check if signal is tradable
                    if (!signalData.isSignalTradable) {
                        log.info(
                            `Signal ${signalData.signalId} is not tradable, skipping`
                        );
                        successMessageIds.push(queueMessage.messageId);
                        continue;
                    }

                    // Map signal exchange to trading platform (single exchange now)
                    const tradingPlatform = this.mapExchangeToTradingPlatform(
                        signalData.exchange
                    );
                    const currency = signalData.quoteCurrency as Currency;
                    const accountType =
                        signalData.accountType || AccountType.FUTURES;

                    // Step 2: Get users with trading accounts and balances for this platform/currency
                    const usersWithAccountsAndBalances =
                        await this.getUsersTradingAccountsAndBalances(
                            tradingPlatform,
                            currency,
                            accountType
                        );

                    if (usersWithAccountsAndBalances.length === 0) {
                        log.info(
                            `No eligible users found for signal ${signalData.signalId} on ${tradingPlatform} with ${currency} balance`
                        );
                        successMessageIds.push(queueMessage.messageId);
                        continue;
                    }

                    // Step 3: Process each user in parallel
                    const userProcessingResults = await Promise.allSettled(
                        usersWithAccountsAndBalances.map(
                            async ({ userId, tradingAccount, balance }) => {
                                try {
                                    // Create proposed trade for validation
                                    const proposedTrade: ITradeInput = {
                                        userId,
                                        signalId: signalData.signalId,
                                        baseAsset: signalData.baseAsset,
                                        quoteCurrency: signalData.quoteCurrency,
                                        baseQuantity: 0, // Will be calculated after validation
                                        quoteTotal: 0,
                                        side: signalData.tradeSide,
                                        tradingAccountId:
                                            tradingAccount._id as mongoose.Types.ObjectId,
                                        leverage: 1, // Default leverage, can be adjusted
                                        price: signalData.entryPrice,
                                    };

                                    // Get user's trading rules
                                    const [userTradingRules, activeTrades] =
                                        await Promise.all([
                                            this.getUserTradingRules(userId),
                                            this.getUserActiveTrades(userId),
                                        ]);

                                    // Validate trading rules
                                    const validationResult =
                                        await this.validateTradingRules({
                                            userId,
                                            proposedTrade,
                                            tradingAccount,
                                            accountBalance: balance,
                                            userTradingRules,
                                            activeTrades,
                                        });

                                    if (!validationResult.isValid) {
                                        return {
                                            success: false,
                                            reason: "Trading rules validation failed",
                                            userId: userId,
                                            violations:
                                                validationResult.violations,
                                        };
                                    }

                                    // Get user's risk percentage rule
                                    const riskPercentage = Number(
                                        userTradingRules.filter(
                                            (rule) =>
                                                rule.name ===
                                                TradingRuleName.RISK_PERCENTAGE_PER_TRADE
                                        )[0]
                                    );
                                    const leverage = 1; // Default leverage

                                    // Calculate trade amount
                                    const tradeAmount =
                                        this.calculateTradeAmount(
                                            balance.availableBalance,
                                            riskPercentage
                                        );

                                    // Calculate base quantity
                                    const baseQuantity =
                                        tradeAmount / signalData.entryPrice;

                                    // Minimum trade amount check (e.g., $10 minimum)
                                    if (tradeAmount < 10) {
                                        return {
                                            success: false,
                                            reason: "Trade amount too small",
                                            userId: userId,
                                        };
                                    }

                                    return {
                                        success: true,
                                        userId: userId,
                                        tradingAccountId: tradingAccount._id,
                                        tradeAmount,
                                        baseQuantity,
                                        platformName:
                                            tradingAccount.platformName,
                                        apiKey: tradingAccount.apiKey!,
                                        apiSecret: tradingAccount.apiSecret!,
                                        passphrase: tradingAccount.passphrase,
                                        leverage,
                                        riskPercentage,
                                        availableBalance:
                                            balance.availableBalance,
                                    };
                                } catch (error) {
                                    log.error(
                                        `Error processing user ${userId}:`,
                                        { error }
                                    );
                                    return {
                                        success: false,
                                        reason: "Processing error",
                                        userId: userId,
                                    };
                                }
                            }
                        )
                    );

                    // Step 4: Collect successful user allocations
                    const successfulAllocations = userProcessingResults
                        .filter(
                            (result) =>
                                result.status === "fulfilled" &&
                                result.value.success
                        )
                        .map(
                            (result) =>
                                (
                                    result as PromiseFulfilledResult<IUserProcessingResult>
                                ).value
                        )
                        .filter((result) => result.tradeAmount !== undefined);

                    // Step 5: Sort by trade amount (descending) to prioritize larger trades
                    successfulAllocations.sort(
                        (a, b) => b.tradeAmount! - a.tradeAmount!
                    );

                    // Step 6: Allocate trades up to target amount
                    let currentAllocatedAmount = 0;
                    for (const allocation of successfulAllocations) {
                        if (
                            currentAllocatedAmount >=
                            signalData.targetAmountToFill
                        ) {
                            break;
                        }

                        const remainingAmount =
                            signalData.targetAmountToFill -
                            currentAllocatedAmount;
                        const finalTradeAmount = Math.min(
                            allocation.tradeAmount!,
                            remainingAmount
                        );
                        const finalBaseQuantity =
                            finalTradeAmount / signalData.entryPrice;

                        userTradeAllocations.push({
                            userId: allocation.userId,
                            tradingAccountId: allocation.tradingAccountId!,
                            tradeAmount: finalTradeAmount,
                            baseQuantity: finalBaseQuantity,
                            platformName: allocation.platformName!,
                            apiKey: allocation.apiKey!,
                            apiSecret: allocation.apiSecret!,
                            passphrase: allocation.passphrase,
                            leverage: allocation.leverage!,
                            riskPercentage: allocation.riskPercentage!,
                            availableBalance: allocation.availableBalance!,
                        });

                        currentAllocatedAmount += finalTradeAmount;
                        totalAllocatedAmount += finalTradeAmount;
                    }

                    log.info(
                        `Successfully processed signal ${signalData.signalId}`,
                        {
                            platform: tradingPlatform,
                            currency: currency,
                            totalUsersWithAccounts:
                                usersWithAccountsAndBalances.length,
                            successfulAllocations: successfulAllocations.length,
                            finalAllocations: userTradeAllocations.length,
                            totalAllocatedAmount: currentAllocatedAmount,
                            targetAmount: signalData.targetAmountToFill,
                        }
                    );

                    successMessageIds.push(queueMessage.messageId);
                } catch (error) {
                    log.error(
                        `Error processing queue message ${queueMessage.messageId}:`,
                        { error }
                    );
                    failedMessageIds.push(queueMessage.messageId);
                }
            }

            return {
                successMessageIds,
                failedMessageIds,
                userTradeAllocations,
                totalAllocatedAmount,
                signalDetails,
            };
        } catch (error) {
            log.error("General error in processUserTradingWithActiveSignal:", {
                error,
            });
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((qm) => qm.messageId),
                userTradeAllocations: [],
                totalAllocatedAmount: 0,
                signalDetails: null,
            };
        }
    }
}

export default new TradingEngineService();
