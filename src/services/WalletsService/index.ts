import log from "@dazn/lambda-powertools-logger";
import "dotenv/config";
import mongoose from "mongoose";
import {
    CryptoPayClient,
    CryptopayWebhookEventStatus,
    CryptopayWebhookEventType,
    ICryptopayWebhookEvent,
} from "src/clients/CryptoPayClient";
import { MongoDBClient } from "src/clients/MongoDBClient";
import { WalletsServiceCollections } from "src/clients/MongoDBClient/constants";
import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { IQueueMessageBody } from "src/config/interfaces";
import { SecretLocation } from "src/config/secrets/enums";
import { getSecrets } from "src/config/secrets/helpers";
import {
    ICommonSecrets,
    IWalletsServiceSecrets,
} from "src/config/secrets/interfaces";
import { UserOnboardingChecklist } from "src/types/users-service";
import {
    ITransaction,
    IUserWallet,
    IUserWalletDepositDetail,
    IWalletCurrency,
    IWalletInput,
    IWalletType,
    TransactionStatus,
    TransactionType,
} from "src/types/wallets-service";
import { publishDepositConfirmationToQueue } from "./helper";
import { IInvoice } from "src/services/TradingEngineService/interfaces";
import {
    InvoiceType,
    InvoiceStatus,
    TradeSide,
} from "src/services/TradingEngineService/enums";
import { Currency } from "src/config/enums";

interface ICreateInvoiceInput {
    userId: string;
    currency: Currency;
    amountDue: number;
    invoiceType: InvoiceType;
    tradeId: string;
    tradeSide: TradeSide;
    baseAsset: string;
    logoUrl?: string;
    quoteCurrency: string;
}

interface IUpdateInvoiceInput {
    invoiceId: string;
    amountPaid?: number;
    status?: InvoiceStatus;
    amountDue?: number;
}
import { publishWithdrawlConfirmationToQueue } from "./helper.withdrawal";

export class WalletsService {
    private connection: mongoose.Connection | null = null;
    private walletSecrets: IWalletsServiceSecrets | null = null;
    private commonSecrets: ICommonSecrets | null = null;
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
                // Fetch both secrets once
                const [walletSecrets, commonSecrets] = await Promise.all([
                    getSecrets<IWalletsServiceSecrets>(
                        `${SecretLocation.walletsServiceSecrets}/${env}`
                    ),
                    getSecrets<ICommonSecrets>(
                        `${SecretLocation.commonSecrets}/${env}`
                    ),
                ]);
                this.walletSecrets = walletSecrets as IWalletsServiceSecrets;
                this.commonSecrets = commonSecrets as ICommonSecrets;

                // Create connection
                this.connection = mongoose.createConnection(
                    this.walletSecrets.WALLET_SERVICE_DB_URL
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
    private async getWalletSecrets(): Promise<IWalletsServiceSecrets> {
        await this.initialize();
        if (!this.walletSecrets) {
            throw new Error("Secrets not available");
        }
        return this.walletSecrets;
    }
    private async getCommonSecrets(): Promise<ICommonSecrets> {
        await this.initialize();
        if (!this.commonSecrets) {
            throw new Error("Common Secrets not available");
        }
        return this.commonSecrets;
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
            log.error("Error recording transaction:", { error });
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
            log.error(`Error getting transaction from DB:`, { error });
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
            log.error("Error crediting user wallet:", { error });
            throw error;
        }
    }

    private async debitUserWallet({
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

            // Use $inc operator to atomically decrement the availableBalance
            await userWalletsCollection.updateOne(
                { userId },
                { $inc: { availableBalance: -amount } }
            );
        } catch (error) {
            log.error("Error debiting user wallet:", { error });
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
            const [walletSecrets, commonSecrets] = await Promise.all([
                this.getWalletSecrets(),
                this.getCommonSecrets(),
            ]);

            const cryptopayClient = new CryptoPayClient({
                baseUrl: walletSecrets.CRYPTOPAY_BASE_URL,
                apiKey: walletSecrets.CRYPTOPAY_DEPOSITS_API_KEY,
                apiSecret: walletSecrets.CRYPTOPAY_DEPOSITS_API_SECRET,
                webhooksSharedSecret:
                    walletSecrets.CRYPTOPAY_WEBHOOK_SHARED_SECRET,
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
                            log.error(
                                `Failed to confirm payment for message ${qm.messageId}:`,
                                { error }
                            );
                            return { messageId: qm.messageId, success: false };
                        }
                    })
            );

