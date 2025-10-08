"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = __importDefault(require("."));
const users_service_1 = require("src/types/users-service");
const MongoDBClient_1 = require("src/clients/MongoDBClient");
const constants_1 = require("src/clients/MongoDBClient/constants");
// Test User Data
const testUserData = {
    email: "testuseremail@example.com",
    password: "HashedPassword12345@",
    firstName: "Test-user-first-name",
    lastName: "Test-user-last-name",
    countryId: 89,
    dob: "1990-01-01",
    role: [users_service_1.Role.USER],
    status: users_service_1.Status.ACTIVE,
    isEmailVerified: false,
    isFirstDepositMade: false,
    isTradingAccountConnected: false,
    isSocialAccountConnected: false,
    isOnboardingTaskDone: false,
    showOnboardingSteps: true,
    isPhoneVerified: false,
    isIdVerified: false,
};
jest.setTimeout(100000); // increase timeout for integration tests
describe("UsersService Integration Tests", () => {
    let usersService;
    let usersCollection;
    let testUserId;
    const testMessageId = "test-message-onboarding-456";
    beforeAll(async () => {
        usersService = _1.default;
        await usersService["initialize"]();
        const connection = await usersService["getConnection"]();
        usersCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.UsersServiceCollections.users);
        // Create one test user that will be used across all tests
        const uniqueTestUserData = {
            ...testUserData,
            email: `testuser+${Date.now()}+${Math.random()}@example.com`,
        };
        const testUser = await usersCollection.insertOne(uniqueTestUserData);
        if (testUser && testUser._id) {
            await usersCollection.findOneAndUpdate({ _id: testUser._id }, { $set: { id: testUser._id.toString() } });
            testUserId = testUser._id.toString();
        }
    });
    afterAll(async () => {
        // Clean up test user after all tests
        if (testUserId) {
            await usersCollection.deleteOne({ id: testUserId });
        }
        await usersService.cleanup();
    });
    const createMockQueueMessage = (userId, onboardingChecklistItem, messageId = testMessageId) => ({
        messageId,
        body: {
            userId,
            onboardingChecklistItem,
        },
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
        eventSourceARN: "arn:aws:sqs:eu-west-1:575439814610:dev-trackUserOnboardingChecklistQueue",
        awsRegion: "eu-west-1",
    });
    describe("Track-User-Onboarding-Checklist Integration Tests", () => {
        it("Update Email Verification Status", async () => {
            // Arrange
            const queueMessage = createMockQueueMessage(testUserId, users_service_1.UserOnboardingChecklist.IS_EMAIL_VERIFIED);
            // Act
            const result = await usersService.trackUserOnboardingChecklist([
                queueMessage,
            ]);
            // Assert
            expect(result.successMessageIds).toContain(testMessageId);
            expect(result.failedMessageIds).toHaveLength(0);
            // Verify the user was actually updated in the database
            const updatedUser = await usersCollection.findOne({
                id: testUserId,
            });
            expect(updatedUser).toBeDefined();
            expect(updatedUser.isEmailVerified).toBe(true);
        });
        it("Update Trading Account Connection Status", async () => {
            // Arrange
            const queueMessage = createMockQueueMessage(testUserId, users_service_1.UserOnboardingChecklist.IS_TRADING_ACCOUNT_CONNECTED);
            // Act
            const result = await usersService.trackUserOnboardingChecklist([
                queueMessage,
            ]);
            // Assert
            expect(result.successMessageIds).toContain(testMessageId);
            expect(result.failedMessageIds).toHaveLength(0);
            // Verify the user was actually updated in the database
            const updatedUser = await usersCollection.findOne({
                id: testUserId,
            });
            expect(updatedUser).toBeDefined();
            expect(updatedUser.isTradingAccountConnected).toBe(true);
        });
        it("Update First Deposit Made Status", async () => {
            // Arrange
            const queueMessage = createMockQueueMessage(testUserId, users_service_1.UserOnboardingChecklist.IS_FIRST_DEPOSIT_MADE);
            // Act
            const result = await usersService.trackUserOnboardingChecklist([
                queueMessage,
            ]);
            // Assert
            expect(result.successMessageIds).toContain(testMessageId);
            expect(result.failedMessageIds).toHaveLength(0);
            // Verify the user was actually updated in the database
            const updatedUser = await usersCollection.findOne({
                id: testUserId,
            });
            expect(updatedUser).toBeDefined();
            expect(updatedUser.isFirstDepositMade).toBe(true);
        });
        it("Turn Off showOnboardingSteps flag after compulsory actions are completed.", async () => {
            // First, set up the required conditions
            await usersCollection.findOneAndUpdate({ id: testUserId }, {
                $set: {
                    isEmailVerified: true,
                    isFirstDepositMade: true,
                    isTradingAccountConnected: true,
                },
            });
            // Arrange
            const queueMessage = createMockQueueMessage(testUserId, users_service_1.UserOnboardingChecklist.SHOW_ONBOARDING_STEPS);
            // Act
            const result = await usersService.trackUserOnboardingChecklist([
                queueMessage,
            ]);
            // Assert
            expect(result.successMessageIds).toContain(testMessageId);
            expect(result.failedMessageIds).toHaveLength(0);
            // Verify the showOnboardingTask was toggled
            const updatedUser = await usersCollection.findOne({
                id: testUserId,
            });
            expect(updatedUser).toBeDefined();
            expect(updatedUser.showOnboardingSteps).toBe(false);
        });
    });
});
