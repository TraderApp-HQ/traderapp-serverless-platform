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
    InvoiceStatus,
    InvoiceType,
    OrderBatchStatus,
    OrderStatus,
    TradeStatus,
    TradeSide,
} from "src/services/TradingEngineService/enums";
import {
    IFailedTrade,
    IInvoice,
    IProcessedTrade,
    IUserTradeAllocation,
} from "src/services/TradingEngineService/interfaces";
import { ICreateInvoiceResponse, WalletsService } from "src/services/WalletsService";
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
    const tradingFee = Number((Math.max(tradeAmount * 0.01, 1)).toFixed(2));

    const tradingEngineService = new TradingEngineService();
    const { pnlAmount } = tradingEngineService.calculatePnL({
        side: tradeSide,
        entryPrice,
        targetPrice: takeProfitPrice,
        baseQuantity,
        riskUSDT,
        requiredMargin: tradeAmount,
    });

    // Compute 30% of the projected profit amount, rounded to 2 decimal places
    const projectedProfitShareAmount = Number((pnlAmount * 0.3).toFixed(2));

    // Compute total amount to lock
    const totalAmountToLock = tradingFee + projectedProfitShareAmount;

    return { tradingFee, projectedProfitShareAmount, totalAmountToLock };
};

// export const processUserTrades = async (
//     queueMessages: IQueueMessageBody<IUserTradeAllocation>[]
// ) => {
//     try {
//         const successMessageIds: string[] = [];
//         const failedMessageIds: string[] = [];
//         const insufficientBalanceUsers: Array<{
//             userTrade: IUserTradeAllocation;
//             wallet?: IUserWallet | null;
//         }> = [];
//         const walletsService = new WalletsService();

//         // Get secrets
//         const tradingEngineServiceSecrets =
//             await getTradingEngineServiceSecrets();

//         // Process all queue messages in parallel
//         const userTradeProcessingResults = await Promise.allSettled(
//             queueMessages.map(async (queueMessage) => {
//                 try {
//                     const userTrade = queueMessage.body;
//                     // let isBalanceLocked = false;
//                     let lockedAmount = 0;
//                     let tradingFeeAmountPaid = 0;
//                     let profitShareAmountPaid = 0;

//                     // Compute total amount to lock
//                     const { totalAmountToLock, projectedProfitShareAmount, tradingFee } = computeTotalAmountToLock({
//                         entryPrice: userTrade.entryPrice,
//                         takeProfitPrice: userTrade.takeProfitPrice,
//                         tradeSide: userTrade.tradeSide,
//                         tradeAmount: userTrade.tradeAmount,
//                         riskUSDT: userTrade.riskAmount,
//                         baseQuantity: userTrade.baseQuantity ?? 0,
//                     });

//                     // Get user wallet and invoices in parallel
//                     const [userWallet, userUnpaidInvoices] = await Promise.all([
//                         walletsService.getUserWallet({
//                             userId: userTrade.userId,
//                             currency: Currency.USDT,
//                             walletType: WalletType.MAIN,
//                         }),
//                         walletsService.getInvoices({
//                             userId: userTrade.userId,
//                             statuses: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE],
//                         }),
//                     ]);

//                     // Check if user has over 3 outstanding/unpaid invoices
//                     const uniqueTradeIds = new Set(userUnpaidInvoices.map(invoice => invoice.tradeId));
//                     if (uniqueTradeIds.size >= 3) {
//                         insufficientBalanceUsers.push({
//                             userTrade,
//                             wallet: userWallet,
//                         });

//                         return {
//                             messageId: queueMessage.messageId,
//                             userTrade,
//                             isSuccess: false,
//                         };
//                     }

//                     // Determine how much to lock based on available balance
//                     const availableBalance = userWallet?.availableBalance || 0;
//                     let invoiceStatus: InvoiceStatus;

//                     if (availableBalance < 1) {
//                         // Case 1: Balance < $1 - Don't lock, create PENDING invoices
//                         lockedAmount = 0;
//                         tradingFeeAmountPaid = 0;
//                         profitShareAmountPaid = 0;
//                         // isBalanceLocked = false;
//                         invoiceStatus = InvoiceStatus.PENDING;
//                     } else if (availableBalance >= totalAmountToLock) {
//                         // Case 2: Full balance available - lock exact amount needed
//                         lockedAmount = totalAmountToLock;
//                         tradingFeeAmountPaid = tradingFee;
//                         profitShareAmountPaid = projectedProfitShareAmount;
//                         invoiceStatus = InvoiceStatus.LOCKED;

