import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import UsersService from "../UsersService";
import { EventTemplate } from "src/config/enums";
import { IQueueMessageBodyObject } from "src/config/interfaces";
import { format } from "date-fns/format";

interface IPublishWithdrawlConfirmationToQueueInput {
    userId: string;
    amount?: number;
    transactionId?: string;
    network?: string;
    address?: string;
    queueUrl: string;
}

export const publishWithdrawlConfirmationToQueue = async (
    input: IPublishWithdrawlConfirmationToQueueInput
) => {
    const { userId, amount, transactionId, queueUrl, address, network } = input;

    const user = await UsersService.getUserById(userId);
    if (!user) {
        throw new Error(`User with the ID ${userId} not found`);
    }

    const dateTime = new Date().toISOString();
    const message: IQueueMessageBodyObject = {
        recipients: [{ firstName: user.firstName, emailAddress: user.email }],
        message: "Withdrawal Successful",
        event: EventTemplate.SEND_WITHDRAWAL_CONFIRMATION_EMAIL,
        metadata: {
            amount,
            transactionId,
            address,
            network,
            dateTime: format(dateTime, "do MMMM yyyy, h:mm a"),
        },
        subject: "Withdrawal Successful",
    };

    await publishMessageToQueue({
        queueUrl,
        message: JSON.stringify(message),
    });
};
