import UsersService from ".";
import { IQueueMessageBody } from "src/config/interfaces";
import {
    IUpdateUserOnboardingStatusInput,
    UserOnboardingStatusField,
    IUser,
    Role,
    Status,
} from "src/types/users-service";
import { MongoDBClient } from "src/clients/MongoDBClient";
import { UsersServiceCollections } from "src/clients/MongoDBClient/constants";

jest.setTimeout(100000); // increase timeout for integration tests

describe("UsersService Integration Tests", () => {
    let usersService: typeof UsersService;
    let usersCollection: MongoDBClient<IUser>;
    const testUserId = "test-user-onboarding-123";
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
    });

    afterAll(async () => {
        // Clean up: delete all test users created during testing
        try {
            await usersCollection.deleteMany({ id: { $regex: /^test-user-/ } });
        } catch (error) {
            console.warn("Failed to cleanup test users:", error);
        }
        try {
            await usersService.cleanup();
        } catch (error) {
            console.warn("Failed to cleanup UsersService:", error);
        }
    });

    const createTestUser = async (
        overrides: Partial<IUser> = {}
    ): Promise<IUser> => {
        const testUser: IUser = {
            id: `${testUserId}-${Date.now()}`,
            email: `test-${Date.now()}@example.com`,
            password: "hashedPassword123",
            firstName: "Test",
            lastName: "User",
            countryId: 163,
            dob: "1990-01-01",
            role: [Role.USER],
            status: Status.ACTIVE,
            referralCode: `TEST${Date.now()}`,
            isEmailVerified: false,
            isFirstDepositMade: false,
            isTradingAccountConnected: false,
            isSocialAccountConnected: false,
            isOnboardingTaskDone: false,
            showOnboardingSteps: true,
            isPhoneVerified: false,
            isIdVerified: false,
            ...overrides,
        };

        await usersCollection.insertOne(testUser);
        return testUser;
    };

    const createMockQueueMessage = (
        userId: string,
        taskField: UserOnboardingStatusField,
        messageId: string = testMessageId
    ): IQueueMessageBody<IUpdateUserOnboardingStatusInput> => ({
        messageId,
        body: {
            userId,
            taskField,
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
            "arn:aws:sqs:eu-west-1:575439814610:dev-updateUserOnboardingStatusQueue",
        awsRegion: "eu-west-1",
    });

    describe("updateUserOnboardingStatus Integration Tests", () => {
        describe("Successful scenarios", () => {
            it("should successfully update email verification status", async () => {
                // Arrange
                const testUser = await createTestUser({
                    isEmailVerified: false,
                });
                const queueMessage = createMockQueueMessage(
                    testUser.id!,
                    UserOnboardingStatusField.IS_EMAIL_VERIFIED
                );

                // Act
                const result = await usersService.updateUserOnboardingStatus([
                    queueMessage,
                ]);

                // Assert
                expect(result.successMessageIds).toContain(testMessageId);
                expect(result.failedMessageIds).toHaveLength(0);

                // Verify the user was actually updated in the database
                const updatedUser = await usersCollection.findOne({
                    id: testUser.id,
                });
                expect(updatedUser).toBeDefined();
                expect(updatedUser!.isEmailVerified).toBe(true);
            });

            it("should successfully update trading account connection status", async () => {
                // Arrange
                const testUser = await createTestUser({
                    isTradingAccountConnected: false,
                });
                const queueMessage = createMockQueueMessage(
                    testUser.id!,
                    UserOnboardingStatusField.IS_TRADING_ACCOUNT_CONNECTED
                );

                // Act
                const result = await usersService.updateUserOnboardingStatus([
                    queueMessage,
                ]);

                // Assert
                expect(result.successMessageIds).toContain(testMessageId);
                expect(result.failedMessageIds).toHaveLength(0);

                // Verify the user was actually updated in the database
                const updatedUser = await usersCollection.findOne({
                    id: testUser.id,
                });
                expect(updatedUser).toBeDefined();
                expect(updatedUser!.isTradingAccountConnected).toBe(true);
            });

            it("should hide onboarding task when all required tasks are completed", async () => {
                // Arrange
                const testUser = await createTestUser({
                    isEmailVerified: true,
                    isFirstDepositMade: true,
                    isTradingAccountConnected: true,
                    isSocialAccountConnected: true,
                    isOnboardingTaskDone: true,
                    showOnboardingSteps: true,
                });
                const queueMessage = createMockQueueMessage(
                    testUser.id!,
                    UserOnboardingStatusField.IS_ONBOARDING_TASK_DONE
                );

                // Act
                const result = await usersService.updateUserOnboardingStatus([
                    queueMessage,
                ]);

                // Assert
                expect(result.successMessageIds).toContain(testMessageId);
                expect(result.failedMessageIds).toHaveLength(0);

                // Verify the showOnboardingTask was set to false
                const updatedUser = await usersCollection.findOne({
                    id: testUser.id,
                });
                expect(updatedUser).toBeDefined();
                expect(updatedUser!.showOnboardingSteps).toBe(false);
            });

            it("should handle showOnboardingTask toggle when user dismisses onboarding", async () => {
                // Arrange
                const testUser = await createTestUser({
                    showOnboardingSteps: true,
                });
                const queueMessage = createMockQueueMessage(
                    testUser.id!,
                    UserOnboardingStatusField.SHOW_ONBOARDING_STEPS
                );

                // Act
                const result = await usersService.updateUserOnboardingStatus([
                    queueMessage,
                ]);

                // Assert
                expect(result.successMessageIds).toContain(testMessageId);
                expect(result.failedMessageIds).toHaveLength(0);

                // Verify the showOnboardingTask was toggled
                const updatedUser = await usersCollection.findOne({
                    id: testUser.id,
                });
                expect(updatedUser).toBeDefined();
                expect(updatedUser!.showOnboardingSteps).toBe(false);
            });

            it("should process multiple messages successfully", async () => {
                // Arrange
                const testUser = await createTestUser();
                const queueMessages = [
                    createMockQueueMessage(
                        testUser.id!,
                        UserOnboardingStatusField.IS_EMAIL_VERIFIED,
                        "msg-1"
                    ),
                    createMockQueueMessage(
                        testUser.id!,
                        UserOnboardingStatusField.IS_FIRST_DEPOSIT_MADE,
                        "msg-2"
                    ),
                ];

                // Act
                const result =
                    await usersService.updateUserOnboardingStatus(
                        queueMessages
                    );

                // Assert
                expect(result.successMessageIds).toContain("msg-1");
                expect(result.successMessageIds).toContain("msg-2");
                expect(result.failedMessageIds).toHaveLength(0);

                // Verify both fields were updated
                const updatedUser = await usersCollection.findOne({
                    id: testUser.id,
                });
                expect(updatedUser).toBeDefined();
                expect(updatedUser!.isEmailVerified).toBe(true);
                expect(updatedUser!.isFirstDepositMade).toBe(true);
            });
        });

        describe("Failure scenarios", () => {
            it("should fail when user does not exist", async () => {
                // Arrange
                const nonExistentUserId = "non-existent-user-123";
                const queueMessage = createMockQueueMessage(
                    nonExistentUserId,
                    UserOnboardingStatusField.IS_EMAIL_VERIFIED
                );

                // Act
                const result = await usersService.updateUserOnboardingStatus([
                    queueMessage,
                ]);

                // Assert
                expect(result.successMessageIds).toHaveLength(0);
                expect(result.failedMessageIds).toContain(testMessageId);
            });

            it("should handle task field that is already completed", async () => {
                // Arrange
                const testUser = await createTestUser({
                    isEmailVerified: true,
                });
                const queueMessage = createMockQueueMessage(
                    testUser.id!,
                    UserOnboardingStatusField.IS_EMAIL_VERIFIED
                );

                // Act
                const result = await usersService.updateUserOnboardingStatus([
                    queueMessage,
                ]);

                // Assert
                expect(result.successMessageIds).toContain(testMessageId); // Still succeeds as no update needed
                expect(result.failedMessageIds).toHaveLength(0);

                // Verify the field remains unchanged
                const updatedUser = await usersCollection.findOne({
                    id: testUser.id,
                });
                expect(updatedUser).toBeDefined();
                expect(updatedUser!.isEmailVerified).toBe(true);
            });
        });

        describe("Complete onboarding flow simulation", () => {
            it("should handle complete onboarding flow step by step", async () => {
                // Arrange - Create a fresh user
                const testUser = await createTestUser();
                const onboardingSteps = [
                    UserOnboardingStatusField.IS_EMAIL_VERIFIED,
                    UserOnboardingStatusField.IS_FIRST_DEPOSIT_MADE,
                    UserOnboardingStatusField.IS_TRADING_ACCOUNT_CONNECTED,
                    UserOnboardingStatusField.IS_SOCIAL_ACCOUNT_CONNECTED,
                    UserOnboardingStatusField.IS_ONBOARDING_TASK_DONE,
                ];

                const queueMessages = onboardingSteps.map((field, index) =>
                    createMockQueueMessage(testUser.id!, field, `step-${index}`)
                );

                // Act - Process all onboarding steps
                const result =
                    await usersService.updateUserOnboardingStatus(
                        queueMessages
                    );

                // Assert
                expect(result.successMessageIds).toHaveLength(
                    onboardingSteps.length
                );
                expect(result.failedMessageIds).toHaveLength(0);

                // Verify all onboarding fields were updated
                const updatedUser = await usersCollection.findOne({
                    id: testUser.id,
                });
                expect(updatedUser).toBeDefined();
                expect(updatedUser!.isEmailVerified).toBe(true);
                expect(updatedUser!.isFirstDepositMade).toBe(true);
                expect(updatedUser!.isTradingAccountConnected).toBe(true);
                expect(updatedUser!.isSocialAccountConnected).toBe(true);
                expect(updatedUser!.isOnboardingTaskDone).toBe(true);
                expect(updatedUser!.showOnboardingSteps).toBe(false); // Should be hidden when all tasks are done
            });
        });

        describe("Edge cases", () => {
            it("should handle empty queue messages array", async () => {
                // Act
                const result = await usersService.updateUserOnboardingStatus(
                    []
                );

                // Assert
                expect(result.successMessageIds).toHaveLength(0);
                expect(result.failedMessageIds).toHaveLength(0);
            });

            it("should handle all UserOnboardingStatusField types", async () => {
                // Arrange
                const testUser = await createTestUser();
                const taskFields = Object.values(UserOnboardingStatusField);
                const queueMessages = taskFields.map((field, index) =>
                    createMockQueueMessage(testUser.id!, field, `msg-${index}`)
                );

                // Act
                const result =
                    await usersService.updateUserOnboardingStatus(
                        queueMessages
                    );

                // Assert
                expect(result.successMessageIds).toHaveLength(
                    taskFields.length
                );
                expect(result.failedMessageIds).toHaveLength(0);

                // Verify all fields were updated
                const updatedUser = await usersCollection.findOne({
                    id: testUser.id,
                });
                expect(updatedUser).toBeDefined();
                expect(updatedUser!.isEmailVerified).toBe(true);
                expect(updatedUser!.isFirstDepositMade).toBe(true);
                expect(updatedUser!.isTradingAccountConnected).toBe(true);
                expect(updatedUser!.isSocialAccountConnected).toBe(true);
                expect(updatedUser!.isOnboardingTaskDone).toBe(true);
                expect(updatedUser!.showOnboardingSteps).toBe(false);
                expect(updatedUser!.isPhoneVerified).toBe(true);
                expect(updatedUser!.isIdVerified).toBe(true);
            });

            it("should handle very long userId values", async () => {
                // Arrange
                const longUserId = "a".repeat(1000);
                await createTestUser({ id: longUserId });
                const queueMessage = createMockQueueMessage(
                    longUserId,
                    UserOnboardingStatusField.IS_EMAIL_VERIFIED
                );

                // Act
                const result = await usersService.updateUserOnboardingStatus([
                    queueMessage,
                ]);

                // Assert
                expect(result.successMessageIds).toContain(testMessageId);
                expect(result.failedMessageIds).toHaveLength(0);

                // Verify the user was updated
                const updatedUser = await usersCollection.findOne({
                    id: longUserId,
                });
                expect(updatedUser).toBeDefined();
                expect(updatedUser!.isEmailVerified).toBe(true);
            });
        });

        describe("Batch processing scenarios", () => {
            it("should handle partial failures in batch processing", async () => {
                // Arrange
                const testUser1 = await createTestUser();
                const testUser2 = await createTestUser();
                const nonExistentUserId = "non-existent-user-456";

                const queueMessages = [
                    createMockQueueMessage(
                        testUser1.id!,
                        UserOnboardingStatusField.IS_EMAIL_VERIFIED,
                        "msg-1"
                    ),
                    createMockQueueMessage(
                        nonExistentUserId,
                        UserOnboardingStatusField.IS_FIRST_DEPOSIT_MADE,
                        "msg-2"
                    ),
                    createMockQueueMessage(
                        testUser2.id!,
                        UserOnboardingStatusField.IS_TRADING_ACCOUNT_CONNECTED,
                        "msg-3"
                    ),
                ];

                // Act
                const result =
                    await usersService.updateUserOnboardingStatus(
                        queueMessages
                    );

                // Assert
                expect(result.successMessageIds).toContain("msg-1");
                expect(result.successMessageIds).toContain("msg-3");
                expect(result.failedMessageIds).toContain("msg-2");

                // Verify successful updates
                const updatedUser1 = await usersCollection.findOne({
                    id: testUser1.id,
                });
                const updatedUser2 = await usersCollection.findOne({
                    id: testUser2.id,
                });
                expect(updatedUser1!.isEmailVerified).toBe(true);
                expect(updatedUser2!.isTradingAccountConnected).toBe(true);
            });
        });
    });
});
