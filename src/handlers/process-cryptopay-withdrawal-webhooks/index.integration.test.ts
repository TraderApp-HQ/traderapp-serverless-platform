import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Collection } from "mongoose";
import { ObjectId as BsonObjectId } from "bson";
import { WithId } from "mongodb";
import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import { handler } from ".";
import WalletsService from "src/services/WalletsService";
import {
    TransactionStatus,
    TransactionType,
    TransactionSource,
    PaymentCategoryName,
    ITransaction,
} from "src/types/wallets-service";
import { CryptopayWebhookEventStatus } from "src/clients/CryptoPayClient";
import { WalletsServiceCollections } from "src/clients/MongoDBClient/constants";
import { SecretLocation } from "src/config/secrets/enums";

interface ITransactionWithObjectId extends Omit<ITransaction, "_id"> {
    _id?: BsonObjectId;
}
interface MockTransactionCollection
    extends Omit<Collection<ITransactionWithObjectId>, "findOne"> {
    findOne: (query: {
        externalTransactionId: string;
        transactionType: string;
    }) => Promise<WithId<ITransactionWithObjectId> | null>;
}

// Mock secrets helper to feed dynamic WALLET_SERVICE_DB_URL
jest.mock("src/config/secrets/helpers", () => ({
    getSecrets: jest.fn(async (path: string) => {
        if (path.includes(SecretLocation.walletsServiceSecrets)) {
            return {
                CRYPTOPAY_BASE_URL: "https://example.crypto",
                CRYPTOPAY_DEPOSITS_API_KEY: "mock-api-key",
                CRYPTOPAY_DEPOSITS_API_SECRET: "mock-api-secret",
                CRYPTOPAY_WEBHOOK_SHARED_SECRET: "mock-webhook-secret",
                WALLET_SERVICE_DB_URL: (
                    global as unknown as { __WALLETS_DB_URL__?: string }
                ).__WALLETS_DB_URL__,
            };
        }
        if (path.includes(SecretLocation.commonSecrets)) {
            return {
                PORT: "3000",
                TRACK_USER_ONBOARDING_CHECKLIST_QUEUE: "https://sqs.fake/queue",
            };
        }
        return {};
    }),
}));

// Ensure ENV so WalletsService.initialize builds correct secret paths
process.env.ENV = "test";

