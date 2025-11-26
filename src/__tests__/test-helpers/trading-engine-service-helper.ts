// add helper functions for trading engine service testing

import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoDBClient } from "src/clients/MongoDBClient";
import { TradingEngineServiceCollections } from "src/clients/MongoDBClient/constants";
import { TradingEngineService } from "src/services/TradingEngineService";
import {
    ITrade,
    IOrder,
    IOrderBatch,
    ITradingRule,
    IUserTradingRule,
    IUserTradingAccount,
    IUserTradingAccountBalance,
    IPlatformTradingRule,
    IMasterTrade,
} from "src/services/TradingEngineService/interfaces";
import {
    OrderType,
    OrderPlacementType,
    OrderStatus,
    OrderBatchStatus,
    TradeStatus,
    TradeSide,
    TradingRuleCategory,
    TradingRuleType,
    AccountConnectionStatus,
    ConnectionType,
    TradingRuleName,
    OrderSide,
    CandleStick,
    TradeRisk,
} from "src/services/TradingEngineService/enums";
import {
    Currency,
    AccountType,
    TradingPlatform,
    Category,
} from "src/config/enums";

// =============================================================================
// DATABASE SETUP AND TEARDOWN
// =============================================================================

export interface TestTradingEngineSetup {
    mongoServer: MongoMemoryServer;
    tradingEngineConnection: mongoose.Connection;
    cleanup: () => Promise<void>;
}

/**
 * Sets up in-memory MongoDB server for trading engine testing
 */
