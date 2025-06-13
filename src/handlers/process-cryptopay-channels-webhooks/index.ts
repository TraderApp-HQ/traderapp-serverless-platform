import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import log from "@dazn/lambda-powertools-logger";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";
import { ICryptopayWebhookEvent } from "src/clients/CryptoPayClient";
import WalletsService from "src/services/WalletsService";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    log.info("Received event", { event });
    const queueMessages =
        getParsedQueueMessagesBody<ICryptopayWebhookEvent>(event);
    const { failedMessageIds } =
        await WalletsService.processCryptoPayChannelsWebhook(queueMessages);

    // put failed items back into the queue
    return {
        batchItemFailures: failedMessageIds.map((id) => ({
            itemIdentifier: id,
        })),
    };
};
