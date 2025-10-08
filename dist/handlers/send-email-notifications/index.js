"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
const NotificationsService_1 = __importDefault(require("src/services/NotificationsService"));
const helpers_1 = require("src/config/sqs/helpers");
const handler = async (event) => {
    lambda_powertools_logger_1.default.info("Received event", { event });
    const queueMessages = (0, helpers_1.getParsedQueueMessagesBody)(event);
    const notificationService = NotificationsService_1.default;
    await notificationService.processMessagesAndSendEmails(queueMessages);
};
exports.handler = handler;
