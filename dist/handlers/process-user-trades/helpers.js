"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processUserTrades = exports.mapUserConnectedTradingPlatformToQueueUrl = void 0;
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
const helpers_1 = require("src/clients/SQSClient/helpers");
const enums_1 = require("src/config/enums");
const enums_2 = require("src/config/secrets/enums");
const helpers_2 = require("src/config/secrets/helpers");
const WalletsService_1 = require("src/services/WalletsService");
const wallets_service_1 = require("src/types/wallets-service");
const mapUserConnectedTradingPlatformToQueueUrl = async (platformName) => {
    // Get secrets
    const env = process.env.ENV ?? "";
    const tradingEngineServiceSecrets = await (0, helpers_2.getSecrets)(`${enums_2.SecretLocation.tradingEngineServiceSecrets}/${env}`);
    // Get process binance orders queue url
    const processBinanceOrdersQueue = tradingEngineServiceSecrets.PROCESS_BINANCE_ORDERS_QUEUE ?? "";
    // Map platform name to queue url
    switch (platformName) {
        case enums_1.TradingPlatform.BINANCE:
            return processBinanceOrdersQueue;
        default:
            throw new Error(`Unsupported trading platform: ${platformName}`);
    }
};
exports.mapUserConnectedTradingPlatformToQueueUrl = mapUserConnectedTradingPlatformToQueueUrl;
const processUserTrades = async (queueMessages) => {
    try {
        const successMessageIds = [];
        const failedMessageIds = [];
        const insufficientBalanceUsers = [];
        const walletsService = new WalletsService_1.WalletsService();
        // Process all queue messages in parallel
        const userTradeProcessingResults = await Promise.allSettled(queueMessages.map(async (queueMessage) => {
            try {
                const userTrade = queueMessage.body;
                // Compute total amount to lock
                const { totalAmountToLock } = walletsService.computeTotalAmountToLock({
                    entryPrice: userTrade.entryPrice,
                    takeProfitPrice: userTrade.takeProfitPrice,
                    tradeSide: userTrade.tradeSide,
                    tradeAmount: userTrade.tradeAmount,
                });
                // Get user wallet
                const userWallet = await walletsService.getUserWallet({
                    userId: userTrade.userId,
                    currency: enums_1.Currency.USDT,
                    walletType: wallets_service_1.WalletType.MAIN,
                });
                // If user wallet is not found or insufficient balance, push to insufficient balance array
                if (!userWallet ||
                    userWallet.availableBalance < totalAmountToLock) {
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
                const lockUserBalanceResult = await walletsService.lockUserBalance({
                    userId: userTrade.userId,
                    amount: totalAmountToLock,
                    currency: enums_1.Currency.USDT,
                    walletType: wallets_service_1.WalletType.MAIN,
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
                // TODO: Add a check to see if user has over 3 outstanding/unpaid invoices
                // If so, push to insufficient balance array
                // If not, publish message to queue
                // Get queue url for user connected trading platform
                const queueUrl = await (0, exports.mapUserConnectedTradingPlatformToQueueUrl)(userTrade.platformName);
                // Publish message to queue to process binance orders
                await (0, helpers_1.publishMessageToQueue)({
                    queueUrl,
                    message: JSON.stringify(userTrade),
                });
                return {
                    messageId: queueMessage.messageId,
                    userTrade,
                    isSuccess: true,
                };
            }
            catch (error) {
                lambda_powertools_logger_1.default.error("Error processing user trade", {
                    error,
                    userId: queueMessage.body.userId,
                    masterTradeId: queueMessage.body.masterTradeId,
                });
                // This is a real error, should be marked as failed for retry
                throw error;
            }
        }));
        // Process results
        userTradeProcessingResults.forEach((result) => {
            if (result.status === "fulfilled") {
                successMessageIds.push(result.value.messageId);
            }
            else {
                // Real errors should be retried
                failedMessageIds.push(result.reason.messageId || "unknown");
            }
        });
        // Send notifications for users with insufficient balance
        if (insufficientBalanceUsers.length > 0) {
            lambda_powertools_logger_1.default.info("Users with insufficient balance found", {
                count: insufficientBalanceUsers.length,
                users: insufficientBalanceUsers,
            });
            // TODO: Send notification to users about insufficient balance
        }
        lambda_powertools_logger_1.default.info("User trades processing completed", {
            totalProcessed: queueMessages.length,
            successful: successMessageIds.length,
            failed: failedMessageIds.length,
            insufficientBalance: insufficientBalanceUsers.length,
        });
        return { successMessageIds, failedMessageIds };
    }
    catch (error) {
        lambda_powertools_logger_1.default.error("Critical error in processUserTrades", { error });
        return {
            successMessageIds: [],
            failedMessageIds: queueMessages.map((qm) => qm.messageId),
        };
    }
};
exports.processUserTrades = processUserTrades;
