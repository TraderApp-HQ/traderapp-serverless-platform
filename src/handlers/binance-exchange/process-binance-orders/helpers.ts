import log from "@dazn/lambda-powertools-logger";
import { OrderSide as BinanceOrderSide } from "binance-api-node";
import mongoose from "mongoose";
import { BinanceClient } from "src/clients/BinanceClient";
import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { IQueueMessageBody } from "src/config/interfaces";
import { getTradingEngineServiceSecrets } from "src/helpers/trade-service-helpers";
import { OrderType, TradeSide, OrderSide } from "src/services/TradingEngineService/enums";
import { IFailedTrade, IProcessedTrade, IUserTradeAllocation } from "src/services/TradingEngineService/interfaces";
import { decrypt } from "src/utils/cypher-helpers";

export const processBinanceTrades = async (queueMessages: IQueueMessageBody<IUserTradeAllocation>[]) => {
    try {
        const successMessageIds: string[] = [];
        const failedMessageIds: string[] = [];

        // Get decryption keys and decrypt api keys
        const tradingEngineServiceSecrets = await getTradingEngineServiceSecrets();
        const decryptionKey = tradingEngineServiceSecrets.API_SECRET_KEY_ENCRYPTION_KEY;

        // Process all queue messages in parallel
        const binanceTradeProcessingResults = await Promise.allSettled(
            queueMessages.map(async (queueMessage) => {
                const userTrade = queueMessage.body;
                try {
                    const apiKey = decrypt(userTrade.apiKey, decryptionKey);
                    const apiSecret = decrypt(userTrade.apiSecret, decryptionKey);

                    // Call Binance client
                    const binanceClient = new BinanceClient(apiKey, apiSecret);

                    // Place trade on binance
                    const side = (userTrade.tradeSide === TradeSide.LONG ? BinanceOrderSide.BUY : BinanceOrderSide.SELL) as BinanceOrderSide;
                    const binanceTrade = await binanceClient.placeTrade({
                        symbol: `${userTrade.baseAsset}${userTrade.quoteCurrency}`,
                        side,
                        quantity: userTrade.baseQuantity ?? 0,
                        type: userTrade.orderPlacementType,
                        leverage: userTrade.leverage ?? 50,
                        price: userTrade.entryPrice,
                        marginType: "CROSSED",
                    });

                    // Create processed order object
                    const processedOrder: IProcessedTrade = {
                        userId: userTrade.userId,
                        tradeId: new mongoose.Types.ObjectId(userTrade.tradeId),
                        baseAsset: userTrade.baseAsset,
                        baseQuantity: userTrade.baseQuantity ?? 0,
                        orderType: OrderType.ENTRY,
                        orderSide: userTrade.tradeSide === TradeSide.LONG ? OrderSide.BUY : OrderSide.SELL,
                        placementType: userTrade.orderPlacementType,
                        externalOrderId: binanceTrade.clientOrderId,
                        side: userTrade.tradeSide,
                        price: userTrade.entryPrice,
                        total: userTrade.quoteTotal,
                        quoteCurrency: userTrade.quoteCurrency,
                        quoteTotal: userTrade.quoteTotal,
                        tradingAccountId: new mongoose.Types.ObjectId(userTrade.tradingAccountId),
                        platformName: userTrade.platformName,
                        platformId: 270, // Binance
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };

                    // publish processed order to queue
                    await publishMessageToQueue({
                        queueUrl: tradingEngineServiceSecrets.HANDLE_PROCESSED_TRADES_QUEUE ?? "",
                        message: JSON.stringify(processedOrder),
                    });

                    // Return processed order
                    return {
                        messageId: queueMessage.messageId,
                        userTrade,
                        isSuccess: true,
                    };
                } catch (error) {
                    console.error("Error processing user trade", {
                        error,
                        userId: queueMessage.body.userId,
                        masterTradeId: queueMessage.body.masterTradeId,
                    });

                    // Create failed order object
                    const failedOrder: IFailedTrade = {
                        userId: userTrade.userId,
                        tradeId: new mongoose.Types.ObjectId(userTrade.tradeId),
                    };

                    // publish failed order to queue
                    await publishMessageToQueue({
                        queueUrl: tradingEngineServiceSecrets.HANDLE_FAILED_TRADES_QUEUE ?? "",
                        message: JSON.stringify(failedOrder),
                    });

                    // This is a real error, should be marked as failed for retry
                    throw error;
                }
            })
        );

        log.info('Binance results', { binanceTradeProcessingResults })

        binanceTradeProcessingResults.forEach((result) => {
            if (result.status === 'fulfilled') {
                successMessageIds.push(result.value.messageId);
            } else {
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        })

        return { successMessageIds, failedMessageIds };
    } catch (error) {
        console.error("Error processing binance trades", { error });
        throw error;
    }
}