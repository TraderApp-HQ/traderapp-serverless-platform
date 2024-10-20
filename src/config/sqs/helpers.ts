import { SQSEvent } from "aws-lambda";
import { IQueueMessageBody, IQueueMessageBodyObject } from "../interfaces";

export const parseQueueMessagesBody = (event: SQSEvent) => {
    const queueMessages: IQueueMessageBody[] = event.Records.map((record) => {
        return {
            ...record,
            body: JSON.parse(record.body) as unknown as IQueueMessageBodyObject,
        };
    });
    return queueMessages;
};
