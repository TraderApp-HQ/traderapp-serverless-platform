import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import log from "@dazn/lambda-powertools-logger";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";
import { IOrder } from "src/services/TradingEngineService/interfaces";
import { processBybitCancelOrders } from "../helpers";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    log.info("Received event", { event });
    const queueMessages = getParsedQueueMessagesBody<IOrder>(event);
    const { failedMessageIds } = await processBybitCancelOrders(queueMessages);

    // put failed items back into the queue
    return {
        batchItemFailures: failedMessageIds.map((id) => ({
            itemIdentifier: id,
        })),
    };
};
