"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sendpulse_api_1 = __importDefault(require("sendpulse-api"));
const helpers_1 = require("src/config/secrets/helpers");
const enums_1 = require("src/config/secrets/enums");
const data = "";
class SendpulseEmailService {
    // Make the constructor private to prevent direct instantiation
    constructor() { }
    // Static async factory method to handle async initialization
    static async create() {
        const instance = new SendpulseEmailService();
        const notificationsServiceSecrets = await (0, helpers_1.getSecrets)(`${enums_1.SecretLocation.notificationsServiceSecrets}/${process.env.ENV}`);
        instance.API_USER_ID =
            notificationsServiceSecrets.SENDPULSE_API_USER_ID;
        instance.API_SECRET = notificationsServiceSecrets.SENDPULSE_API_SECRET;
        instance.TOKEN_STORAGE =
            notificationsServiceSecrets.SENDPULSE_TOKEN_STORAGE;
        instance.initSendpulse();
        return instance;
    }
    initSendpulse() {
        sendpulse_api_1.default.init(this.API_USER_ID, this.API_SECRET, this.TOKEN_STORAGE, (token) => {
            if (token && token.is_error) {
                throw new Error("Sendpulse keys not found.");
            }
        });
    }
    async sendEmail({ recipient, subject, body, from, }) {
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
            sendpulse_api_1.default.smtpSendMail((data) => {
                if (data && data.result === true) {
                    resolve(data);
                }
                else {
                    reject(new Error("Failed to send email"));
                }
            }, email);
        });
    }
    sendBulkEmail({ recipients, subject, body, from, }) {
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
            sendpulse_api_1.default.smtpSendMail((data) => {
                if (data && data.result === true) {
                    resolve(data);
                }
                else {
                    reject(new Error("Failed to send email"));
                }
            }, email);
        });
    }
}
exports.default = SendpulseEmailService;
