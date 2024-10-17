import { IQueueEmailMessageBody } from "src/config/interfaces";
import { formatEmailMessageBody } from "src/helpers/email-helpers";
import SendpulseEmailService, { IContact } from "src/utils/send-pulse";

interface ISendBulkEmailInput {
    recipients: IContact[];
    subject: string;
    body: string;
    from?: IContact;
}

export class NotificationsService {
    constructor() {}

    public async processMessagesAndSendEmails(
        queueMessages: IQueueEmailMessageBody[]
    ): Promise<void> {
        const sendpulseEmailService = await SendpulseEmailService.create();
        const promises: Promise<any>[] = [];
        queueMessages.forEach((message) => {
            const body = formatEmailMessageBody({
                recipient: message.body.messageObject.recipients[0],
                message: message.body.messageObject.message,
                event: message.body.event,
            });
            const subject =
                message.body.messageObject.subject ?? "TraderApp Notification";
            const recipient =
                message.body.messageObject.recipients[0].emailAddress;
            console.log("Trying to send email: ", recipient, subject);
            promises.push(
                sendpulseEmailService.sendEmail({ recipient, subject, body })
            );
        });
        await Promise.all(promises);
    }

    public async sendBulkEmailWithSendpulse(
        queueMessages: IQueueEmailMessageBody[]
    ): Promise<void> {
        // const sendpulseEmailService = await SendpulseEmailService.create();
        // sendpulseEmailService.sendBulkEmail({ recipients, subject, body, from });
    }
}

export default new NotificationsService();
