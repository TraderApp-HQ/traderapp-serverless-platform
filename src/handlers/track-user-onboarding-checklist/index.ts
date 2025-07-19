import log from "@dazn/lambda-powertools-logger";
import { SQSBatchResponse, SQSEvent } from "aws-lambda";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";
import UsersService from "src/services/UsersService";
import { ITrackUserOnboardingChecklistInput } from "src/types/users-service";

export const handler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
    log.info("Handler for user onboarding task update");
    log.info("Received event ", { event });
    const queueMessages =
        getParsedQueueMessagesBody<ITrackUserOnboardingChecklistInput>(event);
    const { failedMessageIds } =
        await UsersService.trackUserOnboardingChecklist(queueMessages);

    return {
        batchItemFailures: failedMessageIds.map((id) => ({
            itemIdentifier: id,
        })),
    };
};
