import { SQSEvent } from "aws-lambda";

export const mockSQSEvent = {
    Records: [
        {
            body: JSON.stringify({
                body: {
                    recipients: [{ emailAddress: "test@example.com" }],
                    message: "Test message",
                    subject: "Test subject",
                    event: "TestEvent",
                },
            }),
        },
    ],
} as SQSEvent;
