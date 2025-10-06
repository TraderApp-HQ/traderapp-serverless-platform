import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import UsersService from "../UsersService";
import { EventTemplate } from "src/config/enums";
import { IQueueMessageBodyObject } from "src/config/interfaces";
import { format } from "date-fns/format";

interface IPublishDepositConfirmationToQueueInput {
    userId: string;
    amount: number;
    transactionId: string;
    queueUrl: string;
}

export const publishDepositConfirmationToQueue = async (
    input: IPublishDepositConfirmationToQueueInput
) => {
    const { userId, amount, transactionId, queueUrl } = input;

    const user = await UsersService.getUserById(userId);
    if (!user) {
        throw new Error(`User with the ID ${userId} not found`);
    }

    const dateTime = new Date().toISOString()
    const message: IQueueMessageBodyObject = {
        recipients: [{ firstName: user.firstName, emailAddress: user.email }],
        message: "Deposit Confirmation",
        event: EventTemplate.SEND_DEPOSIT_CONFIRMATION_EMAIL,
        metadata: { amount, transactionId, dateTime: format(dateTime, "do MMM, yyyy, h:mma") },
        subject: "Deposit Confirmation",
    };

    await publishMessageToQueue({
        queueUrl,
        message: JSON.stringify(message),
    });
};
