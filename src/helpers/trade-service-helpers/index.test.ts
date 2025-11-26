/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import { TradingPlatform, AccountType, Currency } from "src/config/enums";
import { IQueueMessageBody } from "src/config/interfaces";
import { ITradingEngineServiceSecrets } from "src/config/secrets/interfaces";
import {
    OrderPlacementType,
    OrderSide,
    OrderType,
    TradeSide,
    TradeStatus,
    InvoiceStatus,
    InvoiceType,
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
jest.mock("src/services/UsersService");

import UsersService from "src/services/UsersService";

const mockGetUserById = UsersService.getUserById as jest.MockedFunction<
    typeof UsersService.getUserById
>;

// Mock TradingEngineService with a manual mock that can be configured per test
const mockUpdateTrade = jest.fn();
const mockCreateOrderBatch = jest.fn();
const mockCreateOrder = jest.fn();
const mockCalculatePnL = jest.fn();
const mockUpdateMasterTradeData = jest.fn();

jest.mock("src/services/TradingEngineService", () => {
    return {
        TradingEngineService: jest.fn().mockImplementation(() => ({
            updateTrade: mockUpdateTrade,
            createOrderBatch: mockCreateOrderBatch,
            createOrder: mockCreateOrder,
            calculatePnL: mockCalculatePnL,
            updateMasterTradeData: mockUpdateMasterTradeData,
        })),
    };
});

import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { WalletsService } from "src/services/WalletsService";
import { getSecrets } from "src/config/secrets/helpers";
import { WalletType } from "src/types/wallets-service";

const mockPublishMessageToQueue = publishMessageToQueue as jest.MockedFunction<
    typeof publishMessageToQueue
>;
const mockGetSecrets = getSecrets as jest.MockedFunction<typeof getSecrets>;

describe("Trade Service Helpers", () => {
    const mockSecrets: ITradingEngineServiceSecrets = {
        TRADING_ENGINE_SERVICE_DB_URL: "mongodb://test",
        PROCESS_BINANCE_ORDERS_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/binance-orders",
        PROCESS_BYBIT_ORDERS_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/bybit-orders",
        PROCESS_USER_TRADES_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/user-trades",
        HANDLE_FAILED_TRADES_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/failed-trades",
        HANDLE_PROCESSED_TRADES_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/processed-trades",
        API_SECRET_KEY_ENCRYPTION_KEY: "test-key",
        PROCESS_INCOMING_SIGNALS_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/incoming-signals",
        PROCESS_BYBIT_ORDERS_ACTIVATION_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/bybit-orders-activation",
        PROCESS_BYBIT_STOP_LOSS_ORDERS_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/bybit-stop-loss-orders",
        PROCESS_BYBIT_TAKE_PROFIT_ORDERS_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/bybit-take-profit-orders",
        PROCESS_BYBIT_CLOSE_TRADES_QUEUE:
            "https://sqs.us-east-1.amazonaws.com/123/close-bybit-trades",
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

        // Mock getSecrets to return common secrets with email queue
        mockGetSecrets.mockResolvedValue({
            ...mockSecrets,
            EMAIL_NOTIFICATIONS_QUEUE:
                "https://sqs.us-east-1.amazonaws.com/123/notifications",
        });

        // Mock getUserById
        mockGetUserById.mockResolvedValue({
            _id: "user123",
            firstName: "John",
            email: "john@example.com",
            // Add other required user fields as needed
        } as any);
    });

    describe("mapUserConnectedTradingPlatformToQueueUrl", () => {
        it("should map Binance platform to correct queue URL", async () => {
            const result = await mapUserConnectedTradingPlatformToQueueUrl({
                platformName: TradingPlatform.BINANCE,
                tradingEngineServiceSecrets: mockSecrets,
            });

            const resultBybit = await mapUserConnectedTradingPlatformToQueueUrl(
                {
                    platformName: TradingPlatform.BYBIT,
                    tradingEngineServiceSecrets: mockSecrets,
                }
            );

            expect(result).toBe(mockSecrets.PROCESS_BINANCE_ORDERS_QUEUE);
            expect(resultBybit).toBe(mockSecrets.PROCESS_BYBIT_ORDERS_QUEUE);
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
            baseAssetLogoUrl: "https://example.com/logo.png",
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
            mockPublishMessageToQueue.mockResolvedValue(undefined);

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
                getUserWallet: jest.fn(() =>
                    Promise.reject(new Error("Database error"))
                ),
                getInvoices: jest.fn().mockResolvedValue([]),
                lockUserBalance: jest.fn(),
                createInvoice: jest.fn(),
            };

            (WalletsService as jest.Mock).mockImplementation(
                () => mockWalletsService
            );

            const result = await processUserTrades([queueMessage]);

            expect(result.failedMessageIds).toHaveLength(1);
            expect(result.successMessageIds).toHaveLength(0);
        });
    });

    describe("handleProcessedTrades", () => {
        const createProcessedTrade = (): IProcessedTrade => ({
            userId: "user123",
            tradeId: new mongoose.Types.ObjectId(),
            masterTradeId: "68f86e5e738aa71abf5deebb",
            baseAsset: "BTC",
            baseAssetLogoUrl: "https://example.com/logo.png",
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
            entryPrice: 100000,
            stopLossPrice: 95000,
            takeProfitPrice: 110000,
            riskAmount: 10,
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

        beforeEach(() => {
            // Mock getSecrets to return common secrets with email queue
            mockGetSecrets.mockResolvedValue({
                ...mockSecrets,
                EMAIL_NOTIFICATIONS_QUEUE:
                    "https://sqs.us-east-1.amazonaws.com/123/notifications",
            });

            // Mock getUserById
            mockGetUserById.mockResolvedValue({
                _id: "user123",
                firstName: "John",
                email: "john@example.com",
                // Add other required user fields as needed
            } as any);
        });

        it("should update trade status, create order batch and order, and update master trade", async () => {
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
            mockUpdateMasterTradeData.mockResolvedValue(undefined);

            const result = await handleProcessedTrades([queueMessage]);

            expect(result.successMessageIds).toHaveLength(1);
            expect(mockUpdateTrade).toHaveBeenCalledWith({
                tradeId: processedTrade.tradeId.toString(),
                updateData: { status: TradeStatus.PROCESSED },
            });
            expect(mockCreateOrderBatch).toHaveBeenCalled();
            expect(mockCreateOrder).toHaveBeenCalled();

            // Verify master trade was updated with incremented values
            expect(mockUpdateMasterTradeData).toHaveBeenCalledWith({
                masterTradeId: processedTrade.masterTradeId,
                baseQuantity: processedTrade.baseQuantity,
                quoteTotal: processedTrade.quoteTotal,
                estimatedProfit: expect.any(Number), // The calculated profit
                estimatedLoss: processedTrade.riskAmount,
            });

            // Verify notification was sent
            expect(mockPublishMessageToQueue).toHaveBeenCalledWith(
                expect.objectContaining({
                    queueUrl:
                        "https://sqs.us-east-1.amazonaws.com/123/notifications",
                    message: expect.stringContaining("Trade Initiated"),
                })
            );
            expect(mockGetUserById).toHaveBeenCalledWith("user123");
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

        // Add mocks for WalletsService methods
        const mockGetInvoices = jest.fn();
        const mockUnlockUserBalance = jest.fn();
        const mockUpdateInvoice = jest.fn();

        beforeEach(() => {
            // Reset WalletsService mocks
            mockGetInvoices.mockReset();
            mockUnlockUserBalance.mockReset();
            mockUpdateInvoice.mockReset();

            // Setup default mock implementations
            (WalletsService as jest.Mock).mockImplementation(() => ({
                getInvoices: mockGetInvoices,
                unlockUserBalance: mockUnlockUserBalance,
                updateInvoice: mockUpdateInvoice,
            }));
        });

        it("should update trade status to FAILED, unlock balance, and archive invoices", async () => {
            const failedTrade = createFailedTrade();
            const queueMessage = createQueueMessage(failedTrade);

            // Mock invoices with locked amounts
            const mockInvoices = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    userId: failedTrade.userId,
                    tradeId: failedTrade.tradeId.toString(),
                    invoiceType: InvoiceType.TRADING_FEE,
                    amountPaid: 10,
                    amountDue: 10,
                    status: InvoiceStatus.LOCKED,
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    userId: failedTrade.userId,
                    tradeId: failedTrade.tradeId.toString(),
                    invoiceType: InvoiceType.PROFIT_SHARE,
                    amountPaid: 30,
                    amountDue: 50,
                    status: InvoiceStatus.LOCKED,
                },
            ];

            mockGetInvoices.mockResolvedValue(mockInvoices);
            mockUnlockUserBalance.mockResolvedValue(undefined);
            mockUpdateInvoice.mockResolvedValue({
                success: true,
                invoice: { status: InvoiceStatus.ARCHIVED },
            });
            mockUpdateTrade.mockResolvedValue({
                id: failedTrade.tradeId.toString(),
            });

            const result = await handleFailedTrades([queueMessage]);

            expect(result.successMessageIds).toHaveLength(1);

            // Verify trade status was updated to FAILED
            expect(mockUpdateTrade).toHaveBeenCalledWith({
                tradeId: failedTrade.tradeId.toString(),
                updateData: { status: TradeStatus.FAILED },
            });

            // Verify invoices were fetched
            expect(mockGetInvoices).toHaveBeenCalledWith({
                tradeId: failedTrade.tradeId.toString(),
                invoiceTypes: [
                    InvoiceType.TRADING_FEE,
                    InvoiceType.PROFIT_SHARE,
                ],
            });

            // Verify balance was unlocked with correct total amount (10 + 30 = 40)
            expect(mockUnlockUserBalance).toHaveBeenCalledWith({
                userId: failedTrade.userId,
                amount: 40,
                currency: Currency.USDT,
                walletType: WalletType.MAIN,
            });

            // Verify all invoices were archived
            expect(mockUpdateInvoice).toHaveBeenCalledTimes(2);
            mockInvoices.forEach((invoice) => {
                expect(mockUpdateInvoice).toHaveBeenCalledWith({
                    invoiceId: invoice._id.toString(),
                    status: InvoiceStatus.ARCHIVED,
                });
            });
        });

        it("should not unlock balance when no amount was paid", async () => {
            const failedTrade = createFailedTrade();
            const queueMessage = createQueueMessage(failedTrade);

            // Mock invoices with no locked amounts (amountPaid = 0)
            const mockInvoices = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    userId: failedTrade.userId,
                    tradeId: failedTrade.tradeId.toString(),
                    invoiceType: InvoiceType.TRADING_FEE,
                    amountPaid: 0,
                    amountDue: 10,
                    status: InvoiceStatus.PENDING,
                },
                {
                    _id: new mongoose.Types.ObjectId(),
                    userId: failedTrade.userId,
                    tradeId: failedTrade.tradeId.toString(),
                    invoiceType: InvoiceType.PROFIT_SHARE,
                    amountPaid: 0,
                    amountDue: 50,
                    status: InvoiceStatus.PENDING,
                },
            ];

            mockGetInvoices.mockResolvedValue(mockInvoices);
            mockUpdateInvoice.mockResolvedValue({
                success: true,
                invoice: { status: InvoiceStatus.ARCHIVED },
            });
            mockUpdateTrade.mockResolvedValue({
                id: failedTrade.tradeId.toString(),
            });

            const result = await handleFailedTrades([queueMessage]);

            expect(result.successMessageIds).toHaveLength(1);

            // Verify balance unlock was NOT called (total is 0)
            expect(mockUnlockUserBalance).not.toHaveBeenCalled();

            // Verify invoices were still archived
            expect(mockUpdateInvoice).toHaveBeenCalledTimes(2);
        });

        it("should handle case with no invoices", async () => {
            const failedTrade = createFailedTrade();
            const queueMessage = createQueueMessage(failedTrade);

            mockGetInvoices.mockResolvedValue([]); // No invoices
            mockUpdateTrade.mockResolvedValue({
                id: failedTrade.tradeId.toString(),
            });

            const result = await handleFailedTrades([queueMessage]);

            expect(result.successMessageIds).toHaveLength(1);

            // Verify balance unlock was NOT called
            expect(mockUnlockUserBalance).not.toHaveBeenCalled();

            // Verify invoice archive was NOT called
            expect(mockUpdateInvoice).not.toHaveBeenCalled();
        });

        it("should handle errors gracefully", async () => {
            const failedTrade = createFailedTrade();
            const queueMessage = createQueueMessage(failedTrade);

            mockUpdateTrade.mockRejectedValue(new Error("Update failed"));

            const result = await handleFailedTrades([queueMessage]);

            expect(result.failedMessageIds).toHaveLength(1);
        });

        it("should handle unlock balance errors gracefully", async () => {
            const failedTrade = createFailedTrade();
            const queueMessage = createQueueMessage(failedTrade);

            const mockInvoices = [
                {
                    _id: new mongoose.Types.ObjectId(),
                    userId: failedTrade.userId,
                    tradeId: failedTrade.tradeId.toString(),
                    invoiceType: InvoiceType.TRADING_FEE,
                    amountPaid: 10,
                    amountDue: 10,
                    status: InvoiceStatus.LOCKED,
                },
            ];

            mockGetInvoices.mockResolvedValue(mockInvoices);
            mockUnlockUserBalance.mockRejectedValue(new Error("Unlock failed"));
            mockUpdateTrade.mockResolvedValue({
                id: failedTrade.tradeId.toString(),
            });

            const result = await handleFailedTrades([queueMessage]);

            // Should still fail the message due to unlock error
            expect(result.failedMessageIds).toHaveLength(1);
        });
    });
});
