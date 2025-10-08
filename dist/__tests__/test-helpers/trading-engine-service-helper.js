"use strict";
// add helper functions for trading engine service testing
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlatformTradingRule = exports.createMultipleCompleteTradesForUser = exports.createCompleteTradeWithOrders = exports.createOrderBatch = exports.getUserTradingRules = exports.getActiveTradesForUser = exports.getUserTradingAccountsWithBalances = exports.createTestableTradingEngineService = exports.createMultipleUserTradingSetups = exports.createCompleteUserTradingSetup = exports.createOrder = exports.createMultipleTradesForUser = exports.createTrade = exports.createDefaultUserTradingRules = exports.createUserTradingRule = exports.createTradingRule = exports.computeAccountSize = exports.createTradingAccountWithBalances = exports.createAccountBalance = exports.createTradingAccount = exports.generateAccountId = exports.generateObjectId = exports.clearTestTradingEngineDatabase = exports.setupTestTradingEngineDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const MongoDBClient_1 = require("src/clients/MongoDBClient");
const constants_1 = require("src/clients/MongoDBClient/constants");
const TradingEngineService_1 = require("src/services/TradingEngineService");
const enums_1 = require("src/services/TradingEngineService/enums");
const enums_2 = require("src/config/enums");
/**
 * Sets up in-memory MongoDB server for trading engine testing
 */
const setupTestTradingEngineDatabase = async () => {
    const mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    const tradingEngineConnection = mongoose_1.default.createConnection(uri + "trading-engine-test");
    // Wait for connection to be ready
    await new Promise((resolve) => {
        tradingEngineConnection.on("connected", resolve);
    });
    const cleanup = async () => {
        await tradingEngineConnection.close();
        await mongoServer.stop();
    };
    return {
        mongoServer,
        tradingEngineConnection,
        cleanup,
    };
};
exports.setupTestTradingEngineDatabase = setupTestTradingEngineDatabase;
/**
 * Clears all collections in the test trading engine database
 */
const clearTestTradingEngineDatabase = async (connection) => {
    if (connection.readyState === 1) {
        await connection.db?.dropDatabase();
    }
};
exports.clearTestTradingEngineDatabase = clearTestTradingEngineDatabase;
// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
const generateObjectId = () => new mongoose_1.default.Types.ObjectId().toString();
exports.generateObjectId = generateObjectId;
const generateAccountId = (prefix = "account") => `${prefix}-${(0, exports.generateObjectId)()}`;
exports.generateAccountId = generateAccountId;
/**
 * Creates a trading account
 */
const createTradingAccount = async (connection, options = {}) => {
    const accountCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.userTradingAccounts);
    const accountData = {
        id: options.id || (0, exports.generateAccountId)(),
        userId: options.userId || `user-${(0, exports.generateObjectId)()}`,
        platformName: options.platformName || enums_2.TradingPlatform.BINANCE,
        platformId: options.platformId || 1,
        apiKey: options.apiKey || "test-api-key",
        apiSecret: options.apiSecret || "test-api-secret",
        passphrase: options.passphrase,
        accessToken: options.accessToken,
        refreshToken: options.refreshToken,
        externalAccountUserId: options.externalAccountUserId || `ext-${(0, exports.generateObjectId)()}`,
        isWithdrawalEnabled: options.isWithdrawalEnabled !== undefined
            ? options.isWithdrawalEnabled
            : true,
        isFuturesTradingEnabled: options.isFuturesTradingEnabled !== undefined
            ? options.isFuturesTradingEnabled
            : true,
        isSpotTradingEnabled: options.isSpotTradingEnabled !== undefined
            ? options.isSpotTradingEnabled
            : true,
        isIpAddressWhitelisted: options.isIpAddressWhitelisted,
        connectionStatus: options.connectionStatus || enums_1.AccountConnectionStatus.CONNECTED,
        errorMessages: options.errorMessages || [],
        category: options.category || enums_2.Category.CRYPTO,
        connectionType: options.connectionType || enums_1.ConnectionType.FAST,
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };
    return accountCollection.insertOne(accountData);
};
exports.createTradingAccount = createTradingAccount;
/**
 * Creates an account balance
 */
