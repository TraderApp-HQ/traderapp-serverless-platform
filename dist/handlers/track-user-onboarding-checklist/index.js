"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
const helpers_1 = require("src/config/sqs/helpers");
const UsersService_1 = __importDefault(require("src/services/UsersService"));
const handler = async (event) => {
    lambda_powertools_logger_1.default.info("Handler for user onboarding task update");
    lambda_powertools_logger_1.default.info("Received event ", { event });
    const queueMessages = (0, helpers_1.getParsedQueueMessagesBody)(event);
    const { failedMessageIds } = await UsersService_1.default.trackUserOnboardingChecklist(queueMessages);
    return {
        batchItemFailures: failedMessageIds.map((id) => ({
            itemIdentifier: id,
        })),
    };
};
exports.handler = handler;