            log.info("confirmationResults", { confirmationResults });

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
                        log.error(
                            `Failed to find wallet details for message ${qm.messageId}:`,
                            { error }
                        );
                        return { messageId: qm.messageId, success: false };
                    }
                })
            );

            log.info("walletLookupResults", { walletLookupResults });

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

            log.info("transactions", { transactions });

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
                                log.error(
                                    `Transaction ${transaction.externalTransactionId} already credited, skipping.`
                                );
                                return null; // Skip this one
                            }
                            return { messageId, userId, queueMessage };
                        } catch (error) {
                            log.error(
                                `Failed to check transaction status for message ${messageId}:`,
                                { error }
                            );
                            failedMessageIds.push(messageId);
                            return null;
                        }
                    }
                )
            );

            log.info("transactionsToCredit", { transactionsToCredit });

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
                                ) >= 10
                            ) {
                                await publishMessageToQueue({
                                    queueUrl:
                                        commonSecrets.TRACK_USER_ONBOARDING_CHECKLIST_QUEUE ??
                                        "",
                                    message: JSON.stringify({
                                        userId,
                                        onboardingChecklistItem:
                                            UserOnboardingChecklist.IS_FIRST_DEPOSIT_MADE,
                                    }),
                                });
                            }

                            // publish deposit notification to queue
                            const amount = parseFloat(
                                queueMessage.body.data.paid_amount ?? "0"
                            );

                            const transactionId =
                                queueMessage.body.data.txid ?? "";

                            const queueUrl =
                                this.commonSecrets?.EMAIL_NOTIFICATIONS_QUEUE ??
                                "";

                            const address = queueMessage.body.data.address;

                            const network = queueMessage.body.data.network;

                            await publishDepositConfirmationToQueue({
                                amount,
                                transactionId,
                                userId,
                                queueUrl,
                                address,
                                network,
                            });

                            log.info(
                                `Successfully credited wallet for message ${messageId}`
                            );
                            return { messageId, success: true };
                        } catch (error) {
                            log.error(
                                `Failed to credit wallet for message ${messageId}:`,
                                { error }
                            );
                            return { messageId, success: false };
                        }
                    }
                )
            );

            log.info("creditResults", { creditResults });

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
                        log.error(
                            `Failed to record transaction for message ${messageId}:`,
                            { error }
                        );
                        return { messageId, success: false };
                    }
                })
            );

            log.info("transactionRecordResults", {
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

    public async processCryptoPayWithdrawalWebhook(
        queueMessages: IQueueMessageBody<ICryptopayWebhookEvent>[]
    ): Promise<{
        successMessageIds: string[];
        failedMessageIds: string[];
    }> {
        try {
            await this.initialize();
            const connection = await this.getConnection();

            const transactionsCollection = new MongoDBClient<ITransaction>(
                connection,
                WalletsServiceCollections.transactions
            );

            const failedMessageIdSet = new Set<string>(); // retryable failures
            const permanentFailureIdSet = new Set<string>(); // non-retryable, will be dropped

            // Validate webhook type & lookup existing withdrawal transactions
            const lookupResults = await Promise.allSettled(
                queueMessages.map(async (message) => {
                    const { body, messageId } = message;

                    // Non-retryable: unsupported webhook type
                    if (
                        body.type !== CryptopayWebhookEventType.CoinWithdrawal
                    ) {
                        permanentFailureIdSet.add(messageId);
                        log.warn(
                            "Ignoring withdrawal webhook with invalid type",
                            {
                                messageId,
                                type: body.type,
                            }
                        );
                        return null;
                    }

                    const tx = await transactionsCollection.findOne({
                        externalTransactionId: body.data.id,
                        transactionType: TransactionType.WITHDRAWAL,
                    });

                    // Non-retryable: we will never find a transaction later (id mismatch / not created)
                    if (!tx) {
                        permanentFailureIdSet.add(messageId);
                        log.warn(
                            "Ignoring withdrawal webhook with unknown transaction id",
                            {
                                messageId,
                                externalId: body.data.id,
                            }
                        );
                        return null;
                    }

                    return {
                        messageId,
                        queueMessage: message,
                        transaction: tx,
                    };
                })
            );

            const resolved: {
                messageId: string;
                queueMessage: IQueueMessageBody<ICryptopayWebhookEvent>;
                transaction: ITransaction;
            }[] = [];

            lookupResults.forEach((res, i) => {
                const messageId = queueMessages[i].messageId;
                if (res.status === "fulfilled") {
                    // fulfilled may be null (permanent skip) or an object
                    if (res.value) {
                        resolved.push(res.value);
                    }
                } else {
                    failedMessageIdSet.add(messageId);
                    log.error("Withdrawal lookup transient failure", {
                        messageId,
                        error: res.reason,
                    });
                }
            });

            // Update statuses (only for successfully resolved items)
            const statusUpdateResults = await Promise.allSettled(
                resolved.map(
                    async ({ queueMessage: { body }, transaction }) => {
                        switch (body.data.status) {
                            case CryptopayWebhookEventStatus.completed: {
                                const amount = parseFloat(
                                    body.data.paid_amount ?? "0"
                                );

                                const transactionId = body.data.txid ?? "";

                                const queueUrl =
                                    this.commonSecrets
                                        ?.EMAIL_NOTIFICATIONS_QUEUE ?? "";

                                const address = body.data.address ?? "";

                                const network = body.data.network ?? "";

                                await Promise.all([
                                    transactionsCollection.updateOne(
                                        {
                                            _id: transaction._id,
                                            status: {
                                                $ne: TransactionStatus.SUCCESS,
                                            },
                                        },
                                        {
                                            $set: {
                                                status: TransactionStatus.SUCCESS,
                                                transactionHash:
                                                    body.data.txid ??
                                                    transaction.transactionHash,
                                            },
                                        }
                                    ),

                                    publishWithdrawlConfirmationToQueue({
                                        amount,
                                        userId: transaction.userId,
                                        transactionId,
                                        address,
                                        network,
                                        queueUrl,
                                    }),
                                ]);

                                break;
                            }
                            case CryptopayWebhookEventStatus.cancelled:
                                await transactionsCollection.updateOne(
                                    {
                                        _id: transaction._id,
                                        status: {
                                            $nin: [
                                                TransactionStatus.FAILED,
                                                TransactionStatus.SUCCESS,
                                            ],
                                        },
                                    },
                                    {
                                        $set: {
                                            status: TransactionStatus.FAILED,
                                            transactionHash:
                                                body.data.txid ??
                                                transaction.transactionHash,
                                        },
                                    }
                                );
                                break;
                            default:
                                await transactionsCollection.updateOne(
                                    {
                                        _id: transaction._id,
                                        status: {
                                            $nin: [
                                                TransactionStatus.PENDING,
                                                TransactionStatus.SUCCESS,
                                            ],
                                        },
                                    },
                                    {
                                        $set: {
                                            status: TransactionStatus.PENDING,
                                            transactionHash:
                                                body.data.txid ??
                                                transaction.transactionHash,
                                        },
                                    }
                                );
                                break;
                        }
                    }
                )
            );

            statusUpdateResults.forEach((res, i) => {
                const messageId = resolved[i].messageId;
                if (res.status !== "fulfilled") {
                    failedMessageIdSet.add(messageId);
                    log.error(
                        "Failed to update withdrawal transaction status (transient)",
                        {
                            messageId,
                            error: res.status === "rejected" ? res.reason : res,
                        }
                    );
                }
            });

            const failedMessageIds = Array.from(failedMessageIdSet);
            const successMessageIds = queueMessages
                .map((m) => m.messageId)
                .filter((id) => !failedMessageIdSet.has(id));

            if (permanentFailureIdSet.size) {
                log.info(
                    "Permanent withdrawal webhook failures skipped (no retry)",
                    {
                        permanentFailureIds: Array.from(permanentFailureIdSet),
                    }
                );
            }

            return { successMessageIds, failedMessageIds };
        } catch (error) {
            log.error("General error in processCryptoPayWithdrawalWebhook:", {
                error,
            });
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((m) => m.messageId),
            };
        }
    }

    public async getUserWallet({
        userId,
        currency,
        walletType,
    }: {
        userId: string;
        currency: string;
        walletType: string;
    }) {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();

            const userWalletCollection = new MongoDBClient<IUserWallet>(
                connection,
                WalletsServiceCollections.userWallets
            );

            const userWallet = await userWalletCollection.findOne({
                userId,
                currency,
                walletType,
            });

            return userWallet;
        } catch (error) {
            log.error("General error in getUserWallet:", { error });
        }
    }

    public async lockUserBalance({
        userId,
        amount,
        currency,
        walletType,
    }: {
        userId: string;
        amount: number;
        currency: string;
        walletType: string;
    }) {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();

            // Get user wallet collection
            const userWalletCollection = new MongoDBClient<IUserWallet>(
                connection,
                WalletsServiceCollections.userWallets
            );

            // Atomically check sufficient balance and lock if available
            const result = await userWalletCollection.updateOne(
                {
                    userId,
                    currency,
                    walletType,
                    availableBalance: { $gte: amount }, // Only update if sufficient balance
                },
                {
                    $inc: {
                        lockedBalance: amount,
                        availableBalance: -amount,
                    },
                }
            );

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
        } catch (error) {
            log.error("General error in lockUserBalance:", { error });
            throw error;
        }
    }

    public computeTotalAmountToLock(input: {
        entryPrice: number;
        takeProfitPrice: number;
        tradeSide: TradeSide;
        tradeAmount: number;
    }): {
        tradingFee: number;
        projectedProfitAmount: number;
        totalAmountToLock: number;
    } {
        const { entryPrice, takeProfitPrice, tradeSide, tradeAmount } = input;

        // Compute trading fee of 1% of the trade amount or $1, whichever is greater
        const tradingFee = Math.max(tradeAmount * 0.01, 1);

        // Compute profit amount from trade amount based on trade side, entry price, and take profit price
        let projectedProfitAmount = 0;
        if (tradeSide === TradeSide.LONG) {
            // compute profit amount from entry price to take profit price for long trades
            const profitPercentage =
                (takeProfitPrice - entryPrice) / entryPrice;
            projectedProfitAmount = tradeAmount * profitPercentage;
        } else {
            // compute profit amount from entry price to take profit price for short trades
            const profitPercentage =
                (entryPrice - takeProfitPrice) / entryPrice;
            projectedProfitAmount = tradeAmount * profitPercentage;
        }

        const totalAmountToLock = tradingFee + projectedProfitAmount;

        return { tradingFee, projectedProfitAmount, totalAmountToLock };
    }

    public async createInvoice({
        userId,
        currency,
        amountDue,
        invoiceType,
        tradeId,
        tradeSide,
        baseAsset,
        logoUrl = "",
        quoteCurrency,
    }: ICreateInvoiceInput): Promise<{
        success: boolean;
        invoice?: IInvoice;
        error?: string;
        message?: string;
    }> {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();

            const invoicesCollection = new MongoDBClient<IInvoice>(
                connection,
                WalletsServiceCollections.invoices
            );

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
            const invoiceData: Partial<IInvoice> = {
                id: new mongoose.Types.ObjectId().toString(),
                userId,
                invoiceType,
                currency,
                amountDue,
                amountPaid: 0,
                amountOutstanding: amountDue,
                status: InvoiceStatus.PENDING,
                tradeId,
                tradeSide,
                baseAsset,
                logoUrl,
                quoteCurrency,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const createdInvoice =
                await invoicesCollection.insertOne(invoiceData);

            log.info("Successfully created invoice", {
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
        } catch (error) {
            log.error("General error in createInvoice:", { error });
            return {
                success: false,
                error: "SYSTEM_ERROR",
                message:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }

    public async getInvoiceById(invoiceId: string): Promise<IInvoice> {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();

            const invoicesCollection = new MongoDBClient<IInvoice>(
                connection,
                WalletsServiceCollections.invoices
            );

            const invoice = await invoicesCollection.findOne({ id: invoiceId });

            if (!invoice) {
                throw new Error(`Invoice with ID ${invoiceId} not found`);
            }

            return invoice;
        } catch (error) {
            log.error("General error in getInvoiceById:", { error });
            throw error;
        }
    }

    public async getInvoices({
        userId,
        tradeId,
        status,
        invoiceType,
    }: {
        userId?: string;
        tradeId?: string;
        status?: InvoiceStatus;
        invoiceType?: InvoiceType;
    } = {}): Promise<IInvoice[]> {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();

            const invoicesCollection = new MongoDBClient<IInvoice>(
                connection,
                WalletsServiceCollections.invoices
            );

            // Build filter object
            const filter: Record<string, string> = {};
            if (userId) filter.userId = userId;
            if (tradeId) filter.tradeId = tradeId;
            if (status) filter.status = status;
            if (invoiceType) filter.invoiceType = invoiceType;

            const invoices = await invoicesCollection.find(filter);

            return invoices;
        } catch (error) {
            log.error("General error in getInvoices:", { error });
            throw error;
        }
    }

    public async updateInvoice({
        invoiceId,
        amountPaid,
        status,
        amountDue,
    }: IUpdateInvoiceInput): Promise<{
        success: boolean;
        invoice?: IInvoice;
        error?: string;
        message?: string;
    }> {
        try {
            // Ensure service is initialized
            await this.initialize();
            const connection = await this.getConnection();

            const invoicesCollection = new MongoDBClient<IInvoice>(
                connection,
                WalletsServiceCollections.invoices
            );

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
            const updateData: Record<string, string | number> = {};

            if (amountPaid !== undefined) {
                updateData.amountPaid = amountPaid;
                // Recalculate outstanding amount
                const newAmountDue = amountDue ?? currentInvoice.amountDue;
                updateData.amountOutstanding = Math.max(
                    0,
                    newAmountDue - amountPaid
                );

                // Auto-update status based on payment
                if (amountPaid >= newAmountDue) {
                    updateData.status = InvoiceStatus.PAID;
                } else if (amountPaid > 0) {
                    updateData.status = InvoiceStatus.PENDING; // Partially paid
                }
            }

            if (amountDue !== undefined) {
                updateData.amountDue = amountDue;
                const currentAmountPaid = currentInvoice.amountPaid;
                updateData.amountOutstanding = Math.max(
                    0,
                    amountDue - currentAmountPaid
                );
            }

            if (status !== undefined) {
                updateData.status = status;
            }

            // Update the invoice
            const result = await invoicesCollection.updateOne(
                { id: invoiceId },
                { $set: updateData }
            );

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

            log.info("Successfully updated invoice", {
                invoiceId,
                updateData,
            });

            return {
                success: true,
                invoice: updatedInvoice!,
            };
        } catch (error) {
            log.error("General error in updateInvoice:", { error });
            return {
                success: false,
                error: "SYSTEM_ERROR",
                message:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }

    // Helper method to pay an invoice (combines update with wallet operations)
    public async payInvoice({
        invoiceId,
        userId,
        paymentAmount,
    }: {
        invoiceId: string;
        userId: string;
        paymentAmount: number;
    }): Promise<{
        success: boolean;
        invoice?: IInvoice;
        error?: string;
        message?: string;
    }> {
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
            if (invoice.status === InvoiceStatus.PAID) {
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
        } catch (error) {
            log.error("General error in payInvoice:", { error });
            return {
                success: false,
                error: "SYSTEM_ERROR",
                message:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }
}

export default new WalletsService();
