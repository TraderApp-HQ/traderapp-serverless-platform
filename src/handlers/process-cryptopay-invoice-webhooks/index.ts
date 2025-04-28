import { SQSEvent } from "aws-lambda";
import log from "@dazn/lambda-powertools-logger";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";
import { ICryptopayWebhookEvent } from "src/clients/CryptoPayClient";
import WalletsService from "src/services/WalletsService";

export const handler = async (event: SQSEvent): Promise<void> => {
    log.info("Received event", { event });
    const queueMessages =
        getParsedQueueMessagesBody<ICryptopayWebhookEvent>(event);
    await WalletsService.processCryptoPayInvoiceWebhook(queueMessages);
};
