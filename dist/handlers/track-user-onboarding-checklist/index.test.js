"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
const UsersService_1 = __importDefault(require("src/services/UsersService"));
const _1 = require(".");
const users_service_1 = require("src/types/users-service");
// Test data
const mockSingleMessageSQSEvent = {
    Records: [
        {
            messageId: "test-message-id-1",
            body: JSON.stringify({
                body: {
                    userId: "123abc456def789ghi",
                    onboardingChecklistItem: users_service_1.UserOnboardingChecklist.IS_TRADING_ACCOUNT_CONNECTED,
                },
            }),
        },
    ],
};
// Mock UserService and log
jest.mock("src/services/UsersService");
jest.mock("@dazn/lambda-powertools-logger");
describe("update-user-onboarding-status Lambda Handler", () => {
    const mockTrackUserOnboardingChecklist = jest.fn();
    const mockLogInfo = jest.fn();
    beforeAll(() => {
        // Mock the trackUserOnboardingChecklist method of UsersService
        UsersService_1.default.trackUserOnboardingChecklist =
            mockTrackUserOnboardingChecklist;
        // Mock log.info
        lambda_powertools_logger_1.default.info = mockLogInfo;
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
        const result = await (0, _1.handler)(mockSingleMessageSQSEvent);
        // Assert
        expect(mockTrackUserOnboardingChecklist).toHaveBeenCalledTimes(1);
        expect(mockTrackUserOnboardingChecklist).toHaveBeenCalledWith([
            {
                messageId: "test-message-id-1",
                body: {
                    body: {
                        userId: "123abc456def789ghi",
                        onboardingChecklistItem: users_service_1.UserOnboardingChecklist.IS_TRADING_ACCOUNT_CONNECTED,
                    },
                },
            },
        ]);
        expect(result).toEqual({
            batchItemFailures: [],
        });
    });
});
