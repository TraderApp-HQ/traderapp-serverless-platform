import log from "@dazn/lambda-powertools-logger";
import mongoose from "mongoose";
import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { Currency, TradingPlatform } from "src/config/enums";
import { IQueueMessageBody } from "src/config/interfaces";
import { SecretLocation } from "src/config/secrets/enums";
import { getSecrets } from "src/config/secrets/helpers";
import { ITradingEngineServiceSecrets } from "src/config/secrets/interfaces";
import { TradingEngineService } from "src/services/TradingEngineService";
import {
    OrderBatchStatus,
    OrderStatus,
    TradeStatus,
} from "src/services/TradingEngineService/enums";
import {
    IFailedTrade,
    IProcessedTrade,
    IUserTradeAllocation,
} from "src/services/TradingEngineService/interfaces";
import { WalletsService } from "src/services/WalletsService";
import { IUserWallet, WalletType } from "src/types/wallets-service";

export const getTradingEngineServiceSecrets = async () => {
    const env = process.env.ENV ?? "";
    return getSecrets<ITradingEngineServiceSecrets>(
        `${SecretLocation.tradingEngineServiceSecrets}/${env}`
    );
};
export const mapUserConnectedTradingPlatformToQueueUrl = async ({
    platformName,
    tradingEngineServiceSecrets,
}: {
    platformName: string;
    tradingEngineServiceSecrets: ITradingEngineServiceSecrets;
}) => {
    // Get process binance orders queue url
    const processBinanceOrdersQueue =
        tradingEngineServiceSecrets.PROCESS_BINANCE_ORDERS_QUEUE ?? "";

    // Map platform name to queue url
    switch (platformName) {
        case TradingPlatform.BINANCE:
            return processBinanceOrdersQueue;
        default:
            throw new Error(`Unsupported trading platform: ${platformName}`);
    }
};

export const computeTotalAmountToLock = (input: {
    entryPrice: number;
    takeProfitPrice: number;
    tradeSide: TradeSide;
    tradeAmount: number;
    riskUSDT: number;
    baseQuantity: number;
}) => {
    const {
        entryPrice,
        takeProfitPrice,
        tradeSide,
        tradeAmount,
        riskUSDT,
        baseQuantity,
    } = input;

    // Compute trading fee of 1% of the trade amount or $1, whichever is greater
    const tradingFee = Math.max(tradeAmount * 0.01, 1);

    const tradingEngineService = new TradingEngineService();
    const { pnlAmount } = tradingEngineService.calculatePnL({
        side: tradeSide,
        entryPrice,
        targetPrice: takeProfitPrice,
        baseQuantity,
        riskUSDT,
        requiredMargin: tradeAmount,
    });

    const totalAmountToLock = tradingFee + pnlAmount;

    return { tradingFee, projectedProfitAmount: pnlAmount, totalAmountToLock };
};

