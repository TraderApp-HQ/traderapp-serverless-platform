import UsersService from ".";
import { IQueueMessageBody } from "src/config/interfaces";
import {
    ITrackUserOnboardingChecklistInput,
    IUser,
    Role,
    Status,
    UserOnboardingChecklist,
} from "src/types/users-service";
import { MongoDBClient } from "src/clients/MongoDBClient";
import { UsersServiceCollections } from "src/clients/MongoDBClient/constants";

// Test User Data
const testUserData = {
    email: "testuseremail@example.com",
    password: "HashedPassword12345@",
    firstName: "Test-user-first-name",
    lastName: "Test-user-last-name",
    countryId: 89,
    dob: "1990-01-01",
    role: [Role.USER],
    status: Status.ACTIVE,
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
    let usersService: typeof UsersService;
    let usersCollection: MongoDBClient<IUser>;
    let testUserId: string;
    const testMessageId = "test-message-onboarding-456";

    beforeAll(async () => {
        // Create a real instance of UsersService and initialize it
        usersService = UsersService;
        await usersService["initialize"]();
        const connection = await usersService["getConnection"]();
        usersCollection = new MongoDBClient<IUser>(
            connection,
            UsersServiceCollections.users
        );

        // Create a test users
        const testUser = await usersCollection.insertOne(testUserData);

        if (testUser && testUser._id) {
            // Update the id field for query purpose
            await usersCollection.findOneAndUpdate(
                { _id: testUser?._id },
                { $set: { id: testUser?._id.toString() } }
            );

            testUserId = testUser?._id.toString();
        }
    });

    afterAll(async () => {
        // Clean up: delete the test user created during testing and close database connection
        try {
            await usersCollection.deleteOne({ id: testUserId });
            await usersService.cleanup();
        } catch (error) {
            console.warn("Failed to cleanup UsersService:", error);
        }
    });

    const createMockQueueMessage = (
        userId: string,
        onboardingChecklistItem: UserOnboardingChecklist,
        messageId: string = testMessageId
    ): IQueueMessageBody<ITrackUserOnboardingChecklistInput> => ({
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
        eventSourceARN:
            "arn:aws:sqs:eu-west-1:575439814610:dev-trackUserOnboardingChecklistQueue",
        awsRegion: "eu-west-1",
    });

    describe("Track-User-Onboarding-Checklist Integration Tests", () => {
        it("Update Email Verification Status", async () => {
            // Arrange
            const queueMessage = createMockQueueMessage(
                testUserId,
                UserOnboardingChecklist.IS_EMAIL_VERIFIED
            );

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
            expect(updatedUser!.isEmailVerified).toBe(true);
        });

        it("Update Trading Account Connection Status", async () => {
            // Arrange
            const queueMessage = createMockQueueMessage(
                testUserId,
                UserOnboardingChecklist.IS_TRADING_ACCOUNT_CONNECTED
            );

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
            expect(updatedUser!.isTradingAccountConnected).toBe(true);
        });

        it("Update First Deposit Made Status", async () => {
            // Arrange
            const queueMessage = createMockQueueMessage(
                testUserId,
                UserOnboardingChecklist.IS_FIRST_DEPOSIT_MADE
            );

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
            expect(updatedUser!.isFirstDepositMade).toBe(true);
        });

        it("Turn Off showOnboardingSteps flag after compulsory actions are completed.", async () => {
            // Arrange
            const queueMessage = createMockQueueMessage(
                testUserId,
                UserOnboardingChecklist.SHOW_ONBOARDING_STEPS
            );

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
            expect(updatedUser!.showOnboardingSteps).toBe(false);
        });
    });
});
