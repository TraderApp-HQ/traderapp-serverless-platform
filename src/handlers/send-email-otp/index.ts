import { SQSEvent } from "aws-lambda";
import log from "@dazn/lambda-powertools-logger";
import NotificationsService from "src/services/NotificationsService";
import { parseQueueMessagesBody } from "src/config/sqs/helpers";

export const handler = async (event: SQSEvent): Promise<void> => {
    log.info("Received event ", { event });
    const queueMessages = parseQueueMessagesBody(event);

    const notificationService = NotificationsService;
    await notificationService.processMessagesAndSendEmails(queueMessages);
};
