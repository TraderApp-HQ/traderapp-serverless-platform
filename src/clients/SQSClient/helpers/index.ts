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
        console.error("Error sending message to queue", { error });
        throw error;
    }
};