const createAccountBalance = async (connection, options = {}) => {
    const balanceCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.userTradingAccountBalances);
    const balanceData = {
        id: options.id || (0, exports.generateObjectId)(),
        userId: options.userId || `user-${(0, exports.generateObjectId)()}`,
        platformName: options.platformName || enums_2.TradingPlatform.BINANCE,
        platformId: options.platformId || 1,
        currency: options.currency || enums_2.Currency.USDT,
        accountType: options.accountType || enums_2.AccountType.FUTURES,
        availableBalance: options.availableBalance ?? 1000,
        lockedBalance: options.lockedBalance ?? 0,
        accountSize: options.accountSize ||
            (0, exports.computeAccountSize)(options.availableBalance ?? 1000, options.lockedBalance ?? 0),
        tradingAccountId: options.tradingAccountId || new mongoose_1.default.Types.ObjectId(),
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };
    return balanceCollection.insertOne(balanceData);
};
exports.createAccountBalance = createAccountBalance;
/**
 * Creates a trading account with balances
 */
const createTradingAccountWithBalances = async (connection, userId, accountOptions = {}, balances = [
    { currency: enums_2.Currency.USDT, availableBalance: 1000 },
    // { currency: Currency.BTC, availableBalance: 0.1 },
]) => {
    // Create trading account
    const account = await (0, exports.createTradingAccount)(connection, {
        ...accountOptions,
        userId,
    });
    // Create balances for this account
    const accountBalances = [];
    for (const balanceOptions of balances) {
        const balance = await (0, exports.createAccountBalance)(connection, {
            ...balanceOptions,
            userId,
            tradingAccountId: new mongoose_1.default.Types.ObjectId(account._id),
            platformName: account.platformName,
            platformId: account.platformId,
            accountSize: (0, exports.computeAccountSize)(balanceOptions.availableBalance ?? 1000, balanceOptions.lockedBalance ?? 0),
        });
        accountBalances.push(balance);
    }
    return {
        account,
        balances: accountBalances,
    };
};
exports.createTradingAccountWithBalances = createTradingAccountWithBalances;
const computeAccountSize = (availableBalance, lockedBalance) => {
    const totalBalance = availableBalance + (lockedBalance ?? 0);
    const tiers = [
        100, 200, 300, 500, 750, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000,
        7500, 10000, 12500, 15000, 20000, 25000, 30000, 40000, 50000, 60000,
        75000, 100000, 125000, 150000, 200000, 250000, 300000, 400000, 500000,
    ];
    // Find the smallest tier that accommodates the balance
    const accountSize = tiers.find((tier) => totalBalance <= tier);
    // Default to 500000 for anything above the highest tier
    return accountSize || 500000;
};
exports.computeAccountSize = computeAccountSize;
/**
 * Creates a trading rule
 */
const createTradingRule = async (connection, options = {}) => {
    const ruleCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.tradingRules);
    const ruleData = {
        id: options.id || (0, exports.generateObjectId)(),
        name: options.name || enums_1.TradingRuleName.RISK_PERCENTAGE_PER_TRADE,
        description: options.description || "Test trading rule description",
        tooltip: options.tooltip || "Test tooltip",
        category: options.category || enums_1.TradingRuleCategory.RISK_MANAGEMENT,
        type: options.type || enums_1.TradingRuleType.PERCENTAGE,
        value: options.value || 2,
        isEnabled: options.isEnabled !== undefined ? options.isEnabled : true,
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };
    return ruleCollection.insertOne(ruleData);
};
exports.createTradingRule = createTradingRule;
/**
 * Creates a user trading rule
 */
const createUserTradingRule = async (connection, userId, options = {}) => {
    const userRuleCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.userTradingRules);
    const userRuleData = {
        id: options.id || (0, exports.generateObjectId)(),
        userId,
        ruleId: options.ruleId || (0, exports.generateObjectId)(),
        name: options.name || enums_1.TradingRuleName.RISK_PERCENTAGE_PER_TRADE,
        description: options.description || "Test user trading rule description",
        tooltip: options.tooltip || "Test tooltip",
        category: options.category || enums_1.TradingRuleCategory.RISK_MANAGEMENT,
        type: options.type || enums_1.TradingRuleType.PERCENTAGE,
        value: options.value || 2,
        isEnabled: options.isEnabled !== undefined ? options.isEnabled : true,
        isCustomized: options.isCustomized || false,
        lastResetToDefault: options.lastResetToDefault || null,
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };
    return userRuleCollection.insertOne(userRuleData);
};
exports.createUserTradingRule = createUserTradingRule;
/**
 * Creates default trading rules for a user
 */
