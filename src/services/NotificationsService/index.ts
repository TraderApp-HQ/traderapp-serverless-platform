import { IQueueMessageBody } from "src/config/interfaces";
import { formatEmailMessageBody } from "src/helpers/email-helpers";
import SendpulseEmailService from "src/utils/send-pulse";

export interface EmailResult {
    recipient: string;
    subject: string;
    success: boolean;
    error?: string;
}

export class NotificationsService {
    public async processMessagesAndSendEmails(
        queueMessages: IQueueMessageBody[]
    ): Promise<EmailResult[]> {
        const sendpulseEmailService = await SendpulseEmailService.create();

        const results: EmailResult[] = [];

        for (const message of queueMessages) {
            for (const recipient of message.body.recipients) {
                const body = formatEmailMessageBody({
                    recipient,
                    message: message.body.message,
                    event: message.body.event,
                    sender: message.body.sender,
                });

                const subject =
                    message.body.subject ?? "TraderApp Notification";

                try {
                    await sendpulseEmailService.sendEmail({
                        recipient: recipient.emailAddress ?? "",
                        subject,
                        body,
                    });

                    results.push({
                        recipient: recipient.emailAddress ?? "",
                        subject,
                        success: true,
                    });
                } catch (err: unknown) {
                    const errorMessage =
                        err instanceof Error
                            ? err.message
                            : typeof err === "string"
                              ? err
                              : "Unknown error";

                    results.push({
                        recipient: recipient.emailAddress ?? "",
                        subject,
                        success: false,
                        error: errorMessage,
                    });
                }
            }
        }

        return results;
    }
}

export default new NotificationsService();
