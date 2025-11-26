// trade engine service

import mongoose from "mongoose";
import log from "@dazn/lambda-powertools-logger";
import { MongoDBClient } from "src/clients/MongoDBClient";
import { TradingEngineServiceCollections } from "src/clients/MongoDBClient/constants";
import {
    ITrade,
    IUserTradingRule,
    IUserTradingAccount,
    IUserTradingAccountBalance,
    IProcessUserTradingWithMasterTradeEvent,
    IPlatformTradingRule,
    IUserTradeAllocation,
    IOrderBatch,
    IOrder,
    IMasterTrade,
} from "./interfaces";
import {
    OrderType,
    OrderPlacementType,
    TradeStatus,
    TradeSide,
    TradingRuleCategory,
    Exchange,
    AccountConnectionStatus,
    TradingRuleName,
    OrderSide,
    OrderBatchStatus,
    OrderStatus,
    // OrderBatchStatus,
    // OrderStatus,
} from "./enums";
import { SecretLocation } from "src/config/secrets/enums";
import { getSecrets } from "src/config/secrets/helpers";
import { ITradingEngineServiceSecrets } from "src/config/secrets/interfaces";
import { Currency, AccountType, TradingPlatform } from "src/config/enums";
import "dotenv/config";
import { IQueueMessageBody } from "src/config/interfaces";
import { publishMessageToQueue } from "src/clients/SQSClient/helpers";

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
    masterTradeId: string;
    baseAsset: string;
    quoteCurrency: string;
    baseQuantity?: number;
    quoteTotal: number;
    side: TradeSide;
    tradingAccountId: mongoose.Types.ObjectId;
    // leverage: number;
    price: number;
}

export interface IOrderInput {
    userId: string;
    tradeId: mongoose.Types.ObjectId;
    baseAsset: string;
    baseQuantity: number;
    orderType: OrderType;
    orderSide: OrderSide;
    placementType: OrderPlacementType;
    price: number;
    quoteCurrency: string;
    tradingAccountId: mongoose.Types.ObjectId;
    externalOrderId: string;
}

export interface ICreateTradesForUserResult {
    tradeId: string;
}

export interface IAllocateTradesUpToTargetAmountResult {
    userId: string;
    riskAmount: number;
    positionSize: number;
    requiredMargin: number;
    baseQuantity?: number;
    platformName?: TradingPlatform;
}

export interface IProcessUserTradingResult {
    successMessageIds: string[];
    failedMessageIds: string[];
    userTradeAllocations: IUserTradeAllocation[];
    totalAllocatedAmount: number;
    masterTradeDetails: IProcessUserTradingWithMasterTradeEvent | null;
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
    riskPercentage?: number;
    riskAmount?: number;
    positionSize?: number;
    requiredMargin?: number;
    availableBalance?: number;
}

interface ICalculateLeverageInput {
    entryPrice: number;
    liquidationPrice: number;
    tradeSide: TradeSide;
    maintenanceMarginRate?: number;
}

interface IValidateTradeEligibilityForPairInput {
    positionSize: number;
    platformTradingRule: IPlatformTradingRule | null;
    baseQuantity: number;
}

interface IValidateTradeEligibilityResult {
    isValid: boolean;
    reasons: string[];
    positionSize: number;
    quantity: number;
    minQuantity: number;
    minNotional: number;
}

interface ICalculateTradeAmountInput {
    accountSize: number;
    maxRiskAmount: number;
    riskPercentage: number;
    entryPrice: number;
    stopLossPrice: number;
    leverage: number;
    stepSize: number;
}

interface ICalculateTradeAmountResult {
    riskAmount: number;
    positionSize: number;
    requiredMargin: number;
    baseQuantity: number;
}

export class TradingEngineService {
    private connection: mongoose.Connection | null = null;
    private secrets: ITradingEngineServiceSecrets | null = null;
    private initialized: boolean = false;
    private initializationPromise: Promise<void> | null = null;
    private isExternalConnection: boolean = false;

    constructor(connection?: mongoose.Connection) {
        if (connection) {
            this.connection = connection;
            this.isExternalConnection = true;
            this.initialized = true;
        }
    }

