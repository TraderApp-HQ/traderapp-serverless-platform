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
  AccountType: () => AccountType,
  Category: () => Category,
  Currency: () => Currency,
  EventTemplate: () => EventTemplate,
  TradingPlatform: () => TradingPlatform,
  UserRoles: () => UserRoles
});
module.exports = __toCommonJS(enums_exports);
var EventTemplate = /* @__PURE__ */ ((EventTemplate2) => {
  EventTemplate2["WELCOME"] = "WELCOME";
  EventTemplate2["LOGIN"] = "LOGIN";
  EventTemplate2["GENERAL"] = "GENERAL";
  EventTemplate2["RESET_PASSWORD"] = "RESET_PASSWORD";
  EventTemplate2["OTP"] = "OTP";
  EventTemplate2["CREATE_USER"] = "CREATE_USER";
  EventTemplate2["INVITE_USER"] = "INVITE_USER";
  EventTemplate2["SEND_EMAIL"] = "SEND_EMAIL";
  EventTemplate2["SEND_DEPOSIT_CONFIRMATION_EMAIL"] = "SEND_DEPOSIT_CONFIRMATION_EMAIL";
  EventTemplate2["SEND_WITHDRAWAL_CONFIRMATION_EMAIL"] = "SEND_WITHDRAWAL_CONFIRMATION_EMAIL";
  EventTemplate2["SEND_TRADE_INITIATED_NOTIFICATION"] = "SEND_TRADE_INITIATED_NOTIFICATION";
  EventTemplate2["SEND_TRADE_ACTIVATED_NOTIFICATION"] = "SEND_TRADE_ACTIVATED_NOTIFICATION";
  return EventTemplate2;
})(EventTemplate || {});
var AccountType = /* @__PURE__ */ ((AccountType2) => {
  AccountType2["SPOT"] = "SPOT";
  AccountType2["FUTURES"] = "FUTURES";
  AccountType2["MARGIN"] = "MARGIN";
  return AccountType2;
})(AccountType || {});
var Currency = /* @__PURE__ */ ((Currency2) => {
  Currency2["USDT"] = "USDT";
  Currency2["BTC"] = "BTC";
  return Currency2;
})(Currency || {});
var TradingPlatform = /* @__PURE__ */ ((TradingPlatform2) => {
  TradingPlatform2["BINANCE"] = "BINANCE";
  TradingPlatform2["KUCOIN"] = "KUCOIN";
  TradingPlatform2["BYBIT"] = "BYBIT";
  return TradingPlatform2;
})(TradingPlatform || {});
var Category = /* @__PURE__ */ ((Category2) => {
  Category2["FOREX"] = "FOREX";
  Category2["CRYPTO"] = "CRYPTO";
  return Category2;
})(Category || {});
var UserRoles = /* @__PURE__ */ ((UserRoles2) => {
  UserRoles2["USER"] = "USER";
  UserRoles2["SUBSCRIBER"] = "SUBSCRIBER";
  UserRoles2["ADMIN"] = "ADMIN";
  UserRoles2["SUPER_ADMIN"] = "SUPER_ADMIN";
  return UserRoles2;
})(UserRoles || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AccountType,
  Category,
  Currency,
  EventTemplate,
  TradingPlatform,
  UserRoles
});
