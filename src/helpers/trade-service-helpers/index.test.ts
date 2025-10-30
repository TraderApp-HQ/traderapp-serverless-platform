import mongoose from "mongoose";
import { TradingPlatform, AccountType } from "src/config/enums";
import { IQueueMessageBody } from "src/config/interfaces";
import { ITradingEngineServiceSecrets } from "src/config/secrets/interfaces";
import {
    OrderPlacementType,
    OrderSide,
    OrderType,
    TradeSide,
    TradeStatus,
    InvoiceStatus,
} from "src/services/TradingEngineService/enums";
import {
    IFailedTrade,
    IProcessedTrade,
    IUserTradeAllocation,
} from "src/services/TradingEngineService/interfaces";
import {
    mapUserConnectedTradingPlatformToQueueUrl,
    processUserTrades,
    handleProcessedTrades,
    handleFailedTrades,
} from "./index";

// Mock dependencies
jest.mock("src/clients/SQSClient/helpers");
jest.mock("src/services/WalletsService");
jest.mock("src/config/secrets/helpers");

// Mock TradingEngineService with a manual mock that can be configured per test
const mockUpdateTrade = jest.fn();
const mockCreateOrderBatch = jest.fn();
const mockCreateOrder = jest.fn();
const mockCalculatePnL = jest.fn();

jest.mock("src/services/TradingEngineService", () => {
    return {
        TradingEngineService: jest.fn().mockImplementation(() => ({
            updateTrade: mockUpdateTrade,
            createOrderBatch: mockCreateOrderBatch,
            createOrder: mockCreateOrder,
            calculatePnL: mockCalculatePnL,
        })),
    };
});

import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { WalletsService } from "src/services/WalletsService";
import { getSecrets } from "src/config/secrets/helpers";

const mockPublishMessageToQueue = publishMessageToQueue as jest.MockedFunction<
    typeof publishMessageToQueue
>;
const mockGetSecrets = getSecrets as jest.MockedFunction<typeof getSecrets>;

