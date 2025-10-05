/* eslint-disable @typescript-eslint/no-explicit-any */
import { IQueueMessageBody } from "src/config/interfaces";
import { formatEmailMessageBody } from "src/helpers/email-helpers";
import SendpulseEmailService from "src/utils/send-pulse";

export class NotificationsService {
    constructor() {}

    public async processMessagesAndSendEmails(
        queueMessages: IQueueMessageBody[]
    ): Promise<void> {
        console.log(
            "######### data before sendpulseEmailService ############",
            {
                recipients: queueMessages[0].body.recipients,
                message: queueMessages[0].body.message,
                event: queueMessages[0].body.event,
                sender: queueMessages[0].body.sender,
                metadata: queueMessages[0].body.metadata,
            }
        );
        const sendpulseEmailService = await SendpulseEmailService.create();
        const promises: Promise<any>[] = [];
        console.log(
            "######### metadata after sendpulseEmailService create ############",
            {
                recipients: queueMessages[0].body.recipients,
                message: queueMessages[0].body.message,
                event: queueMessages[0].body.event,
                sender: queueMessages[0].body.sender,
                metadata: queueMessages[0].body.metadata,
            }
        );
        queueMessages.forEach((message) => {
            message.body.recipients.forEach((recipient) => {
                const body = formatEmailMessageBody({
                    recipient,
                    message: message.body.message,
                    event: message.body.event,
                    sender: message.body.sender,
                    metadata: message.body.metadata,
                });
                console.log(
                    "######### metadata after formatEmailMessageBody ############",
                    {
                        recipients: message.body.recipients,
                        message: message.body.message,
                        event: message.body.event,
                        sender: message.body.sender,
                        metadata: message.body.metadata,
                    }
                );
                const subject =
                    message.body.subject ?? "TraderApp Notification";
                promises.push(
                    sendpulseEmailService.sendEmail({
                        recipient: recipient.emailAddress ?? "",
                        subject,
                        body,
                    })
                );
                console.log(
                    "######### metadata after sendpulseEmailService sendEmail ############",
                    {
                        recipients: message.body.recipients,
                        message: message.body.message,
                        event: message.body.event,
                        sender: message.body.sender,
                        metadata: message.body.metadata,
                    }
                );
            });
        });
        await Promise.all(promises);
        console.log(
            "######### metadata after sendpulseEmailService promises ############",
            {
                recipients: queueMessages[0].body.recipients,
                message: queueMessages[0].body.message,
                event: queueMessages[0].body.event,
                sender: queueMessages[0].body.sender,
                metadata: queueMessages[0].body.metadata,
            }
        );
    }

    // public async sendBulkEmailWithSendpulse(
    //     queueMessages: IQueueEmailMessageBody[]
    // ): Promise<void> {
    //     const sendpulseEmailService = await SendpulseEmailService.create();
    //     sendpulseEmailService.sendBulkEmail({ recipients, subject, body, from });
    // }
}

export default new NotificationsService();
