"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishDepositConfirmationToQueue = void 0;
const helpers_1 = require("src/clients/SQSClient/helpers");
const UsersService_1 = __importDefault(require("../UsersService"));
const enums_1 = require("src/config/enums");
const format_1 = require("date-fns/format");
const publishDepositConfirmationToQueue = async (input) => {
    const { userId, amount, transactionId, queueUrl } = input;
    const user = await UsersService_1.default.getUserById(userId);
    if (!user) {
        throw new Error(`User with the ID ${userId} not found`);
    }
    const dateTime = new Date().toISOString();
    const message = {
        recipients: [{ firstName: user.firstName, emailAddress: user.email }],
        message: "Deposit Confirmation",
        event: enums_1.EventTemplate.SEND_DEPOSIT_CONFIRMATION_EMAIL,
        metadata: {
            amount,
            transactionId,
            dateTime: (0, format_1.format)(dateTime, "do MMM, yyyy, h:mma"),
        },
        subject: "Deposit Confirmation",
    };
    await (0, helpers_1.publishMessageToQueue)({
        queueUrl,
        message: JSON.stringify(message),
    });
};
exports.publishDepositConfirmationToQueue = publishDepositConfirmationToQueue;
