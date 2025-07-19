"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
const send_email_otp_1 = require("src/handlers/send-email-otp");
const NotificationsService_1 = __importDefault(require("src/services/NotificationsService"));
const test_data_1 = require("./test-data"); // Contains the mock event
// Mock NotificationsService and log
jest.mock("src/services/NotificationsService");
jest.mock("@dazn/lambda-powertools-logger");
describe("Lambda Handler", () => {
    const mockProcessMessagesAndSendEmails = jest.fn();
    const mockLogInfo = jest.fn();
    beforeAll(() => {
        // Mock the processMessagesAndSendEmails method of NotificationsService
        NotificationsService_1.default.processMessagesAndSendEmails =
            mockProcessMessagesAndSendEmails;
        // Mock log.info
        lambda_powertools_logger_1.default.info = mockLogInfo;
    });
    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test
    });
    it("should process SQS event and check email address in body", async () => {
        // Simulate successful processing of the emails
        mockProcessMessagesAndSendEmails.mockResolvedValueOnce(undefined);
        // Call the handler with the mocked SQS event
        await (0, send_email_otp_1.handler)(test_data_1.mockSQSEvent);
        expect(mockProcessMessagesAndSendEmails).toHaveBeenCalledTimes(1);
    });
    it("should parse the event body and verify the nested structure of the email address", async () => {
        // Simulate successful processing of the emails
        mockProcessMessagesAndSendEmails.mockResolvedValueOnce(undefined);
        // Call the handler with the mocked SQS event
        await (0, send_email_otp_1.handler)(test_data_1.mockSQSEvent);
        // Parse the event body and verify the nested structure of the email address
        const loggedEvent = mockLogInfo.mock.calls[0][1].event;
        const parsedBody = JSON.parse(loggedEvent.Records[0].body);
        expect(parsedBody).toHaveProperty("body.recipients[0].emailAddress", "test@example.com");
    });
});