describe("process-cryptopay-withdrawal-webhooks handler (integration)", () => {
    let mongoServer: MongoMemoryServer;
    let connection: mongoose.Connection;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        // Provide DB URL to the mocked getSecrets
        (
            global as unknown as { __WALLETS_DB_URL__?: string }
        ).__WALLETS_DB_URL__ = uri + "wallets";

        // Trigger WalletsService initialization to establish real connection
        await WalletsService["initialize"]();
        connection = await WalletsService["getConnection"]();
    });

    afterAll(async () => {
        await WalletsService.cleanup();
        if (mongoServer) await mongoServer.stop();
    });

    afterEach(async () => {
        // Clean collections between tests
        const col = connection.collection(
            WalletsServiceCollections.transactions
        );
        await col.deleteMany({});
    });

    const insertWithdrawalTx = async (
        externalId: string,
        status: TransactionStatus = TransactionStatus.PENDING,
        amount = 25
    ) => {
        const now = new Date();
        const doc: ITransactionWithObjectId = {
            transactionNetwork: "ETH",
            userId: "user-123",
            currencyName: "USDT",
            amount,
            transactionType: TransactionType.WITHDRAWAL,
            status,
            transactionSource: TransactionSource.EXTERNAL,
            paymentCategoryName: PaymentCategoryName.CRYPTO,
            paymentMethodName: "Wallet",
            paymentProviderName: "CryptoPay",
            externalTransactionId: externalId,
            createdAt: now,
            updatedAt: now,
        };
        await connection
            .collection(WalletsServiceCollections.transactions)
            .insertOne(doc);
        return doc;
    };

    const buildSQSEvent = (
        messageId: string,
        {
            id,
            status,
            txid,
        }: {
            id: string;
            status: CryptopayWebhookEventStatus;
            txid?: string;
        }
    ): SQSEvent =>
        ({
            Records: [
                {
                    messageId,
                    receiptHandle: "rh",
                    body: JSON.stringify({
                        type: "CoinWithdrawal",
                        data: {
                            id,
                            status,
                            txid: txid ?? "0xtxhash",
                        },
                    }),
                    attributes: {
                        ApproximateReceiveCount: "1",
                        SentTimestamp: Date.now().toString(),
                        SenderId: "test",
                        ApproximateFirstReceiveTimestamp: Date.now().toString(),
                    },
                    messageAttributes: {},
                    md5OfBody: "md5",
                    eventSource: "aws:sqs",
                    eventSourceARN:
                        "arn:aws:sqs:us-east-1:123456789012:test-queue",
                    awsRegion: "us-east-1",
                },
            ],
        }) as unknown as SQSEvent;

    it("updates a pending withdrawal to SUCCESS on completed webhook", async () => {
        await insertWithdrawalTx("wd_success", TransactionStatus.PENDING, 50);

        const event = buildSQSEvent("msg-success", {
            id: "wd_success",
            status: CryptopayWebhookEventStatus.completed,
        });

        const result: SQSBatchResponse = await handler(event);

        expect(result.batchItemFailures).toHaveLength(0);

        const updated = await connection
            .collection(WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_success" });

        expect(updated?.status).toBe(TransactionStatus.SUCCESS);
    });

    it("updates a pending withdrawal to FAILED on cancelled webhook", async () => {
        await insertWithdrawalTx("wd_cancel", TransactionStatus.PENDING, 10);

        const event = buildSQSEvent("msg-cancel", {
            id: "wd_cancel",
            status: CryptopayWebhookEventStatus.cancelled,
        });

        const result = await handler(event);
        expect(result.batchItemFailures).toHaveLength(0);

        const updated = await connection
            .collection(WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_cancel" });

        expect(updated?.status).toBe(TransactionStatus.FAILED);
    });

    it("does not include message in failed messages when transaction does not exist", async () => {
        const event = buildSQSEvent("msg-missing", {
            id: "wd_missing",
            status: CryptopayWebhookEventStatus.completed,
        });

        const result = await handler(event);
        expect(result.batchItemFailures).toHaveLength(0);
    });

    it("leaves status unchanged (idempotent) if already SUCCESS and completed arrives again", async () => {
        await insertWithdrawalTx(
            "wd_already_success",
            TransactionStatus.SUCCESS,
            75
        );

        const event = buildSQSEvent("msg-repeat", {
            id: "wd_already_success",
            status: CryptopayWebhookEventStatus.completed,
        });

        const result = await handler(event);
        expect(result.batchItemFailures).toHaveLength(0);

        const updated = await connection
            .collection(WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_already_success" });

        expect(updated?.status).toBe(TransactionStatus.SUCCESS);
    });

    it("handles mixed batch (success, cancelled, transient failure)", async () => {
        // Insert transactions for success + cancelled + failing
        await insertWithdrawalTx("wd_mixed_ok", TransactionStatus.PENDING, 30);
        await insertWithdrawalTx(
            "wd_mixed_cancel",
            TransactionStatus.PENDING,
            12
        );
        await insertWithdrawalTx(
            "wd_mixed_fail",
            TransactionStatus.PENDING,
            18
        );

        // Patch findOne to throw for wd_mixed_fail (transient DB error)
        const txCollection: MockTransactionCollection = connection.collection(
            WalletsServiceCollections.transactions
        );

        const originalFindOne = txCollection.findOne.bind(txCollection);
        txCollection.findOne = jest.fn(
            async (query: {
                externalTransactionId: string;
                transactionType: string;
            }) => {
                if (query?.externalTransactionId === "wd_mixed_fail") {
                    throw new Error("Simulated DB failure");
                }
                return originalFindOne(query);
            }
        );

        const event: SQSEvent = {
            Records: [
                ...buildSQSEvent("msg-ok", {
                    id: "wd_mixed_ok",
                    status: CryptopayWebhookEventStatus.completed,
                }).Records,
                ...buildSQSEvent("msg-cancel", {
                    id: "wd_mixed_cancel",
                    status: CryptopayWebhookEventStatus.cancelled,
                }).Records,
                ...buildSQSEvent("msg-fail", {
                    id: "wd_mixed_fail",
                    status: CryptopayWebhookEventStatus.completed,
                }).Records,
            ],
        } as unknown as SQSEvent;

        const result = await handler(event);

        // Expect only transient failure (msg-fail) to be retried
        expect(result.batchItemFailures).toEqual([
            { itemIdentifier: "msg-fail" },
        ]);

        // Restore patched method
        txCollection.findOne = originalFindOne;

        const okTx = await connection
            .collection(WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_mixed_ok" });
        expect(okTx?.status).toBe(TransactionStatus.SUCCESS);

        const cancelTx = await connection
            .collection(WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_mixed_cancel" });
        expect(cancelTx?.status).toBe(TransactionStatus.FAILED);

        const failTx = await connection
            .collection(WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_mixed_fail" });
        // Status unchanged because status update never reached
        expect(failTx?.status).toBe(TransactionStatus.PENDING);
    });

    it("adds messageId to batchItemFailures on lookup transient DB error (single message)", async () => {
        await insertWithdrawalTx(
            "wd_fail_single",
            TransactionStatus.PENDING,
            40
        );

        const txCollection: MockTransactionCollection = connection.collection(
            WalletsServiceCollections.transactions
        );
        const originalFindOne = txCollection.findOne.bind(txCollection);
        txCollection.findOne = jest.fn(
            async (query: {
                externalTransactionId: string;
                transactionType: string;
            }) => {
                if (query?.externalTransactionId === "wd_fail_single") {
                    throw new Error("Simulated single lookup failure");
                }
                return originalFindOne(query);
            }
        );

        const event = buildSQSEvent("msg-fail-single", {
            id: "wd_fail_single",
            status: CryptopayWebhookEventStatus.completed,
        });

        const result = await handler(event);
        expect(result.batchItemFailures).toEqual([
            { itemIdentifier: "msg-fail-single" },
        ]);

        // Restore patched method
        txCollection.findOne = originalFindOne;

        // Transaction still pending
        const tx = await connection
            .collection(WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_fail_single" });
        expect(tx?.status).toBe(TransactionStatus.PENDING);
    });
});
