import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import UsersService from "../UsersService";
import { EventTemplate } from "src/config/enums";
import { IQueueMessageBodyObject } from "src/config/interfaces";
import { format } from "date-fns/format";

interface IPublishNewTradeNoticationToQueueInput {
    userId: string;
    asset?: string;
    entryPrice?: number;
    stopLoss?: number;
    estimatedProfit?: number;
    estimatedLoss?: number;
    queueUrl: string;
   
}

export const publishNewTradeNotificationToQueue = async (
    input: IPublishNewTradeNoticationToQueueInput
) => {
    const { userId, asset, entryPrice, estimatedLoss, estimatedProfit, stopLoss, queueUrl  } = input;

    const user = await UsersService.getUserById(userId);
    if (!user) {
        throw new Error(`User with the ID ${userId} not found`);
    }

    const dateTime = new Date().toISOString();
    const message: IQueueMessageBodyObject = {
        recipients: [{ firstName: user.firstName, emailAddress: user.email }],
        message: "New Trade Initiated Successfully",
        event: EventTemplate.SEND_WITHDRAWAL_CONFIRMATION_EMAIL,
        metadata: {
            asset,
            entryPrice,
            stopLoss,
            estimatedProfit,
            estimatedLoss,
            dateTime: format(dateTime, "do MMMM yyyy, h:mm a"),
        },
        subject: "New Trade Initiated Successfully",
    };

    await publishMessageToQueue({
        queueUrl,
        message: JSON.stringify(message),
    });
};