describe("Trade Service Helpers", () => {
    const mockSecrets: ITradingEngineServiceSecrets = {
        TRADING_ENGINE_SERVICE_DB_URL: "mongodb://test",
        PROCESS_BINANCE_ORDERS_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/binance-orders",
        PROCESS_USER_TRADES_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/user-trades",
        HANDLE_FAILED_TRADES_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/failed-trades",
        HANDLE_PROCESSED_TRADES_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/processed-trades",
        API_SECRET_KEY_ENCRYPTION_KEY: "test-key",
        PROCESS_INCOMING_SIGNALS_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/incoming-signals",
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetSecrets.mockResolvedValue(mockSecrets);
        // Reset mock implementations
        mockUpdateTrade.mockReset();
        mockCreateOrderBatch.mockReset();
        mockCreateOrder.mockReset();
        mockCalculatePnL.mockReset();

        // Set default return value for calculatePnL
        mockCalculatePnL.mockReturnValue({
            pnlAmount: 100,
            pnlPercentOfRisk: 200,
            pnlPercentOfRequiredMargin: 20,
        });
    });

    describe("mapUserConnectedTradingPlatformToQueueUrl", () => {
        it("should map Binance platform to correct queue URL", async () => {
            const result = await mapUserConnectedTradingPlatformToQueueUrl({
                platformName: TradingPlatform.BINANCE,
                tradingEngineServiceSecrets: mockSecrets,
            });

            expect(result).toBe(mockSecrets.PROCESS_BINANCE_ORDERS_QUEUE);
        });

        it("should throw error for unsupported platform", async () => {
            await expect(
                mapUserConnectedTradingPlatformToQueueUrl({
                    platformName: "UNSUPPORTED" as TradingPlatform,
                    tradingEngineServiceSecrets: mockSecrets,
                })
            ).rejects.toThrow("Unsupported trading platform");
        });
    });

    describe("processUserTrades", () => {
        const createMockUserTrade = (
            overrides: Partial<IUserTradeAllocation> = {}
        ): IUserTradeAllocation => ({
            userId: "user123",
            tradingAccountId: new mongoose.Types.ObjectId(),
            platformName: TradingPlatform.BINANCE,
            apiKey: "test-key",
            apiSecret: "test-secret",
            positionSize: 0.001,
            tradeAmount: 100,
            riskAmount: 10,
            availableBalance: 1000,
            tradeId: new mongoose.Types.ObjectId().toString(),
            masterTradeId: "master123",
            baseAsset: "BTC",
            quoteCurrency: "USDT",
            quoteTotal: 100,
            entryPrice: 100000,
            stopLossPrice: 95000,
            takeProfitPrice: 110000,
            tradeSide: TradeSide.LONG,
            orderPlacementType: OrderPlacementType.MARKET,
            accountType: "FUTURES" as AccountType,
            baseQuantity: 0.001,
            ...overrides,
        });

        const createQueueMessage = (
            userTrade: IUserTradeAllocation
        ): IQueueMessageBody<IUserTradeAllocation> => ({
            messageId: "msg123",
            body: userTrade,
            receiptHandle: "receipt123",
            attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "1234567890",
                SenderId: "sender123",
                ApproximateFirstReceiveTimestamp: "1234567890",
            },
            messageAttributes: {},
            md5OfBody: "md5123",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
        });

        it("should process trades with full balance successfully", async () => {
            const userTrade = createMockUserTrade();
            const queueMessage = createQueueMessage(userTrade);

            const mockWalletsService = {
                computeTotalAmountToLock: jest
                    .fn()
                    .mockReturnValue({ totalAmountToLock: 50 }),
                getUserWallet: jest.fn().mockResolvedValue({
                    availableBalance: 1000,
                    userId: "user123",
                }),
                getInvoices: jest.fn().mockResolvedValue([]), // No unpaid invoices
                lockUserBalance: jest.fn().mockResolvedValue({
                    success: true,
                    wallet: { availableBalance: 1000 },
                }),
                createInvoice: jest.fn().mockResolvedValue({
                    success: true,
                    invoice: { id: "invoice123" },
                }),
            };
            (WalletsService as jest.Mock).mockImplementation(
                () => mockWalletsService
            );
            mockPublishMessageToQueue.mockResolvedValue(undefined);

            const result = await processUserTrades([queueMessage]);

            expect(result.successMessageIds).toHaveLength(1);
            expect(result.failedMessageIds).toHaveLength(0);
            expect(mockWalletsService.getInvoices).toHaveBeenCalled();
            expect(mockWalletsService.lockUserBalance).toHaveBeenCalled();
            expect(mockWalletsService.createInvoice).toHaveBeenCalledTimes(2); // Trading fee + profit share
            expect(mockPublishMessageToQueue).toHaveBeenCalledWith({
                queueUrl: mockSecrets.PROCESS_BINANCE_ORDERS_QUEUE,
                message: expect.any(String),
            });
        });

        it("should process trades with partial balance successfully", async () => {
            const userTrade = createMockUserTrade();
            const queueMessage = createQueueMessage(userTrade);

            const mockWalletsService = {
                getUserWallet: jest.fn().mockResolvedValue({
                    availableBalance: 20, // Less than required but >= $1
                    userId: "user123",
                }),
                getInvoices: jest.fn().mockResolvedValue([]),
                lockUserBalance: jest.fn().mockResolvedValue({
                    success: true,
                    wallet: { availableBalance: 20 },
                }),
                createInvoice: jest.fn().mockResolvedValue({
                    success: true,
                    invoice: { id: "invoice123" },
                }),
            };
            (WalletsService as jest.Mock).mockImplementation(
                () => mockWalletsService
            );
            mockPublishMessageToQueue.mockResolvedValue(undefined);

            const result = await processUserTrades([queueMessage]);

            expect(result.successMessageIds).toHaveLength(1);
            expect(mockWalletsService.lockUserBalance).toHaveBeenCalledWith({
                userId: userTrade.userId,
                amount: 20, // Lock entire available balance
                currency: expect.any(String),
                walletType: expect.any(String),
            });
            // Verify invoices created with LOCKED status
            expect(mockWalletsService.createInvoice).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: InvoiceStatus.LOCKED,
                })
            );
        });

        it("should create PENDING invoices when balance is less than $1 and continue processing", async () => {
            const userTrade = createMockUserTrade();
            const queueMessage = createQueueMessage(userTrade);

            const mockWalletsService = {
                getUserWallet: jest.fn().mockResolvedValue({
                    availableBalance: 0.5, // Less than $1
                    userId: "user123",
                }),
                getInvoices: jest.fn().mockResolvedValue([]),
                lockUserBalance: jest.fn(), // Should NOT be called
                createInvoice: jest.fn().mockResolvedValue({
                    success: true,
                    invoice: { id: "invoice123" },
                }),
            };
            (WalletsService as jest.Mock).mockImplementation(
                () => mockWalletsService
            );
            mockPublishMessageToQueue.mockResolvedValue(undefined);

            const result = await processUserTrades([queueMessage]);

            expect(result.successMessageIds).toHaveLength(1);
            expect(mockWalletsService.lockUserBalance).not.toHaveBeenCalled();
            // Verify invoices created with PENDING status and $0 paid
            expect(mockWalletsService.createInvoice).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: InvoiceStatus.PENDING,
                    amountPaid: 0,
                })
            );
            expect(mockPublishMessageToQueue).toHaveBeenCalledWith({
                queueUrl: mockSecrets.PROCESS_BINANCE_ORDERS_QUEUE,
                message: expect.any(String),
            });
        });

        it("should handle users with 3+ unpaid invoices by publishing to failed trades queue", async () => {
            const userTrade = createMockUserTrade();
            const queueMessage = createQueueMessage(userTrade);

            // Create 3 unpaid invoices for different trades
            const unpaidInvoices = [
                { tradeId: "trade1", status: InvoiceStatus.PENDING },
                { tradeId: "trade2", status: InvoiceStatus.PENDING },
                { tradeId: "trade3", status: InvoiceStatus.OVERDUE },
            ];

            const mockWalletsService = {
                computeTotalAmountToLock: jest
                    .fn()
                    .mockReturnValue({ totalAmountToLock: 2000 }),
                getUserWallet: jest.fn().mockResolvedValue({
                    availableBalance: 1000,
                    userId: "user123",
                }),
                getInvoices: jest.fn().mockResolvedValue(unpaidInvoices),
                lockUserBalance: jest.fn(),
                createInvoice: jest.fn(),
            };
            (WalletsService as jest.Mock).mockImplementation(
                () => mockWalletsService
            );
            mockPublishMessageToQueue.mockResolvedValue(undefined);

            const result = await processUserTrades([queueMessage]);

            expect(result.successMessageIds).toHaveLength(1);
            expect(mockWalletsService.lockUserBalance).not.toHaveBeenCalled();
            expect(mockWalletsService.createInvoice).not.toHaveBeenCalled();
            // Should publish to failed trades queue
            expect(mockPublishMessageToQueue).toHaveBeenCalledWith({
                queueUrl: mockSecrets.HANDLE_FAILED_TRADES_QUEUE,
                message: expect.stringContaining(userTrade.userId),
            });
        });

        it("should handle wallet lock failure", async () => {
            const userTrade = createMockUserTrade();
            const queueMessage = createQueueMessage(userTrade);

            const mockWalletsService = {
                getUserWallet: jest.fn().mockResolvedValue({
                    availableBalance: 1000,
                    userId: "user123",
                }),
                getInvoices: jest.fn().mockResolvedValue([]),
                lockUserBalance: jest.fn().mockResolvedValue({
                    success: false,
                    wallet: { availableBalance: 1000 },
                }),
                createInvoice: jest.fn(),
            };
            (WalletsService as jest.Mock).mockImplementation(
                () => mockWalletsService
            );

            const result = await processUserTrades([queueMessage]);

            expect(result.successMessageIds).toHaveLength(1);
            expect(mockWalletsService.createInvoice).not.toHaveBeenCalled();
            expect(mockPublishMessageToQueue).toHaveBeenCalledWith({
                queueUrl: mockSecrets.HANDLE_FAILED_TRADES_QUEUE,
                message: expect.any(String),
            });
        });

        it("should handle invoice creation failure", async () => {
            const userTrade = createMockUserTrade();
            const queueMessage = createQueueMessage(userTrade);

            const mockWalletsService = {
                getUserWallet: jest.fn().mockResolvedValue({
                    availableBalance: 1000,
                    userId: "user123",
                }),
                getInvoices: jest.fn().mockResolvedValue([]),
                lockUserBalance: jest.fn().mockResolvedValue({
                    success: true,
                    wallet: { availableBalance: 1000 },
                }),
                createInvoice: jest.fn().mockResolvedValue({
                    success: false, // Invoice creation fails
                    error: "Invoice creation failed",
                }),
            };
            (WalletsService as jest.Mock).mockImplementation(
                () => mockWalletsService
            );

            const result = await processUserTrades([queueMessage]);

            expect(result.successMessageIds).toHaveLength(1);
            expect(mockWalletsService.lockUserBalance).toHaveBeenCalled();
            expect(mockWalletsService.createInvoice).toHaveBeenCalled();
            // Should publish to failed trades queue
            expect(mockPublishMessageToQueue).toHaveBeenCalledWith({
                queueUrl: mockSecrets.HANDLE_FAILED_TRADES_QUEUE,
                message: expect.stringContaining(userTrade.userId),
            });
        });

        it("should handle processing errors and mark as failed", async () => {
            const userTrade = createMockUserTrade();
            const queueMessage = createQueueMessage(userTrade);

            const mockWalletsService = {
                getUserWallet: jest.fn(() => Promise.reject(new Error("Database error"))),
                getInvoices: jest.fn().mockResolvedValue([]),
                lockUserBalance: jest.fn(),
                createInvoice: jest.fn(),
            };

            (WalletsService as jest.Mock).mockImplementation(() => mockWalletsService);

            const result = await processUserTrades([queueMessage]);

            expect(result.failedMessageIds).toHaveLength(1);
            expect(result.successMessageIds).toHaveLength(0);
        });
    });

    describe("handleProcessedTrades", () => {
        const createProcessedTrade = (): IProcessedTrade => ({
            userId: "user123",
            tradeId: new mongoose.Types.ObjectId(),
            baseAsset: "BTC",
            baseQuantity: 0.001,
            orderType: OrderType.ENTRY,
            orderSide: OrderSide.BUY,
            placementType: OrderPlacementType.LIMIT,
            externalOrderId: "binance123",
            side: TradeSide.LONG,
            price: 100000,
            total: 100,
            quoteCurrency: "USDT",
            quoteTotal: 100,
            tradingAccountId: new mongoose.Types.ObjectId(),
            platformName: TradingPlatform.BINANCE,
            platformId: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        const createQueueMessage = (
            trade: IProcessedTrade
        ): IQueueMessageBody<IProcessedTrade> => ({
            messageId: "msg123",
            body: trade,
            receiptHandle: "receipt123",
            attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "1234567890",
                SenderId: "sender123",
                ApproximateFirstReceiveTimestamp: "1234567890",
            },
            messageAttributes: {},
            md5OfBody: "md5123",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
        });

        it("should update trade status and create order batch and order", async () => {
            const processedTrade = createProcessedTrade();
            const queueMessage = createQueueMessage(processedTrade);

            // Configure mocks for this test
            mockUpdateTrade.mockResolvedValue({
                id: processedTrade.tradeId.toString(),
            });
            mockCreateOrderBatch.mockResolvedValue({
                id: "68625959a18cb30d0f937702",
            });
            mockCreateOrder.mockResolvedValue({ id: "order123" });

            const result = await handleProcessedTrades([queueMessage]);

            expect(result.successMessageIds).toHaveLength(1);
            expect(mockUpdateTrade).toHaveBeenCalledWith({
                tradeId: processedTrade.tradeId.toString(),
                updateData: { status: TradeStatus.PROCESSED },
            });
            expect(mockCreateOrderBatch).toHaveBeenCalled();
            expect(mockCreateOrder).toHaveBeenCalled();
        });

        it("should handle errors and mark as failed", async () => {
            const processedTrade = createProcessedTrade();
            const queueMessage = createQueueMessage(processedTrade);

            // Configure mock to throw error
            mockUpdateTrade.mockRejectedValue(new Error("Database error"));

            const result = await handleProcessedTrades([queueMessage]);

            expect(result.failedMessageIds).toHaveLength(1);
        });
    });

    describe("handleFailedTrades", () => {
        const createFailedTrade = (): IFailedTrade => ({
            userId: "user123",
            tradeId: new mongoose.Types.ObjectId(),
        });

        const createQueueMessage = (
            trade: IFailedTrade
        ): IQueueMessageBody<IFailedTrade> => ({
            messageId: "msg123",
            body: trade,
            receiptHandle: "receipt123",
            attributes: {
                ApproximateReceiveCount: "1",
                SentTimestamp: "1234567890",
                SenderId: "sender123",
                ApproximateFirstReceiveTimestamp: "1234567890",
            },
            messageAttributes: {},
            md5OfBody: "md5123",
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
        });

        it("should update trade status to FAILED", async () => {
            const failedTrade = createFailedTrade();
            const queueMessage = createQueueMessage(failedTrade);

            mockUpdateTrade.mockResolvedValue({
                id: failedTrade.tradeId.toString(),
            });

            const result = await handleFailedTrades([queueMessage]);

            expect(result.successMessageIds).toHaveLength(1);
            expect(mockUpdateTrade).toHaveBeenCalledWith({
                tradeId: failedTrade.tradeId.toString(),
                updateData: { status: TradeStatus.FAILED },
            });
        });

        it("should handle errors gracefully", async () => {
            const failedTrade = createFailedTrade();
            const queueMessage = createQueueMessage(failedTrade);

            mockUpdateTrade.mockRejectedValue(new Error("Update failed"));

            const result = await handleFailedTrades([queueMessage]);

            expect(result.failedMessageIds).toHaveLength(1);
        });
    });
});