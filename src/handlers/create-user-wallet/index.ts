import log from "@dazn/lambda-powertools-logger";
import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";
import WalletsService from "src/services/WalletsService";
import { IWalletInput } from "src/types/wallets-service";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    log.info("Handler for user wallet creation");
    log.info("Received event ", { event });
    const queueMessages = getParsedQueueMessagesBody<IWalletInput>(event);
    const { failedMessageIds } =
        await WalletsService.createUserWallet(queueMessages);
        
    return {
        batchItemFailures: failedMessageIds.map((id) => ({
            itemIdentifier: id,
        })),
    };
};
