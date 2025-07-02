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

// src/types/wallets-service.ts
var wallets_service_exports = {};
__export(wallets_service_exports, {
  PaymentCategoryName: () => PaymentCategoryName,
  TransactionSource: () => TransactionSource,
  TransactionStatus: () => TransactionStatus,
  TransactionType: () => TransactionType,
  WalletProvider: () => WalletProvider,
  WalletType: () => WalletType
});
module.exports = __toCommonJS(wallets_service_exports);
var WalletType = /* @__PURE__ */ ((WalletType2) => {
  WalletType2["MAIN"] = "MAIN";
  WalletType2["SPOT"] = "SPOT";
  WalletType2["FUTURES"] = "FUTURES";
  return WalletType2;
})(WalletType || {});
var TransactionType = /* @__PURE__ */ ((TransactionType2) => {
  TransactionType2["DEPOSIT"] = "DEPOSIT";
  TransactionType2["WITHDRAWAL"] = "WITHDRAWAL";
  TransactionType2["TRANSFER"] = "TRANSFER";
  TransactionType2["CONVERT"] = "CONVERT";
  return TransactionType2;
})(TransactionType || {});
var TransactionSource = /* @__PURE__ */ ((TransactionSource2) => {
  TransactionSource2["INTERNAL"] = "INTERNAL";
  TransactionSource2["EXTERNAL"] = "EXTERNAL";
  return TransactionSource2;
})(TransactionSource || {});
var TransactionStatus = /* @__PURE__ */ ((TransactionStatus2) => {
  TransactionStatus2["PENDING"] = "PENDING";
  TransactionStatus2["SUCCESS"] = "SUCCESS";
  TransactionStatus2["FAILED"] = "FAILED";
  TransactionStatus2["BLOCKED"] = "BLOCKED";
  return TransactionStatus2;
})(TransactionStatus || {});
var WalletProvider = /* @__PURE__ */ ((WalletProvider2) => {
  WalletProvider2["CRYPTOPAY"] = "CryptoPay";
  return WalletProvider2;
})(WalletProvider || {});
var PaymentCategoryName = /* @__PURE__ */ ((PaymentCategoryName2) => {
  PaymentCategoryName2["CRYPTO"] = "Crypto";
  return PaymentCategoryName2;
})(PaymentCategoryName || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PaymentCategoryName,
  TransactionSource,
  TransactionStatus,
  TransactionType,
  WalletProvider,
  WalletType
});
