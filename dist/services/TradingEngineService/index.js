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
const helpers_2 = require("src/clients/SQSClient/helpers");
class TradingEngineService {
    constructor(connection) {
        this.connection = null;
        this.secrets = null;
        this.initialized = false;
        this.initializationPromise = null;
        this.isExternalConnection = false;
        if (connection) {
            this.connection = connection;
            this.isExternalConnection = true;
            this.initialized = true;
        }
    }
    // Initialize the service once (only needed when no external connection provided)
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
        // Only close connection if we created it (not externally provided)
        if (this.connection && !this.isExternalConnection) {
            await this.connection.close();
            this.connection = null;
        }
    }
    // For cleanup, especially in testing
    async cleanup() {
        await this.closeResources();
        if (!this.isExternalConnection) {
            this.initialized = false;
        }
    }
    // Get connection (ensures initialization first if needed)
    async getConnection() {
        if (!this.isExternalConnection) {
            await this.initialize();
        }
        if (!this.connection) {
            throw new Error("Database connection not available");
        }
        return this.connection;
    }
    // Get secrets (ensures initialization first)
    async getSecrets() {
        if (!this.isExternalConnection) {
            await this.initialize();
        }
        if (!this.secrets) {
            throw new Error("Secrets not available");
        }
        return this.secrets;
    }
    // MAIN VALIDATION METHOD - Validate user trading rules before entering a trade
    async validateTradingRules({ userId, proposedTrade, tradingAccount, accountBalance, userTradingRules, activeTrades, }) {
        try {
            if (!this.isExternalConnection) {
                await this.initialize();
            }
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
            lambda_powertools_logger_1.default.info("validateTradingRulesResult", {
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
    calculateLeverage(input) {
        const { entryPrice, liquidationPrice, tradeSide, maintenanceMarginRate = 0.004, } = input;
        if (entryPrice <= 0 || liquidationPrice <= 0) {
            throw new Error("Entry price and liquidation price must be greater than zero.");
        }
        const ratio = liquidationPrice / entryPrice;
        let denominator;
        if (tradeSide === enums_1.TradeSide.LONG) {
            denominator = 1 + maintenanceMarginRate - ratio;
        }
        else if (tradeSide === enums_1.TradeSide.SHORT) {
            denominator = ratio - (1 - maintenanceMarginRate);
        }
        else {
            throw new Error("Invalid trade side. Must be 'LONG' or 'SHORT'.");
        }
        if (denominator <= 0) {
            throw new Error("Invalid values: denominator is zero or negative. Check inputs.");
        }
        return Math.floor(1 / denominator);
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
    async getPlatformTradingRulesForPair(tradingPlatform, pair) {
        try {
            const connection = await this.getConnection();
            const tradingRulesCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.platformTradingRules);
            const rule = await tradingRulesCollection.findOne({
                platform: tradingPlatform,
                pair,
            });
            lambda_powertools_logger_1.default.info("getPlatformTradingRulesForPair", {
                tradingPlatform,
                pair,
                rule,
            });
            return rule;
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("Error fetching trading platform rules:", {
                error,
                tradingPlatform,
                pair,
            });
            throw error;
        }
    }
    // Consolidated method to get users with trading accounts and their balances
    async getUsersTradingAccountsAndBalances({ platforms, currency, accountType = enums_3.AccountType.FUTURES, }) {
        try {
            const connection = await this.getConnection();
            const accountsCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.userTradingAccounts);
            const balancesCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.userTradingAccountBalances);
            // Get trading accounts for the platform
            const tradingAccounts = await accountsCollection.find({
                platformName: { $in: platforms },
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
                        balance,
                    });
                }
            }
            return results;
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("Error fetching users with trading accounts and balances:", {
                error,
                platforms,
                currency,
                accountType,
            });
            throw error;
        }
    }
    // Helper method to calculate trade amount based on risk amount, risk percentage, entry price, stop loss price, and leverage
    calculateTradeAmount(input) {
        const { accountSize, maxRiskAmount, riskPercentage, entryPrice, stopLossPrice, leverage, stepSize, } = input;
        const calculatedRiskAmount = (accountSize * riskPercentage) / 100;
        let riskAmount = Math.round(Math.min(maxRiskAmount, calculatedRiskAmount));
        // Minimum risk amount is 10 USDT
        if (riskAmount < 10)
            riskAmount = 10;
        if (entryPrice <= 0 || stopLossPrice <= 0) {
            throw new Error("Entry and stop loss prices must be greater than zero.");
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
        const baseQuantity = Math.floor(quantity / stepSize) * stepSize;
        return {
            riskAmount,
            positionSize,
            requiredMargin,
            baseQuantity,
        };
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
    async validateUserTradeEligibilityForPairOnPlatform(input) {
        const { positionSize, platformTradingRule, baseQuantity } = input;
        const reasons = [];
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
            reasons.push(`Quantity ${quantity.toFixed(6)} < minQty ${minQuantity}`);
        }
        if (positionSize < minNotional) {
            reasons.push(`Position size ${positionSize.toFixed(2)} < minNotional ${minNotional}`);
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
    /**
     * Creates trades for a specific user
     */
    async createTradeForUser(userId, tradeData) {
        try {
            const connection = await this.getConnection();
            const tradesCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.trades);
            const trade = {
                ...tradeData,
                userId,
                pnl: 0, // New trades have no PnL yet
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const createdTrade = await tradesCollection.insertOne(trade);
            lambda_powertools_logger_1.default.info(`Created trade for user ${userId}`);
            return createdTrade;
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("Error creating trades for user:", { error, userId });
            throw error;
        }
    }
    // Modify atomicallyProcessMasterTradeForUser to NOT create trades
    async validateAndProcessMasterTradeForUser({ userId, masterTrade, tradingAccount, balance, platformTradingRule, }) {
        // const connection = await this.getConnection();
        try {
            // Get fresh data for validation
            const [userTradingRules, activeTrades] = await Promise.all([
                this.getUserTradingRules(userId),
                this.getUserActiveTrades(userId),
            ]);
            // Create proposed trade for validation
            const proposedTrade = {
                userId,
                masterTradeId: masterTrade.masterTradeId,
                baseAsset: masterTrade.baseAsset,
                quoteCurrency: masterTrade.quoteCurrency,
                quoteTotal: 0,
                side: masterTrade.tradeSide,
                tradingAccountId: tradingAccount._id,
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
            const riskPercentageRule = userTradingRules.find((rule) => rule.name === enums_1.TradingRuleName.RISK_PERCENTAGE_PER_TRADE);
            const riskAmountRule = userTradingRules.find((rule) => rule.name === enums_1.TradingRuleName.MAXIMUM_RISK_AMOUNT_PER_TRADE);
            const riskPercentage = riskPercentageRule
                ? Number(riskPercentageRule.value)
                : 1;
            // Calculate trade amount
            const { positionSize, requiredMargin, riskAmount, baseQuantity } = this.calculateTradeAmount({
                accountSize: balance.accountSize,
                maxRiskAmount: riskAmountRule
                    ? Number(riskAmountRule.value)
                    : 0,
                riskPercentage,
                entryPrice: masterTrade.entryPrice,
                stopLossPrice: masterTrade.stopLossPrice,
                leverage: 25,
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
            const tradeEligibilityResult = await this.validateUserTradeEligibilityForPairOnPlatform({
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
                tradingAccountId: tradingAccount._id,
                positionSize,
                requiredMargin,
                platformName: tradingAccount.platformName,
                apiKey: tradingAccount.apiKey,
                apiSecret: tradingAccount.apiSecret,
                passphrase: tradingAccount.passphrase,
                riskAmount,
                riskPercentage,
                availableBalance: balance.availableBalance,
                tradeAmount: requiredMargin,
            };
        }
        catch (error) {
            return {
                success: false,
                // reason: "Validation error",
                reason: error instanceof Error ? error.message : "Unknown error",
                userId: userId,
            };
        }
    }
    // New method to create trades for allocated users
    async createTradesForAllocatedUsers(allocations, masterTrade) {
        const successfulAllocations = [];
        // Create trades for each allocated user
        const tradeCreationResults = await Promise.allSettled(allocations.map(async (allocation) => {
            const trade = {
                masterTradeId: masterTrade.masterTradeId,
                baseAsset: masterTrade.baseAsset,
                quoteCurrency: masterTrade.quoteCurrency,
                baseQuantity: allocation.positionSize,
                entryPrice: masterTrade.entryPrice,
                stopLossPrice: masterTrade.stopLossPrice,
                takeProfitPrice: masterTrade.takeProfitPrice,
                quoteTotal: allocation.requiredMargin,
                pair: masterTrade.pair,
                side: masterTrade.tradeSide,
                status: enums_1.TradeStatus.PENDING,
            };
            const createdTrade = await this.createTradeForUser(allocation.userId, trade);
            return createdTrade;
        }));
        // Only return allocations where trade creation succeeded
        tradeCreationResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
                successfulAllocations.push(result.value);
            }
            else {
                lambda_powertools_logger_1.default.error(`Failed to create trade for user ${allocations[index].userId}:`, result.reason);
            }
        });
        return successfulAllocations;
    }
    /**
     * Allocates trades up to the target amount from processed users
     */
    allocateTradesUpToTargetAmount(successfullyProcessedUsers, signalData) {
        const userTradeAllocations = [];
        let currentAllocatedAmount = 0;
        // Sort by trade amount (descending) to prioritize larger trades
        successfullyProcessedUsers.sort((a, b) => b.tradeAmount - a.tradeAmount);
        for (const allocation of successfullyProcessedUsers) {
            if (currentAllocatedAmount >= signalData.targetOrdersAmountToFill) {
                break;
            }
            // const remainingAmount =
            //     signalData.targetAmountToFill - currentAllocatedAmount;
            // const finalTradeAmount = Math.min(
            //     allocation.requiredMargin ?? 0,
            //     remainingAmount
            // );
            // const finalBaseQuantity = finalTradeAmount / signalData.entryPrice;
            userTradeAllocations.push({
                userId: allocation.userId,
                riskAmount: allocation.riskAmount,
                positionSize: allocation.positionSize,
                requiredMargin: allocation.requiredMargin,
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
    async processSingleMasterTrade(masterTrade) {
        const currency = masterTrade.quoteCurrency;
        const accountType = masterTrade.accountType || enums_3.AccountType.FUTURES;
        // Get users with trading accounts and balances for this platform/currency
        const usersWithAccountsAndBalances = await this.getUsersTradingAccountsAndBalances({
            platforms: masterTrade.supportedTradingPlatforms,
            currency,
            accountType,
        });
        if (usersWithAccountsAndBalances.length === 0) {
            lambda_powertools_logger_1.default.info(`No eligible users found for master trade ${masterTrade.masterTradeId} on ${masterTrade.supportedTradingPlatforms} with ${currency} balance`);
            return { allocations: [], totalAllocated: 0 };
        }
        // Get trading rules for each platform
        const platformsTradingRules = await Promise.all(usersWithAccountsAndBalances.map(async ({ tradingAccount }) => {
            return this.getPlatformTradingRulesForPair(tradingAccount.platformName, masterTrade.pair);
        }));
        // Step 1: Process all users (validate + calculate) WITHOUT creating trades
        const userProcessingResults = await Promise.allSettled(usersWithAccountsAndBalances.map(async ({ userId, tradingAccount, balance }) => {
            return this.validateAndProcessMasterTradeForUser({
                userId,
                masterTrade,
                tradingAccount,
                balance,
                platformTradingRule: platformsTradingRules.find((rule) => rule?.platform === tradingAccount.platformName),
            });
        }));
        // Step 2: Collect successful users
        const successfullyProcessedUsers = userProcessingResults
            .filter((result) => result.status === "fulfilled" && result.value.success)
            .map((result) => result
            .value)
            .filter((result) => result.tradeAmount !== undefined);
        // Step 3: Allocate users up to target amount
        const { allocations, totalAllocated } = this.allocateTradesUpToTargetAmount(successfullyProcessedUsers, masterTrade);
        // Step 4: Create trades only for allocated users
        const createdTradesForAllocatedUsers = await this.createTradesForAllocatedUsers(allocations, masterTrade);
        const allocationsWithTrades = allocations.map((allocation, index) => {
            const tradingAccount = usersWithAccountsAndBalances.find((user) => user.userId === allocation.userId);
            return {
                ...allocation,
                masterTradeId: masterTrade.masterTradeId,
                tradeId: createdTradesForAllocatedUsers[index]
                    ._id,
                tradingAccountId: tradingAccount?.tradingAccount
                    ._id,
                platformName: tradingAccount?.tradingAccount
                    .platformName,
                apiKey: tradingAccount?.tradingAccount.apiKey,
                apiSecret: tradingAccount?.tradingAccount
                    .apiSecret,
                passphrase: tradingAccount?.tradingAccount
                    .passphrase,
                tradeAmount: allocation.requiredMargin,
                availableBalance: tradingAccount?.balance
                    .availableBalance,
                baseAsset: masterTrade.baseAsset,
                quoteCurrency: masterTrade.quoteCurrency,
                quoteTotal: allocation.requiredMargin,
                entryPrice: masterTrade.entryPrice,
                stopLossPrice: masterTrade.stopLossPrice,
                takeProfitPrice: masterTrade.takeProfitPrice,
                tradeSide: masterTrade.tradeSide,
                orderPlacementType: masterTrade.orderPlacementType,
                accountType: masterTrade.accountType,
            };
        });
        lambda_powertools_logger_1.default.info(`Successfully processed signal ${masterTrade.masterTradeId}`, {
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
    async publishAllocationsToQueue(userTradeAllocations) {
        if (userTradeAllocations.length === 0) {
            return [];
        }
        const queuePublishingResults = await Promise.allSettled(userTradeAllocations.map(async (userTradeAllocation) => {
            return (0, helpers_2.publishMessageToQueue)({
                queueUrl: this.secrets?.PROCESS_USER_TRADES_QUEUE ?? "",
                message: JSON.stringify(userTradeAllocation),
            });
        }));
        // Filter out failed publications and return only successful ones
        const successfulAllocations = [];
        const failedUserIds = [];
        queuePublishingResults.forEach((result, index) => {
            const allocation = userTradeAllocations[index];
            if (result.status === "fulfilled") {
                successfulAllocations.push(allocation);
            }
            else {
                failedUserIds.push(allocation.userId);
                lambda_powertools_logger_1.default.error(`Failed to publish trade to queue for user ${allocation.userId}:`, result.reason);
            }
        });
        if (failedUserIds.length > 0) {
            lambda_powertools_logger_1.default.error(`Failed to publish trades for ${failedUserIds.length} users:`, {
                failedUserIds,
            });
        }
        return successfulAllocations;
    }
    // Consolidated method to process user trading with active signal
    async processIncomingMasterTrades(queueMessages) {
        try {
            const successMessageIds = [];
            const failedMessageIds = [];
            const allUserTradeAllocations = [];
            let totalAllocatedAmount = 0;
            let masterTradeDetails = null;
            await this.initialize();
            // Process all queue messages in parallel
            const signalProcessingResults = await Promise.allSettled(queueMessages.map(async (queueMessage) => {
                try {
                    const masterTrade = queueMessage.body;
                    // Process this signal and get allocations
                    const { allocations, totalAllocated } = await this.processSingleMasterTrade(masterTrade);
                    return {
                        success: true,
                        messageId: queueMessage.messageId,
                        masterTrade,
                        allocations,
                        totalAllocated,
                    };
                }
                catch (error) {
                    lambda_powertools_logger_1.default.error(`Error processing queue message ${queueMessage.messageId}:`, { error });
                    return {
                        success: false,
                        messageId: queueMessage.messageId,
                        error,
                    };
                }
            }));
            // Collect results from parallel processing
            signalProcessingResults.forEach((result) => {
                if (result.status === "fulfilled") {
                    const value = result.value;
                    if (value.success) {
                        successMessageIds.push(value.messageId);
                        allUserTradeAllocations.push(...(value.allocations || [])); // Provide empty array fallback
                        totalAllocatedAmount += value.totalAllocated || 0; // Provide 0 fallback
                        masterTradeDetails = value.masterTrade || null; // Convert undefined to null
                    }
                    else {
                        failedMessageIds.push(value.messageId);
                    }
                }
                else {
                    // This shouldn't happen since we're catching errors inside the map function
                    lambda_powertools_logger_1.default.error("Unexpected Promise.allSettled rejection:", result.reason);
                }
            });
            if (allUserTradeAllocations.length === 0) {
                lambda_powertools_logger_1.default.info("No user trades to publish to queue for signals", {
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
            const successfulAllocations = await this.publishAllocationsToQueue(allUserTradeAllocations);
            lambda_powertools_logger_1.default.info(`Successfully processed ${successMessageIds.length} signals in parallel`, {
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
            });
            return {
                successMessageIds,
                failedMessageIds,
                userTradeAllocations: successfulAllocations, // Only return successfully published allocations
                totalAllocatedAmount,
                masterTradeDetails,
            };
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("General error in processIncomingSignals:", { error });
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
exports.TradingEngineService = TradingEngineService;
exports.default = new TradingEngineService();
