// trade engine service

import mongoose from "mongoose";
import log from "@dazn/lambda-powertools-logger";
import { MongoDBClient } from "src/clients/MongoDBClient";
import { TradingEngineServiceCollections } from "src/clients/MongoDBClient/constants";
import {
    ITrade,
    IOrder,
    IOrderBatch,
    ITradingRule,
    IUserTradingRule,
    IUserTradingAccount,
    IUserTradingAccountBalance,
} from "./interfaces";
import {
    OrderStatus,
    OrderType,
    OrderPlacementType,
    TradeStatus,
    TradeSide,
    OrderBatchStatus,
    TradingRuleCategory,
} from "./enums";
import { SecretLocation } from "src/config/secrets/enums";
import { getSecrets } from "src/config/secrets/helpers";
import { ITradingEngineServiceSecrets } from "src/config/secrets/interfaces";
import { Currency } from "src/config/enums";
import "dotenv/config";

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
    public async validateTradingRules(
        userId: string,
        proposedTrade: ITradeInput
    ): Promise<ITradingRuleValidationResult> {
        try {
            await this.initialize();
            // const connection = await this.getConnection();

            const violations: ITradingRuleViolation[] = [];
            const warnings: ITradingRuleWarning[] = [];

            // Get user's trading rules
            const userTradingRules = await this.getUserTradingRules(userId);

            // Get user's active trades
            const activeTrades = await this.getUserActiveTrades(userId);

            // Get user's account balances
            const accountBalances = await this.getUserAccountBalances(userId);

            // Get specific trading account balance
            const tradingAccount = await this.getUserTradingAccount(
                proposedTrade.tradingAccountId
            );
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

            const accountBalance = accountBalances.find(
                (balance) =>
                    balance.tradingAccountId.toString() ===
                        proposedTrade.tradingAccountId.toString() &&
                    balance.currency ===
                        (proposedTrade.quoteCurrency as Currency)
            );

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
            const proposedTradeValue =
                proposedTrade.baseQuantity * proposedTrade.price || 0;
            const availableBalance = accountBalance?.availableBalance || 0;

            // Validate each rule
            for (const rule of userTradingRules) {
                if (!rule.isEnabled) continue;

                switch (rule.name) {
                    case "Risk Percentage Per Trade":
                        await this.validateRiskPercentage(
                            rule,
                            proposedTradeValue,
                            availableBalance,
                            violations
                        );
                        break;

                    case "Maximum Risk Amount Per Trade":
                        await this.validateMaxRiskAmount(
                            rule,
                            proposedTradeValue,
                            violations
                        );
                        break;

                    case "Maximum Leverage":
                        await this.validateMaxLeverage(
                            rule,
                            proposedTrade,
                            violations
                        );
                        break;

                    case "Minimum Risk-Reward Ratio":
                        await this.validateRiskRewardRatio(
                            rule,
                            proposedTrade,
                            warnings
                        );
                        break;

                    case "Maximum Concurrent Trades":
                        await this.validateMaxConcurrentTrades(
                            rule,
                            activeTrades,
                            violations
                        );
                        break;

                    case "Direction Balance Limit":
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
            if (proposedTradeValue > availableBalance) {
                violations.push({
                    ruleId: "insufficient-balance",
                    ruleName: "Sufficient Balance",
                    category: TradingRuleCategory.RISK_MANAGEMENT,
                    message: "Insufficient balance for this trade",
                    currentValue: availableBalance.toString(),
                    allowedValue: proposedTradeValue.toString(),
                });
            }

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

    // Get user's account balances
    private async getUserAccountBalances(
        userId: string
    ): Promise<IUserTradingAccountBalance[]> {
        try {
            const connection = await this.getConnection();
            const balancesCollection =
                new MongoDBClient<IUserTradingAccountBalance>(
                    connection,
                    TradingEngineServiceCollections.userTradingAccountBalances
                );

            return balancesCollection.find({ userId });
        } catch (error) {
            log.error("Error fetching user account balances:", {
                error,
                userId,
            });
            throw error;
        }
    }

    // Get specific trading account
    private async getUserTradingAccount(
        tradingAccountId: mongoose.Types.ObjectId
    ): Promise<IUserTradingAccount | null> {
        try {
            const connection = await this.getConnection();
            const accountsCollection = new MongoDBClient<IUserTradingAccount>(
                connection,
                TradingEngineServiceCollections.userTradingAccounts
            );

            return accountsCollection.findOne({ _id: tradingAccountId });
        } catch (error) {
            log.error("Error fetching trading account:", {
                error,
                tradingAccountId,
            });
            throw error;
        }
    }

    // CREATE OPERATIONS

    // Create a new trade
    public async createTrade(tradeInput: ITradeInput): Promise<ITrade> {
        try {
            await this.initialize();
            const connection = await this.getConnection();
            const tradesCollection = new MongoDBClient<ITrade>(
                connection,
                TradingEngineServiceCollections.trades
            );

            const trade: Partial<ITrade> = {
                userId: tradeInput.userId,
                signalId: tradeInput.signalId,
                baseAsset: tradeInput.baseAsset,
                quoteCurrency: tradeInput.quoteCurrency,
                baseQuantity: tradeInput.baseQuantity,
                pair: `${tradeInput.baseAsset}/${tradeInput.quoteCurrency}`,
                side: tradeInput.side,
                avgBuyPrice: 0, // Will be updated when orders are filled
                quoteTotal: 0, // Will be calculated based on filled orders
                pnl: 0,
                status: TradeStatus.PENDING,
                // createdAt: new Date().toISOString(),
                // updatedAt: new Date().toISOString(),
            };

            return tradesCollection.insertOne(trade);
        } catch (error) {
            log.error("Error creating trade:", { error, tradeInput });
            throw error;
        }
    }

    // Create a new order
    public async createOrder(orderInput: IOrderInput): Promise<IOrder> {
        try {
            await this.initialize();
            const connection = await this.getConnection();
            const ordersCollection = new MongoDBClient<IOrder>(
                connection,
                TradingEngineServiceCollections.orders
            );

            const order: Partial<IOrder> = {
                userId: orderInput.userId,
                tradeId: orderInput.tradeId,
                baseAsset: orderInput.baseAsset,
                baseQuantity: orderInput.baseQuantity,
                type: orderInput.type,
                placementType: orderInput.placementType,
                price: orderInput.price,
                total: orderInput.baseQuantity * orderInput.price,
                quoteCurrency: orderInput.quoteCurrency,
                quoteTotal: orderInput.baseQuantity * orderInput.price,
                status: OrderStatus.PENDING,
                // createdAt: new Date().toISOString(),
                // updatedAt: new Date().toISOString(),
            };

            return ordersCollection.insertOne(order);
        } catch (error) {
            log.error("Error creating order:", { error, orderInput });
            throw error;
        }
    }

    // Create order batch
    public async createOrderBatch(
        orderId: mongoose.Types.ObjectId,
        orderData: Partial<IOrderBatch>
    ): Promise<IOrderBatch> {
        try {
            await this.initialize();
            const connection = await this.getConnection();
            const orderBatchesCollection = new MongoDBClient<IOrderBatch>(
                connection,
                TradingEngineServiceCollections.orderBatches
            );

            const orderBatch: Partial<IOrderBatch> = {
                orderId,
                ...orderData,
                status: OrderBatchStatus.PENDING,
                // createdAt: new Date().toISOString(),
                // updatedAt: new Date().toISOString(),
            };

            return orderBatchesCollection.insertOne(orderBatch);
        } catch (error) {
            log.error("Error creating order batch:", {
                error,
                orderId,
                orderData,
            });
            throw error;
        }
    }

    // UPDATE OPERATIONS

    // Update trade status and PnL
    public async updateTrade(
        tradeId: mongoose.Types.ObjectId,
        updates: Partial<ITrade>
    ): Promise<boolean> {
        try {
            await this.initialize();
            const connection = await this.getConnection();
            const tradesCollection = new MongoDBClient<ITrade>(
                connection,
                TradingEngineServiceCollections.trades
            );

            const updateData = {
                ...updates,
                // updatedAt: new Date().toISOString(),
            };

            return tradesCollection.updateOne(
                { _id: tradeId },
                { $set: updateData }
            );
        } catch (error) {
            log.error("Error updating trade:", { error, tradeId, updates });
            throw error;
        }
    }

    // Update order status
    public async updateOrder(
        orderId: mongoose.Types.ObjectId,
        updates: Partial<IOrder>
    ): Promise<boolean> {
        try {
            await this.initialize();
            const connection = await this.getConnection();
            const ordersCollection = new MongoDBClient<IOrder>(
                connection,
                TradingEngineServiceCollections.orders
            );

            const updateData = {
                ...updates,
                // updatedAt: new Date().toISOString(),
            };

            return ordersCollection.updateOne(
                { _id: orderId },
                { $set: updateData }
            );
        } catch (error) {
            log.error("Error updating order:", { error, orderId, updates });
            throw error;
        }
    }

    // Update order batch status
    public async updateOrderBatch(
        orderBatchId: mongoose.Types.ObjectId,
        updates: Partial<IOrderBatch>
    ): Promise<boolean> {
        try {
            await this.initialize();
            const connection = await this.getConnection();
            const orderBatchesCollection = new MongoDBClient<IOrderBatch>(
                connection,
                TradingEngineServiceCollections.orderBatches
            );

            const updateData = {
                ...updates,
                // updatedAt: new Date().toISOString(),
            };

            return orderBatchesCollection.updateOne(
                { _id: orderBatchId },
                { $set: updateData }
            );
        } catch (error) {
            log.error("Error updating order batch:", {
                error,
                orderBatchId,
                updates,
            });
            throw error;
        }
    }

    // UTILITY METHODS

    // Get trade by ID
    public async getTradeById(
        tradeId: mongoose.Types.ObjectId
    ): Promise<ITrade | null> {
        try {
            await this.initialize();
            const connection = await this.getConnection();
            const tradesCollection = new MongoDBClient<ITrade>(
                connection,
                TradingEngineServiceCollections.trades
            );

            return tradesCollection.findOne({ _id: tradeId });
        } catch (error) {
            log.error("Error fetching trade by ID:", { error, tradeId });
            throw error;
        }
    }

    // Get orders for a trade
    public async getOrdersForTrade(
        tradeId: mongoose.Types.ObjectId
    ): Promise<IOrder[]> {
        try {
            await this.initialize();
            const connection = await this.getConnection();
            const ordersCollection = new MongoDBClient<IOrder>(
                connection,
                TradingEngineServiceCollections.orders
            );

            return ordersCollection.find({ tradeId });
        } catch (error) {
            log.error("Error fetching orders for trade:", { error, tradeId });
            throw error;
        }
    }

    // Get user's trading statistics (for dashboard/analytics)
    public async getUserTradingStats(userId: string): Promise<{
        activeTrades: number;
        totalTrades: number;
        totalPnL: number;
        winRate: number;
    }> {
        try {
            await this.initialize();
            const connection = await this.getConnection();
            const tradesCollection = new MongoDBClient<ITrade>(
                connection,
                TradingEngineServiceCollections.trades
            );

            const allTrades = await tradesCollection.find({ userId });
            const activeTrades = allTrades.filter(
                (trade) =>
                    trade.status === TradeStatus.ACTIVE ||
                    trade.status === TradeStatus.PENDING
            ).length;

            const closedTrades = allTrades.filter(
                (trade) => trade.status === TradeStatus.CLOSED
            );
            const totalPnL = closedTrades.reduce(
                (sum, trade) => sum + trade.pnl,
                0
            );
            const winningTrades = closedTrades.filter(
                (trade) => trade.pnl > 0
            ).length;
            const winRate =
                closedTrades.length > 0
                    ? (winningTrades / closedTrades.length) * 100
                    : 0;

            return {
                activeTrades,
                totalTrades: allTrades.length,
                totalPnL,
                winRate,
            };
        } catch (error) {
            log.error("Error fetching user trading stats:", { error, userId });
            throw error;
        }
    }

    // Initialize user trading rules (copy from defaults)
    public async initializeUserTradingRules(
        userId: string
    ): Promise<IUserTradingRule[]> {
        try {
            await this.initialize();
            const connection = await this.getConnection();

            const tradingRulesCollection = new MongoDBClient<ITradingRule>(
                connection,
                TradingEngineServiceCollections.tradingRules
            );

            const userTradingRulesCollection =
                new MongoDBClient<IUserTradingRule>(
                    connection,
                    TradingEngineServiceCollections.userTradingRules
                );

            // Get default rules
            const defaultRules = await tradingRulesCollection.findAll();

            // Check if user already has rules
            const existingUserRules = await userTradingRulesCollection.find({
                userId,
            });
            if (existingUserRules.length > 0) {
                return existingUserRules;
            }

            // Create user-specific copies of default rules
            const userRules: Partial<IUserTradingRule>[] = defaultRules.map(
                (rule) => ({
                    userId,
                    ruleId: rule.id,
                    name: rule.name,
                    description: rule.description,
                    tooltip: rule.tooltip,
                    category: rule.category,
                    type: rule.type,
                    value: rule.value,
                    isEnabled: rule.isEnabled,
                    isCustomized: false,
                    lastResetToDefault: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                })
            );

            // Insert all user rules
            const insertedRules: IUserTradingRule[] = [];
            for (const userRule of userRules) {
                const inserted =
                    await userTradingRulesCollection.insertOne(userRule);
                insertedRules.push(inserted);
            }

            return insertedRules;
        } catch (error) {
            log.error("Error initializing user trading rules:", {
                error,
                userId,
            });
            throw error;
        }
    }
}

export default new TradingEngineService();
