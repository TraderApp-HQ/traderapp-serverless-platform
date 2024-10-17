import sendpulse from "sendpulse-api";
import { getSecrets } from "src/config/secrets/helpers";
import { INotificationsServiceSecrets } from "src/config/secrets/interfaces";
import { SecretLocation } from "src/config/secrets/enums";
const data = "";

export interface IContact {
    name?: string;
    email: string;
}

export interface ISendEmailInput {
    recipient: string;
    subject: string;
    body: string;
    from?: IContact;
}

export interface ISendBulkEmailInput {
    recipients: IContact[];
    subject: string;
    body: string;
    from?: IContact;
}

class SendpulseEmailService {
    private API_USER_ID!: string;
    private API_SECRET!: string;
    private TOKEN_STORAGE!: string;

    // Make the constructor private to prevent direct instantiation
    private constructor() {}

    // Static async factory method to handle async initialization
    public static async create(): Promise<SendpulseEmailService> {
        const instance = new SendpulseEmailService();
        const notificationsServiceSecrets =
            await getSecrets<INotificationsServiceSecrets>(
                `${SecretLocation.notificationsServiceSecrets}/${process.env.ENV}`
            );
        instance.API_USER_ID =
            notificationsServiceSecrets.SENDPULSE_API_USER_ID;
        instance.API_SECRET = notificationsServiceSecrets.SENDPULSE_API_SECRET;
        instance.TOKEN_STORAGE =
            notificationsServiceSecrets.SENDPULSE_TOKEN_STORAGE;

        instance.initSendpulse();
        return instance;
    }

    private initSendpulse() {
        sendpulse.init(
            this.API_USER_ID,
            this.API_SECRET,
            this.TOKEN_STORAGE,
            (token: any) => {
                if (token && token.is_error) {
                    throw new Error("Sendpulse keys not found.");
                }
            }
        );
    }

    public async sendEmail({
        recipient,
        subject,
        body,
        from,
    }: ISendEmailInput): Promise<any> {
        const email = {
            html: body,
            subject,
            from: {
                name: from?.name ?? "TraderApp",
                email: from?.email ?? "noreply@traderapp.finance",
            },
            to: [
                {
                    email: recipient,
                },
            ],
        };

        return new Promise((resolve, reject) => {
            sendpulse.smtpSendMail((data: any) => {
                if (data && data.result === true) {
                    resolve(data);
                } else {
                    reject(new Error("Failed to send email"));
                }
            }, email);
        });
    }

    public sendBulkEmail({
        recipients,
        subject,
        body,
        from,
    }: ISendBulkEmailInput) {
        const email = {
            html: body,
            subject,
            from: {
                name: from?.name ?? "TraderApp",
                email: from?.email ?? "noreply@traderapp.finance",
            },
            to: recipients,
        };

        return new Promise((resolve, reject) => {
            sendpulse.smtpSendMail((data: any) => {
                if (data && data.result === true) {
                    resolve(data);
                } else {
                    reject(new Error("Failed to send email"));
                }
            }, email);
        });
    }
}

export default SendpulseEmailService;
