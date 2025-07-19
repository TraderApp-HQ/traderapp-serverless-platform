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
            message.body.recipients.forEach((recipient) => {
                const body = (0, email_helpers_1.formatEmailMessageBody)({
                    recipient,
                    message: message.body.message,
                    event: message.body.event,
                    sender: message.body.sender,
                });
                const subject = message.body.subject ?? "TraderApp Notification";
                promises.push(sendpulseEmailService.sendEmail({
                    recipient: recipient.emailAddress ?? "",
                    subject,
                    body,
                }));
            });
        });
        await Promise.all(promises);
    }
}
exports.NotificationsService = NotificationsService;
exports.default = new NotificationsService();
