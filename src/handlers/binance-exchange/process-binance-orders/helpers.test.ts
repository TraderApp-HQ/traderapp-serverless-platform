import mongoose from "mongoose";
import { OrderSide as BinanceOrderSide } from "binance-api-node";
import { IQueueMessageBody } from "src/config/interfaces";
import { AccountType, TradingPlatform } from "src/config/enums";
import { OrderPlacementType, TradeSide } from "src/services/TradingEngineService/enums";
import { IUserTradeAllocation } from "src/services/TradingEngineService/interfaces";
import { processBinanceTrades } from "./helpers";

// Mock dependencies
jest.mock("src/clients/BinanceClient");
jest.mock("src/clients/SQSClient/helpers");
jest.mock("src/helpers/trade-service-helpers");
jest.mock("src/utils/cypher-helpers");

import { BinanceClient } from "src/clients/BinanceClient";
import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { getTradingEngineServiceSecrets } from "src/helpers/trade-service-helpers";
import { decrypt } from "src/utils/cypher-helpers";

const mockPublishMessageToQueue = publishMessageToQueue as jest.MockedFunction<typeof publishMessageToQueue>;
const mockGetTradingEngineServiceSecrets = getTradingEngineServiceSecrets as jest.MockedFunction<typeof getTradingEngineServiceSecrets>;
const mockDecrypt = decrypt as jest.MockedFunction<typeof decrypt>;

