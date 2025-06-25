import log from "@dazn/lambda-powertools-logger";
import UsersService from "src/services/UsersService";
import { UserOnboardingStatusField } from "src/types/users-service";
import { handler as updateUserOnboardingStatus } from ".";
import { SQSEvent } from "aws-lambda";

// Test data
const mockSingleMessageSQSEvent = {
    Records: [
        {
            messageId: "test-message-id-1",
            body: JSON.stringify({
                body: {
                    userId: "123abc456def789ghi",
                    taskField:
                        UserOnboardingStatusField.IS_TRADING_ACCOUNT_CONNECTED,
                },
            }),
        },
    ],
} as unknown as SQSEvent;

// Mock UserService and log
jest.mock("src/services/UsersService");
jest.mock("@dazn/lambda-powertools-logger");

describe("update-user-onboarding-status Lambda Handler", () => {
    const mockUpdateUserOnboardingStatus = jest.fn();
    const mockLogInfo = jest.fn();

    beforeAll(() => {
        // Mock the updateUserOnboardingStatus method of UsersService
        (UsersService.updateUserOnboardingStatus as jest.Mock) =
            mockUpdateUserOnboardingStatus;
        // Mock log.info
        (log.info as jest.Mock) = mockLogInfo;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Successful Scenarios
    it("should process SQS event with single message successfully", async () => {
        // Arrange
        mockUpdateUserOnboardingStatus.mockResolvedValueOnce({
            successMessageIds: ["test-message-id-1"],
            failedMessageIds: [],
        });

        // Act
        const result = await updateUserOnboardingStatus(
            mockSingleMessageSQSEvent
        );

        // Assert
        expect(mockUpdateUserOnboardingStatus).toHaveBeenCalledTimes(1);
        expect(mockUpdateUserOnboardingStatus).toHaveBeenCalledWith([
            {
                messageId: "test-message-id-1",
                body: {
                    body: {
                        userId: "123abc456def789ghi",
                        taskField:
                            UserOnboardingStatusField.IS_TRADING_ACCOUNT_CONNECTED,
                    },
                },
            },
        ]);
        expect(result).toEqual({
            batchItemFailures: [],
        });
    });
});
