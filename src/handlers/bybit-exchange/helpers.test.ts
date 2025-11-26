import {
    processBybitTrades,
    processBybitOrdersActivation,
    processBybitStopLossOrders,
    processBybitTakeProfitOrders,
    processBybitCloseTrades,
    processBybitCancelOrders,
} from "./helpers";
import { BybitFuturesClient } from "src/clients/BybitClient";
import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { TradingEngineService } from "src/services/TradingEngineService";
import { IQueueMessageBody } from "src/config/interfaces";
import {
    IUserTradeAllocation,
    ITrade,
    ICloseTradeEvent,
    IOrder,
} from "src/services/TradingEngineService/interfaces";
import {
    TradeSide,
    OrderPlacementType,
    TradeStatus,
    OrderStatus,
    OrderBatchStatus,
} from "src/services/TradingEngineService/enums";
import { AccountType, TradingPlatform } from "src/config/enums";
import mongoose from "mongoose";
import { decrypt } from "src/utils/cypher-helpers";
import { getTradingEngineServiceSecrets } from "src/helpers/trade-service-helpers";
import { ITradingEngineServiceSecrets } from "src/config/secrets/interfaces";

// Mock dependencies
jest.mock("src/clients/BybitClient");
jest.mock("src/clients/SQSClient/helpers");
jest.mock("src/services/TradingEngineService");
jest.mock("src/utils/cypher-helpers");
jest.mock("src/helpers/trade-service-helpers");

const mockBybitFuturesClient = BybitFuturesClient as jest.MockedClass<
    typeof BybitFuturesClient
>;
const mockPublishMessageToQueue = publishMessageToQueue as jest.MockedFunction<
    typeof publishMessageToQueue
>;
const mockTradingEngineService =
    TradingEngineService as jest.MockedClass<typeof TradingEngineService>;
const mockDecrypt = decrypt as jest.MockedFunction<typeof decrypt>;
const mockGetTradingEngineServiceSecrets =
    getTradingEngineServiceSecrets as jest.MockedFunction<
        typeof getTradingEngineServiceSecrets
    >;

interface MockBybitInstance {
    getOpenPosition: jest.Mock;
    placeMarketOrder?: jest.Mock;
    placeLimitOrder?: jest.Mock;
    closePosition?: jest.Mock;
    setPositionStopLossTakeProfit?: jest.Mock;
    cancelOrder?: jest.Mock;
    getOrderById?: jest.Mock;
}

interface MockTradingEngineInstance {
    getUserTradingAccount?: jest.Mock;
    updateTrade: jest.Mock;
    getOrderByTradeId?: jest.Mock;
    updateOrder?: jest.Mock;
    updateOrderBatch?: jest.Mock;
    unsetTradeTakeProfit?: jest.Mock;
}

interface BybitPositionData {
    size: string;
    avgPrice?: string;
    side: "Buy" | "Sell";
}

interface BybitOrderResponse {
    orderId: string;
}

// Helper functions
const createMockUserTradeAllocation = (
    overrides: Partial<IUserTradeAllocation> = {}
): IUserTradeAllocation => ({
    userId: "user-1",
    tradingAccountId: new mongoose.Types.ObjectId(),
    baseQuantity: 0.01,
    platformName: TradingPlatform.BYBIT,
    apiKey: "encrypted-key",
    apiSecret: "encrypted-secret",
    tradeId: new mongoose.Types.ObjectId().toHexString(),
    masterTradeId: "master-1",
    baseAsset: "BTC",
    quoteCurrency: "USDT",
    quoteTotal: 500,
    entryPrice: 50000,
    stopLossPrice: 49000,
    takeProfitPrice: 51000,
    tradeSide: TradeSide.LONG,
    orderPlacementType: OrderPlacementType.MARKET,
    riskAmount: 100,
    availableBalance: 1000,
    positionSize: 500,
    tradeAmount: 500,
    accountType: AccountType.FUTURES,
    ...overrides,
});