describe("processBinanceTrades", () => {
    const mockSecrets = {
        TRADING_ENGINE_SERVICE_DB_URL: "mongodb://test",
        PROCESS_BINANCE_ORDERS_QUEUE: "https://sqs.us-east-1.amazonaws.com/123/binance-orders",
        PROCESS_USER_TRADES_QUEUE: "https://sqs.us-east-1.amazonaws.com/123/user-trades",
        HANDLE_FAILED_TRADES_QUEUE: "https://sqs.us-east-1.amazonaws.com/123/failed-trades",
        HANDLE_PROCESSED_TRADES_QUEUE: "https://sqs.us-east-1.amazonaws.com/123/processed-trades",
        API_SECRET_KEY_ENCRYPTION_KEY: "test-encryption-key",
        PROCESS_INCOMING_SIGNALS_QUEUE: "https://sqs.us-east-1.amazonaws.com/123/incoming-signals",
    };

    const createMockUserTrade = (overrides: Partial<IUserTradeAllocation> = {}): IUserTradeAllocation => ({
        userId: "user123",
        tradingAccountId: new mongoose.Types.ObjectId(),
        platformName: TradingPlatform.BINANCE,
        apiKey: "encrypted-api-key",
        apiSecret: "encrypted-api-secret",
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
        accountType: AccountType.FUTURES,
        leverage: 50,
        baseQuantity: 0.001,
        ...overrides,
    });

    const createQueueMessage = (userTrade: IUserTradeAllocation): IQueueMessageBody<IUserTradeAllocation> => ({
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

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetTradingEngineServiceSecrets.mockResolvedValue(mockSecrets);
        mockDecrypt.mockImplementation((encrypted) => `decrypted-${encrypted}`);
        mockPublishMessageToQueue.mockResolvedValue(undefined);
    });

    it("should successfully process LONG trade and publish to processed trades queue", async () => {
        const userTrade = createMockUserTrade({ tradeSide: TradeSide.LONG });
        const queueMessage = createQueueMessage(userTrade);

        const mockBinanceOrder = {
            clientOrderId: "binance-order-123",
            orderId: 12345,
            symbol: "BTCUSDT",
            status: "FILLED",
            executedQty: "0.001",
            price: "100000",
            side: BinanceOrderSide.BUY,
            type: "MARKET",
        };

        const mockPlaceTrade = jest.fn().mockResolvedValue(mockBinanceOrder);
        (BinanceClient as jest.Mock).mockImplementation(() => ({
            placeTrade: mockPlaceTrade,
        }));

        const result = await processBinanceTrades([queueMessage]);

        expect(result.successMessageIds).toHaveLength(1);
        expect(result.failedMessageIds).toHaveLength(0);
        expect(mockDecrypt).toHaveBeenCalledWith(userTrade.apiKey, mockSecrets.API_SECRET_KEY_ENCRYPTION_KEY);
        expect(mockDecrypt).toHaveBeenCalledWith(userTrade.apiSecret, mockSecrets.API_SECRET_KEY_ENCRYPTION_KEY);
        expect(mockPlaceTrade).toHaveBeenCalledWith({
            symbol: "BTCUSDT",
            side: BinanceOrderSide.BUY,
            quantity: 0.001,
            type: OrderPlacementType.MARKET,
            leverage: 50,
            price: 100000,
            marginType: "CROSSED",
        });
        expect(mockPublishMessageToQueue).toHaveBeenCalledWith({
            queueUrl: mockSecrets.HANDLE_PROCESSED_TRADES_QUEUE,
            message: expect.stringContaining(userTrade.userId),
        });
    });

    it("should successfully process SHORT trade and map to SELL order", async () => {
        const userTrade = createMockUserTrade({ tradeSide: TradeSide.SHORT });
        const queueMessage = createQueueMessage(userTrade);

        const mockBinanceOrder = {
            clientOrderId: "binance-order-456",
            orderId: 12346,
            symbol: "BTCUSDT",
            status: "FILLED",
            executedQty: "0.001",
            price: "100000",
            side: BinanceOrderSide.SELL,
            type: "MARKET",
        };

        const mockPlaceTrade = jest.fn().mockResolvedValue(mockBinanceOrder);
        (BinanceClient as jest.Mock).mockImplementation(() => ({
            placeTrade: mockPlaceTrade,
        }));

        const result = await processBinanceTrades([queueMessage]);

        expect(result.successMessageIds).toHaveLength(1);
        expect(mockPlaceTrade).toHaveBeenCalledWith(
            expect.objectContaining({
                side: BinanceOrderSide.SELL,
            })
        );
    });

    it("should handle Binance API errors and publish to failed trades queue", async () => {
        const userTrade = createMockUserTrade();
        const queueMessage = createQueueMessage(userTrade);

        const mockPlaceTrade = jest.fn().mockRejectedValue(new Error("Insufficient balance on Binance"));
        (BinanceClient as jest.Mock).mockImplementation(() => ({
            placeTrade: mockPlaceTrade,
        }));

        const result = await processBinanceTrades([queueMessage]);

        expect(result.successMessageIds).toHaveLength(0);
        expect(result.failedMessageIds).toHaveLength(1);
        expect(mockPublishMessageToQueue).toHaveBeenCalledWith({
            queueUrl: mockSecrets.HANDLE_FAILED_TRADES_QUEUE,
            message: expect.stringContaining(userTrade.userId),
        });
    });

    it("should process multiple trades in parallel", async () => {
        const userTrade1 = createMockUserTrade({ userId: "user1" });
        const userTrade2 = createMockUserTrade({ userId: "user2" });
        const queueMessages = [createQueueMessage(userTrade1), createQueueMessage(userTrade2)];

        const mockBinanceOrder = {
            clientOrderId: "binance-order-123",
            orderId: 12345,
            symbol: "BTCUSDT",
            status: "FILLED",
            executedQty: "0.001",
            price: "100000",
            side: BinanceOrderSide.BUY,
            type: "MARKET",
        };

        const mockPlaceTrade = jest.fn().mockResolvedValue(mockBinanceOrder);
        (BinanceClient as jest.Mock).mockImplementation(() => ({
            placeTrade: mockPlaceTrade,
        }));

        const result = await processBinanceTrades(queueMessages);

        expect(result.successMessageIds).toHaveLength(2);
        expect(result.failedMessageIds).toHaveLength(0);
        expect(mockPlaceTrade).toHaveBeenCalledTimes(2);
    });

    it("should handle mixed success and failure in batch processing", async () => {
        const userTrade1 = createMockUserTrade({ userId: "user1" });
        const userTrade2 = createMockUserTrade({ userId: "user2" });
        const queueMessages = [createQueueMessage(userTrade1), createQueueMessage(userTrade2)];

        const mockBinanceOrder = {
            clientOrderId: "binance-order-123",
            orderId: 12345,
            symbol: "BTCUSDT",
            status: "FILLED",
            executedQty: "0.001",
            price: "100000",
            side: BinanceOrderSide.BUY,
            type: "MARKET",
        };

        let callCount = 0;
        const mockPlaceTrade = jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
                return Promise.resolve(mockBinanceOrder);
            } else {
                return Promise.reject(new Error("API error"));
            }
        });

        (BinanceClient as jest.Mock).mockImplementation(() => ({
            placeTrade: mockPlaceTrade,
        }));

        const result = await processBinanceTrades(queueMessages);

        expect(result.successMessageIds).toHaveLength(1);
        expect(result.failedMessageIds).toHaveLength(1);
    });
});