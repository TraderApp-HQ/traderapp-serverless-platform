"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockSQSEvent = void 0;
exports.mockSQSEvent = {
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
};
