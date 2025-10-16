import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import log from "@dazn/lambda-powertools-logger";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";
import { IFailedTrade } from "src/services/TradingEngineService/interfaces";
import { handleFailedTrades } from "../../helpers/trade-service-helpers";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    log.info("Received event", { event });
    const queueMessages =
        getParsedQueueMessagesBody<IFailedTrade>(event);
    const { failedMessageIds } = await handleFailedTrades(queueMessages);

    // put failed items back into the queue
    return {
        batchItemFailures: failedMessageIds.map((id) => ({
            itemIdentifier: id,
        })),
    };
};
