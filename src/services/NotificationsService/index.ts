/* eslint-disable @typescript-eslint/no-explicit-any */
import { IQueueMessageBody } from "src/config/interfaces";
import { formatEmailMessageBody } from "src/helpers/email-helpers";
import SendpulseEmailService from "src/utils/send-pulse";

export class NotificationsService {
    constructor() {}

    public async processMessagesAndSendEmails(
        queueMessages: IQueueMessageBody[]
    ): Promise<void> {
        const sendpulseEmailService = await SendpulseEmailService.create();
        const promises: Promise<any>[] = [];
        queueMessages.forEach((message) => {
            const body = formatEmailMessageBody({
                recipient: message.body.recipients[0],
                message: message.body.message,
                event: message.body.event,
            });
            const subject = message.body.subject ?? "TraderApp Notification";
            const recipient = message.body.recipients[0].emailAddress ?? "";
            promises.push(
                sendpulseEmailService.sendEmail({ recipient, subject, body })
            );
        });
        await Promise.all(promises);
    }

    // public async sendBulkEmailWithSendpulse(
    //     queueMessages: IQueueEmailMessageBody[]
    // ): Promise<void> {
    //     const sendpulseEmailService = await SendpulseEmailService.create();
    //     sendpulseEmailService.sendBulkEmail({ recipients, subject, body, from });
    // }
}

export default new NotificationsService();
