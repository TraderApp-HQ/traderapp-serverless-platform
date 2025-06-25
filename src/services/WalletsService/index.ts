import log from "@dazn/lambda-powertools-logger";
import "dotenv/config";
import mongoose from "mongoose";
import {
    CryptoPayClient,
    CryptopayWebhookEventStatus,
    ICryptopayWebhookEvent,
} from "src/clients/CryptoPayClient";
import { MongoDBClient } from "src/clients/MongoDBClient";
import { WalletsServiceCollections } from "src/clients/MongoDBClient/constants";
import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { IQueueMessageBody } from "src/config/interfaces";
import { SecretLocation } from "src/config/secrets/enums";
import { getSecrets } from "src/config/secrets/helpers";
import { IWalletsServiceSecrets } from "src/config/secrets/interfaces";
import { UserOnboardingStatusField } from "src/types/users-service";
import {
    ITransaction,
    IUserWallet,
    IUserWalletDepositDetail,
    IWalletCurrency,
    IWalletInput,
    IWalletType,
    TransactionStatus,
} from "src/types/wallets-service";

export class WalletsService {
    private connection: mongoose.Connection | null = null;
    private secrets: IWalletsServiceSecrets | null = null;
    private initialized: boolean = false;
    private initializationPromise: Promise<void> | null = null;

    constructor() {}

