import log from "@dazn/lambda-powertools-logger";
import "dotenv/config";
import { QueueService } from "..";

interface QueueInput {
    queueUrl: string;
    message: string;
    awsRegion?: string;
}

export const publishMessageToQueue = async ({
    message,
    queueUrl,
    awsRegion,
}: QueueInput) => {
    const region = awsRegion ?? process.env.AWS_REGION ?? "eu-west-1";
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
        throw error;
    }
};
