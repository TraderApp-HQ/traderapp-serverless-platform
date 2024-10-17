"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const email_helpers_1 = require("src/helpers/email-helpers");
const send_pulse_1 = __importDefault(require("src/utils/send-pulse"));
class NotificationsService {
    constructor() { }
    async processMessagesAndSendEmails(queueMessages) {
        const sendpulseEmailService = await send_pulse_1.default.create();
        const promises = [];
        queueMessages.forEach((message) => {
            const body = (0, email_helpers_1.formatEmailMessageBody)({
                recipient: message.body.messageObject.recipients[0],
                message: message.body.messageObject.message,
                event: message.body.event,
            });
            const subject = message.body.messageObject.subject ?? "TraderApp Notification";
            const recipient = message.body.messageObject.recipients[0].emailAddress;
            console.log("Trying to send email: ", recipient, subject);
            promises.push(sendpulseEmailService.sendEmail({ recipient: 1, subject, body }));
        });
        await Promise.all(promises);
    }
    async sendBulkEmailWithSendpulse(queueMessages) {
        // const sendpulseEmailService = await SendpulseEmailService.create();
        // sendpulseEmailService.sendBulkEmail({ recipients, subject, body, from });
    }
}
exports.NotificationsService = NotificationsService;
exports.default = new NotificationsService();
