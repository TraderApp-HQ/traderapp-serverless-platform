import { SQSEvent } from "aws-lambda";
import {
    IQueueEmailMessageBody,
    IQueueEmailMessageBodyObject,
} from "src/config/interfaces";
import log from "@dazn/lambda-powertools-logger";
// import NotificationsService from 'src/services/NotificationsService';
import NotificationsService from "src/services/NotificationsService";

export const handler = async (event: SQSEvent): Promise<void> => {
    console.info("Received event", JSON.stringify(event));
    const queueMessages: IQueueEmailMessageBody[] = event.Records.map(
        (record) => {
            return {
                ...record,
                body: record.body as unknown as IQueueEmailMessageBodyObject,
            };
        }
    );

    const notificationService = NotificationsService;
    await notificationService.processMessagesAndSendEmails(queueMessages);
};