    // Initialize the service once (only needed when no external connection provided)
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
                console.error("Failed to initialize TradingEngineService:", {
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
        // Only close connection if we created it (not externally provided)
        if (this.connection && !this.isExternalConnection) {
            await this.connection.close();
            this.connection = null;
        }
    }

    // For cleanup, especially in testing
    public async cleanup(): Promise<void> {
        await this.closeResources();
        if (!this.isExternalConnection) {
            this.initialized = false;
        }
    }

    // Get connection (ensures initialization first if needed)
    private async getConnection(): Promise<mongoose.Connection> {
        if (!this.isExternalConnection) {
            await this.initialize();
        }

        if (!this.connection) {
            throw new Error("Database connection not available");
        }
        return this.connection;
    }

    // Get secrets (ensures initialization first)
    private async getSecrets(): Promise<ITradingEngineServiceSecrets> {
        if (!this.isExternalConnection) {
            await this.initialize();
        }

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
            if (!this.isExternalConnection) {
                await this.initialize();
            }

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

            log.info("validateTradingRulesResult", {
                userId,
                isValid: violations.length === 0,
                violations,
                warnings,
            });

            return {
                isValid: violations.length === 0,
                violations,
                warnings,
            };
        } catch (error) {
            console.error("Error validating trading rules:", { error, userId });
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

    /**
     * Calculate leverage for a futures position (LONG or SHORT)
     *
     * For LONG:
     *    L = 1 / ((1 + m) - (Pl / P0))
     *
     * For SHORT:
     *    L = 1 / ((Pl / P0) - (1 - m))
     *
     * @param entryPrice - Entry price (P0)
     * @param liquidationPrice - Liquidation price (Pl)
     * @param tradeSide - "LONG" or "SHORT"
     * @param maintenanceMarginRate - Maintenance margin rate (default 0.004 for Binance BTC small positions)
     * @returns Leverage (number)
     */
    public calculateLeverage(input: ICalculateLeverageInput): number {
        const {
            entryPrice,
            liquidationPrice,
            tradeSide,
            maintenanceMarginRate = 0.004,
        } = input;

        if (entryPrice <= 0 || liquidationPrice <= 0) {
            throw new Error(
                "Entry price and liquidation price must be greater than zero."
            );
        }

        const ratio = liquidationPrice / entryPrice;
        let denominator: number;

        if (tradeSide === TradeSide.LONG) {
            denominator = 1 + maintenanceMarginRate - ratio;
        } else if (tradeSide === TradeSide.SHORT) {
            denominator = ratio - (1 - maintenanceMarginRate);
        } else {
            throw new Error("Invalid trade side. Must be 'LONG' or 'SHORT'.");
        }

        if (denominator <= 0) {
            throw new Error(
                "Invalid values: denominator is zero or negative. Check inputs."
            );
        }

        return Math.floor(1 / denominator);
    }

    // Get user's trading rules
    public async getUserTradingRules(
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
            console.error("Error fetching user trading rules:", {
                error,
                userId,
            });
            throw error;
        }
    }

    // Get user's active trades
    public async getUserActiveTrades(userId: string): Promise<ITrade[]> {
        try {
            const connection = await this.getConnection();
            const tradesCollection = new MongoDBClient<ITrade>(
                connection,
                TradingEngineServiceCollections.trades
            );

            return tradesCollection.find({
                userId,
                status: {
                    $in: [
                        TradeStatus.ACTIVE,
                        TradeStatus.PENDING,
                        TradeStatus.PROCESSED,
                    ],
                },
            });
        } catch (error) {
            console.error("Error fetching user active trades:", {
                error,
                userId,
            });
            throw error;
        }
    }

    public async getPlatformTradingRulesForPair(
        tradingPlatform: TradingPlatform,
        pair: string
    ): Promise<IPlatformTradingRule | null> {
        try {
            const connection = await this.getConnection();
            const tradingRulesCollection =
                new MongoDBClient<IPlatformTradingRule>(
                    connection,
                    TradingEngineServiceCollections.platformTradingRules
                );

            const rule = await tradingRulesCollection.findOne({
                platform: tradingPlatform,
                pair,
            });

            log.info("getPlatformTradingRulesForPair", {
                tradingPlatform,
                pair,
                rule,
            });

            return rule;
        } catch (error) {
            console.error("Error fetching trading platform rules:", {
                error,
                tradingPlatform,
                pair,
            });
            throw error;
        }
    }

    // Consolidated method to get users with trading accounts and their balances
    public async getUsersTradingAccountsAndBalances({
        platforms,
        currency,
        accountType = AccountType.FUTURES,
    }: {
        platforms: TradingPlatform[];
        currency: Currency;
        accountType: AccountType;
    }): Promise<IUserTradingAccountWithBalance[]> {
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
                platformName: { $in: platforms },
                connectionStatus: AccountConnectionStatus.CONNECTED,
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
                        balance,
                    });
                }
            }

            return results;
        } catch (error) {
            console.error(
                "Error fetching users with trading accounts and balances:",
                {
                    error,
                    platforms,
                    currency,
                    accountType,
                }
            );
            throw error;
        }
    }

    public async getUserTradingAccount(
        userId: string,
        platformName: TradingPlatform
    ): Promise<IUserTradingAccount> {
        const connection = await this.getConnection();
        const tradingAccountsCollection =
            new MongoDBClient<IUserTradingAccount>(
                connection,
                TradingEngineServiceCollections.userTradingAccounts
            );
        const tradingAccount = await tradingAccountsCollection.findOne({
            userId,
            platformName,
        });
        if (!tradingAccount) {
            throw new Error(
                `No trading account found for user ${userId} on platform ${platformName}`
            );
        }
        return tradingAccount;
    }

    // Helper method to calculate trade amount based on risk amount, risk percentage, entry price, stop loss price, and leverage
    public calculateTradeAmount(
        input: ICalculateTradeAmountInput
    ): ICalculateTradeAmountResult {
        const {
            accountSize,
            maxRiskAmount,
            riskPercentage,
            entryPrice,
            stopLossPrice,
            leverage,
            stepSize,
        } = input;

        const calculatedRiskAmount = (accountSize * riskPercentage) / 100;
        let riskAmount = Math.round(
            Math.max(maxRiskAmount, calculatedRiskAmount)
        );

        // Minimum risk amount is 10 USDT
        if (riskAmount < 10) riskAmount = 10;

        if (entryPrice <= 0 || stopLossPrice <= 0) {
            throw new Error(
                "Entry and stop loss prices must be greater than zero."
            );
        }

        if (leverage <= 0) {
            throw new Error("Leverage must be greater than zero.");
        }

        // 1. Price difference (risk per unit)
        const deltaP = Math.abs(entryPrice - stopLossPrice);
        if (deltaP === 0) {
            throw new Error("Entry price and stop loss cannot be the same.");
        }

        // 2. Quantity (contracts / lots) to risk exactly riskAmount
        const quantity = riskAmount / deltaP;

        // 3. Position size (notional in USDT)
        const positionSize = quantity * entryPrice;

        // 4. Required margin given leverage
        const requiredMargin = positionSize / leverage;

        // Calculate the number of decimal places in stepSize
        const decimalPlaces = stepSize.toString().split(".")[1]?.length || 0;
        const baseQuantity = parseFloat(
            (Math.floor(quantity / stepSize) * stepSize).toFixed(decimalPlaces)
        );
        return {
            riskAmount,
            positionSize,
            requiredMargin,
            baseQuantity,
        };
    }

    public calculatePnL({
        side,
        entryPrice,
        targetPrice,
        baseQuantity,
        riskUSDT,
        requiredMargin,
    }: {
        side: TradeSide;
        entryPrice: number;
        targetPrice: number;
        baseQuantity: number;
        riskUSDT: number;
        requiredMargin: number;
    }): {
        pnlAmount: number;
        pnlPercentOfRisk: number;
        pnlPercentOfRequiredMargin: number;
    } {
        const priceDiff =
            side === TradeSide.LONG
                ? targetPrice - entryPrice
                : entryPrice - targetPrice;

        const pnlAmount = priceDiff * baseQuantity;

        return {
            pnlAmount: Number(pnlAmount.toFixed(2)),
            pnlPercentOfRisk: Number(((pnlAmount / riskUSDT) * 100).toFixed(2)),
            pnlPercentOfRequiredMargin: Number(
                ((pnlAmount / requiredMargin) * 100).toFixed(2)
            ),
        };
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

    private async validateUserTradeEligibilityForPairOnPlatform(
        input: IValidateTradeEligibilityForPairInput
    ): Promise<IValidateTradeEligibilityResult> {
        const { positionSize, platformTradingRule, baseQuantity } = input;

        const reasons: string[] = [];
        const quantity = baseQuantity;

        if (!platformTradingRule) {
            return {
                isValid: false,
                reasons,
                positionSize: parseFloat(positionSize.toFixed(6)),
                quantity: parseFloat(quantity.toFixed(6)),
                minQuantity: 0,
                minNotional: 0,
            };
        }

        const { minQuantity, minNotional } = platformTradingRule;
        if (quantity < minQuantity) {
            reasons.push(
                `Quantity ${quantity.toFixed(6)} < minQty ${minQuantity}`
            );
        }

        if (positionSize < minNotional) {
            reasons.push(
                `Position size ${positionSize.toFixed(2)} < minNotional ${minNotional}`
            );
        }

        return {
            isValid: reasons.length === 0,
            reasons,
            positionSize: parseFloat(positionSize.toFixed(6)),
            quantity: parseFloat(quantity.toFixed(6)),
            minQuantity,
            minNotional,
        };
    }

    // update master trade
    public async updateMasterTrade({
        masterTradeId,
        updateData,
    }: {
        masterTradeId: string;
        updateData: Partial<IMasterTrade>;
    }): Promise<IMasterTrade | null> {
        try {
            const connection = await this.getConnection();
            const masterTradesCollection = new MongoDBClient<IMasterTrade>(
                connection,
                TradingEngineServiceCollections.masterTrades
            );

            const updatedMasterTrade =
                await masterTradesCollection.findOneAndUpdate(
                    { _id: new mongoose.Types.ObjectId(masterTradeId) },
                    {
                        $set: {
                            ...updateData,
                        },
                    }
                );
            log.info(`Updated master trade ${masterTradeId}`, { updateData });
            return updatedMasterTrade;
        } catch (error) {
            console.error("Error updating trade:", {
                error,
                masterTradeId,
                updateData,
            });
            throw error;
        }
    }

    public async updateMasterTradeData(input: {
        masterTradeId: string;
        baseQuantity: number;
        quoteTotal: number;
        estimatedProfit: number;
        estimatedLoss: number;
    }) {
        const {
            masterTradeId,
            baseQuantity,
            quoteTotal,
            estimatedProfit,
            estimatedLoss,
        } = input;
        try {
            const connection = await this.getConnection();
            const masterTradesCollection = new MongoDBClient<IMasterTrade>(
                connection,
                TradingEngineServiceCollections.masterTrades
            );

            // increment base quantity, quote total, estimated profit, estimated loss
            await masterTradesCollection.updateOne(
                { _id: new mongoose.Types.ObjectId(masterTradeId) },
                {
                    $inc: {
                        baseQuantity,
                        quoteTotal,
                        estimatedProfit,
                        estimatedLoss,
                        originalBaseQuantity: baseQuantity,
                        originalQuoteTotal: quoteTotal,
                        originalEstimatedProfit: estimatedProfit,
                        originalEstimatedLoss: estimatedLoss,
                    },
                }
            );
            log.info(`Updated master trade data ${masterTradeId}`, {
                baseQuantity,
                quoteTotal,
                estimatedProfit,
                estimatedLoss,
            });
        } catch (error) {
            console.error("Error updating master trade data:", {
                error,
                masterTradeId,
                baseQuantity,
                quoteTotal,
                estimatedProfit,
                estimatedLoss,
            });
            throw error;
        }
    }

    /**
     * Creates trades for a specific user
     */
    private async createTradeForUser(
        userId: string,
        tradeData: Partial<ITrade>
    ): Promise<ITrade> {
        try {
            const connection = await this.getConnection();
            const tradesCollection = new MongoDBClient<ITrade>(
                connection,
                TradingEngineServiceCollections.trades
            );

            const trade: Partial<ITrade> = {
                ...tradeData,
                userId,
                pnl: 0, // New trades have no PnL yet
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const createdTrade = await tradesCollection.insertOne(trade);

            log.info(`Created trade for user ${userId}`);
            return createdTrade;
        } catch (error) {
            console.error("Error creating trades for user:", { error, userId });
            throw error;
        }
    }

    /**
     * Update a trade
     */
    public async updateTrade({
        tradeId,
        updateData,
    }: {
        tradeId: string;
        updateData: Partial<ITrade>;
    }): Promise<ITrade | null> {
        try {
            const connection = await this.getConnection();
            const tradesCollection = new MongoDBClient<ITrade>(
                connection,
                TradingEngineServiceCollections.trades
            );

            const updatedTrade = await tradesCollection.findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(tradeId) },
                {
                    $set: {
                        ...updateData,
                    },
                }
            );

            log.info(`Updated trade ${tradeId}`, { updateData });
            return updatedTrade;
        } catch (error) {
            console.error("Error updating trade:", {
                error,
                tradeId,
                updateData,
            });
            throw error;
        }
    }

    public async unsetTradeTakeProfit({
        tradeId,
    }: {
        tradeId: string;
    }): Promise<ITrade | null> {
        try {
            const connection = await this.getConnection();
            const tradesCollection = new MongoDBClient<ITrade>(
                connection,
                TradingEngineServiceCollections.trades
            );

            const updatedTrade = await tradesCollection.findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(tradeId) },
                {
                    $unset: { takeProfitPrice: "" },
                }
            );

            log.info(
                `Unset trade take profit successfully: tradeId === ${tradeId}`
            );
            return updatedTrade;
        } catch (error) {
            console.error("Error unsetting trade take profit:", {
                error,
                tradeId,
            });
            throw error;
        }
    }

    /**
     * Get a trade by ID
     */
    public async getTradeById(tradeId: string): Promise<ITrade | null> {
        try {
            const connection = await this.getConnection();
            const tradesCollection = new MongoDBClient<ITrade>(
                connection,
                TradingEngineServiceCollections.trades
            );

            return await tradesCollection.findOne({
                _id: new mongoose.Types.ObjectId(tradeId),
            });
        } catch (error) {
            console.error("Error fetching trade:", { error, tradeId });
            throw error;
        }
    }

    /**
     * Create an order batch
     */
    public async createOrderBatch(orderBatchData: {
        baseAsset: string;
        quoteCurrency: string;
        baseQuantity: number;
        quoteTotal: number;
        status: OrderBatchStatus;
        tradingAccountId: mongoose.Types.ObjectId;
        platformName: TradingPlatform;
        platformId: number;
        externalOrderId: string;
    }): Promise<IOrderBatch> {
        try {
            const connection = await this.getConnection();
            const orderBatchCollection = new MongoDBClient<IOrderBatch>(
                connection,
                TradingEngineServiceCollections.orderBatches
            );

            return orderBatchCollection.insertOne(orderBatchData);
        } catch (error) {
            console.error("Error creating order batch:", {
                error,
                orderBatchData,
            });
            throw error;
        }
    }

    /**
     * Update an order batch
     */
    public async updateOrderBatch(
        orderBatchId: string,
        updateData: Partial<IOrderBatch>
    ): Promise<IOrderBatch | null> {
        try {
            const connection = await this.getConnection();
            const orderBatchCollection = new MongoDBClient<IOrderBatch>(
                connection,
                TradingEngineServiceCollections.orderBatches
            );

            const updatedOrderBatch =
                await orderBatchCollection.findOneAndUpdate(
                    { _id: new mongoose.Types.ObjectId(orderBatchId) },
                    {
                        $set: {
                            ...updateData,
                        },
                    }
                );

            log.info(`Updated order batch ${orderBatchId}`, { updateData });
            return updatedOrderBatch;
        } catch (error) {
            console.error("Error updating order batch:", {
                error,
                orderBatchId,
                updateData,
            });
            throw error;
        }
    }

    /**
     * Get order batch by ID
     */
    public async getOrderBatchById(
        orderBatchId: string
    ): Promise<IOrderBatch | null> {
        try {
            const connection = await this.getConnection();
            const orderBatchCollection = new MongoDBClient<IOrderBatch>(
                connection,
                TradingEngineServiceCollections.orderBatches
            );

            return await orderBatchCollection.findOne({
                _id: new mongoose.Types.ObjectId(orderBatchId),
            });
        } catch (error) {
            console.error("Error fetching order batch:", {
                error,
                orderBatchId,
            });
            throw error;
        }
    }

    /**
     * Get order batches by external order ID
     */
    public async getOrderBatchByExternalOrderId(
        externalOrderId: string
    ): Promise<IOrderBatch | null> {
        try {
            const connection = await this.getConnection();
            const orderBatchCollection = new MongoDBClient<IOrderBatch>(
                connection,
                TradingEngineServiceCollections.orderBatches
            );

            return await orderBatchCollection.findOne({ externalOrderId });
        } catch (error) {
            console.error("Error fetching order batch by external ID:", {
                error,
                externalOrderId,
            });
            throw error;
        }
    }

    /**
     * Create an order
     */
    public async createOrder(orderData: {
        userId: string;
        tradeId: mongoose.Types.ObjectId;
        orderBatchId: mongoose.Types.ObjectId;
        baseAsset: string;
        baseQuantity: number;
        orderType: OrderType;
        orderSide: OrderSide;
        placementType: OrderPlacementType;
        price: number;
        total: number;
        quoteCurrency: string;
        quoteTotal: number;
        status: OrderStatus;
        externalOrderId: string;
    }): Promise<IOrder> {
        try {
            const connection = await this.getConnection();
            const ordersCollection = new MongoDBClient<IOrder>(
                connection,
                TradingEngineServiceCollections.orders
            );

            return ordersCollection.insertOne(orderData);
        } catch (error) {
            console.error("Error creating order:", { error, orderData });
            throw error;
        }
    }

    /**
     * Update an order
     */
    public async updateOrder(
        orderId: string,
        updateData: Partial<IOrder>
    ): Promise<IOrder | null> {
        try {
            const connection = await this.getConnection();
            const ordersCollection = new MongoDBClient<IOrder>(
                connection,
                TradingEngineServiceCollections.orders
            );

            const updatedOrder = await ordersCollection.findOneAndUpdate(
                { _id: new mongoose.Types.ObjectId(orderId) },
                {
                    $set: {
                        ...updateData,
                    },
                }
            );
            return updatedOrder;
        } catch (error) {
            console.error("Error updating order:", {
                error,
                orderId,
                updateData,
            });
            throw error;
        }
    }

    /**
     * Get order by ID
     */
    public async getOrderById(orderId: string): Promise<IOrder | null> {
        try {
            const connection = await this.getConnection();
            const ordersCollection = new MongoDBClient<IOrder>(
                connection,
                TradingEngineServiceCollections.orders
            );

            return ordersCollection.findOne({
                _id: new mongoose.Types.ObjectId(orderId),
            });
        } catch (error) {
            console.error("Error fetching order:", { error, orderId });
            throw error;
        }
    }

    /**
     * Get order by trade ID
     */
    public async getOrderByTradeId(tradeId: string): Promise<IOrder | null> {
        try {
            const connection = await this.getConnection();
            const ordersCollection = new MongoDBClient<IOrder>(
                connection,
                TradingEngineServiceCollections.orders
            );

            return ordersCollection.findOne({ tradeId });
        } catch (error) {
            console.error("Error fetching order by trade ID:", {
                error,
                tradeId,
            });
            throw error;
        }
    }

    /**
     * Get order by external order ID
     */
    public async getOrderByExternalOrderId(
        externalOrderId: string
    ): Promise<IOrder | null> {
        try {
            const connection = await this.getConnection();
            const ordersCollection = new MongoDBClient<IOrder>(
                connection,
                TradingEngineServiceCollections.orders
            );

            return ordersCollection.findOne({ externalOrderId });
        } catch (error) {
            console.error("Error fetching order by external ID:", {
                error,
                externalOrderId,
            });
            throw error;
        }
    }

    /**
     * Get orders for a trade
     */
    public async getOrdersForTrade(tradeId: string): Promise<IOrder[]> {
        try {
            const connection = await this.getConnection();
            const ordersCollection = new MongoDBClient<IOrder>(
                connection,
                TradingEngineServiceCollections.orders
            );

            return ordersCollection.find({
                tradeId: new mongoose.Types.ObjectId(tradeId),
            });
        } catch (error) {
            console.error("Error fetching orders for trade:", {
                error,
                tradeId,
            });
            throw error;
        }
    }

    /**
     * Get orders for an order batch
     */
    public async getOrdersForOrderBatch(
        orderBatchId: string
    ): Promise<IOrder[]> {
        try {
            const connection = await this.getConnection();
            const ordersCollection = new MongoDBClient<IOrder>(
                connection,
                TradingEngineServiceCollections.orders
            );

            return await ordersCollection.find({
                orderBatchId: new mongoose.Types.ObjectId(orderBatchId),
            });
        } catch (error) {
            console.error("Error fetching orders for order batch:", {
                error,
                orderBatchId,
            });
            throw error;
        }
    }

    // Modify atomicallyProcessMasterTradeForUser to NOT create trades
    private async validateAndProcessMasterTradeForUser({
        userId,
        masterTrade,
        tradingAccount,
        balance,
        platformTradingRule,
    }: {
        userId: string;
        masterTrade: IProcessUserTradingWithMasterTradeEvent;
        tradingAccount: IUserTradingAccount;
        balance: IUserTradingAccountBalance;
        platformTradingRule: IPlatformTradingRule;
    }): Promise<IUserProcessingResult> {
        // const connection = await this.getConnection();

        try {
            // Get fresh data for validation
            const [userTradingRules, activeTrades] = await Promise.all([
                this.getUserTradingRules(userId),
                this.getUserActiveTrades(userId),
            ]);

            // Create proposed trade for validation
            const proposedTrade: ITradeInput = {
                userId,
                masterTradeId: masterTrade.masterTradeId,
                baseAsset: masterTrade.baseAsset,
                quoteCurrency: masterTrade.quoteCurrency,
                quoteTotal: 0,
                side: masterTrade.tradeSide,
                tradingAccountId: tradingAccount._id as mongoose.Types.ObjectId,
                price: masterTrade.entryPrice,
            };

            // Validate trading rules with fresh data
            const validationResult = await this.validateTradingRules({
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
                    violations: validationResult.violations,
                };
            }

            //  get risk percentage and risk amount rules
            const riskPercentageRule = userTradingRules.find(
                (rule) =>
                    rule.name === TradingRuleName.RISK_PERCENTAGE_PER_TRADE
            );

            const riskAmountRule = userTradingRules.find(
                (rule) =>
                    rule.name === TradingRuleName.MAXIMUM_RISK_AMOUNT_PER_TRADE
            );

            const riskPercentage = riskPercentageRule
                ? Number(riskPercentageRule.value)
                : 5; // default risk percentage is 5%

            // Calculate trade amount
            const { positionSize, requiredMargin, riskAmount, baseQuantity } =
                this.calculateTradeAmount({
                    accountSize: balance.accountSize,
                    maxRiskAmount: riskAmountRule
                        ? Number(riskAmountRule.value)
                        : 0,
                    riskPercentage,
                    entryPrice: masterTrade.entryPrice,
                    stopLossPrice: masterTrade.stopLossPrice,
                    leverage: 50,
                    stepSize: platformTradingRule?.stepSize ?? 0.001,
                });

            // Validate required margin (i.e amount of money that will be used to open the trade)
            const requiredMarginMarkup = requiredMargin * 1.1; // 10% markup for margin
            if (requiredMarginMarkup > balance.availableBalance) {
                return {
                    success: false,
                    userId,
                    reason: "Insufficient balance",
                };
            }

            // Validate trade eligibility for pair
            const tradeEligibilityResult =
                await this.validateUserTradeEligibilityForPairOnPlatform({
                    positionSize,
                    platformTradingRule,
                    baseQuantity,
                });

            if (!tradeEligibilityResult.isValid) {
                return {
                    success: false,
                    userId,
                    reason: tradeEligibilityResult.reasons.join(", "),
                };
            }

            return {
                success: true,
                userId: userId,
                tradingAccountId: tradingAccount._id as mongoose.Types.ObjectId,
                positionSize,
                requiredMargin,
                platformName: tradingAccount.platformName,
                apiKey: tradingAccount.apiKey!,
                apiSecret: tradingAccount.apiSecret!,
                passphrase: tradingAccount.passphrase,
                riskAmount,
                riskPercentage,
                availableBalance: balance.availableBalance,
                tradeAmount: requiredMargin,
                baseQuantity,
            };
        } catch (error) {
            return {
                success: false,
                // reason: "Validation error",
                reason:
                    error instanceof Error ? error.message : "Unknown error",
                userId: userId,
            };
        }
    }

    // New method to create trades for allocated users
    private async createTradesForAllocatedUsers(
        allocations: IAllocateTradesUpToTargetAmountResult[],
        masterTrade: IProcessUserTradingWithMasterTradeEvent
    ): Promise<ITrade[]> {
        const successfulAllocations: ITrade[] = [];

        // Create trades for each allocated user
        const tradeCreationResults = await Promise.allSettled(
            allocations.map(async (allocation) => {
                const { pnlAmount } = this.calculatePnL({
                    side: masterTrade.tradeSide,
                    entryPrice: masterTrade.entryPrice,
                    targetPrice: masterTrade.takeProfitPrice,
                    baseQuantity: allocation.baseQuantity ?? 0,
                    riskUSDT: allocation.riskAmount,
                    requiredMargin: allocation.requiredMargin,
                });
                const trade: Partial<ITrade> = {
                    masterTradeId: masterTrade.masterTradeId,
                    baseAsset: masterTrade.baseAsset,
                    quoteCurrency: masterTrade.quoteCurrency,
                    baseQuantity: allocation.baseQuantity ?? 0,
                    entryPrice: masterTrade.entryPrice,
                    stopLossPrice: masterTrade.stopLossPrice,
                    takeProfitPrice: masterTrade.takeProfitPrice,
                    quoteTotal: allocation.requiredMargin,
                    estimatedProfit: pnlAmount,
                    estimatedLoss: allocation.riskAmount,
                    pair: masterTrade.pair,
                    side: masterTrade.tradeSide,
                    status: TradeStatus.PENDING,
                    platformName: allocation.platformName,
                    originalBaseQuantity: allocation.baseQuantity ?? 0,
                    originalQuoteTotal: allocation.requiredMargin,
                    originalEstimatedProfit: pnlAmount,
                    originalEstimatedLoss: allocation.riskAmount,
                };

                const createdTrade = await this.createTradeForUser(
                    allocation.userId,
                    trade
                );
                return createdTrade;
            })
        );

        // Only return allocations where trade creation succeeded
        tradeCreationResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
                successfulAllocations.push(result.value);
            } else {
                console.error(
                    `Failed to create trade for user ${allocations[index].userId}:`,
                    result.reason
                );
            }
        });

        return successfulAllocations;
    }

    /**
     * Allocates trades up to the target amount from processed users
     */
    private allocateTradesUpToTargetAmount(
        successfullyProcessedUsers: IUserProcessingResult[],
        signalData: IProcessUserTradingWithMasterTradeEvent
    ): {
        allocations: IAllocateTradesUpToTargetAmountResult[];
        totalAllocated: number;
    } {
        const userTradeAllocations: IAllocateTradesUpToTargetAmountResult[] =
            [];
        let currentAllocatedAmount = 0;

        // Sort by trade amount (descending) to prioritize larger trades
        successfullyProcessedUsers.sort(
            (a, b) => b.tradeAmount! - a.tradeAmount!
        );

        for (const allocation of successfullyProcessedUsers) {
            if (currentAllocatedAmount >= signalData.targetOrdersAmountToFill) {
                break;
            }

            userTradeAllocations.push({
                userId: allocation.userId,
                riskAmount: allocation.riskAmount!,
                positionSize: allocation.positionSize!,
                requiredMargin: allocation.requiredMargin!,
                baseQuantity: allocation.baseQuantity,
                platformName: allocation.platformName,
            });

            currentAllocatedAmount += allocation.requiredMargin ?? 0;
        }

        return {
            allocations: userTradeAllocations,
            totalAllocated: currentAllocatedAmount,
        };
    }

    /**
     * Processes a single signal and returns allocations
     */
    private async processSingleMasterTrade(
        masterTrade: IProcessUserTradingWithMasterTradeEvent
    ): Promise<{
        allocations: IUserTradeAllocation[];
        totalAllocated: number;
    }> {
        const currency = masterTrade.quoteCurrency as Currency;
        const accountType = masterTrade.accountType || AccountType.FUTURES;

        // Get users with trading accounts and balances for this platform/currency
        const usersWithAccountsAndBalances =
            await this.getUsersTradingAccountsAndBalances({
                platforms: masterTrade.supportedTradingPlatforms,
                currency,
                accountType,
            });

        if (usersWithAccountsAndBalances.length === 0) {
            log.info(
                `No eligible users found for master trade ${masterTrade.masterTradeId} on ${masterTrade.supportedTradingPlatforms} with ${currency} balance`
            );
            return { allocations: [], totalAllocated: 0 };
        }

        // Get trading rules for each platform
        const platformsTradingRules = await Promise.all(
            usersWithAccountsAndBalances.map(async ({ tradingAccount }) => {
                return this.getPlatformTradingRulesForPair(
                    tradingAccount.platformName,
                    masterTrade.pair
                );
            })
        );

        // Step 1: Process all users (validate + calculate) WITHOUT creating trades
        const userProcessingResults = await Promise.allSettled(
            usersWithAccountsAndBalances.map(
                async ({ userId, tradingAccount, balance }) => {
                    return this.validateAndProcessMasterTradeForUser({
                        userId,
                        masterTrade,
                        tradingAccount,
                        balance,
                        platformTradingRule: platformsTradingRules.find(
                            (rule) =>
                                rule?.platform === tradingAccount.platformName
                        ) as IPlatformTradingRule,
                    });
                }
            )
        );

        // Step 2: Collect successful users
        const successfullyProcessedUsers = userProcessingResults
            .filter(
                (result) =>
                    result.status === "fulfilled" && result.value.success
            )
            .map(
                (result) =>
                    (result as PromiseFulfilledResult<IUserProcessingResult>)
                        .value
            )
            .filter((result) => result.tradeAmount !== undefined);

        // Step 3.1: Choose only one trading platform for users
        const uniqueUserAllocations = new Map<string, IUserProcessingResult>();

        for (const result of successfullyProcessedUsers) {
            const existingAllocation = uniqueUserAllocations.get(result.userId);

            if (!existingAllocation) {
                // First allocation for this user, add it
                uniqueUserAllocations.set(result.userId, result);
            } else {
                // User already has an allocation, choose based on defaultTradingPlatform
                if (
                    result.platformName === masterTrade.defaultTradingPlatform
                ) {
                    // Current result matches default platform, replace existing
                    uniqueUserAllocations.set(result.userId, result);
                }
                // Otherwise, keep the existing allocation (first one found)
            }
        }

        // Convert map back to array for allocation
        const filteredSuccessfulUsers = Array.from(
            uniqueUserAllocations.values()
        );

        // Step 3: Allocate users up to target amount
        const { allocations, totalAllocated } =
            this.allocateTradesUpToTargetAmount(
                filteredSuccessfulUsers, // Use filtered users instead
                masterTrade
            );

        // Step 4: Create trades only for allocated users
        const createdTradesForAllocatedUsers =
            await this.createTradesForAllocatedUsers(allocations, masterTrade);

        // Create a map of userId to filtered user processing result for faster lookup
        const userAllocationMap = new Map(
            filteredSuccessfulUsers.map((user) => [user.userId, user])
        );

        const allocationsWithTrades: IUserTradeAllocation[] = allocations.map(
            (allocation, index) => {
                const userResult = userAllocationMap.get(allocation.userId);

                // if (!userResult) {
                //     throw new Error(`User allocation not found for userId: ${allocation.userId}`);
                // }

                return {
                    ...allocation,
                    masterTradeId: masterTrade.masterTradeId,
                    tradeId: createdTradesForAllocatedUsers[index]
                        ._id as string,
                    tradingAccountId:
                        userResult?.tradingAccountId as mongoose.Types.ObjectId,
                    platformName: userResult?.platformName as TradingPlatform,
                    apiKey: userResult?.apiKey as string,
                    apiSecret: userResult?.apiSecret as string,
                    passphrase: userResult?.passphrase as string,
                    tradeAmount: allocation.requiredMargin,
                    availableBalance: userResult?.availableBalance as number,
                    baseAsset: masterTrade.baseAsset as string,
                    baseQuantity: allocation.baseQuantity,
                    baseAssetLogoUrl: masterTrade.baseAssetLogoUrl,
                    quoteCurrency: masterTrade.quoteCurrency as string,
                    quoteTotal: allocation.requiredMargin,
                    entryPrice: masterTrade.entryPrice,
                    stopLossPrice: masterTrade.stopLossPrice,
                    takeProfitPrice: masterTrade.takeProfitPrice,
                    tradeSide: masterTrade.tradeSide as TradeSide,
                    orderPlacementType:
                        masterTrade.orderPlacementType as OrderPlacementType,
                    accountType: masterTrade.accountType as AccountType,
                };
            }
        );

        log.info(`Successfully processed signal ${masterTrade.masterTradeId}`, {
            platforms: masterTrade.supportedTradingPlatforms,
            currency: currency,
            totalUsersWithAccounts: usersWithAccountsAndBalances.length,
            successfullyProcessedUsers: successfullyProcessedUsers.length,
            finalAllocations: allocations.length,
            totalAllocatedAmount: totalAllocated,
            targetAmount: masterTrade.targetOrdersAmountToFill,
        });

        return { allocations: allocationsWithTrades, totalAllocated };
    }

    /**
     * Publishes allocations to queue with error handling
     */
    private async publishAllocationsToQueue(
        userTradeAllocations: IUserTradeAllocation[]
    ): Promise<IUserTradeAllocation[]> {
        if (userTradeAllocations.length === 0) {
            return [];
        }

        const queuePublishingResults = await Promise.allSettled(
            userTradeAllocations.map(async (userTradeAllocation) => {
                return publishMessageToQueue({
                    queueUrl: this.secrets?.PROCESS_USER_TRADES_QUEUE ?? "",
                    message: JSON.stringify(userTradeAllocation),
                });
            })
        );

        // Filter out failed publications and return only successful ones
        const successfulAllocations: IUserTradeAllocation[] = [];
        const failedUserIds: string[] = [];

        queuePublishingResults.forEach((result, index) => {
            const allocation = userTradeAllocations[index];
            if (result.status === "fulfilled") {
                successfulAllocations.push(allocation);
            } else {
                failedUserIds.push(allocation.userId);
                console.error(
                    `Failed to publish trade to queue for user ${allocation.userId}:`,
                    result.reason
                );
            }
        });

        if (failedUserIds.length > 0) {
            console.error(
                `Failed to publish trades for ${failedUserIds.length} users:`,
                {
                    failedUserIds,
                }
            );
        }

        return successfulAllocations;
    }

    // Consolidated method to process user trading with active signal
    public async processIncomingMasterTrades(
        queueMessages: IQueueMessageBody<IProcessUserTradingWithMasterTradeEvent>[]
    ): Promise<IProcessUserTradingResult> {
        try {
            const successMessageIds: string[] = [];
            const failedMessageIds: string[] = [];
            const allUserTradeAllocations: IUserTradeAllocation[] = [];
            let totalAllocatedAmount = 0;
            let masterTradeDetails: IProcessUserTradingWithMasterTradeEvent | null =
                null;

            await this.initialize();

            // Process all queue messages in parallel
            const signalProcessingResults = await Promise.allSettled(
                queueMessages.map(async (queueMessage) => {
                    try {
                        const masterTrade = queueMessage.body;

                        // Process this signal and get allocations
                        const { allocations, totalAllocated } =
                            await this.processSingleMasterTrade(masterTrade);

                        // update master trade status to PROCESSED
                        const updatedMasterTrade = await this.updateMasterTrade(
                            {
                                masterTradeId: masterTrade.masterTradeId,
                                updateData: { status: TradeStatus.PROCESSED },
                            }
                        );

                        log.info(
                            `Updated master trade ${masterTrade.masterTradeId} status to PROCESSED`,
                            { updatedMasterTrade }
                        );

                        return {
                            success: true,
                            messageId: queueMessage.messageId,
                            masterTrade,
                            allocations,
                            totalAllocated,
                        };
                    } catch (error) {
                        console.error(
                            `Error processing queue message ${queueMessage.messageId}:`,
                            { error }
                        );
                        return {
                            success: false,
                            messageId: queueMessage.messageId,
                            error,
                        };
                    }
                })
            );

            // Collect results from parallel processing
            signalProcessingResults.forEach((result) => {
                if (result.status === "fulfilled") {
                    const value = result.value;
                    if (value.success) {
                        successMessageIds.push(value.messageId);
                        allUserTradeAllocations.push(
                            ...(value.allocations || [])
                        ); // Provide empty array fallback
                        totalAllocatedAmount += value.totalAllocated || 0; // Provide 0 fallback
                        masterTradeDetails = value.masterTrade || null; // Convert undefined to null
                    } else {
                        failedMessageIds.push(value.messageId);
                    }
                } else {
                    // This shouldn't happen since we're catching errors inside the map function
                    console.error(
                        "Unexpected Promise.allSettled rejection:",
                        result.reason
                    );
                }
            });

            if (allUserTradeAllocations.length === 0) {
                log.info("No user trades to publish to queue for signals", {
                    processedSignals: successMessageIds.length,
                    failedSignals: failedMessageIds.length,
                });
                return {
                    successMessageIds,
                    failedMessageIds,
                    userTradeAllocations: [],
                    totalAllocatedAmount: 0,
                    masterTradeDetails,
                };
            }

            // Publish allocations to queue with error handling
            const successfulAllocations = await this.publishAllocationsToQueue(
                allUserTradeAllocations
            );

            log.info(
                `Successfully processed ${successMessageIds.length} signals in parallel`,
                {
                    successfulSignals: successMessageIds.length,
                    failedSignals: failedMessageIds.length,
                    totalAllocations: allUserTradeAllocations.length,
                    successfulPublications: successfulAllocations.length,
                    totalAllocatedAmount,
                    users: successfulAllocations.map((allocation) => ({
                        userId: allocation.userId,
                        tradingAccountId: allocation.tradingAccountId,
                        tradeAmount: allocation.tradeAmount,
                        platformName: allocation.platformName,
                    })),
                }
            );

            return {
                successMessageIds,
                failedMessageIds,
                userTradeAllocations: successfulAllocations, // Only return successfully published allocations
                totalAllocatedAmount,
                masterTradeDetails,
            };
        } catch (error) {
            console.error("General error in processIncomingSignals:", {
                error,
            });
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((qm) => qm.messageId),
                userTradeAllocations: [],
                totalAllocatedAmount: 0,
                masterTradeDetails: null,
            };
        }
    }
}

export default new TradingEngineService();
