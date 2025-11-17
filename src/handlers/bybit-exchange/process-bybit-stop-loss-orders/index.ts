import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import log from "@dazn/lambda-powertools-logger";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";
import { ITrade } from "src/services/TradingEngineService/interfaces";
import { processBybitStopLossOrders } from "../helpers";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    log.info("Received event", { event });
    const queueMessages = getParsedQueueMessagesBody<ITrade>(event);
    const { failedMessageIds } =
        await processBybitStopLossOrders(queueMessages);

    // put failed items back into the queue
    return {
        batchItemFailures: failedMessageIds.map((id) => ({
            itemIdentifier: id,
        })),
    };
};
