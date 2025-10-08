"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishMessageToQueue = void 0;
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
require("dotenv/config");
const __1 = require("..");
const publishMessageToQueue = async ({ message, queueUrl, awsRegion, }) => {
    const region = awsRegion ?? process.env.AWS_REGION ?? "eu-west-1";
    const sqsClient = new __1.QueueService({ region, queueUrl });
    try {
        let processedBody;
        if (typeof message === "string") {
            processedBody = message;
        }
        else {
            processedBody = JSON.stringify(message);
        }
        await sqsClient.sendMessage(processedBody);
    }
    catch (error) {
        lambda_powertools_logger_1.default.error(`Error sending message to queue == ${JSON.stringify(error)}`);
        throw error;
    }
};
exports.publishMessageToQueue = publishMessageToQueue;
