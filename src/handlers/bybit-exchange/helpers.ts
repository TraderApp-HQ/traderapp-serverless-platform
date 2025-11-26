import log from "@dazn/lambda-powertools-logger";
import mongoose from "mongoose";
import {
    BybitFuturesClient,
    BybitOrderResponse,
    BybitOrderSide,
} from "src/clients/BybitClient";
import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { TradingPlatform } from "src/config/enums";
import { IQueueMessageBody } from "src/config/interfaces";
import { getTradingEngineServiceSecrets } from "src/helpers/trade-service-helpers";
import { TradingEngineService } from "src/services/TradingEngineService";
import {
    OrderType,
    TradeSide,
    OrderSide,
    OrderPlacementType,
    TradeStatus,
    OrderStatus,
    OrderBatchStatus,
} from "src/services/TradingEngineService/enums";
import {
    ICloseTradeEvent,
    IFailedTrade,
    IOrder,
    IProcessedTrade,
    ITrade,
    IUserTradeAllocation,
} from "src/services/TradingEngineService/interfaces";
import { decrypt } from "src/utils/cypher-helpers";

export const processBybitTrades = async (
    queueMessages: IQueueMessageBody<IUserTradeAllocation>[]
) => {
    const successMessageIds: string[] = [];
    const failedMessageIds: string[] = [];
    try {
        // Get decryption keys and decrypt api keys
        const tradingEngineServiceSecrets =
            await getTradingEngineServiceSecrets();
        const decryptionKey =
            tradingEngineServiceSecrets.API_SECRET_KEY_ENCRYPTION_KEY;

        // Process all queue messages in parallel
        const bybitTradeProcessingResults = await Promise.allSettled(
            queueMessages.map(async (queueMessage) => {
                const userTrade = queueMessage.body;
                try {
                    const apiKey = decrypt(userTrade.apiKey, decryptionKey);
                    const apiSecret = decrypt(
                        userTrade.apiSecret,
                        decryptionKey
                    );

                    // Call Binance client
                    const environment =
                        process.env.ENV === "prod" ? "mainnet" : "demo";
                    const bybitClient = new BybitFuturesClient({
                        apiKey,
                        apiSecret,
                        environment,
                    });

                    // Close open position if it exists
                    const openPosition = await bybitClient.getOpenPosition(
                        `${userTrade.baseAsset}${userTrade.quoteCurrency}`
                    );
                    if (openPosition) {
                        await bybitClient.closePosition({
                            symbol: `${userTrade.baseAsset}${userTrade.quoteCurrency}`,
                            side: openPosition.side === "Buy" ? "Sell" : "Buy",
                            qty: openPosition.size,
                        });
                    }

                    // Place trade on bybit
                    const side = (userTrade.tradeSide === TradeSide.LONG
                        ? "Buy"
                        : "Sell") as unknown as BybitOrderSide;

                    let bybitTrade: BybitOrderResponse;

                    if (
                        userTrade.orderPlacementType ===
                        OrderPlacementType.LIMIT
                    ) {
                        console.log("################## placing limit order ################");
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
                        console.log("################## placing market order ################");
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

                    // Attach messageId to error before throwing
                    const errorWithMessageId = new Error(
                        error instanceof Error ? error.message : String(error)
                    );
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (errorWithMessageId as any).messageId = queueMessage.messageId;
                    throw errorWithMessageId;
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
        return {
            successMessageIds: [],
            failedMessageIds: queueMessages.map((qm) => qm.messageId),
        };
    }
};

export const processBybitOrdersActivation = async (
    queueMessages: IQueueMessageBody<ITrade>[]
) => {
    const successMessageIds: string[] = [];
    const failedMessageIds: string[] = [];
    try {
        const tradingEngineService = new TradingEngineService();

        // Get decryption keys and decrypt api keys
        const tradingEngineServiceSecrets =
            await getTradingEngineServiceSecrets();
        const decryptionKey =
            tradingEngineServiceSecrets.API_SECRET_KEY_ENCRYPTION_KEY;

        // Process all queue messages in parallel
        const bybitOrdersActivationResults = await Promise.allSettled(
            queueMessages.map(async (queueMessage) => {
                const trade = queueMessage.body;
                try {
                    // Get user trading account
                    const userTradingAccount =
                        await tradingEngineService.getUserTradingAccount(
                            trade.userId,
                            TradingPlatform.BYBIT
                        );

                    // Decrypt api keys
                    const apiKey = decrypt(
                        userTradingAccount.apiKey ?? "",
                        decryptionKey
                    );
                    const apiSecret = decrypt(
                        userTradingAccount.apiSecret ?? "",
                        decryptionKey
                    );

                    // Create Bybit client
                    const bybitClient = new BybitFuturesClient({
                        apiKey,
                        apiSecret,
                        environment:
                            process.env.ENV === "prod" ? "mainnet" : "demo",
                    });

                    // Get Bybit open position for pair
                    // TODO: Get open position by getting the order by external order id
                    const openPosition = await bybitClient.getOpenPosition(
                        trade.pair
                    );
                    if (openPosition) {
                        // Update trade status to ACTIVE
                        await tradingEngineService.updateTrade({
                            tradeId: (
                                trade._id as mongoose.Types.ObjectId
                            ).toString(),
                            updateData: {
                                status: TradeStatus.ACTIVE,
                                entryPrice: Number(openPosition?.avgPrice ?? 0),
                            },
                        });

                        // Get order by trade id
                        const order =
                            await tradingEngineService.getOrderByTradeId(
                                (
                                    trade._id as mongoose.Types.ObjectId
                                ).toString()
                            );

                        if (order) {
                            // Update order status to FILLED
                            await Promise.all([
                                tradingEngineService.updateOrder(
                                    order._id as string,
                                    {
                                        status:
                                            Number(openPosition?.size ?? 0) >=
                                                order.baseQuantity
                                                ? OrderStatus.FILLED
                                                : OrderStatus.PARTIALLY_FILLED,
                                    }
                                ),
                                tradingEngineService.updateOrderBatch(
                                    order.orderBatchId as unknown as string,
                                    {
                                        status:
                                            Number(openPosition?.size ?? 0) >=
                                                order.baseQuantity
                                                ? OrderBatchStatus.FILLED
                                                : OrderBatchStatus.PARTIALLY_FILLED,
                                    }
                                ),
                            ]);
                        }

                        // Publish to stop loss and take profit orders queues
                        await Promise.all([
                            publishMessageToQueue({
                                queueUrl:
                                    tradingEngineServiceSecrets.PROCESS_BYBIT_STOP_LOSS_ORDERS_QUEUE ??
                                    "",
                                message: JSON.stringify(trade),
                            }),
                            publishMessageToQueue({
                                queueUrl:
                                    tradingEngineServiceSecrets.PROCESS_BYBIT_TAKE_PROFIT_ORDERS_QUEUE ??
                                    "",
                                message: JSON.stringify(trade),
                            }),
                        ]);
                    }

                    // return success message id
                    return { messageId: queueMessage.messageId, trade };
                } catch (error) {
                    console.error("Error updating trade status to ACTIVE", {
                        error,
                    });
                    // Attach messageId to error before throwing
                    const errorWithMessageId = new Error(
                        error instanceof Error ? error.message : String(error)
                    );
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (errorWithMessageId as any).messageId = queueMessage.messageId;
                    throw errorWithMessageId;
                }
            })
        );

        bybitOrdersActivationResults.forEach((result) => {
            if (result.status === "fulfilled") {
                successMessageIds.push(result.value.messageId);
            } else {
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        });

        return { successMessageIds, failedMessageIds };
    } catch (error) {
        console.error("Error processing bybit orders activation", { error });
        return {
            successMessageIds: [],
            failedMessageIds: queueMessages.map((qm) => qm.messageId),
        };
    }
};

export const processBybitStopLossOrders = async (
    queueMessages: IQueueMessageBody<ITrade>[]
) => {
    const successMessageIds: string[] = [];
    const failedMessageIds: string[] = [];

    const tradingEngineService = new TradingEngineService();

    // Get decryption keys and decrypt api keys
    const tradingEngineServiceSecrets = await getTradingEngineServiceSecrets();
    const decryptionKey =
        tradingEngineServiceSecrets.API_SECRET_KEY_ENCRYPTION_KEY;

    try {
        const bybitStopLossOrdersResults = await Promise.allSettled(
            queueMessages.map(async (queueMessage) => {
                const trade = queueMessage.body;
                try {
                    // Get user trading account
                    const userTradingAccount =
                        await tradingEngineService.getUserTradingAccount(
                            trade.userId,
                            TradingPlatform.BYBIT
                        );

                    // Decrypt api keys
                    const apiKey = decrypt(
                        userTradingAccount.apiKey ?? "",
                        decryptionKey
                    );
                    const apiSecret = decrypt(
                        userTradingAccount.apiSecret ?? "",
                        decryptionKey
                    );

                    // Create Bybit client
                    const bybitClient = new BybitFuturesClient({
                        apiKey,
                        apiSecret,
                        environment:
                            process.env.ENV === "prod" ? "mainnet" : "demo",
                    });

                    // Get Bybit open position for pair
                    const openPosition = await bybitClient.getOpenPosition(
                        trade.pair
                    );
                    if (openPosition) {
                        // Set stop loss and take profit for position
                        await bybitClient.setPositionStopLossTakeProfit({
                            symbol: trade.pair,
                            stopLoss: trade.stopLossPrice.toString(),
                        });
                    }

                    // Update trade stop loss price
                    await tradingEngineService.updateTrade({
                        tradeId: (trade._id as mongoose.Types.ObjectId).toString(),
                        updateData: { stopLossPrice: trade.stopLossPrice },
                    });

                    // return success message id
                    return { messageId: queueMessage.messageId, trade };
                } catch (error) {
                    console.error("Error processing bybit stop loss order", {
                        error,
                    });
                    // Attach messageId to error before throwing
                    const errorWithMessageId = new Error(
                        error instanceof Error ? error.message : String(error)
                    );
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (errorWithMessageId as any).messageId = queueMessage.messageId;
                    throw errorWithMessageId;
                }
            })
        );
        bybitStopLossOrdersResults.forEach((result) => {
            if (result.status === "fulfilled") {
                successMessageIds.push(result.value.messageId);
            } else {
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        });

        return { successMessageIds, failedMessageIds };
    } catch (error) {
        console.error("Error processing bybit stop loss orders", { error });
        return {
            successMessageIds: [],
            failedMessageIds: queueMessages.map((qm) => qm.messageId),
        };
    }
};

export const processBybitTakeProfitOrders = async (
    queueMessages: IQueueMessageBody<ITrade>[]
) => {
    const successMessageIds: string[] = [];
    const failedMessageIds: string[] = [];

    const tradingEngineService = new TradingEngineService();

    // Get decryption keys and decrypt api keys
    const tradingEngineServiceSecrets = await getTradingEngineServiceSecrets();
    const decryptionKey =
        tradingEngineServiceSecrets.API_SECRET_KEY_ENCRYPTION_KEY;

    try {
        const bybitTakeProfitOrdersResults = await Promise.allSettled(
            queueMessages.map(async (queueMessage) => {
                const trade = queueMessage.body;
                try {
                    // Get user trading account
                    const userTradingAccount =
                        await tradingEngineService.getUserTradingAccount(
                            trade.userId,
                            TradingPlatform.BYBIT
                        );

                    // Decrypt api keys
                    const apiKey = decrypt(
                        userTradingAccount.apiKey ?? "",
                        decryptionKey
                    );
                    const apiSecret = decrypt(
                        userTradingAccount.apiSecret ?? "",
                        decryptionKey
                    );

                    // Create Bybit client
                    const bybitClient = new BybitFuturesClient({
                        apiKey,
                        apiSecret,
                        environment:
                            process.env.ENV === "prod" ? "mainnet" : "demo",
                    });

                    // Get Bybit open position for pair
                    const openPosition = await bybitClient.getOpenPosition(
                        trade.pair
                    );
                    if (openPosition) {
                        // Set take profit for position
                        await bybitClient.setPositionStopLossTakeProfit({
                            symbol: trade.pair,
                            takeProfit: trade.takeProfitPrice?.toString() ?? "0",
                        });
                    }

                    if (trade.takeProfitPrice) {
                        // Update trade take profit price
                        await tradingEngineService.updateTrade({
                            tradeId: (trade._id as mongoose.Types.ObjectId).toString(),
                            updateData: { takeProfitPrice: trade.takeProfitPrice },
                        });
                    }
                    else {
                        // Update trade take profit price
                        await tradingEngineService.unsetTradeTakeProfit({
                            tradeId: (trade._id as mongoose.Types.ObjectId).toString(),
                        });
                    }

                    // return success message id
                    return { messageId: queueMessage.messageId, trade };
                } catch (error) {
                    console.error("Error processing bybit take profit order", {
                        error,
                    });
                    // Attach messageId to error before throwing
                    const errorWithMessageId = new Error(
                        error instanceof Error ? error.message : String(error)
                    );
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (errorWithMessageId as any).messageId = queueMessage.messageId;
                    throw errorWithMessageId;
                }
            })
        );
        bybitTakeProfitOrdersResults.forEach((result) => {
            if (result.status === "fulfilled") {
                successMessageIds.push(result.value.messageId);
            } else {
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        });

        return { successMessageIds, failedMessageIds };
    } catch (error) {
        console.error("Error processing bybit take profit orders", { error });
        return {
            successMessageIds: [],
            failedMessageIds: queueMessages.map((qm) => qm.messageId),
        };
    }
};

export const processBybitCloseTrades = async (
    queueMessages: IQueueMessageBody<ICloseTradeEvent>[]
) => {
    const successMessageIds: string[] = [];
    const failedMessageIds: string[] = [];

    const tradingEngineService = new TradingEngineService();

    // Get decryption keys and decrypt api keys
    const tradingEngineServiceSecrets = await getTradingEngineServiceSecrets();
    const decryptionKey =
        tradingEngineServiceSecrets.API_SECRET_KEY_ENCRYPTION_KEY;

    try {
        const processBybitCloseTradesResults = await Promise.allSettled(
            queueMessages.map(async (queueMessage) => {
                const closeTradeEvent = queueMessage.body;
                try {
                    // Get user trading account
                    const userTradingAccount =
                        await tradingEngineService.getUserTradingAccount(
                            closeTradeEvent.trade.userId,
                            TradingPlatform.BYBIT
                        );

                    // Decrypt api keys
                    const apiKey = decrypt(
                        userTradingAccount.apiKey ?? "",
                        decryptionKey
                    );
                    const apiSecret = decrypt(
                        userTradingAccount.apiSecret ?? "",
                        decryptionKey
                    );

                    // Create Bybit client
                    const bybitClient = new BybitFuturesClient({
                        apiKey,
                        apiSecret,
                        environment:
                            process.env.ENV === "prod" ? "mainnet" : "demo",
                    });

                    // Get Bybit open position for pair
                    const openPosition = await bybitClient.getOpenPosition(
                        closeTradeEvent.trade.pair
                    );


                    // Close position
                    if (openPosition) {
                        // Calculate quantity to close
                        const qtyToClose = Number(openPosition.size) * (closeTradeEvent.qtyPercentToClose / 100);
                        const qtyRemaining = Number(openPosition.size) - qtyToClose;

                        await bybitClient.closePosition({
                            symbol: closeTradeEvent.trade.pair,
                            side: openPosition.side as BybitOrderSide,
                            qty: qtyToClose.toString(),
                        });

                        if (closeTradeEvent.qtyPercentToClose < 100) {
                            // Calculate updated quote total, estimated profit and estimated loss
                            const quoteTotalToClose = closeTradeEvent.trade.quoteTotal * (closeTradeEvent.qtyPercentToClose / 100);
                            const quoteToalRemaining = closeTradeEvent.trade.quoteTotal - quoteTotalToClose;

                            const estimatedProfitToClose = closeTradeEvent.trade.estimatedProfit * (closeTradeEvent.qtyPercentToClose / 100);
                            const estimatedProfitRemaining = closeTradeEvent.trade.estimatedProfit - estimatedProfitToClose;

                            const estimatedLossToClose = closeTradeEvent.trade.estimatedLoss * (closeTradeEvent.qtyPercentToClose / 100);
                            const estimatedLossRemaining = closeTradeEvent.trade.estimatedLoss - estimatedLossToClose;

                            // Update user trade
                            await tradingEngineService.updateTrade({
                                tradeId: (
                                    closeTradeEvent.trade._id as mongoose.Types.ObjectId
                                ).toString(),
                                updateData: {
                                    baseQuantity: qtyRemaining,
                                    quoteTotal: quoteToalRemaining,
                                    estimatedProfit: estimatedProfitRemaining,
                                    estimatedLoss: estimatedLossRemaining,
                                    status: TradeStatus.BREAK_EVEN
                                },
                            });
                        }
                    }

                    if (closeTradeEvent.qtyPercentToClose >= 100) {
                        // Update user trade status to CLOSED
                        await tradingEngineService.updateTrade({
                            tradeId: (
                                closeTradeEvent.trade._id as mongoose.Types.ObjectId
                            ).toString(),
                            updateData: { status: TradeStatus.CLOSED },
                        });
                    }


                    // TODO: publish to trade settled queue for profit and loss calculation

                    // TODO: publish to notifications queue

                    // return success message id
                    return { messageId: queueMessage.messageId, closeTradeEvent };
                } catch (error) {
                    console.error("Error closing bybit trade", { error });
                    // Attach messageId to error before throwing
                    const errorWithMessageId = new Error(
                        error instanceof Error ? error.message : String(error)
                    );
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (errorWithMessageId as any).messageId = queueMessage.messageId;
                    throw errorWithMessageId;
                }
            })
        );

        processBybitCloseTradesResults.forEach((result) => {
            if (result.status === "fulfilled") {
                successMessageIds.push(result.value.messageId);
            } else {
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        });

        return { successMessageIds, failedMessageIds };
    } catch (error) {
        console.error("Error closing bybit trades", { error });
        return {
            successMessageIds: [],
            failedMessageIds: queueMessages.map((qm) => qm.messageId),
        };
    }
};

export const processBybitCancelOrders = async (
    queueMessages: IQueueMessageBody<IOrder>[]
) => {
    const successMessageIds: string[] = [];
    const failedMessageIds: string[] = [];

    const tradingEngineService = new TradingEngineService();

    // Get decryption keys and decrypt api keys
    const tradingEngineServiceSecrets = await getTradingEngineServiceSecrets();
    const decryptionKey =
        tradingEngineServiceSecrets.API_SECRET_KEY_ENCRYPTION_KEY;

    try {
        const processBybitCancelOrdersResults = await Promise.allSettled(
            queueMessages.map(async (queueMessage) => {
                const order = queueMessage.body;
                try {
                    // Get user trading account
                    const userTradingAccount =
                        await tradingEngineService.getUserTradingAccount(
                            order.userId,
                            TradingPlatform.BYBIT
                        );

                    // Decrypt api keys
                    const apiKey = decrypt(
                        userTradingAccount.apiKey ?? "",
                        decryptionKey
                    );
                    const apiSecret = decrypt(
                        userTradingAccount.apiSecret ?? "",
                        decryptionKey
                    );

                    // Create Bybit client
                    const bybitClient = new BybitFuturesClient({
                        apiKey,
                        apiSecret,
                        environment:
                            process.env.ENV === "prod" ? "mainnet" : "demo",
                    });

                    // Get Bybit order by external order id
                    const openOrder = await bybitClient.getOrderById({
                        symbol: `${order.baseAsset}${order.quoteCurrency}`,
                        orderId: order.externalOrderId
                    });

                    if (openOrder && (openOrder.orderStatus === "New" || openOrder.orderStatus === "PartiallyFilled" || openOrder.orderStatus === "Untriggered")) {
                        await bybitClient.cancelOrder({
                            symbol: `${order.baseAsset}${order.quoteCurrency}`,
                            orderId: order.externalOrderId
                        });
                    }

                    const tradeId = typeof order.tradeId === 'string' ? order.tradeId : order.tradeId.toString();

                    await Promise.all([
                        // Update order status to CANCELLED
                        tradingEngineService.updateOrder(
                            (order._id as mongoose.Types.ObjectId).toString(),
                            {
                                status: OrderStatus.CANCELED,
                            }
                        ),
                        // Update order batch status to CANCELLED
                        tradingEngineService.updateOrderBatch(
                            (order.orderBatchId as mongoose.Types.ObjectId).toString(),
                            {
                                status: OrderBatchStatus.CANCELED,
                            }
                        ),
                        // Update user trade status to CLOSED
                        tradingEngineService.updateTrade({
                            tradeId,
                            updateData: { status: TradeStatus.CANCELED },
                        }),
                    ]);

                    // TODO: publish to notifications queue

                    // return success message id
                    return { messageId: queueMessage.messageId, order };
                } catch (error) {
                    console.error("Error closing bybit trade", { error });
                    // Attach messageId to error before throwing
                    const errorWithMessageId = new Error(
                        error instanceof Error ? error.message : String(error)
                    );
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (errorWithMessageId as any).messageId = queueMessage.messageId;
                    throw errorWithMessageId;
                }
            })
        );

        processBybitCancelOrdersResults.forEach((result) => {
            if (result.status === "fulfilled") {
                successMessageIds.push(result.value.messageId);
            } else {
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        });

        return { successMessageIds, failedMessageIds };
    } catch (error) {
        console.error("Error closing bybit trades", { error });
        return {
            successMessageIds: [],
            failedMessageIds: queueMessages.map((qm) => qm.messageId),
        };
    }
};