const createDefaultUserTradingRules = async (connection, userId) => {
    const defaultRules = [
        {
            name: enums_1.TradingRuleName.RISK_PERCENTAGE_PER_TRADE,
            category: enums_1.TradingRuleCategory.RISK_MANAGEMENT,
            type: enums_1.TradingRuleType.PERCENTAGE,
            value: 1,
            isEnabled: true,
        },
        {
            name: enums_1.TradingRuleName.MAXIMUM_RISK_AMOUNT_PER_TRADE,
            category: enums_1.TradingRuleCategory.RISK_MANAGEMENT,
            type: enums_1.TradingRuleType.AMOUNT,
            value: 100,
            isEnabled: true,
        },
        {
            name: enums_1.TradingRuleName.MAXIMUM_LEVERAGE,
            category: enums_1.TradingRuleCategory.RISK_MANAGEMENT,
            type: enums_1.TradingRuleType.COUNT,
            value: 10,
            isEnabled: true,
        },
        {
            name: enums_1.TradingRuleName.MINIMUM_RISK_REWARD_RATIO,
            category: enums_1.TradingRuleCategory.RISK_MANAGEMENT,
            type: enums_1.TradingRuleType.COUNT,
            value: 2,
            isEnabled: true,
        },
        {
            name: enums_1.TradingRuleName.MAXIMUM_CONCURRENT_TRADES,
            category: enums_1.TradingRuleCategory.POSITION_LIMITS,
            type: enums_1.TradingRuleType.COUNT,
            value: 4,
            isEnabled: true,
        },
        {
            name: enums_1.TradingRuleName.DIRECTION_BALANCE_LIMIT,
            category: enums_1.TradingRuleCategory.DIRECTION_BALANCE,
            type: enums_1.TradingRuleType.PERCENTAGE,
            value: 2,
            isEnabled: true,
        },
    ];
    const rules = [];
    for (const rule of defaultRules) {
        const userRule = await (0, exports.createUserTradingRule)(connection, userId, rule);
        rules.push(userRule);
    }
    return rules;
};
exports.createDefaultUserTradingRules = createDefaultUserTradingRules;
/**
 * Creates a trade
 */
const createTrade = async (connection, options = {}) => {
    const tradeCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.trades);
    const tradeData = {
        id: options.id || (0, exports.generateObjectId)(),
        userId: options.userId || `user-${(0, exports.generateObjectId)()}`,
        masterTradeId: options.masterTradeId || `master-trade-${(0, exports.generateObjectId)()}`,
        baseAsset: options.baseAsset || "BTC",
        quoteCurrency: options.quoteCurrency || "USDT",
        baseQuantity: options.baseQuantity || 0.001,
        entryPrice: options.entryPrice || 50000,
        stopLossPrice: options.stopLossPrice || 40000,
        takeProfitPrice: options.takeProfitPrice || 60000,
        quoteTotal: options.quoteTotal || 50,
        pair: options.pair || "BTCUSDT",
        side: options.side || enums_1.TradeSide.LONG,
        pnl: options.pnl || 0,
        status: options.status || enums_1.TradeStatus.ACTIVE,
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };
    return tradeCollection.insertOne(tradeData);
};
exports.createTrade = createTrade;
/**
 * Creates multiple trades for a user
 */
const createMultipleTradesForUser = async (connection, userId, count, options = {}) => {
    const trades = [];
    for (let i = 0; i < count; i++) {
        const trade = await (0, exports.createTrade)(connection, {
            ...options,
            userId,
            id: options.id ? `${options.id}-${i}` : undefined,
        });
        trades.push(trade);
    }
    return trades;
};
exports.createMultipleTradesForUser = createMultipleTradesForUser;
/**
 * Creates an order
 */
