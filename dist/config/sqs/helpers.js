"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParsedQueueMessagesBody = exports.parseQueueMessagesBody = void 0;
/**
 * Parse SQS event messages and convert the JSON body to a specified type
 * @param event The SQS event containing records to parse
 * @returns Array of parsed records with typed body
 */
const parseQueueMessagesBody = (event) => {
    const queueMessages = event.Records.map((record) => {
        return {
            ...record,
            body: JSON.parse(record.body),
        };
    });
    return queueMessages;
};
exports.parseQueueMessagesBody = parseQueueMessagesBody;
/**
 * Legacy version for backward compatibility with notification service
 * @param event The SQS event containing records to parse
 * @returns Array of parsed records with IQueueMessageBodyObject body
 */
const getParsedQueueMessagesBody = (event) => {
    return (0, exports.parseQueueMessagesBody)(event);
};
exports.getParsedQueueMessagesBody = getParsedQueueMessagesBody;
