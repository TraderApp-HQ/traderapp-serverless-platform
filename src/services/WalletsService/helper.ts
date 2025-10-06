import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import UsersService from "../UsersService";
import { EventTemplate } from "src/config/enums";

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

    await publishMessageToQueue({
        queueUrl,
        message: JSON.stringify({
            recipients: [{ firstName: user.firstName, email: user.email }],
            message: "",
            event: EventTemplate.SEND_DEPOSIT_CONFIRMATION_EMAIL,
            metadata: { amount, transactionId },
        }),
    });
};
