import log from "@dazn/lambda-powertools-logger";
import mongoose from "mongoose";
import {
    BybitFuturesClient,
    BybitOrderResponse,
    BybitOrderSide,
} from "src/clients/BybitClient";
import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { IQueueMessageBody } from "src/config/interfaces";
import { getTradingEngineServiceSecrets } from "src/helpers/trade-service-helpers";
import {
    OrderType,
    TradeSide,
    OrderSide,
    OrderPlacementType,
} from "src/services/TradingEngineService/enums";
import {
    IFailedTrade,
    IProcessedTrade,
    IUserTradeAllocation,
} from "src/services/TradingEngineService/interfaces";
import { decrypt } from "src/utils/cypher-helpers";

export const processBybitTrades = async (
    queueMessages: IQueueMessageBody<IUserTradeAllocation>[]
) => {
    try {
        const successMessageIds: string[] = [];
        const failedMessageIds: string[] = [];

        // Get decryption keys and decrypt api keys
        const tradingEngineServiceSecrets =
            await getTradingEngineServiceSecrets();
        const decryptionKey =
            tradingEngineServiceSecrets.API_SECRET_KEY_ENCRYPTION_KEY;

        // Process all queue messages in parallel
        const bybitTradeProcessingResults = await Promise.allSettled(
            queueMessages.map(async (queueMessage) => {
                const userTrade = queueMessage.body;
                // console.log("##################userTrade", { userTrade });
                try {
                    const apiKey = decrypt(userTrade.apiKey, decryptionKey);
                    const apiSecret = decrypt(
                        userTrade.apiSecret,
                        decryptionKey
                    );

                    // console.log("##################apiKey", { apiKey });
                    // console.log("##################apiSecret", { apiSecret });

                    // Call Binance client
                    const environment =
                        process.env.ENV === "prod" ? "mainnet" : "demo";
                    const bybitClient = new BybitFuturesClient({
                        apiKey,
                        apiSecret,
                        environment,
                    });
                    // console.log("##################after binanceClient creation");

                    // Place trade on bybit
                    const side = (userTrade.tradeSide === TradeSide.LONG
                        ? "Buy"
                        : "Sell") as unknown as BybitOrderSide;
                    // console.log("############### after trade side")
                    let bybitTrade: BybitOrderResponse;

                    if (
                        userTrade.orderPlacementType ===
                        OrderPlacementType.LIMIT
                    ) {
                        bybitTrade = await bybitClient.placeLimitOrder({
                            symbol: `${userTrade.baseAsset}${userTrade.quoteCurrency}`,
                            side,
                            qty: (userTrade.baseQuantity ?? 0).toString(),
                            leverage: userTrade.leverage ?? 50,
                            price: userTrade.entryPrice.toString(),
                        });
                    } else if (
                        userTrade.orderPlacementType ===
                        OrderPlacementType.MARKET
                    ) {
                        bybitTrade = await bybitClient.placeMarketOrder({
                            symbol: `${userTrade.baseAsset}${userTrade.quoteCurrency}`,
                            side,
                            qty: (userTrade.baseQuantity ?? 0).toString(),
                            leverage: userTrade.leverage ?? 50,
                        });
                    } else {
                        throw new Error(
                            `Unsupported order placement type: ${userTrade.orderPlacementType}`
                        );
                    }
                    // console.log("##################placedbybitTrade", { bybitTrade });

                    // Create processed order object
                    const processedOrder: IProcessedTrade = {
                        userId: userTrade.userId,
                        tradeId: new mongoose.Types.ObjectId(userTrade.tradeId),
                        masterTradeId: userTrade.masterTradeId,
                        baseAsset: userTrade.baseAsset,
                        baseAssetLogoUrl: userTrade.baseAssetLogoUrl,
                        baseQuantity: userTrade.baseQuantity ?? 0,
                        orderType: OrderType.ENTRY,
                        orderSide:
                            userTrade.tradeSide === TradeSide.LONG
                                ? OrderSide.BUY
                                : OrderSide.SELL,
                        placementType: userTrade.orderPlacementType,
                        externalOrderId: bybitTrade.orderId,
                        side: userTrade.tradeSide,
                        price: userTrade.entryPrice,
                        total: userTrade.quoteTotal,
                        quoteCurrency: userTrade.quoteCurrency,
                        quoteTotal: userTrade.quoteTotal,
                        entryPrice: userTrade.entryPrice,
                        stopLossPrice: userTrade.stopLossPrice,
                        takeProfitPrice: userTrade.takeProfitPrice,
                        riskAmount: userTrade.riskAmount,
                        tradingAccountId: new mongoose.Types.ObjectId(
                            userTrade.tradingAccountId
                        ),
                        platformName: userTrade.platformName,
                        platformId: 521, // Bybit
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    // console.log("##################processedOrder", { processedOrder });

                    // publish processed order to queue
                    await publishMessageToQueue({
                        queueUrl:
                            tradingEngineServiceSecrets.HANDLE_PROCESSED_TRADES_QUEUE ??
                            "",
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
                        queueUrl:
                            tradingEngineServiceSecrets.HANDLE_FAILED_TRADES_QUEUE ??
                            "",
                        message: JSON.stringify(failedOrder),
                    });

                    // This is a real error, should be marked as failed for retry
                    throw error;
                }
            })
        );

        log.info("Bybit results", { bybitTradeProcessingResults });

        bybitTradeProcessingResults.forEach((result) => {
            if (result.status === "fulfilled") {
                successMessageIds.push(result.value.messageId);
            } else {
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        });

        return { successMessageIds, failedMessageIds };
    } catch (error) {
        console.error("Error processing bybit trades", { error });
        throw error;
    }
};
