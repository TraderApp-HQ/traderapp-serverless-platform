import log from "@dazn/lambda-powertools-logger";
import "dotenv/config";
import { IUpdateUserOnboardingStatusInput } from "src/types/users-service";
import { QueueService } from "..";

interface QueueInput {
    queueUrl: string;
    message: string | IUpdateUserOnboardingStatusInput;
    awsRegion?: string;
}

export const publishMessageToQueue = async ({
    message,
    queueUrl,
    awsRegion,
}: QueueInput) => {
    const region = awsRegion ?? process.env.AWS_REGION ?? "";
    const sqsClient = new QueueService({ region, queueUrl });

    try {
        let processedBody: string;
        if (typeof message === "string") {
            processedBody = message;
        } else {
            processedBody = JSON.stringify(message);
        }
        await sqsClient.sendMessage(processedBody);
    } catch (error) {
        log.error(`Error sending message to queue == ${JSON.stringify(error)}`);
    }
};