//                         // Lock the balance
//                         const lockUserBalanceResult = await walletsService.lockUserBalance({
//                             userId: userTrade.userId,
//                             amount: lockedAmount,
//                             currency: Currency.USDT,
//                             walletType: WalletType.MAIN,
//                         });

//                         if (!lockUserBalanceResult.success) {
//                             insufficientBalanceUsers.push({
//                                 userTrade,
//                                 wallet: lockUserBalanceResult.wallet,
//                             });

//                             return {
//                                 messageId: queueMessage.messageId,
//                                 userTrade,
//                                 isSuccess: false,
//                             };
//                         }

//                         // isBalanceLocked = true;
//                     } else {
//                         // Case 3: Partial balance - lock entire available balance
//                         lockedAmount = availableBalance;
//                         invoiceStatus = InvoiceStatus.LOCKED;

//                         // Prioritize trading fee first, then profit share
//                         if (availableBalance >= tradingFee) {
//                             tradingFeeAmountPaid = tradingFee;
//                             profitShareAmountPaid = availableBalance - tradingFee;
//                         } else {
//                             tradingFeeAmountPaid = availableBalance;
//                             profitShareAmountPaid = 0;
//                         }

//                         // Lock the balance
//                         const lockUserBalanceResult = await walletsService.lockUserBalance({
//                             userId: userTrade.userId,
//                             amount: lockedAmount,
//                             currency: Currency.USDT,
//                             walletType: WalletType.MAIN,
//                         });

//                         if (!lockUserBalanceResult.success) {
//                             insufficientBalanceUsers.push({
//                                 userTrade,
//                                 wallet: lockUserBalanceResult.wallet,
//                             });

//                             return {
//                                 messageId: queueMessage.messageId,
//                                 userTrade,
//                                 isSuccess: false,
//                             };
//                         }

//                         // isBalanceLocked = true;
//                     }

//                     // Create invoices with appropriate amounts paid and status
//                     const [tradingFeeInvoice, projectedProfitShareInvoice] = await Promise.all([
//                         walletsService.createInvoice({
//                             userId: userTrade.userId,
//                             invoiceType: InvoiceType.TRADING_FEE,
//                             amountDue: tradingFee,
//                             amountPaid: tradingFeeAmountPaid,
//                             currency: Currency.USDT,
//                             tradeId: userTrade.tradeId,
//                             tradeSide: userTrade.tradeSide,
//                             baseAsset: userTrade.baseAsset,
//                             logoUrl: "",
//                             quoteCurrency: userTrade.quoteCurrency,
//                             status: invoiceStatus, // Use determined status
//                         }),
//                         walletsService.createInvoice({
//                             userId: userTrade.userId,
//                             invoiceType: InvoiceType.PROFIT_SHARE,
//                             amountDue: projectedProfitShareAmount,
//                             amountPaid: profitShareAmountPaid,
//                             currency: Currency.USDT,
//                             tradeId: userTrade.tradeId,
//                             tradeSide: userTrade.tradeSide,
//                             baseAsset: userTrade.baseAsset,
//                             logoUrl: "",
//                             quoteCurrency: userTrade.quoteCurrency,
//                             status: invoiceStatus, // Use determined status
//                         }),
//                     ]);

//                     // If either invoice creation fails, push to insufficient balance array
//                     if (!tradingFeeInvoice.success || !projectedProfitShareInvoice.success) {
//                         insufficientBalanceUsers.push({
//                             userTrade,
//                             wallet: userWallet,
//                         });

//                         return {
//                             messageId: queueMessage.messageId,
//                             userTrade,
//                             isSuccess: false,
//                         };
//                     }

//                     // Get queue url for user connected trading platform
//                     const queueUrl = await mapUserConnectedTradingPlatformToQueueUrl({
//                         platformName: userTrade.platformName,
//                         tradingEngineServiceSecrets,
//                     });

//                     // Publish message to queue to process binance orders
//                     await publishMessageToQueue({
//                         queueUrl,
//                         message: JSON.stringify(userTrade),
//                     });