const createMockQueueMessage = <T>(
    body: T,
    messageId: string = "msg-1"
): IQueueMessageBody<T> => ({
    messageId,
    body,
    receiptHandle: `receipt-${messageId}`,
    attributes: {
        ApproximateReceiveCount: "1",
        SentTimestamp: Date.now().toString(),
        SenderId: "test-sender",
        ApproximateFirstReceiveTimestamp: Date.now().toString(),
    },
    messageAttributes: {},
    md5OfBody: "md5",
    eventSource: "aws:sqs",
    eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
    awsRegion: "us-east-1",
});

const setupBybitMocks = (
    positionData: BybitPositionData | null = null,
    orderResponse: BybitOrderResponse | null = null,
    shouldFail: boolean = false
): MockBybitInstance => {
    const mockBybitInstance: MockBybitInstance = {
        getOpenPosition: jest.fn(),
        placeMarketOrder: jest.fn(),
        placeLimitOrder: jest.fn(),
        closePosition: jest.fn(),
        setPositionStopLossTakeProfit: jest.fn(),
        cancelOrder: jest.fn(),
        getOrderById: jest.fn(),
    };

    if (shouldFail) {
        mockBybitInstance.getOpenPosition?.mockRejectedValue(
            new Error("API Error")
        );
    } else {
        mockBybitInstance.getOpenPosition?.mockResolvedValue(positionData);
    }

    if (orderResponse) {
        mockBybitInstance.placeMarketOrder?.mockResolvedValue(orderResponse);
        mockBybitInstance.placeLimitOrder?.mockResolvedValue(orderResponse);
    }

    mockBybitInstance.closePosition?.mockResolvedValue({});
    mockBybitInstance.setPositionStopLossTakeProfit?.mockResolvedValue({});

    mockBybitFuturesClient.mockImplementation(
        () => mockBybitInstance as unknown as InstanceType<typeof BybitFuturesClient>
    );

    return mockBybitInstance;
};

const setupTradingEngineMocks = (): MockTradingEngineInstance => {
    const mockTradingEngineInstance: MockTradingEngineInstance = {
        getUserTradingAccount: jest.fn().mockResolvedValue({
            apiKey: "encrypted-key",
            apiSecret: "encrypted-secret",
        }),
        updateTrade: jest.fn().mockResolvedValue({}),
        getOrderByTradeId: jest.fn().mockResolvedValue({
            _id: "order-1",
            baseQuantity: 0.01,
            orderBatchId: new mongoose.Types.ObjectId(),
        }),
        updateOrder: jest.fn().mockResolvedValue({}),
        updateOrderBatch: jest.fn().mockResolvedValue({}),
    };

    mockTradingEngineService.mockImplementation(
        () =>
            mockTradingEngineInstance as unknown as InstanceType<
                typeof TradingEngineService
            >
    );

    return mockTradingEngineInstance;
};

const createMockTrade = (
    overrides: Partial<ITrade> = {}
): ITrade => {
    const trade = {
        _id: new mongoose.Types.ObjectId(),
        id: "trade-1",
        userId: "user-1",
        masterTradeId: "master-1",
        baseAsset: "BTC",
        quoteCurrency: "USDT",
        pair: "BTCUSDT",
        baseQuantity: 0.01,
        quoteTotal: 500,
        entryPrice: 50000,
        stopLossPrice: 49000,
        takeProfitPrice: 51000,
        estimatedProfit: 100,
        estimatedLoss: 50,
        originalBaseQuantity: 0.01,
        originalQuoteTotal: 500,
        originalEstimatedProfit: 100,
        originalEstimatedLoss: 50,
        pnl: 0,
        status: TradeStatus.ACTIVE,
        side: TradeSide.LONG,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };

    return trade as ITrade;
};

