// Import sqsPayloadLoggerHandler function from sqs-payload-logger.mjs
import { sqsPayloadLoggerHandler } from "../../../src/handlers/sqs-payload-logger";
import { jest } from "@jest/globals";
import { SQSEvent } from "aws-lambda";

describe("Test for sqs-payload-logger", function () {
    it("Verifies the payload is logged", async () => {
        // Mock console.log statements so we can verify them.
        console.info = jest.fn();

        var payload = {
            DelaySeconds: 10,
            MessageAttributes: {
                Sender: {
                    DataType: "String",
                    StringValue: "sqs-payload-logger",
                },
            },
            MessageBody:
                "This message was sent by the sqs-payload-logger Lambda function",
            QueueUrl: "SQS_QUEUE_URL",
        } as unknown as SQSEvent;

        await sqsPayloadLoggerHandler(payload);
        expect(console.info).toHaveBeenCalledWith(JSON.stringify(payload));
    });
});
