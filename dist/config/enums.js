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

// src/config/enums.ts
var enums_exports = {};
__export(enums_exports, {
  EventTemplate: () => EventTemplate
});
module.exports = __toCommonJS(enums_exports);
var EventTemplate = /* @__PURE__ */ ((EventTemplate2) => {
  EventTemplate2["WELCOME"] = "WELCOME";
  EventTemplate2["LOGIN"] = "LOGIN";
  EventTemplate2["GENERAL"] = "GENERAL";
  EventTemplate2["RESET_PASSWORD"] = "RESET_PASSWORD";
  EventTemplate2["OTP"] = "OTP";
  EventTemplate2["CREATE_USER"] = "CREATE_USER";
  return EventTemplate2;
})(EventTemplate || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EventTemplate
});