//                     return {
//                         messageId: queueMessage.messageId,
//                         userTrade,
//                         isSuccess: true,
//                     };
//                 } catch (error) {
//                     console.error("Error processing user trade", {
//                         error,
//                         userId: queueMessage.body.userId,
//                         masterTradeId: queueMessage.body.masterTradeId,
//                     });

//                     // This is a real error, should be marked as failed for retry
//                     throw error;
//                 }
//             })
//         );

//         // Process results
//         userTradeProcessingResults.forEach((result) => {
//             if (result.status === "fulfilled") {
//                 successMessageIds.push(result.value.messageId);
//             } else {
//                 // Real errors should be retried
//                 failedMessageIds.push(result.reason.messageId || "unknown");
//             }
//         });

//         // Cancel pending trade and Send notifications for users with insufficient balance
//         if (insufficientBalanceUsers.length > 0) {
//             log.info("Users with insufficient balance found", {
//                 count: insufficientBalanceUsers.length,
//                 users: insufficientBalanceUsers,
//             });

//             await Promise.allSettled(
//                 insufficientBalanceUsers.map(async ({ userTrade }) => {
//                     try {
//                         // Create failed order object
//                         const failedOrder: IFailedTrade = {
//                             userId: userTrade.userId,
//                             tradeId: new mongoose.Types.ObjectId(
//                                 userTrade.tradeId
//                             ),
//                         };

//                         // publish failed order to queue
//                         await publishMessageToQueue({
//                             queueUrl:
//                                 tradingEngineServiceSecrets.HANDLE_FAILED_TRADES_QUEUE ??
//                                 "",
//                             message: JSON.stringify(failedOrder),
//                         });

//                         // TODO: Send notification to users about insufficient balance
//                     } catch (error) {
//                         console.error(
//                             "Error canceling and sending notification",
//                             { error }
//                         );
//                     }
//                 })
//             );
//         }

//         log.info("User trades processing completed", {
//             totalProcessed: queueMessages.length,
//             successful: successMessageIds.length,
//             failed: failedMessageIds.length,
//             insufficientBalance: insufficientBalanceUsers.length,
//         });

//         return { successMessageIds, failedMessageIds };
//     } catch (error) {
//         console.error("Critical error in processUserTrades", { error });
//         return {
//             successMessageIds: [],
//             failedMessageIds: queueMessages.map((qm) => qm.messageId),
//         };
//     }
// };

// Helper function to check if user has exceeded unpaid invoices limit

const checkUserUnpaidInvoicesLimit = (
    unpaidInvoices: IInvoice[]
): boolean => {
    const uniqueTradeIds = new Set(
        unpaidInvoices.map((invoice) => invoice.tradeId)
    );
    return uniqueTradeIds.size >= 3;
};

// Helper function to determine balance lock strategy
const determineBalanceLockStrategy = ({
    availableBalance,
    totalAmountToLock,
    tradingFee,
    projectedProfitShareAmount,
}: {
    availableBalance: number;
    totalAmountToLock: number;
    tradingFee: number;
    projectedProfitShareAmount: number;
}): {
    lockedAmount: number;
    tradingFeeAmountPaid: number;
    profitShareAmountPaid: number;
    invoiceStatus: InvoiceStatus;
    shouldLock: boolean;
} => {
    if (availableBalance < 1) {
        // Case 1: Balance < $1 - Don't lock, create PENDING invoices
        return {
            lockedAmount: 0,
            tradingFeeAmountPaid: 0,
            profitShareAmountPaid: 0,
            invoiceStatus: InvoiceStatus.PENDING,
            shouldLock: false,
        };
    } else if (availableBalance >= totalAmountToLock) {
        // Case 2: Full balance available - lock exact amount needed
        return {
            lockedAmount: totalAmountToLock,
            tradingFeeAmountPaid: tradingFee,
            profitShareAmountPaid: projectedProfitShareAmount,
            invoiceStatus: InvoiceStatus.LOCKED,
            shouldLock: true,
        };
    } else {
        // Case 3: Partial balance - lock entire available balance
        const tradingFeeAmountPaid =
            availableBalance >= tradingFee ? tradingFee : availableBalance;
        const profitShareAmountPaid =
            availableBalance >= tradingFee ? availableBalance - tradingFee : 0;

        return {
            lockedAmount: availableBalance,
            tradingFeeAmountPaid,
            profitShareAmountPaid,
            invoiceStatus: InvoiceStatus.LOCKED,
            shouldLock: true,
        };
    }
};

