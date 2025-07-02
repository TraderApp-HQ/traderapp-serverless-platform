import log from "@dazn/lambda-powertools-logger";
import UsersService from "src/services/UsersService";
import { handler as updateUserOnboardingStatus } from ".";
import { SQSEvent } from "aws-lambda";
import { UserOnboardingChecklist } from "src/types/users-service";

// Test data
const mockSingleMessageSQSEvent = {
    Records: [
        {
            messageId: "test-message-id-1",
            body: JSON.stringify({
                body: {
                    userId: "123abc456def789ghi",
                    onboardingChecklistItem:
                        UserOnboardingChecklist.IS_TRADING_ACCOUNT_CONNECTED,
                },
            }),
        },
    ],
} as unknown as SQSEvent;

// Mock UserService and log
jest.mock("src/services/UsersService");
jest.mock("@dazn/lambda-powertools-logger");

describe("update-user-onboarding-status Lambda Handler", () => {
    const mockTrackUserOnboardingChecklist = jest.fn();
    const mockLogInfo = jest.fn();

    beforeAll(() => {
        // Mock the trackUserOnboardingChecklist method of UsersService
        (UsersService.trackUserOnboardingChecklist as jest.Mock) =
            mockTrackUserOnboardingChecklist;
        // Mock log.info
        (log.info as jest.Mock) = mockLogInfo;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // Successful Scenarios
    it("should process SQS event with single message successfully", async () => {
        // Arrange
        mockTrackUserOnboardingChecklist.mockResolvedValueOnce({
            successMessageIds: ["test-message-id-1"],
            failedMessageIds: [],
        });

        // Act
        const result = await updateUserOnboardingStatus(
            mockSingleMessageSQSEvent
        );

        // Assert
        expect(mockTrackUserOnboardingChecklist).toHaveBeenCalledTimes(1);
        expect(mockTrackUserOnboardingChecklist).toHaveBeenCalledWith([
            {
                messageId: "test-message-id-1",
                body: {
                    body: {
                        userId: "123abc456def789ghi",
                        onboardingChecklistItem:
                            UserOnboardingChecklist.IS_TRADING_ACCOUNT_CONNECTED,
                    },
                },
            },
        ]);
        expect(result).toEqual({
            batchItemFailures: [],
        });
    });
});
