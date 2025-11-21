import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import UsersService from "../UsersService";
import { EventTemplate } from "src/config/enums";
import { IQueueMessageBodyObject } from "src/config/interfaces";
import { format } from "date-fns/format";

interface IPublishDepositConfirmationToQueueInput {
    userId: string;
    amount: number;
    address: string;
    network: string;
    transactionId: string;
    queueUrl: string;
}

export const publishDepositConfirmationToQueue = async (
    input: IPublishDepositConfirmationToQueueInput
) => {
    const { userId, amount, transactionId, queueUrl, network, address } = input;

    const user = await UsersService.getUserById(userId);
    if (!user) {
        throw new Error(`User with the ID ${userId} not found`);
    }

    const dateTime = new Date(); // Server time
    const dateTimeGMT1 = new Date(dateTime.getTime() + 60 * 60 * 1000) // GMT+1 - Nigerian Time Zone
    const message: IQueueMessageBodyObject = {
        recipients: [{ firstName: user.firstName, emailAddress: user.email }],
        message: "Deposit Confirmation",
        event: EventTemplate.SEND_DEPOSIT_CONFIRMATION_EMAIL,
        metadata: {
            amount,
            transactionId,
            address,
            network,
            dateTime: `${format(dateTimeGMT1, "do MMM, yyyy, h:mma")} (GMT+1)`,
        },
        subject: "Deposit Confirmation",
    };

    await publishMessageToQueue({
        queueUrl,
        message: JSON.stringify(message),
    });
};
