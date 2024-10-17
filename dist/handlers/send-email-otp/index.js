"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
// import NotificationsService from 'src/services/NotificationsService';
const NotificationsService_1 = __importDefault(require("src/services/NotificationsService"));
const handler = async (event) => {
    console.info("Received event", JSON.stringify(event));
    const queueMessages = event.Records.map((record) => {
        return {
            ...record,
            body: record.body,
        };
    });
    const notificationService = NotificationsService_1.default;
    await notificationService.processMessagesAndSendEmails(queueMessages);
};
exports.handler = handler;
