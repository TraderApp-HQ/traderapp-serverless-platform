"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const _1 = __importDefault(require("."));
const constants_1 = require("src/clients/MongoDBClient/constants");
const MongoDBClient_1 = require("src/clients/MongoDBClient");
jest.setTimeout(100000); // increase timeout for integration tests
describe("Create User Wallet Integration Test", () => {
    let walletsService;
    let userWalletCollection;
    const testUserId = "999ss9s9ss99s999999sss9s";
    const testMessageId = "8d0d2fae-1a50-4e88-943f-ac07493a1af0";
    beforeAll(async () => {
        // Create a real instance of WalletsService and initialize it
        walletsService = _1.default;
        await walletsService["initialize"]();
        const connection = await walletsService["getConnection"]();
        userWalletCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.WalletsServiceCollections.userWallets);
    });
    afterAll(async () => {
        // Clean up: delete all wallets created for the test user
        await userWalletCollection.deleteMany({ userId: testUserId });
        await walletsService.cleanup();
    });
    it("should create wallets for all available wallet types and currencies", async () => {
        // Arrange
        const queueMessages = [
            {
                messageId: testMessageId,
                body: { userId: testUserId },
                receiptHandle: "AQEB",
                attributes: {
                    ApproximateReceiveCount: "1",
                    SentTimestamp: "1729383908528",
                    SenderId: "AIDAYL6XCX7JKIAG7VEHQ",
                    ApproximateFirstReceiveTimestamp: "1729383908540",
                },
                messageAttributes: {},
                md5OfBody: "f2e9098bc1e087904f2aa7237833e167",
                eventSource: "aws:sqs",
                eventSourceARN: "arn:aws:sqs:eu-west-1:575439814610:dev-createUserWalletQueue",
                awsRegion: "eu-west-1",
            },
        ];
        // Act
        const result = await walletsService.createUserWallet(queueMessages);
        // Assert
        expect(result.successMessageIds).toContain(testMessageId);
        expect(result.failedMessageIds).toHaveLength(0);
    });
    it("verify new wallet details", async () => {
        // Verify wallets were created
        const createdWallets = await userWalletCollection.find({
            userId: testUserId,
        });
        expect(createdWallets).toBeDefined();
        expect(Array.isArray(createdWallets)).toBe(true);
        expect(createdWallets.length).toBeGreaterThan(0);
        // Check wallet properties
        const wallet = createdWallets[0];
        expect(wallet.userId).toBe(testUserId);
        expect(wallet.availableBalance).toBe(0);
        expect(wallet.lockedBalance).toBe(0);
        expect(wallet.walletTypeName).toBeDefined();
        expect(wallet.currencyName).toBeDefined();
        expect(wallet.currencySymbol).toBeDefined();
    });
});