export const setupTestTradingEngineDatabase =
    async (): Promise<TestTradingEngineSetup> => {
        const mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        const tradingEngineConnection = mongoose.createConnection(
            uri + "trading-engine-test"
        );

        // Wait for connection to be ready
        await new Promise<void>((resolve) => {
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

/**
 * Clears all collections in the test trading engine database
 */
export const clearTestTradingEngineDatabase = async (
    connection: mongoose.Connection
): Promise<void> => {
    if (connection.readyState === 1) {
        await connection.db?.dropDatabase();
    }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const generateObjectId = () => new mongoose.Types.ObjectId().toString();

export const generateAccountId = (prefix: string = "account") =>
    `${prefix}-${generateObjectId()}`;

// =============================================================================
// TRADING ACCOUNT CREATION
// =============================================================================

export interface CreateTradingAccountOptions {
    id?: string;
    userId?: string;
    platformName?: TradingPlatform;
    platformId?: number;
    apiKey?: string;
    apiSecret?: string;
    passphrase?: string;
    accessToken?: string;
    refreshToken?: string;
    externalAccountUserId?: string;
    isWithdrawalEnabled?: boolean;
    isFuturesTradingEnabled?: boolean;
    isSpotTradingEnabled?: boolean;
    isIpAddressWhitelisted?: boolean;
    connectionStatus?: AccountConnectionStatus;
    errorMessages?: string[];
    category?: Category;
    connectionType?: ConnectionType;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Creates a trading account
 */
export const createTradingAccount = async (
    connection: mongoose.Connection,
    options: CreateTradingAccountOptions = {}
): Promise<IUserTradingAccount> => {
    const accountCollection = new MongoDBClient<IUserTradingAccount>(
        connection,
        TradingEngineServiceCollections.userTradingAccounts
    );

    const accountData: Partial<IUserTradingAccount> = {
        id: options.id || generateAccountId(),
        userId: options.userId || `user-${generateObjectId()}`,
        platformName: options.platformName || TradingPlatform.BINANCE,
        platformId: options.platformId || 1,
        apiKey: options.apiKey || "test-api-key",
        apiSecret: options.apiSecret || "test-api-secret",
        passphrase: options.passphrase,
        accessToken: options.accessToken,
        refreshToken: options.refreshToken,
        externalAccountUserId:
            options.externalAccountUserId || `ext-${generateObjectId()}`,
        isWithdrawalEnabled:
            options.isWithdrawalEnabled !== undefined
                ? options.isWithdrawalEnabled
                : true,
        isFuturesTradingEnabled:
            options.isFuturesTradingEnabled !== undefined
                ? options.isFuturesTradingEnabled
                : true,
        isSpotTradingEnabled:
            options.isSpotTradingEnabled !== undefined
                ? options.isSpotTradingEnabled
                : true,
        isIpAddressWhitelisted: options.isIpAddressWhitelisted,
        connectionStatus:
            options.connectionStatus || AccountConnectionStatus.CONNECTED,
        errorMessages: options.errorMessages || [],
        category: options.category || Category.CRYPTO,
        connectionType: options.connectionType || ConnectionType.FAST,
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };

    return accountCollection.insertOne(accountData);
};

// =============================================================================
// ACCOUNT BALANCE CREATION
// =============================================================================

export interface CreateAccountBalanceOptions {
    id?: string;
    userId?: string;
    platformName?: TradingPlatform;
    platformId?: number;
    currency?: Currency;
    accountType?: AccountType;
    availableBalance?: number;
    lockedBalance?: number;
    accountSize?: number;
    tradingAccountId?: mongoose.Types.ObjectId;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Creates an account balance
 */
export const createAccountBalance = async (
    connection: mongoose.Connection,
    options: CreateAccountBalanceOptions = {}
): Promise<IUserTradingAccountBalance> => {
    const balanceCollection = new MongoDBClient<IUserTradingAccountBalance>(
        connection,
        TradingEngineServiceCollections.userTradingAccountBalances
    );

    const balanceData: Partial<IUserTradingAccountBalance> = {
        id: options.id || generateObjectId(),
        userId: options.userId || `user-${generateObjectId()}`,
        platformName: options.platformName || TradingPlatform.BINANCE,
        platformId: options.platformId || 1,
        currency: options.currency || Currency.USDT,
        accountType: options.accountType || AccountType.FUTURES,
        availableBalance: options.availableBalance ?? 1000,
        lockedBalance: options.lockedBalance ?? 0,
        accountSize:
            options.accountSize ||
            computeAccountSize(
                options.availableBalance ?? 1000,
                options.lockedBalance ?? 0
            ),
        tradingAccountId:
            options.tradingAccountId || new mongoose.Types.ObjectId(),
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };

    return balanceCollection.insertOne(balanceData);
};

/**
 * Creates a trading account with balances
 */
export const createTradingAccountWithBalances = async (
    connection: mongoose.Connection,
    userId: string,
    accountOptions: CreateTradingAccountOptions = {},
    balances: CreateAccountBalanceOptions[] = [
        { currency: Currency.USDT, availableBalance: 1000 },
        // { currency: Currency.BTC, availableBalance: 0.1 },
    ]
): Promise<{
    account: IUserTradingAccount;
    balances: IUserTradingAccountBalance[];
}> => {
    // Create trading account
    const account = await createTradingAccount(connection, {
        ...accountOptions,
        userId,
    });

    // Create balances for this account
    const accountBalances: IUserTradingAccountBalance[] = [];
    for (const balanceOptions of balances) {
        const balance = await createAccountBalance(connection, {
            ...balanceOptions,
            userId,
            tradingAccountId: new mongoose.Types.ObjectId(
                account._id as string
            ),
            platformName: account.platformName,
            platformId: account.platformId,
            accountSize: computeAccountSize(
                balanceOptions.availableBalance ?? 1000,
                balanceOptions.lockedBalance ?? 0
            ),
        });
        accountBalances.push(balance);
    }

    return {
        account,
        balances: accountBalances,
    };
};

export const computeAccountSize = (
    availableBalance: number,
    lockedBalance: number
) => {
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

// =============================================================================
// TRADING RULES CREATION
// =============================================================================

export interface CreateTradingRuleOptions {
    id?: string;
    name?: string;
    description?: string;
    tooltip?: string;
    category?: TradingRuleCategory;
    type?: TradingRuleType;
    value?: number | string;
    isEnabled?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Creates a trading rule
 */
export const createTradingRule = async (
    connection: mongoose.Connection,
    options: CreateTradingRuleOptions = {}
): Promise<ITradingRule> => {
    const ruleCollection = new MongoDBClient<ITradingRule>(
        connection,
        TradingEngineServiceCollections.tradingRules
    );

    const ruleData: Partial<ITradingRule> = {
        id: options.id || generateObjectId(),
        name: options.name || TradingRuleName.RISK_PERCENTAGE_PER_TRADE,
        description: options.description || "Test trading rule description",
        tooltip: options.tooltip || "Test tooltip",
        category: options.category || TradingRuleCategory.RISK_MANAGEMENT,
        type: options.type || TradingRuleType.PERCENTAGE,
        value: options.value || 2,
        isEnabled: options.isEnabled !== undefined ? options.isEnabled : true,
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };

    return ruleCollection.insertOne(ruleData);
};

/**
 * Creates a user trading rule
 */
export const createUserTradingRule = async (
    connection: mongoose.Connection,
    userId: string,
    options: CreateTradingRuleOptions & {
        ruleId?: string;
        isCustomized?: boolean;
        lastResetToDefault?: string | null;
    } = {}
): Promise<IUserTradingRule> => {
    const userRuleCollection = new MongoDBClient<IUserTradingRule>(
        connection,
        TradingEngineServiceCollections.userTradingRules
    );

    const userRuleData: Partial<IUserTradingRule> = {
        id: options.id || generateObjectId(),
        userId,
        ruleId: options.ruleId || generateObjectId(),
        name: options.name || TradingRuleName.RISK_PERCENTAGE_PER_TRADE,
        description:
            options.description || "Test user trading rule description",
        tooltip: options.tooltip || "Test tooltip",
        category: options.category || TradingRuleCategory.RISK_MANAGEMENT,
        type: options.type || TradingRuleType.PERCENTAGE,
        value: options.value || 2,
        isEnabled: options.isEnabled !== undefined ? options.isEnabled : true,
        isCustomized: options.isCustomized || false,
        lastResetToDefault: options.lastResetToDefault || null,
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };

    return userRuleCollection.insertOne(userRuleData);
};

/**
 * Creates default trading rules for a user
 */
export const createDefaultUserTradingRules = async (
    connection: mongoose.Connection,
    userId: string
): Promise<IUserTradingRule[]> => {
    const defaultRules = [
        {
            name: TradingRuleName.RISK_PERCENTAGE_PER_TRADE,
            category: TradingRuleCategory.RISK_MANAGEMENT,
            type: TradingRuleType.PERCENTAGE,
            value: 1,
            isEnabled: true,
        },
        {
            name: TradingRuleName.MAXIMUM_RISK_AMOUNT_PER_TRADE,
            category: TradingRuleCategory.RISK_MANAGEMENT,
            type: TradingRuleType.AMOUNT,
            value: 100,
            isEnabled: true,
        },
        {
            name: TradingRuleName.MAXIMUM_LEVERAGE,
            category: TradingRuleCategory.RISK_MANAGEMENT,
            type: TradingRuleType.COUNT,
            value: 10,
            isEnabled: true,
        },
        {
            name: TradingRuleName.MINIMUM_RISK_REWARD_RATIO,
            category: TradingRuleCategory.RISK_MANAGEMENT,
            type: TradingRuleType.COUNT,
            value: 2,
            isEnabled: true,
        },
        {
            name: TradingRuleName.MAXIMUM_CONCURRENT_TRADES,
            category: TradingRuleCategory.POSITION_LIMITS,
            type: TradingRuleType.COUNT,
            value: 4,
            isEnabled: true,
        },
        {
            name: TradingRuleName.DIRECTION_BALANCE_LIMIT,
            category: TradingRuleCategory.DIRECTION_BALANCE,
            type: TradingRuleType.PERCENTAGE,
            value: 2,
            isEnabled: true,
        },
    ];

    const rules: IUserTradingRule[] = [];
    for (const rule of defaultRules) {
        const userRule = await createUserTradingRule(connection, userId, rule);
        rules.push(userRule);
    }

    return rules;
};

// =============================================================================
// TRADE CREATION
// =============================================================================

export const createMasterTrade = async (
    connection: mongoose.Connection,
    options: Partial<IMasterTrade> = {}
): Promise<IMasterTrade> => {
    const masterTradeCollection = new MongoDBClient<IMasterTrade>(
        connection,
        TradingEngineServiceCollections.masterTrades
    );

    const masterTradeData: Partial<IMasterTrade> = {
        ...options,
        baseAsset: options.baseAsset || "BTC",
        quoteCurrency: options.quoteCurrency || "USDT",
        baseQuantity: options.baseQuantity || 0.001,
        originalBaseQuantity: options.baseQuantity || 0.001,
        entryPrice: options.entryPrice || 111373,
        stopLossPrice: options.stopLossPrice || 110408,
        takeProfitPrice: options.takeProfitPrice || 117882,
        quoteTotal: options.quoteTotal || 50,
        originalQuoteTotal: options.quoteTotal || 50,
        createdAt: options.createdAt || new Date(),
        updatedAt: options.updatedAt || new Date(),
        baseAssetLogoUrl:
            options.baseAssetLogoUrl || "https://example.com/logo.png",
        currentPrice: options.currentPrice || 111373,
        ordersTriggerPrice: options.ordersTriggerPrice || 111373,
        targetOrdersAmountToFill: options.targetOrdersAmountToFill || 100000,
        orderPlacementType:
            options.orderPlacementType || OrderPlacementType.MARKET,
        accountType: options.accountType || AccountType.FUTURES,
        supportedTradingPlatforms: options.supportedTradingPlatforms || [
            TradingPlatform.BINANCE,
            TradingPlatform.BYBIT,
        ],
        defaultTradingPlatform:
            options.defaultTradingPlatform || TradingPlatform.BINANCE,
        chartUrl: options.chartUrl || "https://example.com/chart.png",
        tradeNote: options.tradeNote || "Test trade note",
        pair: options.pair || "BTCUSDT",
        side: options.side || TradeSide.LONG,
        pnl: options.pnl || 0,
        pnlPercentage: options.pnlPercentage || 0,
        estimatedProfit: options.estimatedProfit || 0,
        originalEstimatedProfit: options.estimatedProfit || 0,
        estimatedLoss: options.estimatedLoss || 0,
        originalEstimatedLoss: options.estimatedLoss || 0,
        status: options.status || TradeStatus.PENDING,
        candlestick: options.candlestick || CandleStick.oneHour,
        risk: options.risk || TradeRisk.low,
        category: options.category || Category.CRYPTO,
    };

    return masterTradeCollection.insertOne(masterTradeData);
};

export interface CreateTradeOptions {
    id?: string;
    userId?: string;
    masterTradeId?: string;
    baseAsset?: string;
    quoteCurrency?: string;
    baseQuantity?: number;
    entryPrice?: number;
    stopLossPrice?: number;
    takeProfitPrice?: number;
    quoteTotal?: number;
    pair?: string;
    side?: TradeSide;
    pnl?: number;
    status?: TradeStatus;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Creates a trade
 */
export const createTrade = async (
    connection: mongoose.Connection,
    options: CreateTradeOptions = {}
): Promise<ITrade> => {
    const tradeCollection = new MongoDBClient<ITrade>(
        connection,
        TradingEngineServiceCollections.trades
    );

    const tradeData: Partial<ITrade> = {
        id: options.id || generateObjectId(),
        userId: options.userId || `user-${generateObjectId()}`,
        masterTradeId:
            options.masterTradeId || `master-trade-${generateObjectId()}`,
        baseAsset: options.baseAsset || "BTC",
        quoteCurrency: options.quoteCurrency || "USDT",
        baseQuantity: options.baseQuantity || 0.001,
        originalBaseQuantity: options.baseQuantity || 0.001,
        entryPrice: options.entryPrice || 50000,
        stopLossPrice: options.stopLossPrice || 40000,
        takeProfitPrice: options.takeProfitPrice || 60000,
        quoteTotal: options.quoteTotal || 50,
        originalQuoteTotal: options.quoteTotal || 50,
        estimatedProfit: 100,
        estimatedLoss: 50,
        originalEstimatedProfit: 100,
        originalEstimatedLoss: 50,
        pair: options.pair || "BTCUSDT",
        side: options.side || TradeSide.LONG,
        pnl: options.pnl || 0,
        status: options.status || TradeStatus.ACTIVE,
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };

    return tradeCollection.insertOne(tradeData);
};

/**
 * Creates multiple trades for a user
 */
export const createMultipleTradesForUser = async (
    connection: mongoose.Connection,
    userId: string,
    count: number,
    options: CreateTradeOptions = {}
): Promise<ITrade[]> => {
    const trades: ITrade[] = [];
    for (let i = 0; i < count; i++) {
        const trade = await createTrade(connection, {
            ...options,
            userId,
            id: options.id ? `${options.id}-${i}` : undefined,
        });
        trades.push(trade);
    }
    return trades;
};

// =============================================================================
// ORDER CREATION
// =============================================================================

export interface CreateOrderOptions {
    id?: string;
    userId?: string;
    tradeId?: mongoose.Types.ObjectId;
    orderBatchId?: mongoose.Types.ObjectId;
    baseAsset?: string;
    baseQuantity?: number;
    orderType?: OrderType;
    orderSide?: OrderSide;
    placementType?: OrderPlacementType;
    price?: number;
    total?: number;
    quoteCurrency?: string;
    quoteTotal?: number;
    status?: OrderStatus;
    externalOrderId?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Creates an order
 */
export const createOrder = async (
    connection: mongoose.Connection,
    options: CreateOrderOptions = {}
): Promise<IOrder> => {
    const orderCollection = new MongoDBClient<IOrder>(
        connection,
        TradingEngineServiceCollections.orders
    );

    const orderData: Partial<IOrder> = {
        id: options.id || generateObjectId(),
        userId: options.userId || `user-${generateObjectId()}`,
        tradeId: options.tradeId || new mongoose.Types.ObjectId(),
        orderBatchId: options.orderBatchId || new mongoose.Types.ObjectId(),
        baseAsset: options.baseAsset || "BTC",
        baseQuantity: options.baseQuantity || 0.001,
        orderType: options.orderType || OrderType.ENTRY,
        orderSide: options.orderSide || OrderSide.BUY,
        placementType: options.placementType || OrderPlacementType.MARKET,
        price: options.price || 50000,
        total: options.total || 50,
        quoteCurrency: options.quoteCurrency || "USDT",
        quoteTotal: options.quoteTotal || 50,
        status: options.status || OrderStatus.PENDING,
        externalOrderId: options.externalOrderId || generateObjectId(),
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };

    return orderCollection.insertOne(orderData);
};

// =============================================================================
// COMPREHENSIVE TEST SCENARIOS
// =============================================================================

/**
 * Creates a complete user trading setup with account, balances, rules, and trades
 */
export const createCompleteUserTradingSetup = async (
    connection: mongoose.Connection,
    userId: string,
    options: {
        accountOptions?: CreateTradingAccountOptions;
        balanceOptions?: CreateAccountBalanceOptions[];
        includeDefaultRules?: boolean;
        customRules?: CreateTradingRuleOptions[];
        existingTrades?: number;
        tradeSides?: { long?: number; short?: number }; // Add this
        tradeOptions?: CreateTradeOptions;
    } = {}
): Promise<{
    account: IUserTradingAccount;
    balances: IUserTradingAccountBalance[];
    tradingRules: IUserTradingRule[];
    trades: ITrade[];
    testService: TradingEngineService;
}> => {
    const {
        accountOptions = {},
        balanceOptions = [
            {
                currency: Currency.USDT,
                availableBalance: 10000,
                accountSize: 10000,
            },
            // { currency: Currency.BTC, availableBalance: 0.5 },
        ],
        includeDefaultRules = true,
        customRules = [],
        existingTrades = 0,
        tradeSides = {},
        tradeOptions = {},
    } = options;

    // Create account with balances
    const { account, balances } = await createTradingAccountWithBalances(
        connection,
        userId,
        accountOptions,
        balanceOptions
    );

    // Create trading rules
    let tradingRules: IUserTradingRule[] = [];
    if (includeDefaultRules) {
        tradingRules = await createDefaultUserTradingRules(connection, userId);
    }

    // Add custom rules
    for (const ruleOptions of customRules) {
        const rule = await createUserTradingRule(
            connection,
            userId,
            ruleOptions
        );
        tradingRules.push(rule);
    }

    // Create existing trades with specified sides
    const trades: ITrade[] = [];
    const { long = existingTrades, short = 0 } = tradeSides;
    if (long + short !== existingTrades) {
        throw new Error(
            `Total trades (${long + short}) must equal existing trades (${existingTrades})`
        );
    }

    // Create LONG trades
    for (let i = 0; i < long; i++) {
        const trade = await createTrade(connection, {
            ...tradeOptions,
            userId,
            side: TradeSide.LONG,
            id: tradeOptions.id ? `${tradeOptions.id}-long-${i}` : undefined,
            masterTradeId: tradeOptions.masterTradeId,
        });
        trades.push(trade);
    }

    // Create SHORT trades
    for (let i = 0; i < short; i++) {
        const trade = await createTrade(connection, {
            ...tradeOptions,
            userId,
            side: TradeSide.SHORT,
            id: tradeOptions.id ? `${tradeOptions.id}-short-${i}` : undefined,
        });
        trades.push(trade);
    }

    const testService = new TradingEngineService(connection);

    return {
        account,
        balances,
        tradingRules,
        trades,
        testService,
    };
};

/**
 * Creates multiple users with different trading configurations
 */
export const createMultipleUserTradingSetups = async (
    connection: mongoose.Connection,
    userConfigs: Array<{
        userId: string;
        setupOptions?: Parameters<typeof createCompleteUserTradingSetup>[2];
    }>
): Promise<
    Array<{
        userId: string;
        setup: Awaited<ReturnType<typeof createCompleteUserTradingSetup>>;
    }>
> => {
    const results = [];

    for (const config of userConfigs) {
        const setup = await createCompleteUserTradingSetup(
            connection,
            config.userId,
            config.setupOptions
        );
        results.push({
            userId: config.userId,
            setup,
        });
    }

    return results;
};

/**
 * Creates a testable instance of TradingEngineService
 */
export const createTestableTradingEngineService = (
    connection: mongoose.Connection
): TradingEngineService => {
    return new TradingEngineService(connection);
};

// =============================================================================
// QUERY HELPERS
// =============================================================================

/**
 * Gets user trading accounts with balances
 */
export const getUserTradingAccountsWithBalances = async (
    connection: mongoose.Connection,
    userId: string
): Promise<
    Array<{
        account: IUserTradingAccount;
        balances: IUserTradingAccountBalance[];
    }>
> => {
    const accountCollection = new MongoDBClient<IUserTradingAccount>(
        connection,
        TradingEngineServiceCollections.userTradingAccounts
    );

    const balanceCollection = new MongoDBClient<IUserTradingAccountBalance>(
        connection,
        TradingEngineServiceCollections.userTradingAccountBalances
    );

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

/**
 * Gets active trades for a user
 */
export const getActiveTradesForUser = async (
    connection: mongoose.Connection,
    userId: string
): Promise<ITrade[]> => {
    const tradeCollection = new MongoDBClient<ITrade>(
        connection,
        TradingEngineServiceCollections.trades
    );

    return tradeCollection.find({
        userId,
        status: TradeStatus.ACTIVE,
    });
};

/**
 * Gets user trading rules
 */
export const getUserTradingRules = async (
    connection: mongoose.Connection,
    userId: string
): Promise<IUserTradingRule[]> => {
    const ruleCollection = new MongoDBClient<IUserTradingRule>(
        connection,
        TradingEngineServiceCollections.userTradingRules
    );

    return ruleCollection.find({ userId });
};

// Gets master trade by id
export const getMasterTradeById = async (
    connection: mongoose.Connection,
    id: string
): Promise<IMasterTrade | null> => {
    const masterTradeCollection = new MongoDBClient<IMasterTrade>(
        connection,
        TradingEngineServiceCollections.masterTrades
    );

    return masterTradeCollection.findOne({
        _id: new mongoose.Types.ObjectId(id),
    });
};

// Add these functions after the existing ORDER CREATION section

// =============================================================================
// ORDER BATCH CREATION
// =============================================================================

export interface CreateOrderBatchOptions {
    id?: string;
    // Remove orderId from options
    baseAsset?: string;
    quoteCurrency?: string;
    baseQuantity?: number;
    quoteTotal?: number;
    status?: OrderBatchStatus;
    tradingAccountId?: mongoose.Types.ObjectId;
    platformName?: TradingPlatform;
    platformId?: number;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * Creates an order batch
 */
export const createOrderBatch = async (
    connection: mongoose.Connection,
    options: CreateOrderBatchOptions = {}
): Promise<IOrderBatch> => {
    const orderBatchCollection = new MongoDBClient<IOrderBatch>(
        connection,
        TradingEngineServiceCollections.orderBatches
    );

    const orderBatchData: Partial<IOrderBatch> = {
        id: options.id || generateObjectId(),
        // Remove orderId - it's not in the interface
        baseAsset: options.baseAsset || "BTC",
        quoteCurrency: options.quoteCurrency || "USDT",
        baseQuantity: options.baseQuantity || 0.001,
        quoteTotal: options.quoteTotal || 50,
        status: options.status || OrderBatchStatus.PENDING,
        tradingAccountId:
            options.tradingAccountId || new mongoose.Types.ObjectId(),
        platformName: options.platformName || TradingPlatform.BINANCE,
        platformId: options.platformId || 1,
        createdAt: options.createdAt || new Date().toISOString(),
        updatedAt: options.updatedAt || new Date().toISOString(),
    };

    return orderBatchCollection.insertOne(orderBatchData);
};

/**
 * Creates a complete trade with orders and order batches
 */
export const createCompleteTradeWithOrders = async (
    connection: mongoose.Connection,
    options: CreateTradeOptions & {
        orderCount?: number;
        orderOptions?: CreateOrderOptions;
        orderBatchOptions?: CreateOrderBatchOptions;
    } = {}
): Promise<{
    trade: ITrade;
    orders: IOrder[];
    orderBatches: IOrderBatch[];
}> => {
    const {
        orderCount = 1,
        orderOptions = {},
        orderBatchOptions = {},
        ...tradeOptions
    } = options;

    // Create the trade first
    const trade = await createTrade(connection, tradeOptions);

    const orders: IOrder[] = [];
    const orderBatches: IOrderBatch[] = [];

    // Create orders and their batches
    for (let i = 0; i < orderCount; i++) {
        // Create order batch first
        const orderBatch = await createOrderBatch(connection, {
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
        const order = await createOrder(connection, {
            ...orderOptions,
            userId: trade.userId,
            tradeId: new mongoose.Types.ObjectId(trade._id as string),
            orderBatchId: new mongoose.Types.ObjectId(orderBatch._id as string),
            baseAsset: trade.baseAsset,
            quoteCurrency: trade.quoteCurrency,
            baseQuantity: trade.baseQuantity / orderCount,
            quoteTotal: trade.quoteTotal / orderCount,
            price: orderOptions.price || trade.entryPrice, // Use trade's entryPrice
            total:
                (trade.baseQuantity / orderCount) *
                (orderOptions.price || trade.entryPrice), // Calculate total
            id: orderOptions.id ? `${orderOptions.id}-${i}` : undefined,
            orderType: orderOptions.orderType || OrderType.ENTRY,
            orderSide: orderOptions.orderSide || OrderSide.BUY,
            externalOrderId: orderOptions.externalOrderId || generateObjectId(),
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

// Update the createMultipleTradesForUser function to use complete trades
export const createMultipleCompleteTradesForUser = async (
    connection: mongoose.Connection,
    userId: string,
    count: number,
    options: Parameters<typeof createCompleteTradeWithOrders>[1] = {}
): Promise<
    Array<{
        trade: ITrade;
        orders: IOrder[];
        orderBatches: IOrderBatch[];
    }>
> => {
    const results = [];
    for (let i = 0; i < count; i++) {
        const result = await createCompleteTradeWithOrders(connection, {
            ...options,
            userId,
            id: options.id ? `${options.id}-${i}` : undefined,
        });
        results.push(result);
    }
    return results;
};

export const createPlatformTradingRule = async (
    connection: mongoose.Connection,
    options: {
        pair: string;
        platform: TradingPlatform;
        minQuantity: number;
        minNotional: number;
        stepSize: number;
        baseAsset?: string;
        quoteCurrency?: string;
    }
) => {
    const ruleCollection = new MongoDBClient<IPlatformTradingRule>(
        connection,
        TradingEngineServiceCollections.platformTradingRules
    );

    const ruleData = {
        id: generateObjectId(),
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