const mockSecrets: ITradingEngineServiceSecrets = {
    API_SECRET_KEY_ENCRYPTION_KEY: "test-encryption-key",
    PROCESS_BYBIT_ORDERS_QUEUE:
        "https://sqs.us-east-1.amazonaws.com/123/process-bybit-orders",
    HANDLE_FAILED_TRADES_QUEUE:
        "https://sqs.us-east-1.amazonaws.com/123/handle-failed-trades",
    TRADING_ENGINE_SERVICE_DB_URL: "mongodb://test",
    PROCESS_BINANCE_ORDERS_QUEUE:
        "https://sqs.us-east-1.amazonaws.com/123/binance-orders",
    PROCESS_USER_TRADES_QUEUE:
        "https://sqs.us-east-1.amazonaws.com/123/user-trades",
    HANDLE_PROCESSED_TRADES_QUEUE:
        "https://sqs.us-east-1.amazonaws.com/123/processed-trades",
    PROCESS_INCOMING_SIGNALS_QUEUE:
        "https://sqs.us-east-1.amazonaws.com/123/incoming-signals",
    PROCESS_BYBIT_ORDERS_ACTIVATION_QUEUE:
        "https://sqs.us-east-1.amazonaws.com/123/bybit-orders-activation",
    PROCESS_BYBIT_STOP_LOSS_ORDERS_QUEUE:
        "https://sqs.us-east-1.amazonaws.com/123/bybit-stop-loss-orders",
    PROCESS_BYBIT_TAKE_PROFIT_ORDERS_QUEUE:
        "https://sqs.us-east-1.amazonaws.com/123/bybit-take-profit-orders",
    CLOSE_BYBIT_TRADES_QUEUE:
        "https://sqs.us-east-1.amazonaws.com/123/close-bybit-trades",
};

