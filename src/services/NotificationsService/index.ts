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
            const { recipients, message: msg, event, sender, subject, metadata } = message.body;

            for (const recipient of recipients) {
                const body = formatEmailMessageBody({
                    recipient,
                    message: msg,
                    event,
                    sender,
                    metadata,
                });

                const finalSubject = subject ?? "TraderApp Notification";

                try {
                    await sendpulseEmailService.sendEmail({
                        recipient: recipient.emailAddress ?? "",
                        subject: finalSubject,
                        body,
                    });

                    results.push({
                        recipient: recipient.emailAddress ?? "",
                        subject: finalSubject,
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
                        subject: finalSubject,
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