// Helper function to create trade invoices
const createTradeInvoices = async ({
    walletsService,
    userTrade,
    tradingFee,
    tradingFeeAmountPaid,
    projectedProfitShareAmount,
    profitShareAmountPaid,
    invoiceStatus,
}: {
    walletsService: WalletsService;
    userTrade: IUserTradeAllocation;
    tradingFee: number;
    tradingFeeAmountPaid: number;
    projectedProfitShareAmount: number;
    profitShareAmountPaid: number;
    invoiceStatus: InvoiceStatus;
}): Promise<{
    tradingFeeInvoice: ICreateInvoiceResponse;
    profitShareInvoice: ICreateInvoiceResponse;
}> => {
    const [tradingFeeInvoice, profitShareInvoice] = await Promise.all([
        walletsService.createInvoice({
            userId: userTrade.userId,
            invoiceType: InvoiceType.TRADING_FEE,
            amountDue: tradingFee,
            amountPaid: tradingFeeAmountPaid,
            currency: Currency.USDT,
            tradeId: userTrade.tradeId,
            tradeSide: userTrade.tradeSide,
            baseAsset: userTrade.baseAsset,
            logoUrl: "",
            quoteCurrency: userTrade.quoteCurrency,
            status: invoiceStatus,
        }),
        walletsService.createInvoice({
            userId: userTrade.userId,
            invoiceType: InvoiceType.PROFIT_SHARE,
            amountDue: projectedProfitShareAmount,
            amountPaid: profitShareAmountPaid,
            currency: Currency.USDT,
            tradeId: userTrade.tradeId,
            tradeSide: userTrade.tradeSide,
            baseAsset: userTrade.baseAsset,
            logoUrl: "",
            quoteCurrency: userTrade.quoteCurrency,
            status: invoiceStatus,
        }),
    ]);

    return { tradingFeeInvoice, profitShareInvoice };
};

// Helper function to publish user trade to appropriate queue
const publishUserTradeToQueue = async ({
    userTrade,
    tradingEngineServiceSecrets,
}: {
    userTrade: IUserTradeAllocation;
    tradingEngineServiceSecrets: ITradingEngineServiceSecrets;
}): Promise<void> => {
    const queueUrl = await mapUserConnectedTradingPlatformToQueueUrl({
        platformName: userTrade.platformName,
        tradingEngineServiceSecrets,
    });

    await publishMessageToQueue({
        queueUrl,
        message: JSON.stringify(userTrade),
    });
};

