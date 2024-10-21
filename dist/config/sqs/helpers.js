"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/config/sqs/helpers.ts
var helpers_exports = {};
__export(helpers_exports, {
  parseQueueMessagesBody: () => parseQueueMessagesBody
});
module.exports = __toCommonJS(helpers_exports);
var parseQueueMessagesBody = (event) => {
  const queueMessages = event.Records.map((record) => {
    return {
      ...record,
      body: JSON.parse(record.body)
    };
  });
  return queueMessages;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  parseQueueMessagesBody
});
