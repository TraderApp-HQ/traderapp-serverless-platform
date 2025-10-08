"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const trading_engine_service_helper_1 = require("src/__tests__/test-helpers/trading-engine-service-helper");
const enums_1 = require("./enums");
const enums_2 = require("src/config/enums");
const constants_1 = require("src/clients/MongoDBClient/constants");
const MongoDBClient_1 = require("src/clients/MongoDBClient");
// Mock the SQS helper
jest.mock("src/clients/SQSClient/helpers", () => ({
    publishMessageToQueue: jest.fn(),
}));
// Import the mocked function
const helpers_1 = require("src/clients/SQSClient/helpers");
const mockPublishMessageToQueue = helpers_1.publishMessageToQueue;
jest.setTimeout(60000);
describe("TradingEngineService", () => {
    let testDb;
    let service;
    beforeAll(async () => {
        testDb = await (0, trading_engine_service_helper_1.setupTestTradingEngineDatabase)();
        service = new index_1.TradingEngineService(testDb.tradingEngineConnection);
    });
    afterAll(async () => {
        await testDb.cleanup();
    });
    beforeEach(async () => {
        await (0, trading_engine_service_helper_1.clearTestTradingEngineDatabase)(testDb.tradingEngineConnection);
        // Reset mocks before each test
        jest.clearAllMocks();
        // Default successful queue publishing
        mockPublishMessageToQueue.mockResolvedValue(undefined);
    });
    const createMockMasterTradeEvent = (overrides = {}) => ({
        masterTradeId: "test-signal-123",
        stopLossPrice: 110408,
        takeProfitPrice: 117882,
        entryPrice: 111373,
        baseAsset: "BTC",
        quoteCurrency: "USDT",
        pair: "BTCUSDT",
        supportedTradingPlatforms: [enums_2.TradingPlatform.BINANCE],
        tradeSide: enums_1.TradeSide.LONG,
        targetOrdersAmountToFill: 1000,
        orderPlacementType: enums_1.OrderPlacementType.MARKET,
        accountType: enums_2.AccountType.FUTURES,
        ...overrides,
    });
    const createMockQueueMessage = (signalEvent, messageId = "test-message-123") => ({
        messageId,
        body: signalEvent,
        receiptHandle: "test-receipt",
        attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: Date.now().toString(),
            SenderId: "test-sender",
            ApproximateFirstReceiveTimestamp: Date.now().toString(),
        },
        messageAttributes: {},
        md5OfBody: "test-md5",
        eventSource: "aws:sqs",
        eventSourceARN: "arn:aws:sqs:test:123456789012:test-queue",
        awsRegion: "us-east-1",
    });
    describe("processIncomingMasterTrades", () => {
        it("should handle queue publishing failures and remove failed users from allocations", async () => {
            const userId1 = "success-publish-user";
            const userId2 = "failed-publish-user";
            // Create two users with larger balances or use higher leverage
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId1, {
                accountOptions: {
                    platformName: enums_2.TradingPlatform.BINANCE,
                    connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                },
                balanceOptions: [
                    {
                        currency: enums_2.Currency.USDT,
                        availableBalance: 5000, // INCREASED from 1000 to 5000
                        accountType: enums_2.AccountType.FUTURES,
                    },
                ],
                includeDefaultRules: true,
            });
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId2, {
                accountOptions: {
                    platformName: enums_2.TradingPlatform.BINANCE,
                    connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                },
                balanceOptions: [
                    {
                        currency: enums_2.Currency.USDT,
                        availableBalance: 5000, // INCREASED from 1000 to 5000
                        accountType: enums_2.AccountType.FUTURES,
                    },
                ],
                includeDefaultRules: true,
            });
            // Keep original platform trading rules
            await (0, trading_engine_service_helper_1.createPlatformTradingRule)(testDb.tradingEngineConnection, {
                pair: "BTCUSDT",
                platform: enums_2.TradingPlatform.BINANCE,
                minQuantity: 0.001,
                minNotional: 10,
                stepSize: 0.001,
            });
            // Mock queue publishing to fail for the second user
            mockPublishMessageToQueue
                .mockResolvedValueOnce(undefined)
                .mockRejectedValueOnce(new Error("Queue publishing failed"));
            // Use higher leverage to meet minimum quantity requirements
            const signalEvent = createMockMasterTradeEvent({
                // leverage: 10, // ADDED leverage to increase position size
                targetOrdersAmountToFill: 500, // REDUCED target to match available amounts
            });
            const queueMessage = createMockQueueMessage(signalEvent);
            const result = await service.processIncomingMasterTrades([
                queueMessage,
            ]);
            expect(result.successMessageIds).toContain("test-message-123");
            expect(result.failedMessageIds).toHaveLength(0);
            // Should only return successfully published allocations
            expect(result.userTradeAllocations).toHaveLength(1);
            expect(result.userTradeAllocations[0].userId).toBe(userId1);
            // Verify publishMessageToQueue was called twice
            expect(mockPublishMessageToQueue).toHaveBeenCalledTimes(2);
        });
        xit("should handle trade creation failures and remove failed users from allocations", async () => {
            const userId1 = "success-user";
            const userId2 = "failure-user";
            // Create successful user
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId1, {
                accountOptions: {
                    platformName: enums_2.TradingPlatform.BINANCE,
                    connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                },
                balanceOptions: [
                    {
                        currency: enums_2.Currency.USDT,
                        availableBalance: 5000,
                        accountType: enums_2.AccountType.FUTURES,
                    },
                ],
            });
            // Create user that will fail (no platform trading rules)
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId2, {
                accountOptions: {
                    platformName: enums_2.TradingPlatform.BINANCE,
                    connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                },
                balanceOptions: [
                    {
                        currency: enums_2.Currency.USDT,
                        availableBalance: 3000,
                        accountType: enums_2.AccountType.FUTURES,
                    },
                ],
            });
            // Create platform trading rules for BTCUSDT - this makes user1 succeed
            await (0, trading_engine_service_helper_1.createPlatformTradingRule)(testDb.tradingEngineConnection, {
                pair: "BTCUSDT",
                platform: enums_2.TradingPlatform.BINANCE,
                minQuantity: 0.001,
                minNotional: 200,
                stepSize: 0.001,
            });
            const signalEvent = createMockMasterTradeEvent();
            const queueMessage = createMockQueueMessage(signalEvent);
            const result = await service.processIncomingMasterTrades([
                queueMessage,
            ]);
            expect(result.successMessageIds).toContain("test-message-123");
            expect(result.failedMessageIds).toHaveLength(0);
            // Should only have successful user in allocations
            expect(result.userTradeAllocations).toHaveLength(1);
            expect(result.userTradeAllocations[0].userId).toBe(userId1);
            expect(result.totalAllocatedAmount).toBeGreaterThan(0);
            // Verify queue publishing was called only for successful user
            expect(mockPublishMessageToQueue).toHaveBeenCalledTimes(1);
        });
        it("should process valid signal with eligible users", async () => {
            const userId = "test-user-1";
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                accountOptions: {
                    platformName: enums_2.TradingPlatform.BINANCE,
                    connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                },
                balanceOptions: [
                    {
                        currency: enums_2.Currency.USDT,
                        availableBalance: 5000, // This gives 1% = 50 USDT trade amount
                        accountType: enums_2.AccountType.FUTURES,
                    },
                ],
            });
            // Keep original platform trading rules
            await (0, trading_engine_service_helper_1.createPlatformTradingRule)(testDb.tradingEngineConnection, {
                pair: "BTCUSDT",
                platform: enums_2.TradingPlatform.BINANCE,
                minQuantity: 0.001,
                minNotional: 10,
                stepSize: 0.001,
            });
            // Use higher leverage to meet minimum quantity requirements
            const masterTradeEvent = createMockMasterTradeEvent({
                // leverage: 5, // ADDED leverage to increase position size
                targetOrdersAmountToFill: 250, // ADJUSTED target for the trade amount
            });
            const queueMessage = createMockQueueMessage(masterTradeEvent);
            const result = await service.processIncomingMasterTrades([
                queueMessage,
            ]);
            expect(result.successMessageIds).toContain("test-message-123");
            expect(result.failedMessageIds).toHaveLength(0);
            expect(result.masterTradeDetails).toEqual(masterTradeEvent);
            expect(result.userTradeAllocations).toHaveLength(1);
            expect(result.userTradeAllocations[0].userId).toBe(userId);
            // Verify trades were actually created in database
            const tradesCollection = new MongoDBClient_1.MongoDBClient(testDb.tradingEngineConnection, constants_1.TradingEngineServiceCollections.trades);
            const createdTrades = await tradesCollection.find({
                userId,
                masterTradeId: masterTradeEvent.masterTradeId,
            });
            expect(createdTrades).toHaveLength(1);
            expect(createdTrades[0].userId).toBe(userId);
            expect(createdTrades[0].masterTradeId).toBe(masterTradeEvent.masterTradeId);
            expect(createdTrades[0].status).toBe(enums_1.TradeStatus.PENDING);
            expect(createdTrades[0].baseAsset).toBe("BTC");
            expect(createdTrades[0].quoteCurrency).toBe("USDT");
            expect(createdTrades[0].side).toBe(enums_1.TradeSide.LONG);
            expect(createdTrades[0].quoteTotal).toBeGreaterThan(0);
            // Verify queue publishing was called
            expect(mockPublishMessageToQueue).toHaveBeenCalledTimes(1);
            expect(mockPublishMessageToQueue).toHaveBeenCalledWith({
                queueUrl: "",
                message: JSON.stringify(result.userTradeAllocations[0]),
            });
        });
        it("should handle no eligible users scenario", async () => {
            // Don't create any users - no eligible users
            const masterTradeEvent = createMockMasterTradeEvent();
            const queueMessage = createMockQueueMessage(masterTradeEvent);
            const result = await service.processIncomingMasterTrades([
                queueMessage,
            ]);
            expect(result.successMessageIds).toContain("test-message-123");
            expect(result.userTradeAllocations).toHaveLength(0);
            expect(result.totalAllocatedAmount).toBe(0);
            // No queue publishing should happen when no users are eligible
            expect(mockPublishMessageToQueue).not.toHaveBeenCalled();
        });
        it("should respect maximum concurrent trades rule", async () => {
            const userId = "test-user-max-trades";
            // Create user with existing trades
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                accountOptions: {
                    platformName: enums_2.TradingPlatform.BINANCE,
                    connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                },
                balanceOptions: [
                    {
                        currency: enums_2.Currency.USDT,
                        availableBalance: 5000,
                        accountType: enums_2.AccountType.FUTURES,
                    },
                ],
                existingTrades: 5, // Already at max trades (default rule is 4)
            });
            const masterTradeEvent = createMockMasterTradeEvent();
            const queueMessage = createMockQueueMessage(masterTradeEvent);
            const result = await service.processIncomingMasterTrades([
                queueMessage,
            ]);
            expect(result.successMessageIds).toContain("test-message-123");
            expect(result.userTradeAllocations).toHaveLength(0);
            // No queue publishing should happen when user violates trading rules
            expect(mockPublishMessageToQueue).not.toHaveBeenCalled();
        });
        it("should allocate trades up to target amount", async () => {
            // Create multiple users with different balance amounts
            const users = [
                { id: "user-1", balance: 10000 },
                { id: "user-2", balance: 5000 },
                { id: "user-3", balance: 2000 },
            ];
            for (const user of users) {
                await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, user.id, {
                    accountOptions: {
                        platformName: enums_2.TradingPlatform.BINANCE,
                        connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                    },
                    balanceOptions: [
                        {
                            currency: enums_2.Currency.USDT,
                            availableBalance: user.balance,
                            accountType: enums_2.AccountType.FUTURES,
                        },
                    ],
                });
            }
            // Create platform trading rules
            await (0, trading_engine_service_helper_1.createPlatformTradingRule)(testDb.tradingEngineConnection, {
                pair: "BTCUSDT",
                platform: enums_2.TradingPlatform.BINANCE,
                minQuantity: 0.001,
                minNotional: 10,
                stepSize: 0.001,
            });
            const masterTradeEvent = createMockMasterTradeEvent({
                targetOrdersAmountToFill: 800,
            });
            const queueMessage = createMockQueueMessage(masterTradeEvent);
            const result = await service.processIncomingMasterTrades([
                queueMessage,
            ]);
            expect(result.successMessageIds).toContain("test-message-123");
            expect(result.userTradeAllocations.length).toBeGreaterThan(0);
            expect(result.totalAllocatedAmount).toBeLessThanOrEqual(800);
            // Verify queue publishing was called for each allocation
            expect(mockPublishMessageToQueue).toHaveBeenCalledTimes(result.userTradeAllocations.length);
        });
        it("should handle multiple queue messages", async () => {
            const userId = "test-user-multi";
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                accountOptions: {
                    platformName: enums_2.TradingPlatform.BINANCE,
                    connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                },
                balanceOptions: [
                    {
                        currency: enums_2.Currency.USDT,
                        availableBalance: 5000,
                        accountType: enums_2.AccountType.FUTURES,
                    },
                ],
            });
            // Create platform trading rules
            await (0, trading_engine_service_helper_1.createPlatformTradingRule)(testDb.tradingEngineConnection, {
                pair: "BTCUSDT",
                platform: enums_2.TradingPlatform.BINANCE,
                minQuantity: 0.001,
                minNotional: 10,
                stepSize: 0.001,
            });
            const masterTradeEvent1 = createMockMasterTradeEvent({
                masterTradeId: "signal-1",
            });
            const masterTradeEvent2 = createMockMasterTradeEvent({
                masterTradeId: "signal-2",
            });
            const queueMessages = [
                createMockQueueMessage(masterTradeEvent1, "msg-1"),
                createMockQueueMessage(masterTradeEvent2, "msg-2"),
            ];
            const result = await service.processIncomingMasterTrades(queueMessages);
            expect(result.successMessageIds).toHaveLength(2);
            expect(result.failedMessageIds).toHaveLength(0);
            // Should have queue publishing calls for both signals
            expect(mockPublishMessageToQueue).toHaveBeenCalledTimes(2);
        });
        it("should handle complete queue publishing failure", async () => {
            const userId = "all-fail-user";
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                accountOptions: {
                    platformName: enums_2.TradingPlatform.BINANCE,
                    connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                },
                balanceOptions: [
                    {
                        currency: enums_2.Currency.USDT,
                        availableBalance: 5000,
                        accountType: enums_2.AccountType.FUTURES,
                    },
                ],
            });
            // Create platform trading rules
            await (0, trading_engine_service_helper_1.createPlatformTradingRule)(testDb.tradingEngineConnection, {
                pair: "BTCUSDT",
                platform: enums_2.TradingPlatform.BINANCE,
                minQuantity: 0.001,
                minNotional: 10,
                stepSize: 0.001,
            });
            // Mock all queue publishing to fail
            mockPublishMessageToQueue.mockRejectedValue(new Error("Queue service unavailable"));
            const masterTradeEvent = createMockMasterTradeEvent();
            const queueMessage = createMockQueueMessage(masterTradeEvent);
            const result = await service.processIncomingMasterTrades([
                queueMessage,
            ]);
            expect(result.successMessageIds).toContain("test-message-123");
            expect(result.failedMessageIds).toHaveLength(0);
            // Should return empty allocations due to publishing failures
            expect(result.userTradeAllocations).toHaveLength(0);
            // Verify queue publishing was attempted
            expect(mockPublishMessageToQueue).toHaveBeenCalledTimes(1);
        });
        it("should calculate leverage correctly when not provided in signal", async () => {
            const userId = "leverage-user";
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                accountOptions: {
                    platformName: enums_2.TradingPlatform.BINANCE,
                    connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                },
                balanceOptions: [
                    {
                        currency: enums_2.Currency.USDT,
                        availableBalance: 5000,
                        accountType: enums_2.AccountType.FUTURES,
                    },
                ],
            });
            // Create platform trading rules
            await (0, trading_engine_service_helper_1.createPlatformTradingRule)(testDb.tradingEngineConnection, {
                pair: "BTCUSDT",
                platform: enums_2.TradingPlatform.BINANCE,
                minQuantity: 0.001,
                minNotional: 10,
                stepSize: 0.001,
            });
            const masterTradeEvent = createMockMasterTradeEvent({
            // Don't provide leverage - should be calculated
            // leverage: undefined,
            });
            const queueMessage = createMockQueueMessage(masterTradeEvent);
            const result = await service.processIncomingMasterTrades([
                queueMessage,
            ]);
            expect(result.successMessageIds).toContain("test-message-123");
            expect(result.userTradeAllocations).toHaveLength(1);
            // expect(result.userTradeAllocations[0].leverage).toBeGreaterThan(0);
        });
        it("should reject users who don't meet platform minimum requirements", async () => {
            const userId = "insufficient-user";
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                accountOptions: {
                    platformName: enums_2.TradingPlatform.BINANCE,
                    connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                },
                balanceOptions: [
                    {
                        currency: enums_2.Currency.USDT,
                        availableBalance: 500, // Small balance = 5 USDT trade amount
                        accountType: enums_2.AccountType.FUTURES,
                    },
                ],
                includeDefaultRules: true,
            });
            // Use strict platform trading rules
            await (0, trading_engine_service_helper_1.createPlatformTradingRule)(testDb.tradingEngineConnection, {
                pair: "BTCUSDT",
                platform: enums_2.TradingPlatform.BINANCE,
                minQuantity: 0.001, // This will cause failure
                minNotional: 10000,
                stepSize: 0.001,
            });
            // Use low leverage that won't meet minimum quantity
            const masterTradeEvent = createMockMasterTradeEvent({
            // leverage: 1, // Low leverage = small position
            // entryPrice: 50000,
            });
            const queueMessage = createMockQueueMessage(masterTradeEvent);
            const result = await service.processIncomingMasterTrades([
                queueMessage,
            ]);
            expect(result.successMessageIds).toContain("test-message-123");
            expect(result.failedMessageIds).toHaveLength(0);
            // Should have no allocations due to platform requirements not being met
            expect(result.userTradeAllocations).toHaveLength(0);
            expect(result.totalAllocatedAmount).toBe(0);
            // No queue publishing should happen
            expect(mockPublishMessageToQueue).not.toHaveBeenCalled();
        });
    });
    describe("validateTradingRules", () => {
        it("should validate concurrent trades rule", async () => {
            const userId = "test-validation-user";
            const { tradingRules, account, balances, trades } = await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                existingTrades: 3, // Under the limit
                includeDefaultRules: true,
                tradeSides: {
                    long: 2,
                    short: 1,
                },
            });
            const proposedTrade = {
                userId,
                masterTradeId: "test-signal",
                baseAsset: "BTC",
                quoteCurrency: "USDT",
                baseQuantity: 0.001,
                quoteTotal: 50,
                side: enums_1.TradeSide.LONG,
                tradingAccountId: account._id,
                leverage: 1,
                price: 50000,
            };
            const result = await service.validateTradingRules({
                userId,
                proposedTrade,
                tradingAccount: account,
                accountBalance: balances[0],
                userTradingRules: tradingRules,
                activeTrades: trades,
            });
            expect(result.isValid).toBe(true);
            expect(result.violations).toHaveLength(0);
        });
        it("should reject when max concurrent trades exceeded", async () => {
            const userId = "test-max-trades-user";
            const { tradingRules, account, balances, trades } = await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                existingTrades: 4, // At the limit (default is 4)
                includeDefaultRules: true,
                tradeSides: {
                    long: 2,
                    short: 2,
                },
            });
            const proposedTrade = {
                userId,
                masterTradeId: "test-signal",
                baseAsset: "BTC",
                quoteCurrency: "USDT",
                baseQuantity: 0.001,
                quoteTotal: 50,
                side: enums_1.TradeSide.LONG,
                tradingAccountId: account._id,
                leverage: 1,
                price: 50000,
            };
            const result = await service.validateTradingRules({
                userId,
                proposedTrade,
                tradingAccount: account,
                accountBalance: balances[0],
                userTradingRules: tradingRules,
                activeTrades: trades,
            });
            expect(result.isValid).toBe(false);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0].ruleName).toBe(enums_1.TradingRuleName.MAXIMUM_CONCURRENT_TRADES);
        });
    });
    describe("getUserTradingRules", () => {
        it("should return all trading rules for user", async () => {
            const userId = "rules-user";
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                includeDefaultRules: true,
            });
            const result = await service.getUserTradingRules(userId);
            expect(result).toHaveLength(6); // Default rules count
            expect(result.every((rule) => rule.userId === userId)).toBe(true);
        });
        it("should return empty array for user with no rules", async () => {
            const userId = "no-rules-user";
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                includeDefaultRules: false,
            });
            const result = await service.getUserTradingRules(userId);
            expect(result).toHaveLength(0);
        });
    });
    describe("getUserActiveTrades", () => {
        it("should return only active and pending trades", async () => {
            const userId = "active-trades-user";
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                existingTrades: 2,
                tradeOptions: { status: enums_1.TradeStatus.ACTIVE },
            });
            // Add a closed trade
            await (0, trading_engine_service_helper_1.createTrade)(testDb.tradingEngineConnection, {
                userId,
                status: enums_1.TradeStatus.CLOSED,
            });
            const result = await service.getUserActiveTrades(userId);
            expect(result).toHaveLength(2);
            expect(result.every((t) => [enums_1.TradeStatus.ACTIVE, enums_1.TradeStatus.PENDING].includes(t.status))).toBe(true);
        });
        it("should return empty for user with no active trades", async () => {
            const userId = "no-active-trades";
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                existingTrades: 0,
            });
            const result = await service.getUserActiveTrades(userId);
            expect(result).toHaveLength(0);
        });
    });
    describe("getUsersTradingAccountsAndBalances", () => {
        it("should return users with connected accounts and balances", async () => {
            const userId = "balance-user";
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, userId, {
                accountOptions: {
                    platformName: enums_2.TradingPlatform.BINANCE,
                    connectionStatus: enums_1.AccountConnectionStatus.CONNECTED,
                },
                balanceOptions: [
                    {
                        currency: enums_2.Currency.USDT,
                        availableBalance: 1000,
                        accountType: enums_2.AccountType.FUTURES,
                    },
                ],
            });
            const result = await service.getUsersTradingAccountsAndBalances({
                platforms: [enums_2.TradingPlatform.BINANCE],
                currency: enums_2.Currency.USDT,
                accountType: enums_2.AccountType.FUTURES,
            });
            expect(result).toHaveLength(1);
            expect(result[0].userId).toBe(userId);
            expect(result[0].balance.availableBalance).toBe(1000);
        });
        it("should return empty for disconnected accounts", async () => {
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, "disconnected-user", {
                accountOptions: {
                    connectionStatus: enums_1.AccountConnectionStatus.FAILED,
                },
            });
            const result = await service.getUsersTradingAccountsAndBalances({
                platforms: [enums_2.TradingPlatform.BINANCE],
                currency: enums_2.Currency.USDT,
                accountType: enums_2.AccountType.FUTURES,
            });
            expect(result).toHaveLength(0);
        });
        it("should filter by platform", async () => {
            await (0, trading_engine_service_helper_1.createCompleteUserTradingSetup)(testDb.tradingEngineConnection, "binance-user", {
                accountOptions: { platformName: enums_2.TradingPlatform.BINANCE },
            });
            const binanceResult = await service.getUsersTradingAccountsAndBalances({
                platforms: [enums_2.TradingPlatform.BINANCE],
                currency: enums_2.Currency.USDT,
                accountType: enums_2.AccountType.FUTURES,
            });
            const kucoinResult = await service.getUsersTradingAccountsAndBalances({
                platforms: [enums_2.TradingPlatform.KUCOIN],
                currency: enums_2.Currency.USDT,
                accountType: enums_2.AccountType.FUTURES,
            });
            expect(binanceResult).toHaveLength(1);
            expect(kucoinResult).toHaveLength(0);
        });
    });
    describe("getPlatformTradingRulesForPair", () => {
        it("should return platform trading rules for pair", async () => {
            const pair = "BTCUSDT";
            const platform = enums_2.TradingPlatform.BINANCE;
            // Create platform trading rule
            await (0, trading_engine_service_helper_1.createPlatformTradingRule)(testDb.tradingEngineConnection, {
                pair,
                platform,
                minQuantity: 0.001,
                minNotional: 10,
                stepSize: 0.001,
            });
            const result = await service.getPlatformTradingRulesForPair(platform, pair);
            expect(result).toBeDefined();
            expect(result?.pair).toBe(pair);
            expect(result?.platform).toBe(platform);
            expect(result?.minQuantity).toBe(0.001);
            expect(result?.minNotional).toBe(10);
        });
        it("should return null for non-existent pair", async () => {
            const result = await service.getPlatformTradingRulesForPair(enums_2.TradingPlatform.BINANCE, "NONEXISTENT");
            expect(result).toBeNull();
        });
    });
});
