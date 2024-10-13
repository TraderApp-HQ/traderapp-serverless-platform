"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqsPayloadLoggerHandler = void 0;
const sqsPayloadLoggerHandler = async (event) => {
    console.info(JSON.stringify(event));
};
exports.sqsPayloadLoggerHandler = sqsPayloadLoggerHandler;
