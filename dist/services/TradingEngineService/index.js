"use strict";
// trade engine service
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingEngineService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
const MongoDBClient_1 = require("src/clients/MongoDBClient");
const constants_1 = require("src/clients/MongoDBClient/constants");
const enums_1 = require("./enums");
const enums_2 = require("src/config/secrets/enums");
const helpers_1 = require("src/config/secrets/helpers");
const enums_3 = require("src/config/enums");
require("dotenv/config");
class TradingEngineService {
    constructor() {
        this.connection = null;
        this.secrets = null;
        this.initialized = false;
        this.initializationPromise = null;
    }
    // Initialize the service once
    async initialize() {
        if (this.initialized)
            return;
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
                console.log(`=============== Getting secrets for ${enums_2.SecretLocation.tradingEngineServiceSecrets}/${env} =====================`);
                this.secrets = await (0, helpers_1.getSecrets)(`${enums_2.SecretLocation.tradingEngineServiceSecrets}/${env}`);
                // Create connection
                this.connection = mongoose_1.default.createConnection(this.secrets.TRADING_ENGINE_SERVICE_DB_URL);
                this.initialized = true;
            }
            catch (error) {
                lambda_powertools_logger_1.default.error("Failed to initialize TradingEngineService:", {
                    error,
                });
                throw error;
            }
            finally {
                this.initializationPromise = null;
            }
        })();
        await this.initializationPromise;
    }
    // Close resources
    async closeResources() {
        if (this.connection) {
            await this.connection.close();
            this.connection = null;
        }
    }
    // For cleanup, especially in testing
    async cleanup() {
        await this.closeResources();
        this.initialized = false;
    }
    // Get connection (ensures initialization first)
    async getConnection() {
        await this.initialize();
        if (!this.connection) {
            throw new Error("Database connection not available");
        }
        return this.connection;
    }
    // Get secrets (ensures initialization first)
    async getSecrets() {
        await this.initialize();
        if (!this.secrets) {
            throw new Error("Secrets not available");
        }
        return this.secrets;
    }
    // MAIN VALIDATION METHOD - Validate user trading rules before entering a trade
    async validateTradingRules({ userId, proposedTrade, tradingAccount, accountBalance, userTradingRules, activeTrades, }) {
        try {
            await this.initialize();
            const violations = [];
            const warnings = [];
            // Validate trading account
            if (!tradingAccount) {
                violations.push({
                    ruleId: "trading-account",
                    ruleName: "Trading Account",
                    category: enums_1.TradingRuleCategory.RISK_MANAGEMENT,
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
                    category: enums_1.TradingRuleCategory.RISK_MANAGEMENT,
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
                if (!rule.isEnabled)
                    continue;
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
                    case enums_1.TradingRuleName.MAXIMUM_CONCURRENT_TRADES:
                        await this.validateMaxConcurrentTrades(rule, activeTrades, violations);
                        break;
                    case enums_1.TradingRuleName.DIRECTION_BALANCE_LIMIT:
                        await this.validateDirectionBalance(rule, activeTrades, proposedTrade, violations);
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
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("Error validating trading rules:", { error, userId });
            throw error;
        }
    }
    // Helper validation methods
    async validateRiskPercentage(rule, proposedTradeValue, availableBalance, violations) {
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
    async validateMaxRiskAmount(rule, proposedTradeValue, violations) {
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
    async validateMaxLeverage(rule, proposedTrade, violations) {
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
    async validateRiskRewardRatio(rule, proposedTrade, warnings) {
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
    async validateMaxConcurrentTrades(rule, activeTrades, violations) {
        const maxConcurrentTrades = Number(rule.value);
        const currentActiveCount = activeTrades.filter((trade) => trade.status === enums_1.TradeStatus.ACTIVE ||
            trade.status === enums_1.TradeStatus.PENDING).length;
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
    async validateDirectionBalance(rule, activeTrades, proposedTrade, violations) {
        const maxDirectionDifference = Number(rule.value);
        const longTrades = activeTrades.filter((trade) => trade.side === enums_1.TradeSide.LONG).length;
        const shortTrades = activeTrades.filter((trade) => trade.side === enums_1.TradeSide.SHORT).length;
        let newLongCount = longTrades;
        let newShortCount = shortTrades;
        if (proposedTrade.side === enums_1.TradeSide.LONG) {
            newLongCount++;
        }
        else {
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
    async getUserTradingRules(userId) {
        try {
            const connection = await this.getConnection();
            const userTradingRulesCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.userTradingRules);
            return userTradingRulesCollection.find({ userId });
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("Error fetching user trading rules:", { error, userId });
            throw error;
        }
    }
    // Get user's active trades
    async getUserActiveTrades(userId) {
        try {
            const connection = await this.getConnection();
            const tradesCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.trades);
            return tradesCollection.find({
                userId,
                status: { $in: [enums_1.TradeStatus.ACTIVE, enums_1.TradeStatus.PENDING] },
            });
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("Error fetching user active trades:", { error, userId });
            throw error;
        }
    }
    // Consolidated method to get users with trading accounts and their balances
    async getUsersTradingAccountsAndBalances(platform, currency, accountType = enums_3.AccountType.FUTURES) {
        try {
            const connection = await this.getConnection();
            const accountsCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.userTradingAccounts);
            const balancesCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.userTradingAccountBalances);
            // Get trading accounts for the platform
            const tradingAccounts = await accountsCollection.find({
                platformName: platform,
                connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                // isFuturesTradingEnabled: accountType === AccountType.FUTURES,
                // isSpotTradingEnabled: accountType === AccountType.SPOT,
                // apiKey: { $exists: true, $ne: "" },
                // apiSecret: { $exists: true, $ne: "" },
            });
            if (tradingAccounts.length === 0) {
                return [];
            }
            // Get balances for these accounts
            const tradingAccountIds = tradingAccounts.map((acc) => acc._id);
            const balances = await balancesCollection.find({
                tradingAccountId: { $in: tradingAccountIds },
                currency: currency,
                accountType: accountType,
                availableBalance: { $gt: 0 },
            });
            // Combine accounts with their balances
            const results = [];
            for (const account of tradingAccounts) {
                const balance = balances.find((b) => b.tradingAccountId.toString() ===
                    account._id.toString());
                if (balance) {
                    results.push({
                        userId: account.userId,
                        tradingAccount: account,
                        balance: balance,
                    });
                }
            }
            return results;
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("Error fetching users with trading accounts and balances:", {
                error,
                platform,
                currency,
                accountType,
            });
            throw error;
        }
    }
    // Helper method to calculate trade amount based on risk percentage
    calculateTradeAmount(availableBalance, riskPercentage) {
        const riskAmount = (availableBalance * riskPercentage) / 100;
        return riskAmount;
    }
    // Consolidated method to map Exchange to TradingPlatform
    mapExchangeToTradingPlatform(exchange) {
        switch (exchange) {
            case enums_1.Exchange.binance:
                return enums_3.TradingPlatform.BINANCE;
            case enums_1.Exchange.kucoin:
                return enums_3.TradingPlatform.KUCOIN;
            default:
                throw new Error(`Unsupported exchange: ${exchange}`);
        }
    }
    // Consolidated method to process user trading with active signal
    async processUserTradingWithActiveSignal(queueMessages) {
        try {
            const successMessageIds = [];
            const failedMessageIds = [];
            const userTradeAllocations = [];
            let totalAllocatedAmount = 0;
            let signalDetails = null;
            await this.initialize();
            // Step 1: Process each queue message
            for (const queueMessage of queueMessages) {
                try {
                    const signalData = queueMessage.body;
                    signalDetails = signalData;
                    // Check if signal is still valid
                    if (new Date(signalData.validUntil) < new Date()) {
                        lambda_powertools_logger_1.default.info(`Signal ${signalData.signalId} has expired, skipping`);
                        successMessageIds.push(queueMessage.messageId);
                        continue;
                    }
                    // Check if signal is tradable
                    if (!signalData.isSignalTradable) {
                        lambda_powertools_logger_1.default.info(`Signal ${signalData.signalId} is not tradable, skipping`);
                        successMessageIds.push(queueMessage.messageId);
                        continue;
                    }
                    // Map signal exchange to trading platform (single exchange now)
                    const tradingPlatform = this.mapExchangeToTradingPlatform(signalData.exchange);
                    const currency = signalData.quoteCurrency;
                    const accountType = signalData.accountType || enums_3.AccountType.FUTURES;
                    // Step 2: Get users with trading accounts and balances for this platform/currency
                    const usersWithAccountsAndBalances = await this.getUsersTradingAccountsAndBalances(tradingPlatform, currency, accountType);
                    if (usersWithAccountsAndBalances.length === 0) {
                        lambda_powertools_logger_1.default.info(`No eligible users found for signal ${signalData.signalId} on ${tradingPlatform} with ${currency} balance`);
                        successMessageIds.push(queueMessage.messageId);
                        continue;
                    }
                    // Step 3: Process each user in parallel
                    const userProcessingResults = await Promise.allSettled(usersWithAccountsAndBalances.map(async ({ userId, tradingAccount, balance }) => {
                        try {
                            // Create proposed trade for validation
                            const proposedTrade = {
                                userId,
                                signalId: signalData.signalId,
                                baseAsset: signalData.baseAsset,
                                quoteCurrency: signalData.quoteCurrency,
                                baseQuantity: 0, // Will be calculated after validation
                                quoteTotal: 0,
                                side: signalData.tradeSide,
                                tradingAccountId: tradingAccount._id,
                                leverage: 1, // Default leverage, can be adjusted
                                price: signalData.entryPrice,
                            };
                            // Get user's trading rules
                            const [userTradingRules, activeTrades] = await Promise.all([
                                this.getUserTradingRules(userId),
                                this.getUserActiveTrades(userId),
                            ]);
                            // Validate trading rules
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
                            // Get user's risk percentage rule
                            const riskPercentage = Number(userTradingRules.filter((rule) => rule.name ===
                                enums_1.TradingRuleName.RISK_PERCENTAGE_PER_TRADE)[0]);
                            const leverage = 1; // Default leverage
                            // Calculate trade amount
                            const tradeAmount = this.calculateTradeAmount(balance.availableBalance, riskPercentage);
                            // Calculate base quantity
                            const baseQuantity = tradeAmount / signalData.entryPrice;
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
                                platformName: tradingAccount.platformName,
                                apiKey: tradingAccount.apiKey,
                                apiSecret: tradingAccount.apiSecret,
                                passphrase: tradingAccount.passphrase,
                                leverage,
                                riskPercentage,
                                availableBalance: balance.availableBalance,
                            };
                        }
                        catch (error) {
                            lambda_powertools_logger_1.default.error(`Error processing user ${userId}:`, { error });
                            return {
                                success: false,
                                reason: "Processing error",
                                userId: userId,
                            };
                        }
                    }));
                    // Step 4: Collect successful user allocations
                    const successfulAllocations = userProcessingResults
                        .filter((result) => result.status === "fulfilled" &&
                        result.value.success)
                        .map((result) => result.value)
                        .filter((result) => result.tradeAmount !== undefined);
                    // Step 5: Sort by trade amount (descending) to prioritize larger trades
                    successfulAllocations.sort((a, b) => b.tradeAmount - a.tradeAmount);
                    // Step 6: Allocate trades up to target amount
                    let currentAllocatedAmount = 0;
                    for (const allocation of successfulAllocations) {
                        if (currentAllocatedAmount >=
                            signalData.targetAmountToFill) {
                            break;
                        }
                        const remainingAmount = signalData.targetAmountToFill -
                            currentAllocatedAmount;
                        const finalTradeAmount = Math.min(allocation.tradeAmount, remainingAmount);
                        const finalBaseQuantity = finalTradeAmount / signalData.entryPrice;
                        userTradeAllocations.push({
                            userId: allocation.userId,
                            tradingAccountId: allocation.tradingAccountId,
                            tradeAmount: finalTradeAmount,
                            baseQuantity: finalBaseQuantity,
                            platformName: allocation.platformName,
                            apiKey: allocation.apiKey,
                            apiSecret: allocation.apiSecret,
                            passphrase: allocation.passphrase,
                            leverage: allocation.leverage,
                            riskPercentage: allocation.riskPercentage,
                            availableBalance: allocation.availableBalance,
                        });
                        currentAllocatedAmount += finalTradeAmount;
                        totalAllocatedAmount += finalTradeAmount;
                    }
                    lambda_powertools_logger_1.default.info(`Successfully processed signal ${signalData.signalId}`, {
                        platform: tradingPlatform,
                        currency: currency,
                        totalUsersWithAccounts: usersWithAccountsAndBalances.length,
                        successfulAllocations: successfulAllocations.length,
                        finalAllocations: userTradeAllocations.length,
                        totalAllocatedAmount: currentAllocatedAmount,
                        targetAmount: signalData.targetAmountToFill,
                    });
                    successMessageIds.push(queueMessage.messageId);
                }
                catch (error) {
                    lambda_powertools_logger_1.default.error(`Error processing queue message ${queueMessage.messageId}:`, { error });
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
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("General error in processUserTradingWithActiveSignal:", {
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
exports.TradingEngineService = TradingEngineService;
exports.default = new TradingEngineService();
