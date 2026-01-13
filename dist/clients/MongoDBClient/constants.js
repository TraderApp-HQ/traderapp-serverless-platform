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

// src/clients/MongoDBClient/constants.ts
var constants_exports = {};
__export(constants_exports, {
  TradingEngineServiceCollections: () => TradingEngineServiceCollections,
  UsersServiceCollections: () => UsersServiceCollections,
  WalletsServiceCollections: () => WalletsServiceCollections
});
module.exports = __toCommonJS(constants_exports);
var WalletsServiceCollections = {
  userWalletDepositDetails: "user-wallet-deposit-details",
  transactions: "transactions",
  userWallets: "user-wallets",
  walletTypes: "wallet-types",
  currencies: "currencies",
  invoices: "invoices"
};
var UsersServiceCollections = {
  users: "users",
  userRelationships: "user-relationships",
  countries: "countries"
};
var TradingEngineServiceCollections = {
  masterTrades: "master-trades",
  trades: "trades",
  orders: "orders",
  orderBatches: "order-batches",
  tradingRules: "trading-rules",
  userTradingRules: "user-trading-rules",
  userTradingAccounts: "user-trading-accounts",
  userTradingAccountBalances: "user-trading-account-balances",
  platformTradingRules: "platform-trading-rules"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TradingEngineServiceCollections,
  UsersServiceCollections,
  WalletsServiceCollections
});
