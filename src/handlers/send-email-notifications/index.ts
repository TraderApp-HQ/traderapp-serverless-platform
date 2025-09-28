import { SQSEvent } from "aws-lambda";
import log from "@dazn/lambda-powertools-logger";
import NotificationsService from "src/services/NotificationsService";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";

export const handler = async (event: SQSEvent): Promise<void> => {
    log.info("Received event", { event });
    const queueMessages = getParsedQueueMessagesBody(event);

    const notificationService = NotificationsService;
    await notificationService.processMessagesAndSendEmails(queueMessages);

};
