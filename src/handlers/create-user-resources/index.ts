import log from "@dazn/lambda-powertools-logger";
import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";
import { ICreateUserResourcesInput } from "src/types/wallets-service";
import { createUserResources } from "./helpers";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    log.info("Handler for user resources creation");
    log.info("Received event ", { event });

    const queueMessages = getParsedQueueMessagesBody<ICreateUserResourcesInput>(event);
    const { failedMessageIds } = await createUserResources(queueMessages);

    return {
        batchItemFailures: failedMessageIds.map((id) => ({
            itemIdentifier: id,
        })),
    };
};