const createOrder = async (connection, options = {}) => {
    const orderCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.orders);
    const orderData = {
        id: options.id || (0, exports.generateObjectId)(),
        userId: options.userId || `user-${(0, exports.generateObjectId)()}`,
        tradeId: options.tradeId || new mongoose_1.default.Types.ObjectId(),
        orderBatchId: options.orderBatchId || new mongoose_1.default.Types.ObjectId(),
        baseAsset: options.baseAsset || "BTC",
        baseQuantity: options.baseQuantity || 0.001,
        type: options.type || enums_1.OrderType.BUY,
        placementType: options.placementType || enums_1.OrderPlacementType.MARKET,
        price: options.price || 50000,
        total: options.total || 50,
        quoteCurrency: options.quoteCurrency || "USDT",
        quoteTotal: options.quoteTotal || 50,
        status: options.status || enums_1.OrderStatus.PENDING,
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };
    return orderCollection.insertOne(orderData);
};
exports.createOrder = createOrder;
// =============================================================================
// COMPREHENSIVE TEST SCENARIOS
// =============================================================================
/**
 * Creates a complete user trading setup with account, balances, rules, and trades
 */
const createCompleteUserTradingSetup = async (connection, userId, options = {}) => {
    const { accountOptions = {}, balanceOptions = [
        {
            currency: enums_2.Currency.USDT,
            availableBalance: 10000,
            accountSize: 10000,
        },
        // { currency: Currency.BTC, availableBalance: 0.5 },
    ], includeDefaultRules = true, customRules = [], existingTrades = 0, tradeSides = {}, tradeOptions = {}, } = options;
    // Create account with balances
    const { account, balances } = await (0, exports.createTradingAccountWithBalances)(connection, userId, accountOptions, balanceOptions);
    // Create trading rules
    let tradingRules = [];
    if (includeDefaultRules) {
        tradingRules = await (0, exports.createDefaultUserTradingRules)(connection, userId);
    }
    // Add custom rules
    for (const ruleOptions of customRules) {
        const rule = await (0, exports.createUserTradingRule)(connection, userId, ruleOptions);
        tradingRules.push(rule);
    }
    // Create existing trades with specified sides
    const trades = [];
    const { long = existingTrades, short = 0 } = tradeSides;
    if (long + short !== existingTrades) {
        throw new Error(`Total trades (${long + short}) must equal existing trades (${existingTrades})`);
    }
    // Create LONG trades
    for (let i = 0; i < long; i++) {
        const trade = await (0, exports.createTrade)(connection, {
            ...tradeOptions,
            userId,
            side: enums_1.TradeSide.LONG,
            id: tradeOptions.id ? `${tradeOptions.id}-long-${i}` : undefined,
        });
        trades.push(trade);
    }
    // Create SHORT trades
    for (let i = 0; i < short; i++) {
        const trade = await (0, exports.createTrade)(connection, {
            ...tradeOptions,
            userId,
            side: enums_1.TradeSide.SHORT,
            id: tradeOptions.id ? `${tradeOptions.id}-short-${i}` : undefined,
        });
        trades.push(trade);
    }
    const testService = new TradingEngineService_1.TradingEngineService(connection);
    return {
        account,
        balances,
        tradingRules,
        trades,
        testService,
    };
};
exports.createCompleteUserTradingSetup = createCompleteUserTradingSetup;
/**
 * Creates multiple users with different trading configurations
 */
const createMultipleUserTradingSetups = async (connection, userConfigs) => {
    const results = [];
    for (const config of userConfigs) {
        const setup = await (0, exports.createCompleteUserTradingSetup)(connection, config.userId, config.setupOptions);
        results.push({
            userId: config.userId,
            setup,
        });
    }
    return results;
};
exports.createMultipleUserTradingSetups = createMultipleUserTradingSetups;
/**
 * Creates a testable instance of TradingEngineService
 */
const createTestableTradingEngineService = (connection) => {
    return new TradingEngineService_1.TradingEngineService(connection);
};
exports.createTestableTradingEngineService = createTestableTradingEngineService;
// =============================================================================
// QUERY HELPERS
// =============================================================================
/**
 * Gets user trading accounts with balances
 */
const getUserTradingAccountsWithBalances = async (connection, userId) => {
    const accountCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.userTradingAccounts);
    const balanceCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.userTradingAccountBalances);
    const accounts = await accountCollection.find({ userId });
    const results = [];
    for (const account of accounts) {
        const balances = await balanceCollection.find({
            tradingAccountId: account._id,
        });
        results.push({ account, balances });
    }
    return results;
};
exports.getUserTradingAccountsWithBalances = getUserTradingAccountsWithBalances;
/**
 * Gets active trades for a user
 */
