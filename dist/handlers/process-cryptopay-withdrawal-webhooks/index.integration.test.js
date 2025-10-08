"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const _1 = require(".");
const WalletsService_1 = __importDefault(require("src/services/WalletsService"));
const wallets_service_1 = require("src/types/wallets-service");
const CryptoPayClient_1 = require("src/clients/CryptoPayClient");
const constants_1 = require("src/clients/MongoDBClient/constants");
const enums_1 = require("src/config/secrets/enums");
// Mock secrets helper to feed dynamic WALLET_SERVICE_DB_URL
jest.mock("src/config/secrets/helpers", () => ({
    getSecrets: jest.fn(async (path) => {
        if (path.includes(enums_1.SecretLocation.walletsServiceSecrets)) {
            return {
                CRYPTOPAY_BASE_URL: "https://example.crypto",
                CRYPTOPAY_DEPOSITS_API_KEY: "mock-api-key",
                CRYPTOPAY_DEPOSITS_API_SECRET: "mock-api-secret",
                CRYPTOPAY_WEBHOOK_SHARED_SECRET: "mock-webhook-secret",
                WALLET_SERVICE_DB_URL: global.__WALLETS_DB_URL__,
            };
        }
        if (path.includes(enums_1.SecretLocation.commonSecrets)) {
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
    let mongoServer;
    let connection;
    beforeAll(async () => {
        mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        // Provide DB URL to the mocked getSecrets
        global.__WALLETS_DB_URL__ = uri + "wallets";
        // Trigger WalletsService initialization to establish real connection
        await WalletsService_1.default["initialize"]();
        connection = await WalletsService_1.default["getConnection"]();
    });
    afterAll(async () => {
        await WalletsService_1.default.cleanup();
        if (mongoServer)
            await mongoServer.stop();
    });
    afterEach(async () => {
        // Clean collections between tests
        const col = connection.collection(constants_1.WalletsServiceCollections.transactions);
        await col.deleteMany({});
    });
    const insertWithdrawalTx = async (externalId, status = wallets_service_1.TransactionStatus.PENDING, amount = 25) => {
        const now = new Date();
        const doc = {
            transactionNetwork: "ETH",
            userId: "user-123",
            currencyName: "USDT",
            amount,
            transactionType: wallets_service_1.TransactionType.WITHDRAWAL,
            status,
            transactionSource: wallets_service_1.TransactionSource.EXTERNAL,
            paymentCategoryName: wallets_service_1.PaymentCategoryName.CRYPTO,
            paymentMethodName: "Wallet",
            paymentProviderName: "CryptoPay",
            externalTransactionId: externalId,
            createdAt: now,
            updatedAt: now,
        };
        await connection
            .collection(constants_1.WalletsServiceCollections.transactions)
            .insertOne(doc);
        return doc;
    };
    const buildSQSEvent = (messageId, { id, status, txid, }) => ({
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
                eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
                awsRegion: "us-east-1",
            },
        ],
    });
    it("updates a pending withdrawal to SUCCESS on completed webhook", async () => {
        await insertWithdrawalTx("wd_success", wallets_service_1.TransactionStatus.PENDING, 50);
        const event = buildSQSEvent("msg-success", {
            id: "wd_success",
            status: CryptoPayClient_1.CryptopayWebhookEventStatus.completed,
        });
        const result = await (0, _1.handler)(event);
        expect(result.batchItemFailures).toHaveLength(0);
        const updated = await connection
            .collection(constants_1.WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_success" });
        expect(updated?.status).toBe(wallets_service_1.TransactionStatus.SUCCESS);
    });
    it("updates a pending withdrawal to FAILED on cancelled webhook", async () => {
        await insertWithdrawalTx("wd_cancel", wallets_service_1.TransactionStatus.PENDING, 10);
        const event = buildSQSEvent("msg-cancel", {
            id: "wd_cancel",
            status: CryptoPayClient_1.CryptopayWebhookEventStatus.cancelled,
        });
        const result = await (0, _1.handler)(event);
        expect(result.batchItemFailures).toHaveLength(0);
        const updated = await connection
            .collection(constants_1.WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_cancel" });
        expect(updated?.status).toBe(wallets_service_1.TransactionStatus.FAILED);
    });
    it("does not include message in failed messages when transaction does not exist", async () => {
        const event = buildSQSEvent("msg-missing", {
            id: "wd_missing",
            status: CryptoPayClient_1.CryptopayWebhookEventStatus.completed,
        });
        const result = await (0, _1.handler)(event);
        expect(result.batchItemFailures).toHaveLength(0);
    });
    it("leaves status unchanged (idempotent) if already SUCCESS and completed arrives again", async () => {
        await insertWithdrawalTx("wd_already_success", wallets_service_1.TransactionStatus.SUCCESS, 75);
        const event = buildSQSEvent("msg-repeat", {
            id: "wd_already_success",
            status: CryptoPayClient_1.CryptopayWebhookEventStatus.completed,
        });
        const result = await (0, _1.handler)(event);
        expect(result.batchItemFailures).toHaveLength(0);
        const updated = await connection
            .collection(constants_1.WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_already_success" });
        expect(updated?.status).toBe(wallets_service_1.TransactionStatus.SUCCESS);
    });
    it("handles mixed batch (success, cancelled, transient failure)", async () => {
        // Insert transactions for success + cancelled + failing
        await insertWithdrawalTx("wd_mixed_ok", wallets_service_1.TransactionStatus.PENDING, 30);
        await insertWithdrawalTx("wd_mixed_cancel", wallets_service_1.TransactionStatus.PENDING, 12);
        await insertWithdrawalTx("wd_mixed_fail", wallets_service_1.TransactionStatus.PENDING, 18);
        // Patch findOne to throw for wd_mixed_fail (transient DB error)
        const txCollection = connection.collection(constants_1.WalletsServiceCollections.transactions);
        const originalFindOne = txCollection.findOne.bind(txCollection);
        txCollection.findOne = jest.fn(async (query) => {
            if (query?.externalTransactionId === "wd_mixed_fail") {
                throw new Error("Simulated DB failure");
            }
            return originalFindOne(query);
        });
        const event = {
            Records: [
                ...buildSQSEvent("msg-ok", {
                    id: "wd_mixed_ok",
                    status: CryptoPayClient_1.CryptopayWebhookEventStatus.completed,
                }).Records,
                ...buildSQSEvent("msg-cancel", {
                    id: "wd_mixed_cancel",
                    status: CryptoPayClient_1.CryptopayWebhookEventStatus.cancelled,
                }).Records,
                ...buildSQSEvent("msg-fail", {
                    id: "wd_mixed_fail",
                    status: CryptoPayClient_1.CryptopayWebhookEventStatus.completed,
                }).Records,
            ],
        };
        const result = await (0, _1.handler)(event);
        // Expect only transient failure (msg-fail) to be retried
        expect(result.batchItemFailures).toEqual([
            { itemIdentifier: "msg-fail" },
        ]);
        // Restore patched method
        txCollection.findOne = originalFindOne;
        const okTx = await connection
            .collection(constants_1.WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_mixed_ok" });
        expect(okTx?.status).toBe(wallets_service_1.TransactionStatus.SUCCESS);
        const cancelTx = await connection
            .collection(constants_1.WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_mixed_cancel" });
        expect(cancelTx?.status).toBe(wallets_service_1.TransactionStatus.FAILED);
        const failTx = await connection
            .collection(constants_1.WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_mixed_fail" });
        // Status unchanged because status update never reached
        expect(failTx?.status).toBe(wallets_service_1.TransactionStatus.PENDING);
    });
    it("adds messageId to batchItemFailures on lookup transient DB error (single message)", async () => {
        await insertWithdrawalTx("wd_fail_single", wallets_service_1.TransactionStatus.PENDING, 40);
        const txCollection = connection.collection(constants_1.WalletsServiceCollections.transactions);
        const originalFindOne = txCollection.findOne.bind(txCollection);
        txCollection.findOne = jest.fn(async (query) => {
            if (query?.externalTransactionId === "wd_fail_single") {
                throw new Error("Simulated single lookup failure");
            }
            return originalFindOne(query);
        });
        const event = buildSQSEvent("msg-fail-single", {
            id: "wd_fail_single",
            status: CryptoPayClient_1.CryptopayWebhookEventStatus.completed,
        });
        const result = await (0, _1.handler)(event);
        expect(result.batchItemFailures).toEqual([
            { itemIdentifier: "msg-fail-single" },
        ]);
        // Restore patched method
        txCollection.findOne = originalFindOne;
        // Transaction still pending
        const tx = await connection
            .collection(constants_1.WalletsServiceCollections.transactions)
            .findOne({ externalTransactionId: "wd_fail_single" });
        expect(tx?.status).toBe(wallets_service_1.TransactionStatus.PENDING);
    });
});
