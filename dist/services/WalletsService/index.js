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
            lambda_powertools_logger_1.default.debug("Error recording transaction:", { error });
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
            lambda_powertools_logger_1.default.debug(`Error getting transaction from DB:`, { error });
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
            lambda_powertools_logger_1.default.debug("Error crediting user wallet:", { error });
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
                    lambda_powertools_logger_1.default.debug(`Failed to confirm payment for message ${qm.messageId}:`, { error });
                    return { messageId: qm.messageId, success: false };
                }
            }));
            console.log("confirmationResults", { confirmationResults });
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
                    lambda_powertools_logger_1.default.debug(`Failed to find wallet details for message ${qm.messageId}:`, { error });
                    return { messageId: qm.messageId, success: false };
                }
            }));
            console.log("walletLookupResults", { walletLookupResults });
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
            console.log("transactions", { transactions });
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
                        console.log(`Transaction ${transaction.externalTransactionId} already credited, skipping.`);
                        return null; // Skip this one
                    }
                    return { messageId, userId, queueMessage };
                }
                catch (error) {
                    console.log(`Failed to check transaction status for message ${messageId}:`, { error });
                    failedMessageIds.push(messageId);
                    return null;
                }
            }));
            console.log("transactionsToCredit", { transactionsToCredit });
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
                    if (parseFloat(queueMessage.body.data.paid_amount ?? "0") > 10) {
                        await (0, helpers_1.publishMessageToQueue)({
                            queueUrl: commonSecrets.TRACK_USER_ONBOARDING_CHECKLIST_QUEUE ??
                                "",
                            message: {
                                userId,
                                onboardingChecklistItem: users_service_1.UserOnboardingChecklist.IS_FIRST_DEPOSIT_MADE,
                            },
                        });
                    }
                    console.debug(`Successfully credited wallet for message ${messageId}`);
                    return { messageId, success: true };
                }
                catch (error) {
                    console.debug(`Failed to credit wallet for message ${messageId}:`, { error });
                    return { messageId, success: false };
                }
            }));
            console.log("creditResults", { creditResults });
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
                    lambda_powertools_logger_1.default.debug(`Failed to record transaction for message ${messageId}:`, { error });
                    return { messageId, success: false };
                }
            }));
            console.log("transactionRecordResults", {
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
}
exports.WalletsService = WalletsService;
exports.default = new WalletsService();
