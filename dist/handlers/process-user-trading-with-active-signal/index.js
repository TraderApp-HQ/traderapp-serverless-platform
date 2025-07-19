"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
const helpers_1 = require("src/config/sqs/helpers");
const TradingEngineService_1 = __importDefault(require("src/services/TradingEngineService"));
const handler = async (event) => {
    lambda_powertools_logger_1.default.info("Received event", { event });
    const queueMessages = (0, helpers_1.getParsedQueueMessagesBody)(event);
    const { failedMessageIds } = await TradingEngineService_1.default.processUserTradingWithActiveSignal(queueMessages);
    // put failed items back into the queue
    return {
        batchItemFailures: failedMessageIds.map((id) => ({
            itemIdentifier: id,
        })),
    };
};
exports.handler = handler;
