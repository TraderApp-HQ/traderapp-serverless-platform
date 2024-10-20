import log from "@dazn/lambda-powertools-logger";
import { handler as sendEmailOtpHandler } from "src/handlers/send-email-otp";
import NotificationsService from "src/services/NotificationsService";
import { mockSQSEvent } from "./test-data"; // Contains the mock event

// Mock NotificationsService and log
jest.mock("src/services/NotificationsService");
jest.mock("@dazn/lambda-powertools-logger");

describe("Lambda Handler", () => {
    const mockProcessMessagesAndSendEmails = jest.fn();
    const mockLogInfo = jest.fn();

    beforeAll(() => {
        // Mock the processMessagesAndSendEmails method of NotificationsService
        (NotificationsService.processMessagesAndSendEmails as jest.Mock) =
            mockProcessMessagesAndSendEmails;

        // Mock log.info
        (log.info as jest.Mock) = mockLogInfo;
    });

    afterEach(() => {
        jest.clearAllMocks(); // Clear mocks after each test
    });

    it("should process SQS event and check email address in body", async () => {
        // Simulate successful processing of the emails
        mockProcessMessagesAndSendEmails.mockResolvedValueOnce(undefined);

        // Call the handler with the mocked SQS event
        await sendEmailOtpHandler(mockSQSEvent);

        expect(mockProcessMessagesAndSendEmails).toHaveBeenCalledTimes(1);
        expect(mockLogInfo).toHaveBeenCalledWith(
            "Received event",
            expect.objectContaining({
                event: expect.objectContaining({
                    Records: expect.arrayContaining([
                        expect.objectContaining({
                            body: expect.stringContaining("test@example.com"),
                        }),
                    ]),
                }),
            })
        );
    });

    it("should parse the event body and verify the nested structure of the email address", async () => {
        // Simulate successful processing of the emails
        mockProcessMessagesAndSendEmails.mockResolvedValueOnce(undefined);

        // Call the handler with the mocked SQS event
        await sendEmailOtpHandler(mockSQSEvent);

        // Parse the event body and verify the nested structure of the email address
        const loggedEvent = mockLogInfo.mock.calls[0][1].event;
        const parsedBody = JSON.parse(loggedEvent.Records[0].body);
        expect(parsedBody).toHaveProperty(
            "body.recipients[0].emailAddress",
            "test@example.com"
        );
    });
});
