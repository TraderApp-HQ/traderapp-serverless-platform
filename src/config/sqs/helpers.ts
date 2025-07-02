import { SQSEvent } from "aws-lambda";
import { IQueueMessageBody, IQueueMessageBodyObject } from "../interfaces";

/**
 * Parse SQS event messages and convert the JSON body to a specified type
 * @param event The SQS event containing records to parse
 * @returns Array of parsed records with typed body
 */
export const parseQueueMessagesBody = <T = IQueueMessageBodyObject>(
    event: SQSEvent
) => {
    const queueMessages = event.Records.map((record) => {
        return {
            ...record,
            body: JSON.parse(record.body) as unknown as T,
        };
    });
    return queueMessages;
};

/**
 * Legacy version for backward compatibility with notification service
 * @param event The SQS event containing records to parse
 * @returns Array of parsed records with IQueueMessageBodyObject body
 */
export const getParsedQueueMessagesBody = <T = IQueueMessageBodyObject>(
    event: SQSEvent
): IQueueMessageBody<T>[] => {
    return parseQueueMessagesBody<T>(event) as IQueueMessageBody<T>[];
};