export const processUserTrades = async (
    queueMessages: IQueueMessageBody<IUserTradeAllocation>[]
) => {
    try {
        const successMessageIds: string[] = [];
        const failedMessageIds: string[] = [];
        const insufficientBalanceUsers: Array<{
            userTrade: IUserTradeAllocation;
            wallet?: IUserWallet | null;
        }> = [];
        const walletsService = new WalletsService();

        // Get secrets
        const tradingEngineServiceSecrets =
            await getTradingEngineServiceSecrets();

        // Process all queue messages in parallel
        const userTradeProcessingResults = await Promise.allSettled(
            queueMessages.map(async (queueMessage) => {
                try {
                    const userTrade = queueMessage.body;

                    // Compute total amount to lock
                    const { totalAmountToLock } = computeTotalAmountToLock({
                        entryPrice: userTrade.entryPrice,
                        takeProfitPrice: userTrade.takeProfitPrice,
                        tradeSide: userTrade.tradeSide,
                        tradeAmount: userTrade.tradeAmount,
                        riskUSDT: userTrade.riskAmount,
                        baseQuantity: userTrade.baseQuantity ?? 0,
                    });

                    // Get user wallet
                    const userWallet = await walletsService.getUserWallet({
                        userId: userTrade.userId,
                        currency: Currency.USDT,
                        walletType: WalletType.MAIN,
                    });

                    // If user wallet is not found or insufficient balance, push to insufficient balance array
                    if (
                        !userWallet ||
                        userWallet.availableBalance < totalAmountToLock
                    ) {
                        // TODO: Add a check to see if user has over 3 outstanding/unpaid invoices
                        // If so, push to insufficient balance array
                        // If not, continue

                        insufficientBalanceUsers.push({
                            userTrade,
                            wallet: userWallet,
                        });

                        return {
                            messageId: queueMessage.messageId,
                            userTrade,
                            isSuccess: false,
                        };
                    }

                    // Lock the balance if sufficient
                    const lockUserBalanceResult =
                        await walletsService.lockUserBalance({
                            userId: userTrade.userId,
                            amount: totalAmountToLock,
                            currency: Currency.USDT,
                            walletType: WalletType.MAIN,
                        });

                    // If lockUserBalanceResult is not successful, push to insufficient balance array
                    if (!lockUserBalanceResult.success) {
                        insufficientBalanceUsers.push({
                            userTrade,
                            wallet: lockUserBalanceResult.wallet,
                        });

                        return {
                            messageId: queueMessage.messageId,
                            userTrade,
                            isSuccess: false,
                        };
                    }

                    // Get queue url for user connected trading platform
                    const queueUrl =
                        await mapUserConnectedTradingPlatformToQueueUrl({
                            platformName: userTrade.platformName,
                            tradingEngineServiceSecrets,
                        });

                    // Publish message to queue to process binance orders
                    await publishMessageToQueue({
                        queueUrl,
                        message: JSON.stringify(userTrade),
                    });

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

                    // This is a real error, should be marked as failed for retry
                    throw error;
                }
            })
        );

        // Process results
        userTradeProcessingResults.forEach((result) => {
            if (result.status === "fulfilled") {
                successMessageIds.push(result.value.messageId);
            } else {
                // Real errors should be retried
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        });

        // Cancel pending trade and Send notifications for users with insufficient balance
        if (insufficientBalanceUsers.length > 0) {
            log.info("Users with insufficient balance found", {
                count: insufficientBalanceUsers.length,
                users: insufficientBalanceUsers,
            });

            await Promise.allSettled(
                insufficientBalanceUsers.map(async ({ userTrade }) => {
                    try {
                        // Create failed order object
                        const failedOrder: IFailedTrade = {
                            userId: userTrade.userId,
                            tradeId: new mongoose.Types.ObjectId(
                                userTrade.tradeId
                            ),
                        };

                        // publish failed order to queue
                        await publishMessageToQueue({
                            queueUrl:
                                tradingEngineServiceSecrets.HANDLE_FAILED_TRADES_QUEUE ??
                                "",
                            message: JSON.stringify(failedOrder),
                        });

                        // TODO: Send notification to users about insufficient balance
                    } catch (error) {
                        console.error(
                            "Error canceling and sending notification",
                            { error }
                        );
                    }
                })
            );
        }

        log.info("User trades processing completed", {
            totalProcessed: queueMessages.length,
            successful: successMessageIds.length,
            failed: failedMessageIds.length,
            insufficientBalance: insufficientBalanceUsers.length,
        });

        return { successMessageIds, failedMessageIds };
    } catch (error) {
        console.error("Critical error in processUserTrades", { error });
        return {
            successMessageIds: [],
            failedMessageIds: queueMessages.map((qm) => qm.messageId),
        };
    }
};

export const handleProcessedTrades = async (
    queueMessages: IQueueMessageBody<IProcessedTrade>[]
) => {
    try {
        const successMessageIds: string[] = [];
        const failedMessageIds: string[] = [];
        const tradingEngineService = new TradingEngineService();

        // handle processed order in parallel
        const processedTradeProcessingResults = await Promise.allSettled(
            queueMessages.map(async (queueMessage) => {
                const processedOrder = queueMessage.body;
                try {
                    // update trade status to PROCESSED
                    await tradingEngineService.updateTrade({
                        tradeId: processedOrder.tradeId.toString(),
                        updateData: { status: TradeStatus.PROCESSED },
                    });

                    // create order batch
                    const orderBatch =
                        await tradingEngineService.createOrderBatch({
                            baseAsset: processedOrder.baseAsset,
                            quoteCurrency: processedOrder.quoteCurrency,
                            baseQuantity: processedOrder.baseQuantity,
                            quoteTotal: processedOrder.quoteTotal,
                            status: OrderBatchStatus.PENDING,
                            tradingAccountId: processedOrder.tradingAccountId,
                            platformName: processedOrder.platformName,
                            platformId: processedOrder.platformId,
                            externalOrderId: processedOrder.externalOrderId,
                        });

                    // create order
                    await tradingEngineService.createOrder({
                        userId: processedOrder.userId,
                        tradeId: processedOrder.tradeId,
                        orderBatchId: new mongoose.Types.ObjectId(
                            orderBatch.id
                        ),
                        baseAsset: processedOrder.baseAsset,
                        baseQuantity: processedOrder.baseQuantity,
                        orderType: processedOrder.orderType,
                        orderSide: processedOrder.orderSide,
                        placementType: processedOrder.placementType,
                        price: processedOrder.price,
                        total: processedOrder.total,
                        quoteCurrency: processedOrder.quoteCurrency,
                        quoteTotal: processedOrder.quoteTotal,
                        status: OrderStatus.PENDING,
                        externalOrderId: processedOrder.externalOrderId,
                    });

                    return {
                        messageId: queueMessage.messageId,
                        processedOrder,
                        isSuccess: true,
                    };
                } catch (error) {
                    console.error("Error handling processed order", { error });
                    throw error;
                }
            })
        );

        // process results
        processedTradeProcessingResults.forEach((result) => {
            if (result.status === "fulfilled") {
                successMessageIds.push(result.value.messageId);
            } else {
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        });

        log.info("Processed trades processing completed", {
            totalProcessed: queueMessages.length,
            successful: successMessageIds.length,
            failed: failedMessageIds.length,
        });

        return { successMessageIds, failedMessageIds };
    } catch (error) {
        console.error("Critical error in handleProcessedOrders", { error });
        return {
            successMessageIds: [],
            failedMessageIds: queueMessages.map((qm) => qm.messageId),
        };
    }
};

export const handleFailedTrades = async (
    queueMessages: IQueueMessageBody<IFailedTrade>[]
) => {
    try {
        const successMessageIds: string[] = [];
        const failedMessageIds: string[] = [];
        const tradingEngineService = new TradingEngineService();

        // handle failed order in parallel
        const failedOrderProcessingResults = await Promise.allSettled(
            queueMessages.map(async (queueMessage) => {
                const failedOrder = queueMessage.body;
                try {
                    // update trade status to FAILED
                    await tradingEngineService.updateTrade({
                        tradeId: failedOrder.tradeId.toString(),
                        updateData: { status: TradeStatus.FAILED },
                    });
                    return {
                        messageId: queueMessage.messageId,
                        failedOrder,
                        isSuccess: true,
                    };
                } catch (error) {
                    console.error("Error handling failed order", { error });
                    throw error;
                }
            })
        );

        // process results
        failedOrderProcessingResults.forEach((result) => {
            if (result.status === "fulfilled") {
                successMessageIds.push(result.value.messageId);
            } else {
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        });

        log.info("Failed orders processing completed", {
            totalProcessed: queueMessages.length,
            successful: successMessageIds.length,
            failed: failedMessageIds.length,
        });

        return { successMessageIds, failedMessageIds };
    } catch (error) {
        console.error("Critical error in handleFailedOrders", { error });
        return {
            successMessageIds: [],
            failedMessageIds: queueMessages.map((qm) => qm.messageId),
        };
    }
};