// Helper function to process a single user trade
const processSingleUserTrade = async ({
    queueMessage,
    walletsService,
    tradingEngineServiceSecrets,
}: {
    queueMessage: IQueueMessageBody<IUserTradeAllocation>;
    walletsService: WalletsService;
    tradingEngineServiceSecrets: ITradingEngineServiceSecrets;
}): Promise<{
    messageId: string;
    userTrade: IUserTradeAllocation;
    isSuccess: boolean;
    shouldAddToInsufficientBalance?: boolean;
    wallet?: IUserWallet | null;
}> => {
    const userTrade = queueMessage.body;

    try {
        // Compute total amount to lock
        const { totalAmountToLock, projectedProfitShareAmount, tradingFee } =
            computeTotalAmountToLock({
                entryPrice: userTrade.entryPrice,
                takeProfitPrice: userTrade.takeProfitPrice,
                tradeSide: userTrade.tradeSide,
                tradeAmount: userTrade.tradeAmount,
                riskUSDT: userTrade.riskAmount,
                baseQuantity: userTrade.baseQuantity ?? 0,
            });

        // Get user wallet and invoices in parallel
        const [userWallet, userUnpaidInvoices] = await Promise.all([
            walletsService.getUserWallet({
                userId: userTrade.userId,
                currency: Currency.USDT,
                walletType: WalletType.MAIN,
            }),
            walletsService.getInvoices({
                userId: userTrade.userId,
                statuses: [InvoiceStatus.PENDING, InvoiceStatus.OVERDUE],
            }),
        ]);

        // Check if user has exceeded unpaid invoices limit
        const hasExceededUnpaidInvoicesLimit = checkUserUnpaidInvoicesLimit(userUnpaidInvoices);
        if (hasExceededUnpaidInvoicesLimit) {
            return {
                messageId: queueMessage.messageId,
                userTrade,
                isSuccess: false,
                shouldAddToInsufficientBalance: true,
                wallet: userWallet,
            };
        }

        // Determine balance lock strategy
        const availableBalance = userWallet?.availableBalance || 0;
        const {
            lockedAmount,
            tradingFeeAmountPaid,
            profitShareAmountPaid,
            invoiceStatus,
            shouldLock,
        } = determineBalanceLockStrategy({
            availableBalance,
            totalAmountToLock,
            tradingFee,
            projectedProfitShareAmount,
        });

        // Lock balance if needed
        if (shouldLock) {
            const lockUserBalanceResult = await walletsService.lockUserBalance({
                userId: userTrade.userId,
                amount: lockedAmount,
                currency: Currency.USDT,
                walletType: WalletType.MAIN,
            });

            if (!lockUserBalanceResult.success) {
                return {
                    messageId: queueMessage.messageId,
                    userTrade,
                    isSuccess: false,
                    shouldAddToInsufficientBalance: true,
                    wallet: lockUserBalanceResult.wallet,
                };
            }
        }

        // Create invoices
        const { tradingFeeInvoice, profitShareInvoice } =
            await createTradeInvoices({
                walletsService,
                userTrade,
                tradingFee,
                tradingFeeAmountPaid,
                projectedProfitShareAmount,
                profitShareAmountPaid,
                invoiceStatus,
            });

        // Check if invoice creation was successful
        if (!tradingFeeInvoice.success || !profitShareInvoice.success) {
            return {
                messageId: queueMessage.messageId,
                userTrade,
                isSuccess: false,
                shouldAddToInsufficientBalance: true,
                wallet: userWallet,
            };
        }

        // Publish to trading platform queue
        await publishUserTradeToQueue({
            userTrade,
            tradingEngineServiceSecrets,
        });

        return {
            messageId: queueMessage.messageId,
            userTrade,
            isSuccess: true,
        };
    } catch (error) {
        console.error("Error processing single user trade", {
            error,
            userId: userTrade.userId,
            masterTradeId: userTrade.masterTradeId,
        });
        throw error;
    }
};

// Helper function to handle users with insufficient balance
const handleInsufficientBalanceUsers = async ({
    insufficientBalanceUsers,
    tradingEngineServiceSecrets,
}: {
    insufficientBalanceUsers: Array<{
        userTrade: IUserTradeAllocation;
        wallet?: IUserWallet | null;
    }>;
    tradingEngineServiceSecrets: ITradingEngineServiceSecrets;
}): Promise<void> => {
    if (insufficientBalanceUsers.length === 0) return;

    log.info("Users with insufficient balance found", {
        count: insufficientBalanceUsers.length,
        users: insufficientBalanceUsers,
    });

    await Promise.allSettled(
        insufficientBalanceUsers.map(async ({ userTrade }) => {
            try {
                const failedOrder: IFailedTrade = {
                    userId: userTrade.userId,
                    tradeId: new mongoose.Types.ObjectId(userTrade.tradeId),
                };

                await publishMessageToQueue({
                    queueUrl:
                        tradingEngineServiceSecrets.HANDLE_FAILED_TRADES_QUEUE ??
                        "",
                    message: JSON.stringify(failedOrder),
                });

                // TODO: Send notification to users about insufficient balance
            } catch (error) {
                console.error("Error canceling and sending notification", {
                    error,
                });
            }
        })
    );
};

// Main function - now much cleaner
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
                    const result = await processSingleUserTrade({
                        queueMessage,
                        walletsService,
                        tradingEngineServiceSecrets,
                    });

                    // Track insufficient balance users
                    if (result.shouldAddToInsufficientBalance) {
                        insufficientBalanceUsers.push({
                            userTrade: result.userTrade,
                            wallet: result.wallet,
                        });
                    }

                    return result;
                } catch (error) {
                    console.error("Error processing user trade", {
                        error,
                        userId: queueMessage.body.userId,
                        masterTradeId: queueMessage.body.masterTradeId,
                    });
                    throw error;
                }
            })
        );

        // Process results
        userTradeProcessingResults.forEach((result) => {
            if (result.status === "fulfilled") {
                successMessageIds.push(result.value.messageId);
            } else {
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        });

        // Handle users with insufficient balance
        await handleInsufficientBalanceUsers({
            insufficientBalanceUsers,
            tradingEngineServiceSecrets,
        });

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