    // Initialize the service once
    private async initialize(): Promise<void> {
        if (this.initialized) return;

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
                console.log(
                    `=============== Getting secrets  for ${SecretLocation.walletsServiceSecrets}/${env} =====================`
                );
                this.secrets = await getSecrets<IWalletsServiceSecrets>(
                    `${SecretLocation.walletsServiceSecrets}/${env}`
                );

                // Create connection
                this.connection = mongoose.createConnection(
                    this.secrets.WALLET_SERVICE_DB_URL
                );

                this.initialized = true;
            } catch (error) {
                log.error("Failed to initialize WalletsService:", { error });
                throw error;
            } finally {
                this.initializationPromise = null;
            }
        })();

        await this.initializationPromise;
    }

    // Close resources
    private async closeResources(): Promise<void> {
        if (this.connection) {
            await this.connection.close();
            this.connection = null;
        }
    }

    // For cleanup, especially in testing
    public async cleanup(): Promise<void> {
        await this.closeResources();
        this.initialized = false;
    }

    // Get connection (ensures initialization first)
    private async getConnection(): Promise<mongoose.Connection> {
        await this.initialize();
        if (!this.connection) {
            throw new Error("Database connection not available");
        }
        return this.connection;
    }

    // Get secrets (ensures initialization first)
    private async getSecrets(): Promise<IWalletsServiceSecrets> {
        await this.initialize();
        if (!this.secrets) {
            throw new Error("Secrets not available");
        }
        return this.secrets;
    }

    // Record transaction to DB
    private async recordTransactionToDB(
        transaction: ITransaction
    ): Promise<void> {
        try {
            const connection = await this.getConnection();
            const transactionsCollection = new MongoDBClient<ITransaction>(
                connection,
                WalletsServiceCollections.transactions
            );

            // Find existing transaction
            const existingTransaction = await transactionsCollection.findOne({
                externalTransactionId: transaction.externalTransactionId,
            });

            if (existingTransaction) {
                // Update existing transaction status if different
                if (existingTransaction.status !== transaction.status) {
                    await transactionsCollection.updateOne(
                        {
                            externalTransactionId:
                                transaction.externalTransactionId,
                        },
                        { $set: { status: transaction.status } }
                    );
                }
            } else {
                // Insert new transaction
                await transactionsCollection.insertOne(transaction);
            }
        } catch (error) {
            log.debug("Error recording transaction:", { error });
            throw error;
        }
    }

    // Get transaction from DB
    private async getTransactionFromDB(
        externalTransactionId: string
    ): Promise<ITransaction | null> {
        try {
            const connection = await this.getConnection();
            const transactionsCollection = new MongoDBClient<ITransaction>(
                connection,
                WalletsServiceCollections.transactions
            );

            return transactionsCollection.findOne({
                externalTransactionId,
            });
        } catch (error) {
            log.debug(`Error getting transaction from DB:`, { error });
            throw error;
        }
    }

    // Credit user wallet
    private async creditUserWallet({
        userId,
        amount,
    }: {
        userId: string;
        amount: number;
    }): Promise<void> {
        try {
            const connection = await this.getConnection();
            const userWalletsCollection = new MongoDBClient<IUserWallet>(
                connection,
                WalletsServiceCollections.userWallets
            );

            // Use $inc operator to atomically increment the availableBalance
            await userWalletsCollection.updateOne(
                { userId },
                { $inc: { availableBalance: amount } }
            );
        } catch (error) {
            log.debug("Error crediting user wallet:", { error });
            throw error;
        }
    }

    // Process CryptoPay channels webhook
    public async processCryptoPayChannelsWebhook(
        queueMessages: IQueueMessageBody<ICryptopayWebhookEvent>[]
    ): Promise<{
        successMessageIds: string[];
        failedMessageIds: string[];
    }> {
        try {
            // Ensure service is initialized
            await this.initialize();
            const secrets = await this.getSecrets();

            const cryptopayClient = new CryptoPayClient({
                baseUrl: secrets.CRYPTOPAY_BASE_URL,
                apiKey: secrets.CRYPTOPAY_DEPOSITS_API_KEY,
                apiSecret: secrets.CRYPTOPAY_DEPOSITS_API_SECRET,
                webhooksSharedSecret: secrets.CRYPTOPAY_WEBHOOK_SHARED_SECRET,
            });

            const connection = await this.getConnection();
            const userWalletDepositDetailsCollection =
                new MongoDBClient<IUserWalletDepositDetail>(
                    connection,
                    WalletsServiceCollections.userWalletDepositDetails
                );

            const successMessageIds: string[] = [];
            const failedMessageIds: string[] = [];
            const completedMessages: IQueueMessageBody<ICryptopayWebhookEvent>[] =
                [];

            // Step 1: Confirm completed payments in parallel
            const confirmationResults = await Promise.allSettled(
                queueMessages
                    .filter(
                        (qm) =>
                            qm.body.data.status ===
                            CryptopayWebhookEventStatus.completed
                    )
                    .map(async (qm) => {
                        try {
                            await cryptopayClient.confirmChannelsPayment(
                                qm.body
                            );
                            completedMessages.push(qm);
                            return { messageId: qm.messageId, success: true };
                        } catch (error) {
                            log.debug(
                                `Failed to confirm payment for message ${qm.messageId}:`,
                                { error }
                            );
                            return { messageId: qm.messageId, success: false };
                        }
                    })
            );

            console.log("confirmationResults", { confirmationResults });

            // Track confirmation failures
            confirmationResults.forEach((result) => {
                if (result.status === "rejected" || !result.value.success) {
                    const messageId =
                        result.status === "fulfilled"
                            ? result.value.messageId
                            : "unknown";
                    failedMessageIds.push(messageId);
                }
            });

            // Step 2: Find wallet details for all messages in parallel
            const walletLookupResults = await Promise.allSettled(
                queueMessages.map(async (qm) => {
                    try {
                        const userWalletDetail =
                            await userWalletDepositDetailsCollection.findOne({
                                externalWalletId: qm.body.data.channel_id,
                            });
                        return {
                            messageId: qm.messageId,
                            queueMessage: qm,
                            userWalletDetail,
                            success: true,
                        };
                    } catch (error) {
                        log.debug(
                            `Failed to find wallet details for message ${qm.messageId}:`,
                            { error }
                        );
                        return { messageId: qm.messageId, success: false };
                    }
                })
            );

            console.log("walletLookupResults", { walletLookupResults });

            // Process successful wallet lookups
            const successfulLookups = walletLookupResults
                .filter(
                    (
                        result
                    ): result is PromiseFulfilledResult<{
                        messageId: string;
                        queueMessage: IQueueMessageBody<ICryptopayWebhookEvent>;
                        userWalletDetail: IUserWalletDepositDetail | null;
                        success: boolean;
                    }> => result.status === "fulfilled" && result.value.success
                )
                .map((result) => result.value);

            // Track lookup failures
            walletLookupResults.forEach((result) => {
                if (
                    result.status === "rejected" ||
                    (result.status === "fulfilled" && !result.value.success)
                ) {
                    const messageId =
                        result.status === "fulfilled"
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
                    transaction: cryptopayClient.formatTransaction(
                        lookup.queueMessage.body,
                        userId
                    ),
                    userId,
                    queueMessage: lookup.queueMessage,
                };
            });

            console.log("transactions", { transactions });

            // Step 4: Check which transactions need crediting (not already completed)
            const completedDeposits = transactions.filter(
                (t) =>
                    t.queueMessage.body.data.status ===
                        CryptopayWebhookEventStatus.completed && t.userId
            );

            const transactionsToCredit = await Promise.all(
                completedDeposits.map(
                    async ({
                        messageId,
                        transaction,
                        userId,
                        queueMessage,
                    }) => {
                        try {
                            // Check if transaction is already marked as SUCCESS
                            const existingTransaction =
                                await this.getTransactionFromDB(
                                    transaction.externalTransactionId
                                );
                            if (
                                existingTransaction &&
                                existingTransaction.status ===
                                    TransactionStatus.SUCCESS
                            ) {
                                console.log(
                                    `Transaction ${transaction.externalTransactionId} already credited, skipping.`
                                );
                                return null; // Skip this one
                            }
                            return { messageId, userId, queueMessage };
                        } catch (error) {
                            console.log(
                                `Failed to check transaction status for message ${messageId}:`,
                                { error }
                            );
                            failedMessageIds.push(messageId);
                            return null;
                        }
                    }
                )
            );

            console.log("transactionsToCredit", { transactionsToCredit });

            // Filter out nulls (already credited or errored)
            const filteredTransactionsToCredit = transactionsToCredit.filter(
                Boolean
            ) as {
                messageId: string;
                userId: string;
                queueMessage: IQueueMessageBody<ICryptopayWebhookEvent>;
            }[];

            // check if first deposit has not been made so we can deduct activation fee

            // Step 5: Credit user wallets for transactions that need crediting
            const creditResults = await Promise.allSettled(
                filteredTransactionsToCredit.map(
                    async ({ messageId, userId, queueMessage }) => {
                        try {
                            await this.creditUserWallet({
                                userId,
                                amount: parseFloat(
                                    queueMessage.body.data.paid_amount ?? "0"
                                ),
                            });
                            // Publish user to queue for first deposit tracking if paid_amount is greater than $10
                            if (
                                parseFloat(
                                    queueMessage.body.data.paid_amount ?? "0"
                                ) > 10
                            ) {
                                await publishMessageToQueue({
                                    queueUrl:
                                        process.env
                                            .UPDATE_USER_ONBOARDING_STATUS_QUEUE ??
                                        "",
                                    message: {
                                        userId,
                                        taskField:
                                            UserOnboardingStatusField.IS_FIRST_DEPOSIT_MADE,
                                    },
                                });
                            }

                            console.debug(
                                `Successfully credited wallet for message ${messageId}`
                            );
                            return { messageId, success: true };
                        } catch (error) {
                            console.debug(
                                `Failed to credit wallet for message ${messageId}:`,
                                { error }
                            );
                            return { messageId, success: false };
                        }
                    }
                )
            );

            console.log("creditResults", { creditResults });

            // Track credit failures
            creditResults.forEach((result) => {
                if (
                    result.status === "rejected" ||
                    (result.status === "fulfilled" && !result.value.success)
                ) {
                    const messageId =
                        result.status === "fulfilled"
                            ? result.value.messageId
                            : "unknown";
                    if (!failedMessageIds.includes(messageId)) {
                        failedMessageIds.push(messageId);
                    }
                }
            });

            // Step 6: Record transactions in parallel
            const transactionRecordResults = await Promise.allSettled(
                transactions.map(async ({ messageId, transaction }) => {
                    try {
                        await this.recordTransactionToDB(transaction);
                        return { messageId, success: true };
                    } catch (error) {
                        log.debug(
                            `Failed to record transaction for message ${messageId}:`,
                            { error }
                        );
                        return { messageId, success: false };
                    }
                })
            );

            console.log("transactionRecordResults", {
                transactionRecordResults,
            });

            // Track transaction recording failures
            transactionRecordResults.forEach((result) => {
                if (
                    result.status === "rejected" ||
                    (result.status === "fulfilled" && !result.value.success)
                ) {
                    const messageId =
                        result.status === "fulfilled"
                            ? result.value.messageId
                            : "unknown";
                    if (!failedMessageIds.includes(messageId)) {
                        failedMessageIds.push(messageId);
                    }
                }
            });

            // Compile final list of successful messages
            successMessageIds.push(
                ...queueMessages
                    .filter((qm) => !failedMessageIds.includes(qm.messageId))
                    .map((qm) => qm.messageId)
            );

            return {
                successMessageIds,
                failedMessageIds,
            };
        } catch (error) {
            log.error("General error in processCryptoPayChannelsWebhook:", {
                error,
            });
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((qm) => qm.messageId),
            };
        }
    }

    public async processCryptoPayInvoiceWebhook(
        queueMessages: IQueueMessageBody<ICryptopayWebhookEvent>[]
    ): Promise<void> {
        log.info("processCryptoPayInvoiceWebhook", { queueMessages });
    }

    // Create User Wallet
    public async createUserWallet(
        queueMessages: IQueueMessageBody<IWalletInput>[]
    ): Promise<{
        successMessageIds: string[];
        failedMessageIds: string[];
    }> {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();

            const successMessageIds: string[] = [];
            const failedMessageIds: string[] = [];

            // 1.) Set up colllection
            const walletTypeCollection = new MongoDBClient<IWalletType>(
                connection,
                WalletsServiceCollections.walletTypes
            );
            const currenciesCollection = new MongoDBClient<IWalletCurrency>(
                connection,
                WalletsServiceCollections.currencies
            );
            const userWalletCollection = new MongoDBClient<IUserWallet>(
                connection,
                WalletsServiceCollections.userWallets
            );

            // 2.) Get all wallet types and currencies
            const walletTypes = await walletTypeCollection.findAll();

            // Get unique currency IDs for all Wallet Type's
            const uniqueCurrencyIds = new Set<string>();
            walletTypes.forEach((wallet) => {
                wallet.currencies.forEach((currency) => {
                    uniqueCurrencyIds.add(currency._id.toString()); // Ensure currency ID is a string
                });
            });
            const currencyIdsArray = Array.from(uniqueCurrencyIds); // Convert Set to Array

            // Get all Currencies with ID in the currencyIdsArray
            const walletCurrencies = await currenciesCollection.find({
                _id: {
                    $in: currencyIdsArray.map(
                        (id) => new mongoose.Types.ObjectId(id)
                    ),
                },
            });

            // 3.) Create user wallets
            const userWalletCreationResult = await Promise.allSettled(
                queueMessages.map(async (queue) => {
                    try {
                        // Create wallet for each wallet type and currency
                        const walletPromises = walletTypes.flatMap((wallet) =>
                            wallet.currencies.map(async (currency) => {
                                try {
                                    await userWalletCollection.insertOne({
                                        userId: queue.body.userId,
                                        walletType: new mongoose.Types.ObjectId(
                                            wallet.id
                                        ),
                                        walletTypeName: wallet.walletTypeName,
                                        currency: currency,
                                        currencyName: walletCurrencies.find(
                                            (cur) =>
                                                cur._id.toString() ===
                                                currency._id.toString()
                                        )?.name,
                                        currencySymbol: walletCurrencies.find(
                                            (cur) =>
                                                cur._id.toString() ===
                                                currency._id.toString()
                                        )?.symbol,
                                        availableBalance: 0,
                                        lockedBalance: 0,
                                    });
                                    return { success: true };
                                } catch (error) {
                                    log.debug(
                                        `Failed to create user wallet for currency ${currency._id}:`,
                                        { error }
                                    );
                                    return { success: false };
                                }
                            })
                        );

                        const walletResults = await Promise.all(walletPromises);
                        const allWalletsCreatedSuccessfully =
                            walletResults.every((result) => result.success);

                        return {
                            messageId: queue.messageId,
                            success: allWalletsCreatedSuccessfully,
                        };
                    } catch (error) {
                        log.error(
                            `Failed to create all wallets for user ${queue.messageId}:`,
                            {
                                error,
                            }
                        );
                        return {
                            messageId: queue.messageId,
                            success: false,
                        };
                    }
                })
            );

            // 4.) Process operation result
            userWalletCreationResult.forEach((result) => {
                if (result.status === "fulfilled") {
                    if (result.value.success) {
                        successMessageIds.push(result.value.messageId);
                    } else {
                        failedMessageIds.push(result.value.messageId);
                    }
                } else {
                    // Handle rejected promises
                    const messageId = queueMessages.find(
                        (qm) => qm.messageId === result.reason.messageId
                    )?.messageId;
                    if (messageId) {
                        failedMessageIds.push(messageId);
                    }
                }
            });

            return {
                successMessageIds,
                failedMessageIds,
            };
        } catch (error) {
            log.error("General error in createUserWallet:", {
                error,
            });
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((qm) => qm.messageId),
            };
        }
    }
}

export default new WalletsService();
