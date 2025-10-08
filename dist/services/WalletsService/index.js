"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletsService = void 0;
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
require("dotenv/config");
const mongoose_1 = __importDefault(require("mongoose"));
const CryptoPayClient_1 = require("src/clients/CryptoPayClient");
const MongoDBClient_1 = require("src/clients/MongoDBClient");
const constants_1 = require("src/clients/MongoDBClient/constants");
const helpers_1 = require("src/clients/SQSClient/helpers");
const enums_1 = require("src/config/secrets/enums");
const helpers_2 = require("src/config/secrets/helpers");
const users_service_1 = require("src/types/users-service");
const wallets_service_1 = require("src/types/wallets-service");
const helper_1 = require("./helper");
const enums_2 = require("src/services/TradingEngineService/enums");
class WalletsService {
    constructor() {
        this.connection = null;
        this.walletSecrets = null;
        this.commonSecrets = null;
        this.initialized = false;
        this.initializationPromise = null;
    }
    // Initialize the service once
    async initialize() {
        if (this.initialized)
            return;
        // If initialization is already in progress, wait for it
        if (this.initializationPromise) {
            await this.initializationPromise;
            return;
        }
        // Set up initialization promise
        this.initializationPromise = (async () => {
            try {
                // Fetch secrets once
                const env = process.env.ENV;
                console.log(`=============== Getting secrets  for ${enums_1.SecretLocation.walletsServiceSecrets}/${env} =====================`);
                // Fetch both secrets once
                const [walletSecrets, commonSecrets] = await Promise.all([
                    (0, helpers_2.getSecrets)(`${enums_1.SecretLocation.walletsServiceSecrets}/${env}`),
                    (0, helpers_2.getSecrets)(`${enums_1.SecretLocation.commonSecrets}/${env}`),
                ]);
                this.walletSecrets = walletSecrets;
                this.commonSecrets = commonSecrets;
                // Create connection
                this.connection = mongoose_1.default.createConnection(this.walletSecrets.WALLET_SERVICE_DB_URL);
                this.initialized = true;
            }
            catch (error) {
                lambda_powertools_logger_1.default.error("Failed to initialize WalletsService:", { error });
                throw error;
            }
            finally {
                this.initializationPromise = null;
            }
        })();
        await this.initializationPromise;
    }
    // Close resources
    async closeResources() {
        if (this.connection) {
            await this.connection.close();
            this.connection = null;
        }
    }
    // For cleanup, especially in testing
    async cleanup() {
        await this.closeResources();
        this.initialized = false;
    }
    // Get connection (ensures initialization first)
    async getConnection() {
        await this.initialize();
        if (!this.connection) {
            throw new Error("Database connection not available");
        }
        return this.connection;
    }
    // Get secrets (ensures initialization first)
    async getWalletSecrets() {
        await this.initialize();
        if (!this.walletSecrets) {
            throw new Error("Secrets not available");
        }
        return this.walletSecrets;
    }
    async getCommonSecrets() {
        await this.initialize();
        if (!this.commonSecrets) {
            throw new Error("Common Secrets not available");
        }
        return this.commonSecrets;
    }
    // Record transaction to DB
    async recordTransactionToDB(transaction) {
        try {
            const connection = await this.getConnection();
            const transactionsCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.transactions);
            // Find existing transaction
            const existingTransaction = await transactionsCollection.findOne({
                externalTransactionId: transaction.externalTransactionId,
            });
            if (existingTransaction) {
                // Update existing transaction status if different
                if (existingTransaction.status !== transaction.status) {
                    await transactionsCollection.updateOne({
                        externalTransactionId: transaction.externalTransactionId,
                    }, { $set: { status: transaction.status } });
                }
            }
            else {
                // Insert new transaction
                await transactionsCollection.insertOne(transaction);
            }
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("Error recording transaction:", { error });
            throw error;
        }
    }
    // Get transaction from DB
    async getTransactionFromDB(externalTransactionId) {
        try {
            const connection = await this.getConnection();
            const transactionsCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.transactions);
            return transactionsCollection.findOne({
                externalTransactionId,
            });
        }
        catch (error) {
            lambda_powertools_logger_1.default.error(`Error getting transaction from DB:`, { error });
            throw error;
        }
    }
    // Credit user wallet
    async creditUserWallet({ userId, amount, }) {
        try {
            const connection = await this.getConnection();
            const userWalletsCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.userWallets);
            // Use $inc operator to atomically increment the availableBalance
            await userWalletsCollection.updateOne({ userId }, { $inc: { availableBalance: amount } });
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("Error crediting user wallet:", { error });
            throw error;
        }
    }
    async debitUserWallet({ userId, amount, }) {
        try {
            const connection = await this.getConnection();
            const userWalletsCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.userWallets);
            // Use $inc operator to atomically decrement the availableBalance
            await userWalletsCollection.updateOne({ userId }, { $inc: { availableBalance: -amount } });
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("Error debiting user wallet:", { error });
            throw error;
        }
    }
    // Process CryptoPay channels webhook
    async processCryptoPayChannelsWebhook(queueMessages) {
        try {
            // Ensure service is initialized
            await this.initialize();
            const [walletSecrets, commonSecrets] = await Promise.all([
                this.getWalletSecrets(),
                this.getCommonSecrets(),
            ]);
            const cryptopayClient = new CryptoPayClient_1.CryptoPayClient({
                baseUrl: walletSecrets.CRYPTOPAY_BASE_URL,
                apiKey: walletSecrets.CRYPTOPAY_DEPOSITS_API_KEY,
                apiSecret: walletSecrets.CRYPTOPAY_DEPOSITS_API_SECRET,
                webhooksSharedSecret: walletSecrets.CRYPTOPAY_WEBHOOK_SHARED_SECRET,
            });
            const connection = await this.getConnection();
            const userWalletDepositDetailsCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.userWalletDepositDetails);
            const successMessageIds = [];
            const failedMessageIds = [];
            const completedMessages = [];
            // Step 1: Confirm completed payments in parallel
            const confirmationResults = await Promise.allSettled(queueMessages
                .filter((qm) => qm.body.data.status ===
                CryptoPayClient_1.CryptopayWebhookEventStatus.completed)
                .map(async (qm) => {
                try {
                    await cryptopayClient.confirmChannelsPayment(qm.body);
                    completedMessages.push(qm);
                    return { messageId: qm.messageId, success: true };
                }
                catch (error) {
                    lambda_powertools_logger_1.default.error(`Failed to confirm payment for message ${qm.messageId}:`, { error });
                    return { messageId: qm.messageId, success: false };
                }
            }));
            lambda_powertools_logger_1.default.info("confirmationResults", { confirmationResults });
            // Track confirmation failures
            confirmationResults.forEach((result) => {
                if (result.status === "rejected" || !result.value.success) {
                    const messageId = result.status === "fulfilled"
                        ? result.value.messageId
                        : "unknown";
                    failedMessageIds.push(messageId);
                }
            });
            // Step 2: Find wallet details for all messages in parallel
            const walletLookupResults = await Promise.allSettled(queueMessages.map(async (qm) => {
                try {
                    const userWalletDetail = await userWalletDepositDetailsCollection.findOne({
                        externalWalletId: qm.body.data.channel_id,
                    });
                    return {
                        messageId: qm.messageId,
                        queueMessage: qm,
                        userWalletDetail,
                        success: true,
                    };
                }
                catch (error) {
                    lambda_powertools_logger_1.default.error(`Failed to find wallet details for message ${qm.messageId}:`, { error });
                    return { messageId: qm.messageId, success: false };
                }
            }));
            lambda_powertools_logger_1.default.info("walletLookupResults", { walletLookupResults });
            // Process successful wallet lookups
            const successfulLookups = walletLookupResults
                .filter((result) => result.status === "fulfilled" && result.value.success)
                .map((result) => result.value);
            // Track lookup failures
            walletLookupResults.forEach((result) => {
                if (result.status === "rejected" ||
                    (result.status === "fulfilled" && !result.value.success)) {
                    const messageId = result.status === "fulfilled"
                        ? result.value.messageId
                        : "unknown";
                    if (!failedMessageIds.includes(messageId)) {
                        failedMessageIds.push(messageId);
                    }
                }
            });
            // Step 3: Format transactions
            const transactions = successfulLookups.map((lookup) => {
                const userId = lookup.userWalletDetail?.userId ?? "";
                return {
                    messageId: lookup.messageId,
                    transaction: cryptopayClient.formatTransaction(lookup.queueMessage.body, userId),
                    userId,
                    queueMessage: lookup.queueMessage,
                };
            });
            lambda_powertools_logger_1.default.info("transactions", { transactions });
            // Step 4: Check which transactions need crediting (not already completed)
            const completedDeposits = transactions.filter((t) => t.queueMessage.body.data.status ===
                CryptoPayClient_1.CryptopayWebhookEventStatus.completed && t.userId);
            const transactionsToCredit = await Promise.all(completedDeposits.map(async ({ messageId, transaction, userId, queueMessage, }) => {
                try {
                    // Check if transaction is already marked as SUCCESS
                    const existingTransaction = await this.getTransactionFromDB(transaction.externalTransactionId);
                    if (existingTransaction &&
                        existingTransaction.status ===
                            wallets_service_1.TransactionStatus.SUCCESS) {
                        lambda_powertools_logger_1.default.error(`Transaction ${transaction.externalTransactionId} already credited, skipping.`);
                        return null; // Skip this one
                    }
                    return { messageId, userId, queueMessage };
                }
                catch (error) {
                    lambda_powertools_logger_1.default.error(`Failed to check transaction status for message ${messageId}:`, { error });
                    failedMessageIds.push(messageId);
                    return null;
                }
            }));
            lambda_powertools_logger_1.default.info("transactionsToCredit", { transactionsToCredit });
            // Filter out nulls (already credited or errored)
            const filteredTransactionsToCredit = transactionsToCredit.filter(Boolean);
            // check if first deposit has not been made so we can deduct activation fee
            // Step 5: Credit user wallets for transactions that need crediting
            const creditResults = await Promise.allSettled(filteredTransactionsToCredit.map(async ({ messageId, userId, queueMessage }) => {
                try {
                    await this.creditUserWallet({
                        userId,
                        amount: parseFloat(queueMessage.body.data.paid_amount ?? "0"),
                    });
                    // Publish user to queue for first deposit tracking if paid_amount is greater than $10
                    if (parseFloat(queueMessage.body.data.paid_amount ?? "0") >= 10) {
                        await (0, helpers_1.publishMessageToQueue)({
                            queueUrl: commonSecrets.TRACK_USER_ONBOARDING_CHECKLIST_QUEUE ??
                                "",
                            message: JSON.stringify({
                                userId,
                                onboardingChecklistItem: users_service_1.UserOnboardingChecklist.IS_FIRST_DEPOSIT_MADE,
                            }),
                        });
                    }
                    // publish to notification queue
                    const amount = parseFloat(queueMessage.body.data.paid_amount ?? "0");
                    const transactionId = queueMessage.body.data.txid ?? "";
                    const queueUrl = this.commonSecrets?.EMAIL_NOTIFICATIONS_QUEUE ??
                        "";
                    await (0, helper_1.publishDepositConfirmationToQueue)({
                        amount,
                        transactionId,
                        userId,
                        queueUrl,
                    });
                    lambda_powertools_logger_1.default.info(`Successfully credited wallet for message ${messageId}`);
                    return { messageId, success: true };
                }
                catch (error) {
                    lambda_powertools_logger_1.default.error(`Failed to credit wallet for message ${messageId}:`, { error });
                    return { messageId, success: false };
                }
            }));
            lambda_powertools_logger_1.default.info("creditResults", { creditResults });
            // Track credit failures
            creditResults.forEach((result) => {
                if (result.status === "rejected" ||
                    (result.status === "fulfilled" && !result.value.success)) {
                    const messageId = result.status === "fulfilled"
                        ? result.value.messageId
                        : "unknown";
                    if (!failedMessageIds.includes(messageId)) {
                        failedMessageIds.push(messageId);
                    }
                }
            });
            // Step 6: Record transactions in parallel
            const transactionRecordResults = await Promise.allSettled(transactions.map(async ({ messageId, transaction }) => {
                try {
                    await this.recordTransactionToDB(transaction);
                    return { messageId, success: true };
                }
                catch (error) {
                    lambda_powertools_logger_1.default.error(`Failed to record transaction for message ${messageId}:`, { error });
                    return { messageId, success: false };
                }
            }));
            lambda_powertools_logger_1.default.info("transactionRecordResults", {
                transactionRecordResults,
            });
            // Track transaction recording failures
            transactionRecordResults.forEach((result) => {
                if (result.status === "rejected" ||
                    (result.status === "fulfilled" && !result.value.success)) {
                    const messageId = result.status === "fulfilled"
                        ? result.value.messageId
                        : "unknown";
                    if (!failedMessageIds.includes(messageId)) {
                        failedMessageIds.push(messageId);
                    }
                }
            });
            // Compile final list of successful messages
            successMessageIds.push(...queueMessages
                .filter((qm) => !failedMessageIds.includes(qm.messageId))
                .map((qm) => qm.messageId));
            return {
                successMessageIds,
                failedMessageIds,
            };
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("General error in processCryptoPayChannelsWebhook:", {
                error,
            });
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((qm) => qm.messageId),
            };
        }
    }
    async processCryptoPayInvoiceWebhook(queueMessages) {
        lambda_powertools_logger_1.default.info("processCryptoPayInvoiceWebhook", { queueMessages });
    }
    // Create User Wallet
    async createUserWallet(queueMessages) {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();
            const successMessageIds = [];
            const failedMessageIds = [];
            // 1.) Set up colllection
            const walletTypeCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.walletTypes);
            const currenciesCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.currencies);
            const userWalletCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.userWallets);
            // 2.) Get all wallet types and currencies
            const walletTypes = await walletTypeCollection.findAll();
            // Get unique currency IDs for all Wallet Type's
            const uniqueCurrencyIds = new Set();
            walletTypes.forEach((wallet) => {
                wallet.currencies.forEach((currency) => {
                    uniqueCurrencyIds.add(currency._id.toString()); // Ensure currency ID is a string
                });
            });
            const currencyIdsArray = Array.from(uniqueCurrencyIds); // Convert Set to Array
            // Get all Currencies with ID in the currencyIdsArray
            const walletCurrencies = await currenciesCollection.find({
                _id: {
                    $in: currencyIdsArray.map((id) => new mongoose_1.default.Types.ObjectId(id)),
                },
            });
            // 3.) Create user wallets
            const userWalletCreationResult = await Promise.allSettled(queueMessages.map(async (queue) => {
                try {
                    // Create wallet for each wallet type and currency
                    const walletPromises = walletTypes.flatMap((wallet) => wallet.currencies.map(async (currency) => {
                        try {
                            await userWalletCollection.insertOne({
                                userId: queue.body.userId,
                                walletType: new mongoose_1.default.Types.ObjectId(wallet.id),
                                walletTypeName: wallet.walletTypeName,
                                currency: currency,
                                currencyName: walletCurrencies.find((cur) => cur._id.toString() ===
                                    currency._id.toString())?.name,
                                currencySymbol: walletCurrencies.find((cur) => cur._id.toString() ===
                                    currency._id.toString())?.symbol,
                                availableBalance: 0,
                                lockedBalance: 0,
                            });
                            return { success: true };
                        }
                        catch (error) {
                            lambda_powertools_logger_1.default.debug(`Failed to create user wallet for currency ${currency._id}:`, { error });
                            return { success: false };
                        }
                    }));
                    const walletResults = await Promise.all(walletPromises);
                    const allWalletsCreatedSuccessfully = walletResults.every((result) => result.success);
                    return {
                        messageId: queue.messageId,
                        success: allWalletsCreatedSuccessfully,
                    };
                }
                catch (error) {
                    lambda_powertools_logger_1.default.error(`Failed to create all wallets for user ${queue.messageId}:`, {
                        error,
                    });
                    return {
                        messageId: queue.messageId,
                        success: false,
                    };
                }
            }));
            // 4.) Process operation result
            userWalletCreationResult.forEach((result) => {
                if (result.status === "fulfilled") {
                    if (result.value.success) {
                        successMessageIds.push(result.value.messageId);
                    }
                    else {
                        failedMessageIds.push(result.value.messageId);
                    }
                }
                else {
                    // Handle rejected promises
                    const messageId = queueMessages.find((qm) => qm.messageId === result.reason.messageId)?.messageId;
                    if (messageId) {
                        failedMessageIds.push(messageId);
                    }
                }
            });
            return {
                successMessageIds,
                failedMessageIds,
            };
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("General error in createUserWallet:", {
                error,
            });
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((qm) => qm.messageId),
            };
        }
    }
    async processCryptoPayWithdrawalWebhook(queueMessages) {
        try {
            await this.initialize();
            const connection = await this.getConnection();
            const transactionsCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.transactions);
            const failedMessageIdSet = new Set(); // retryable failures
            const permanentFailureIdSet = new Set(); // non-retryable, will be dropped
            // Validate webhook type & lookup existing withdrawal transactions
            const lookupResults = await Promise.allSettled(queueMessages.map(async (message) => {
                const { body, messageId } = message;
                // Non-retryable: unsupported webhook type
                if (body.type !== CryptoPayClient_1.CryptopayWebhookEventType.CoinWithdrawal) {
                    permanentFailureIdSet.add(messageId);
                    lambda_powertools_logger_1.default.warn("Ignoring withdrawal webhook with invalid type", {
                        messageId,
                        type: body.type,
                    });
                    return null;
                }
                const tx = await transactionsCollection.findOne({
                    externalTransactionId: body.data.id,
                    transactionType: wallets_service_1.TransactionType.WITHDRAWAL,
                });
                // Non-retryable: we will never find a transaction later (id mismatch / not created)
                if (!tx) {
                    permanentFailureIdSet.add(messageId);
                    lambda_powertools_logger_1.default.warn("Ignoring withdrawal webhook with unknown transaction id", {
                        messageId,
                        externalId: body.data.id,
                    });
                    return null;
                }
                return {
                    messageId,
                    queueMessage: message,
                    transaction: tx,
                };
            }));
            const resolved = [];
            lookupResults.forEach((res, i) => {
                const messageId = queueMessages[i].messageId;
                if (res.status === "fulfilled") {
                    // fulfilled may be null (permanent skip) or an object
                    if (res.value) {
                        resolved.push(res.value);
                    }
                }
                else {
                    failedMessageIdSet.add(messageId);
                    lambda_powertools_logger_1.default.error("Withdrawal lookup transient failure", {
                        messageId,
                        error: res.reason,
                    });
                }
            });
            // Update statuses (only for successfully resolved items)
            const statusUpdateResults = await Promise.allSettled(resolved.map(async ({ queueMessage: { body }, transaction }) => {
                switch (body.data.status) {
                    case CryptoPayClient_1.CryptopayWebhookEventStatus.completed:
                        await transactionsCollection.updateOne({
                            _id: transaction._id,
                            status: {
                                $ne: wallets_service_1.TransactionStatus.SUCCESS,
                            },
                        }, {
                            $set: {
                                status: wallets_service_1.TransactionStatus.SUCCESS,
                                transactionHash: body.data.txid ??
                                    transaction.transactionHash,
                            },
                        });
                        break;
                    case CryptoPayClient_1.CryptopayWebhookEventStatus.cancelled:
                        await transactionsCollection.updateOne({
                            _id: transaction._id,
                            status: {
                                $nin: [
                                    wallets_service_1.TransactionStatus.FAILED,
                                    wallets_service_1.TransactionStatus.SUCCESS,
                                ],
                            },
                        }, {
                            $set: {
                                status: wallets_service_1.TransactionStatus.FAILED,
                                transactionHash: body.data.txid ??
                                    transaction.transactionHash,
                            },
                        });
                        break;
                    default:
                        await transactionsCollection.updateOne({
                            _id: transaction._id,
                            status: {
                                $nin: [
                                    wallets_service_1.TransactionStatus.PENDING,
                                    wallets_service_1.TransactionStatus.SUCCESS,
                                ],
                            },
                        }, {
                            $set: {
                                status: wallets_service_1.TransactionStatus.PENDING,
                                transactionHash: body.data.txid ??
                                    transaction.transactionHash,
                            },
                        });
                        break;
                }
            }));
            statusUpdateResults.forEach((res, i) => {
                const messageId = resolved[i].messageId;
                if (res.status !== "fulfilled") {
                    failedMessageIdSet.add(messageId);
                    lambda_powertools_logger_1.default.error("Failed to update withdrawal transaction status (transient)", {
                        messageId,
                        error: res.status === "rejected" ? res.reason : res,
                    });
                }
            });
            const failedMessageIds = Array.from(failedMessageIdSet);
            const successMessageIds = queueMessages
                .map((m) => m.messageId)
                .filter((id) => !failedMessageIdSet.has(id));
            if (permanentFailureIdSet.size) {
                lambda_powertools_logger_1.default.info("Permanent withdrawal webhook failures skipped (no retry)", {
                    permanentFailureIds: Array.from(permanentFailureIdSet),
                });
            }
            return { successMessageIds, failedMessageIds };
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("General error in processCryptoPayWithdrawalWebhook:", {
                error,
            });
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((m) => m.messageId),
            };
        }
    }
    async getUserWallet({ userId, currency, walletType, }) {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();
            const userWalletCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.userWallets);
            const userWallet = await userWalletCollection.findOne({
                userId,
                currency,
                walletType,
            });
            return userWallet;
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("General error in getUserWallet:", { error });
        }
    }
    async lockUserBalance({ userId, amount, currency, walletType, }) {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();
            // Get user wallet collection
            const userWalletCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.userWallets);
            // Atomically check sufficient balance and lock if available
            const result = await userWalletCollection.updateOne({
                userId,
                currency,
                walletType,
                availableBalance: { $gte: amount }, // Only update if sufficient balance
            }, {
                $inc: {
                    lockedBalance: amount,
                    availableBalance: -amount,
                },
            });
            // Check if the update actually modified a document
            const wallet = await this.getUserWallet({
                userId,
                currency,
                walletType,
            });
            if (!wallet) {
                return {
                    success: false,
                    error: "WALLET_NOT_FOUND",
                    message: `No wallet found for user ${userId} with currency ${currency} and walletType ${walletType}`,
                };
            }
            // Either wallet doesn't exist or insufficient balance
            if (result.modifiedCount === 0) {
                return {
                    success: false,
                    error: "INSUFFICIENT_BALANCE",
                    message: `Insufficient balance. Required: ${amount}, Available: ${wallet.availableBalance}`,
                    requiredAmount: amount,
                    availableBalance: wallet.availableBalance,
                };
            }
            return { success: true, wallet };
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("General error in lockUserBalance:", { error });
            throw error;
        }
    }
    computeTotalAmountToLock(input) {
        const { entryPrice, takeProfitPrice, tradeSide, tradeAmount } = input;
        // Compute trading fee of 1% of the trade amount or $1, whichever is greater
        const tradingFee = Math.max(tradeAmount * 0.01, 1);
        // Compute profit amount from trade amount based on trade side, entry price, and take profit price
        let projectedProfitAmount = 0;
        if (tradeSide === enums_2.TradeSide.LONG) {
            // compute profit amount from entry price to take profit price for long trades
            const profitPercentage = (takeProfitPrice - entryPrice) / entryPrice;
            projectedProfitAmount = tradeAmount * profitPercentage;
        }
        else {
            // compute profit amount from entry price to take profit price for short trades
            const profitPercentage = (entryPrice - takeProfitPrice) / entryPrice;
            projectedProfitAmount = tradeAmount * profitPercentage;
        }
        const totalAmountToLock = tradingFee + projectedProfitAmount;
        return { tradingFee, projectedProfitAmount, totalAmountToLock };
    }
    async createInvoice({ userId, currency, amountDue, invoiceType, tradeId, tradeSide, baseAsset, logoUrl = "", quoteCurrency, }) {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();
            const invoicesCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.invoices);
            // Check if invoice already exists for this trade
            const existingInvoice = await invoicesCollection.findOne({
                userId,
                tradeId,
                invoiceType,
            });
            if (existingInvoice) {
                return {
                    success: false,
                    error: "INVOICE_ALREADY_EXISTS",
                    message: `Invoice already exists for trade ${tradeId} and type ${invoiceType}`,
                    invoice: existingInvoice,
                };
            }
            // Create new invoice
            const invoiceData = {
                id: new mongoose_1.default.Types.ObjectId().toString(),
                userId,
                invoiceType,
                currency,
                amountDue,
                amountPaid: 0,
                amountOutstanding: amountDue,
                status: enums_2.InvoiceStatus.PENDING,
                tradeId,
                tradeSide,
                baseAsset,
                logoUrl,
                quoteCurrency,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            const createdInvoice = await invoicesCollection.insertOne(invoiceData);
            lambda_powertools_logger_1.default.info("Successfully created invoice", {
                userId,
                invoiceId: createdInvoice.id,
                tradeId,
                invoiceType,
                amountDue,
            });
            return {
                success: true,
                invoice: createdInvoice,
            };
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("General error in createInvoice:", { error });
            return {
                success: false,
                error: "SYSTEM_ERROR",
                message: error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            };
        }
    }
    async getInvoiceById(invoiceId) {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();
            const invoicesCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.invoices);
            const invoice = await invoicesCollection.findOne({ id: invoiceId });
            if (!invoice) {
                throw new Error(`Invoice with ID ${invoiceId} not found`);
            }
            return invoice;
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("General error in getInvoiceById:", { error });
            throw error;
        }
    }
    async getInvoices({ userId, tradeId, status, invoiceType, } = {}) {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();
            const invoicesCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.invoices);
            // Build filter object
            const filter = {};
            if (userId)
                filter.userId = userId;
            if (tradeId)
                filter.tradeId = tradeId;
            if (status)
                filter.status = status;
            if (invoiceType)
                filter.invoiceType = invoiceType;
            const invoices = await invoicesCollection.find(filter);
            return invoices;
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("General error in getInvoices:", { error });
            throw error;
        }
    }
    async updateInvoice({ invoiceId, amountPaid, status, amountDue, }) {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();
            const invoicesCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.invoices);
            // Get current invoice
            const currentInvoice = await invoicesCollection.findOne({
                id: invoiceId,
            });
            if (!currentInvoice) {
                return {
                    success: false,
                    error: "INVOICE_NOT_FOUND",
                    message: `Invoice with ID ${invoiceId} not found`,
                };
            }
            // Build update object
            const updateData = {};
            if (amountPaid !== undefined) {
                updateData.amountPaid = amountPaid;
                // Recalculate outstanding amount
                const newAmountDue = amountDue ?? currentInvoice.amountDue;
                updateData.amountOutstanding = Math.max(0, newAmountDue - amountPaid);
                // Auto-update status based on payment
                if (amountPaid >= newAmountDue) {
                    updateData.status = enums_2.InvoiceStatus.PAID;
                }
                else if (amountPaid > 0) {
                    updateData.status = enums_2.InvoiceStatus.PENDING; // Partially paid
                }
            }
            if (amountDue !== undefined) {
                updateData.amountDue = amountDue;
                const currentAmountPaid = currentInvoice.amountPaid;
                updateData.amountOutstanding = Math.max(0, amountDue - currentAmountPaid);
            }
            if (status !== undefined) {
                updateData.status = status;
            }
            // Update the invoice
            const result = await invoicesCollection.updateOne({ id: invoiceId }, { $set: updateData });
            if (result.modifiedCount === 0) {
                return {
                    success: false,
                    error: "UPDATE_FAILED",
                    message: "Failed to update invoice",
                };
            }
            // Get updated invoice
            const updatedInvoice = await invoicesCollection.findOne({
                id: invoiceId,
            });
            lambda_powertools_logger_1.default.info("Successfully updated invoice", {
                invoiceId,
                updateData,
            });
            return {
                success: true,
                invoice: updatedInvoice,
            };
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("General error in updateInvoice:", { error });
            return {
                success: false,
                error: "SYSTEM_ERROR",
                message: error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            };
        }
    }
    // Helper method to pay an invoice (combines update with wallet operations)
    async payInvoice({ invoiceId, userId, paymentAmount, }) {
        try {
            // Get the invoice first
            const invoice = await this.getInvoiceById(invoiceId);
            if (!invoice) {
                throw new Error(`Invoice with ID ${invoiceId} not found`);
            }
            // Verify user owns the invoice
            if (invoice.userId !== userId) {
                throw new Error("User not authorized to pay this invoice");
            }
            // Check if already paid
            if (invoice.status === enums_2.InvoiceStatus.PAID) {
                throw new Error("Invoice is already paid");
            }
            // Lock user balance for payment
            const lockResult = await this.lockUserBalance({
                userId,
                amount: paymentAmount,
                currency: invoice.currency,
                walletType: "MAIN", // Assuming MAIN wallet
            });
            if (!lockResult.success) {
                throw new Error(lockResult.message);
            }
            // Update invoice with payment
            const newAmountPaid = invoice.amountPaid + paymentAmount;
            const updateResult = await this.updateInvoice({
                invoiceId,
                amountPaid: newAmountPaid,
            });
            if (!updateResult.success) {
                // TODO: Rollback the locked balance if invoice update fails
                return updateResult;
            }
            return {
                success: true,
                invoice: updateResult.invoice,
            };
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("General error in payInvoice:", { error });
            return {
                success: false,
                error: "SYSTEM_ERROR",
                message: error instanceof Error
                    ? error.message
                    : "Unknown error occurred",
            };
        }
    }
}
exports.WalletsService = WalletsService;
exports.default = new WalletsService();