describe("Bybit Exchange Helpers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPublishMessageToQueue.mockResolvedValue(undefined);
        mockDecrypt.mockImplementation((value) => `decrypted-${value}`);
        mockGetTradingEngineServiceSecrets.mockResolvedValue(mockSecrets);
    });

    describe("processBybitTrades", () => {
        it("should successfully process market orders for LONG trades", async () => {
            const userTrade = createMockUserTradeAllocation({
                tradeSide: TradeSide.LONG,
                orderPlacementType: OrderPlacementType.MARKET,
                baseAsset: "BTC",
            });
            const queueMessage = createMockQueueMessage<IUserTradeAllocation>(
                userTrade,
                "msg-1"
            );

            setupTradingEngineMocks();
            const mockBybitInstance = setupBybitMocks(null, {
                orderId: "order-123",
            });

            const result = await processBybitTrades([queueMessage]);

            expect(result.successMessageIds).toContain("msg-1");
            expect(result.failedMessageIds).toHaveLength(0);
            expect(mockBybitInstance.placeMarketOrder).toHaveBeenCalledWith({
                symbol: "BTCUSDT",
                side: "Buy",
                qty: "0.01",
                leverage: expect.any(Number),
            });
            expect(mockPublishMessageToQueue).toHaveBeenCalled();
        });

        it("should successfully process limit orders for SHORT trades", async () => {
            const userTrade = createMockUserTradeAllocation({
                tradeSide: TradeSide.SHORT,
                orderPlacementType: OrderPlacementType.LIMIT,
                baseAsset: "ETH",
                baseQuantity: 0.02,
                entryPrice: 2500,
            });
            const queueMessage = createMockQueueMessage<IUserTradeAllocation>(
                userTrade,
                "msg-2"
            );

            setupTradingEngineMocks();
            const mockBybitInstance = setupBybitMocks(null, {
                orderId: "order-456",
            });

            const result = await processBybitTrades([queueMessage]);

            expect(result.successMessageIds).toContain("msg-2");
            expect(mockBybitInstance.placeLimitOrder).toHaveBeenCalledWith({
                symbol: "ETHUSDT",
                side: "Sell",
                qty: "0.02",
                leverage: expect.any(Number),
                price: "2500",
            });
        });

        it("should handle trade placement failures gracefully", async () => {
            const userTrade = createMockUserTradeAllocation();
            const queueMessage = createMockQueueMessage<IUserTradeAllocation>(
                userTrade,
                "msg-3"
            );

            setupTradingEngineMocks();
            setupBybitMocks(null, null, true);

            const result = await processBybitTrades([queueMessage]);

            expect(result.failedMessageIds).toContain("msg-3");
            expect(result.successMessageIds).toHaveLength(0);
            expect(mockPublishMessageToQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    queueUrl: expect.any(String),
                })
            );
        });

        it("should process multiple trades and track success/failure separately", async () => {
            const userTrade1 = createMockUserTradeAllocation({
                userId: "user-1",
                tradeId: new mongoose.Types.ObjectId().toHexString(),
            });
            const userTrade2 = createMockUserTradeAllocation({
                userId: "user-2",
                tradeId: new mongoose.Types.ObjectId().toHexString(),
            });

            const queueMessages = [
                createMockQueueMessage<IUserTradeAllocation>(userTrade1, "msg-1"),
                createMockQueueMessage<IUserTradeAllocation>(userTrade2, "msg-2"),
            ];

            setupTradingEngineMocks();
            setupBybitMocks(null, { orderId: "order-123" });

            const result = await processBybitTrades(queueMessages);

            expect(result.successMessageIds).toContain("msg-1");
            expect(result.successMessageIds).toContain("msg-2");
            expect(result.failedMessageIds).toHaveLength(0);
        });
    });

    describe("processBybitOrdersActivation", () => {
        it("should activate filled orders and update trade status", async () => {
            const trade = createMockTrade({
                status: TradeStatus.PENDING,
            });
            const queueMessage = createMockQueueMessage<ITrade>(trade, "msg-1");

            const mockTradingEngineInstance = setupTradingEngineMocks();
            setupBybitMocks({
                size: "0.01",
                avgPrice: "50000",
                side: "Buy",
            });

            const result = await processBybitOrdersActivation([queueMessage]);

            expect(result.successMessageIds).toContain("msg-1");
            expect(
                mockTradingEngineInstance.updateTrade
            ).toHaveBeenCalledWith({
                tradeId: trade._id?.toString(),
                updateData: {
                    status: TradeStatus.ACTIVE,
                    entryPrice: expect.any(Number),
                },
            });
        });

        it("should handle activation failures", async () => {
            const trade = createMockTrade();
            const queueMessage = createMockQueueMessage<ITrade>(trade, "msg-1");

            setupTradingEngineMocks();
            setupBybitMocks(null, null, true);

            const result = await processBybitOrdersActivation([queueMessage]);

            expect(result.failedMessageIds).toContain("msg-1");
            expect(result.successMessageIds).toHaveLength(0);
        });
    });

    describe("processBybitStopLossOrders", () => {
        it("should set stop loss for open position", async () => {
            const trade = createMockTrade({
                pair: "BTCUSDT",
                stopLossPrice: 49000,
                status: TradeStatus.ACTIVE,
            });
            const queueMessage = createMockQueueMessage<ITrade>(trade, "msg-1");

            const mockTradingEngineInstance = setupTradingEngineMocks();
            const mockBybitInstance = setupBybitMocks({
                size: "0.01",
                side: "Buy",
            });

            const result = await processBybitStopLossOrders([queueMessage]);

            expect(result.successMessageIds).toContain("msg-1");
            expect(
                mockBybitInstance.setPositionStopLossTakeProfit
            ).toHaveBeenCalledWith({
                symbol: "BTCUSDT",
                stopLoss: "49000",
            });
            expect(
                mockTradingEngineInstance.updateTrade
            ).toHaveBeenCalled();
        });

        it("should skip if no open position exists", async () => {
            const trade = createMockTrade();
            const queueMessage = createMockQueueMessage<ITrade>(trade, "msg-1");

            const mockTradingEngineInstance = setupTradingEngineMocks();
            const mockBybitInstance = setupBybitMocks(null);

            const result = await processBybitStopLossOrders([queueMessage]);

            expect(result.successMessageIds).toContain("msg-1");
            expect(
                mockBybitInstance.setPositionStopLossTakeProfit
            ).not.toHaveBeenCalled();
            expect(
                mockTradingEngineInstance.updateTrade
            ).toHaveBeenCalled();
        });

        it("should handle API errors gracefully", async () => {
            const trade = createMockTrade();
            const queueMessage = createMockQueueMessage<ITrade>(trade, "msg-1");

            setupTradingEngineMocks();
            setupBybitMocks(null, null, true);

            const result = await processBybitStopLossOrders([queueMessage]);

            expect(result.failedMessageIds).toContain("msg-1");
            expect(result.successMessageIds).toHaveLength(0);
        });
    });

    describe("processBybitTakeProfitOrders", () => {
        it("should set take profit for open position", async () => {
            const trade = createMockTrade({
                pair: "BTCUSDT",
                takeProfitPrice: 51000,
                status: TradeStatus.ACTIVE,
            });
            const queueMessage = createMockQueueMessage<ITrade>(trade, "msg-1");

            const mockTradingEngineInstance = setupTradingEngineMocks();
            const mockBybitInstance = setupBybitMocks({
                size: "0.01",
                side: "Buy",
            });

            const result = await processBybitTakeProfitOrders([queueMessage]);

            expect(result.successMessageIds).toContain("msg-1");
            expect(
                mockBybitInstance.setPositionStopLossTakeProfit
            ).toHaveBeenCalledWith({
                symbol: "BTCUSDT",
                takeProfit: "51000",
            });
            expect(
                mockTradingEngineInstance.updateTrade
            ).toHaveBeenCalled();
        });

        it("should handle missing take profit price", async () => {
            const trade = createMockTrade({
                takeProfitPrice: undefined,
            });
            const queueMessage = createMockQueueMessage<ITrade>(trade, "msg-1");

            const mockTradingEngineInstance = setupTradingEngineMocks();
            // Add mock for the new unsetTradeTakeProfit method
            mockTradingEngineInstance.unsetTradeTakeProfit = jest
                .fn()
                .mockResolvedValue({});

            setupBybitMocks({ size: "0.01", side: "Buy" });

            const result = await processBybitTakeProfitOrders([queueMessage]);

            expect(result.successMessageIds).toContain("msg-1");
            expect(result.failedMessageIds).toHaveLength(0);
            expect(
                mockTradingEngineInstance.unsetTradeTakeProfit
            ).toHaveBeenCalledWith({
                tradeId: trade._id?.toString(),
            });
        });
    });

    describe("closeBybitTrades", () => {
        it("should close full position and update trade status to CLOSED", async () => {
            const trade = createMockTrade({
                baseQuantity: 0.01,
                status: TradeStatus.ACTIVE,
                pair: "BTCUSDT",
            });
            const closeTradeEvent: ICloseTradeEvent = {
                trade,
                qtyPercentToClose: 100,
            };
            const queueMessage = createMockQueueMessage<ICloseTradeEvent>(
                closeTradeEvent,
                "msg-1"
            );

            const mockTradingEngineInstance = setupTradingEngineMocks();
            const mockBybitInstance = setupBybitMocks({
                size: "0.01",
                side: "Buy",
            });

            const result = await processBybitCloseTrades([queueMessage]);

            expect(result.successMessageIds).toContain("msg-1");
            expect(mockBybitInstance.closePosition).toHaveBeenCalledWith({
                symbol: "BTCUSDT",
                side: "Sell",
                qty: "0.01",
            });
            expect(
                mockTradingEngineInstance.updateTrade
            ).toHaveBeenCalledWith({
                tradeId: trade._id?.toString(),
                updateData: { status: TradeStatus.CLOSED },
            });
        });

        it("should close partial position and update remaining quantities", async () => {
            const trade = createMockTrade({
                baseQuantity: 0.02,
                quoteTotal: 1000,
                estimatedProfit: 200,
                estimatedLoss: 100,
                status: TradeStatus.ACTIVE,
            });
            const closeTradeEvent: ICloseTradeEvent = {
                trade,
                qtyPercentToClose: 50,
            };
            const queueMessage = createMockQueueMessage<ICloseTradeEvent>(
                closeTradeEvent,
                "msg-1"
            );

            const mockTradingEngineInstance = setupTradingEngineMocks();
            const mockBybitInstance = setupBybitMocks({
                size: "0.02",
                side: "Buy",
            });

            const result = await processBybitCloseTrades([queueMessage]);

            expect(result.successMessageIds).toContain("msg-1");
            expect(mockBybitInstance.closePosition).toHaveBeenCalledWith({
                symbol: expect.any(String),
                side: expect.any(String),
                qty: "0.01",
            });
            expect(
                mockTradingEngineInstance.updateTrade
            ).toHaveBeenCalledWith({
                tradeId: trade._id?.toString(),
                updateData: expect.objectContaining({
                    baseQuantity: 0.01,
                    quoteTotal: 500,
                    estimatedProfit: 100,
                    estimatedLoss: 50,
                }),
            });
        });

        it("should handle close position failures", async () => {
            const trade = createMockTrade();
            const closeTradeEvent: ICloseTradeEvent = {
                trade,
                qtyPercentToClose: 100,
            };
            const queueMessage = createMockQueueMessage<ICloseTradeEvent>(
                closeTradeEvent,
                "msg-1"
            );

            setupTradingEngineMocks();
            setupBybitMocks(null, null, true);

            const result = await processBybitCloseTrades([queueMessage]);

            expect(result.failedMessageIds).toContain("msg-1");
            expect(result.successMessageIds).toHaveLength(0);
        });

        it("should handle SHORT position closing", async () => {
            const trade = createMockTrade({
                pair: "ETHUSDT",
                baseQuantity: 0.05,
                status: TradeStatus.ACTIVE,
                side: TradeSide.SHORT,
            });
            const closeTradeEvent: ICloseTradeEvent = {
                trade,
                qtyPercentToClose: 100,
            };
            const queueMessage = createMockQueueMessage<ICloseTradeEvent>(
                closeTradeEvent,
                "msg-1"
            );

            setupTradingEngineMocks();
            const mockBybitInstance = setupBybitMocks({
                size: "0.05",
                side: "Sell",
            });

            const result = await processBybitCloseTrades([queueMessage]);

            expect(result.successMessageIds).toContain("msg-1");
            expect(mockBybitInstance.closePosition).toHaveBeenCalledWith({
                symbol: "ETHUSDT",
                side: "Buy",
                qty: "0.05",
            });
        });
    });

    describe("processBybitCancelOrders", () => {
        it("should cancel open orders successfully", async () => {
            const order = {
                _id: new mongoose.Types.ObjectId(),
                id: "order-1",

                tradeId: new mongoose.Types.ObjectId(),
                orderBatchId: new mongoose.Types.ObjectId(),
                baseAsset: "BTC",
                baseQuantity: 0.01,
                orderType: "ENTRY" as const,
                orderSide: "BUY" as const,
                placementType: OrderPlacementType.LIMIT,
                price: 50000,
                total: 500,
                quoteCurrency: "USDT",
                quoteTotal: 500,
                status: OrderStatus.PENDING,
                externalOrderId: "ext-order-123",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as IOrder;

            const queueMessage = createMockQueueMessage<IOrder>(order, "msg-1");

            const mockTradingEngineInstance = setupTradingEngineMocks();
            const mockBybitInstance = setupBybitMocks();

            // Mock getOrderById to return an open order
            mockBybitInstance.getOrderById = jest.fn().mockResolvedValue({
                orderId: "ext-order-123",
                orderStatus: "New",
            });
            mockBybitInstance.cancelOrder = jest
                .fn()
                .mockResolvedValue({});

            const result = await processBybitCancelOrders([queueMessage]);

            expect(result.successMessageIds).toContain("msg-1");
            expect(mockBybitInstance.cancelOrder).toHaveBeenCalledWith({
                symbol: "BTCUSDT",
                orderId: "ext-order-123",
            });
            expect(
                mockTradingEngineInstance.updateOrder
            ).toHaveBeenCalledWith(
                order._id?.toString(),
                expect.objectContaining({
                    status: OrderStatus.CANCELED,
                })
            );
            expect(
                mockTradingEngineInstance.updateOrderBatch
            ).toHaveBeenCalledWith(
                order.orderBatchId?.toString(),
                expect.objectContaining({
                    status: OrderBatchStatus.CANCELED,
                })
            );

            expect(
                mockTradingEngineInstance.updateTrade
            ).toHaveBeenCalledWith({
                tradeId: order.tradeId?.toString(),
                updateData: expect.objectContaining({
                    status: TradeStatus.CANCELED
                }),
            });
        });

        it("should cancel partially filled orders", async () => {
            const order = {
                _id: new mongoose.Types.ObjectId(),
                id: "order-2",
                userId: "user-1",
                tradeId: new mongoose.Types.ObjectId(),
                orderBatchId: new mongoose.Types.ObjectId(),
                baseAsset: "ETH",
                baseQuantity: 0.1,
                orderType: "ENTRY" as const,
                orderSide: "SELL" as const,
                placementType: OrderPlacementType.LIMIT,
                price: 2500,
                total: 250,
                quoteCurrency: "USDT",
                quoteTotal: 250,
                status: OrderStatus.PARTIALLY_FILLED,
                externalOrderId: "ext-order-456",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as IOrder;

            const queueMessage = createMockQueueMessage<IOrder>(order, "msg-1");

            // const mockTradingEngineInstance = setupTradingEngineMocks();
            const mockBybitInstance = setupBybitMocks();

            mockBybitInstance.getOrderById = jest.fn().mockResolvedValue({
                orderId: "ext-order-456",
                orderStatus: "PartiallyFilled",
            });
            mockBybitInstance.cancelOrder = jest
                .fn()
                .mockResolvedValue({});

            const result = await processBybitCancelOrders([queueMessage]);

            expect(result.successMessageIds).toContain("msg-1");
            expect(mockBybitInstance.cancelOrder).toHaveBeenCalled();
        });

        it("should skip cancellation for already filled orders", async () => {
            const order = {
                _id: new mongoose.Types.ObjectId(),
                id: "order-3",

                tradeId: new mongoose.Types.ObjectId(),
                orderBatchId: new mongoose.Types.ObjectId(),
                baseAsset: "BTC",
                baseQuantity: 0.01,
                orderType: "ENTRY" as const,
                orderSide: "BUY" as const,
                placementType: OrderPlacementType.MARKET,
                price: 50000,
                total: 500,
                quoteCurrency: "USDT",
                quoteTotal: 500,
                status: OrderStatus.FILLED,
                externalOrderId: "ext-order-789",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as IOrder;

            const queueMessage = createMockQueueMessage<IOrder>(order, "msg-1");

            const mockTradingEngineInstance = setupTradingEngineMocks();
            const mockBybitInstance = setupBybitMocks();

            // Mock getOrderById to return a filled order
            mockBybitInstance.getOrderById = jest.fn().mockResolvedValue({
                orderId: "ext-order-789",
                orderStatus: "Filled",
            });
            mockBybitInstance.cancelOrder = jest
                .fn()
                .mockResolvedValue({});

            const result = await processBybitCancelOrders([queueMessage]);

            expect(result.successMessageIds).toContain("msg-1");
            // Cancel should not be called for filled orders
            expect(mockBybitInstance.cancelOrder).not.toHaveBeenCalled();
            expect(
                mockTradingEngineInstance.updateOrder
            ).toHaveBeenCalledWith(
                order._id?.toString(),
                expect.objectContaining({
                    status: OrderStatus.CANCELED,
                })
            );
        });

        it("should handle cancel order failures", async () => {
            const order = {
                _id: new mongoose.Types.ObjectId(),
                id: "order-4",
                userId: "user-1",
                tradeId: new mongoose.Types.ObjectId(),
                orderBatchId: new mongoose.Types.ObjectId(),
                baseAsset: "BTC",
                baseQuantity: 0.01,
                orderType: "ENTRY" as const,
                orderSide: "BUY" as const,
                placementType: OrderPlacementType.LIMIT,
                price: 50000,
                total: 500,
                quoteCurrency: "USDT",
                quoteTotal: 500,
                status: OrderStatus.PENDING,
                externalOrderId: "ext-order-999",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as IOrder;

            const queueMessage = createMockQueueMessage<IOrder>(order, "msg-1");

            setupTradingEngineMocks();

            // Create a custom bybit instance that fails on cancelOrder
            const mockBybitInstance: MockBybitInstance = {
                getOpenPosition: jest.fn().mockResolvedValue({
                    size: "0.01",
                    side: "Buy",
                }),
                getOrderById: jest.fn().mockResolvedValue({
                    orderId: "ext-order-999",
                    orderStatus: "New",
                }),
                cancelOrder: jest
                    .fn()
                    .mockRejectedValue(new Error("Failed to cancel order")),
                placeMarketOrder: jest.fn(),
                placeLimitOrder: jest.fn(),
                closePosition: jest.fn(),
                setPositionStopLossTakeProfit: jest.fn(),
            };

            mockBybitFuturesClient.mockImplementation(
                () => mockBybitInstance as unknown as InstanceType<typeof BybitFuturesClient>
            );

            const result = await processBybitCancelOrders([queueMessage]);

            expect(result.failedMessageIds).toContain("msg-1");
            expect(result.successMessageIds).toHaveLength(0);
        });

        it("should process multiple cancel orders in parallel", async () => {
            const order1 = {
                _id: new mongoose.Types.ObjectId(),
                id: "order-1",
                userId: "user-1",
                tradeId: new mongoose.Types.ObjectId(),
                orderBatchId: new mongoose.Types.ObjectId(),
                baseAsset: "BTC",
                baseQuantity: 0.01,
                orderType: "ENTRY" as const,
                orderSide: "BUY" as const,
                placementType: OrderPlacementType.LIMIT,
                price: 50000,
                total: 500,
                quoteCurrency: "USDT",
                quoteTotal: 500,
                status: OrderStatus.PENDING,
                externalOrderId: "ext-order-1",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as IOrder;

            const order2 = {
                _id: new mongoose.Types.ObjectId(),
                id: "order-2",
                userId: "user-2",
                tradeId: new mongoose.Types.ObjectId(),
                orderBatchId: new mongoose.Types.ObjectId(),
                baseAsset: "ETH",
                baseQuantity: 0.1,
                orderType: "ENTRY" as const,
                orderSide: "SELL" as const,
                placementType: OrderPlacementType.LIMIT,
                price: 2500,
                total: 250,
                quoteCurrency: "USDT",
                quoteTotal: 250,
                status: OrderStatus.PENDING,
                externalOrderId: "ext-order-2",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            } as IOrder;

            const queueMessages = [
                createMockQueueMessage<IOrder>(order1, "msg-1"),
                createMockQueueMessage<IOrder>(order2, "msg-2"),
            ];

            setupTradingEngineMocks();
            const mockBybitInstance = setupBybitMocks();

            mockBybitInstance.getOrderById = jest.fn().mockResolvedValue({
                orderId: "ext-order",
                orderStatus: "New",
            });
            mockBybitInstance.cancelOrder = jest
                .fn()
                .mockResolvedValue({});

            const result = await processBybitCancelOrders(queueMessages);

            expect(result.successMessageIds).toContain("msg-1");
            expect(result.successMessageIds).toContain("msg-2");
            expect(result.failedMessageIds).toHaveLength(0);
            expect(mockBybitInstance.cancelOrder).toHaveBeenCalledTimes(2);
        });
    });
});