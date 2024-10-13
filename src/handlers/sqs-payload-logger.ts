import { SQSEvent } from "aws-lambda";

export const sqsPayloadLoggerHandler = async (event: SQSEvent) => {
                console.info(JSON.stringify(event));
}