const getActiveTradesForUser = async (connection, userId) => {
    const tradeCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.trades);
    return tradeCollection.find({
        userId,
        status: enums_1.TradeStatus.ACTIVE,
    });
};
exports.getActiveTradesForUser = getActiveTradesForUser;
/**
 * Gets user trading rules
 */
const getUserTradingRules = async (connection, userId) => {
    const ruleCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.userTradingRules);
    return ruleCollection.find({ userId });
};
exports.getUserTradingRules = getUserTradingRules;
/**
 * Creates an order batch
 */
const createOrderBatch = async (connection, options = {}) => {
    const orderBatchCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.orderBatches);
    const orderBatchData = {
        id: options.id || (0, exports.generateObjectId)(),
        // Remove orderId - it's not in the interface
        baseAsset: options.baseAsset || "BTC",
        quoteCurrency: options.quoteCurrency || "USDT",
        baseQuantity: options.baseQuantity || 0.001,
        quoteTotal: options.quoteTotal || 50,
        status: options.status || enums_1.OrderBatchStatus.PENDING,
        tradingAccountId: options.tradingAccountId || new mongoose_1.default.Types.ObjectId(),
        platformName: options.platformName || enums_2.TradingPlatform.BINANCE,
        platformId: options.platformId || 1,
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };
    return orderBatchCollection.insertOne(orderBatchData);
};
exports.createOrderBatch = createOrderBatch;
/**
 * Creates a complete trade with orders and order batches
 */
const createCompleteTradeWithOrders = async (connection, options = {}) => {
    const { orderCount = 1, orderOptions = {}, orderBatchOptions = {}, ...tradeOptions } = options;
    // Create the trade first
    const trade = await (0, exports.createTrade)(connection, tradeOptions);
    const orders = [];
    const orderBatches = [];
    // Create orders and their batches
    for (let i = 0; i < orderCount; i++) {
        // Create order batch first
        const orderBatch = await (0, exports.createOrderBatch)(connection, {
            ...orderBatchOptions,
            baseAsset: trade.baseAsset,
            quoteCurrency: trade.quoteCurrency,
            baseQuantity: trade.baseQuantity / orderCount,
            quoteTotal: trade.quoteTotal / orderCount,
            id: orderBatchOptions.id
                ? `${orderBatchOptions.id}-${i}`
                : undefined,
        });
        // Create order
        const order = await (0, exports.createOrder)(connection, {
            ...orderOptions,
            userId: trade.userId,
            tradeId: new mongoose_1.default.Types.ObjectId(trade._id),
            orderBatchId: new mongoose_1.default.Types.ObjectId(orderBatch._id),
            baseAsset: trade.baseAsset,
            quoteCurrency: trade.quoteCurrency,
            baseQuantity: trade.baseQuantity / orderCount,
            quoteTotal: trade.quoteTotal / orderCount,
            price: orderOptions.price || trade.entryPrice, // Use trade's entryPrice
            total: (trade.baseQuantity / orderCount) *
                (orderOptions.price || trade.entryPrice), // Calculate total
            id: orderOptions.id ? `${orderOptions.id}-${i}` : undefined,
        });
        orders.push(order);
        orderBatches.push(orderBatch);
    }
    return {
        trade,
        orders,
        orderBatches,
    };
};
exports.createCompleteTradeWithOrders = createCompleteTradeWithOrders;
// Update the createMultipleTradesForUser function to use complete trades
const createMultipleCompleteTradesForUser = async (connection, userId, count, options = {}) => {
    const results = [];
    for (let i = 0; i < count; i++) {
        const result = await (0, exports.createCompleteTradeWithOrders)(connection, {
            ...options,
            userId,
            id: options.id ? `${options.id}-${i}` : undefined,
        });
        results.push(result);
    }
    return results;
};
exports.createMultipleCompleteTradesForUser = createMultipleCompleteTradesForUser;
const createPlatformTradingRule = async (connection, options) => {
    const ruleCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.TradingEngineServiceCollections.platformTradingRules);
    const ruleData = {
        id: (0, exports.generateObjectId)(),
        pair: options.pair,
        baseAsset: options.baseAsset || "BTC",
        quoteCurrency: options.quoteCurrency || "USDT",
        minQuantity: options.minQuantity,
        minNotional: options.minNotional,
        stepSize: options.stepSize,
        platform: options.platform,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    return ruleCollection.insertOne(ruleData);
};
exports.createPlatformTradingRule = createPlatformTradingRule;
