"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const client_sqs_1 = require("@aws-sdk/client-sqs");
class QueueService {
    constructor(input) {
        this.sqsClient = new client_sqs_1.SQSClient({ region: input.region });
        this.queueUrl = input.queueUrl;
    }
    async sendMessage(message) {
        const command = new client_sqs_1.SendMessageCommand({
            QueueUrl: this.queueUrl,
            MessageBody: message,
        });
        try {
            const response = await this.sqsClient.send(command);
            return response.MessageId ?? "";
        }
        catch (error) {
            console.error("Error sending message:", error);
            throw error;
        }
    }
    async receiveMessages(input) {
        const command = new client_sqs_1.ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: input?.maxNumberOfMessages ?? 1,
        });
        try {
            const response = await this.sqsClient.send(command);
            if (response.Messages && response.Messages.length > 0) {
                return response.Messages;
            }
            else {
                return [];
            }
        }
        catch (error) {
            console.error("Error receiving messages:", error);
            throw error;
        }
    }
    async deleteMessages(messages) {
        const entries = messages.map((message) => ({
            Id: message.MessageId,
            ReceiptHandle: message.ReceiptHandle,
        }));
        const command = new client_sqs_1.DeleteMessageBatchCommand({
            QueueUrl: this.queueUrl,
            Entries: entries,
        });
        try {
            await this.sqsClient.send(command);
            console.log("Messages deleted:", messages);
        }
        catch (error) {
            console.error("Error deleting messages:", error);
            throw error;
        }
    }
}
exports.QueueService = QueueService;
