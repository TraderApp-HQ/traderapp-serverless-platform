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

// src/services/TradingEngineService/enums.ts
var enums_exports = {};
__export(enums_exports, {
  AccountConnectionStatus: () => AccountConnectionStatus,
  CandleStick: () => CandleStick,
  ConnectionType: () => ConnectionType,
  Exchange: () => Exchange,
  InvoiceStatus: () => InvoiceStatus,
  InvoiceType: () => InvoiceType,
  OrderBatchStatus: () => OrderBatchStatus,
  OrderPlacementType: () => OrderPlacementType,
  OrderSide: () => OrderSide,
  OrderStatus: () => OrderStatus,
  OrderType: () => OrderType,
  TradeRisk: () => TradeRisk,
  TradeSide: () => TradeSide,
  TradeStatus: () => TradeStatus,
  TradingRuleCategory: () => TradingRuleCategory,
  TradingRuleName: () => TradingRuleName,
  TradingRuleType: () => TradingRuleType
});
module.exports = __toCommonJS(enums_exports);
var OrderType = /* @__PURE__ */ ((OrderType2) => {
  OrderType2["ENTRY"] = "ENTRY";
  OrderType2["TAKE_PROFIT"] = "TAKE_PROFIT";
  OrderType2["STOP_LOSS"] = "STOP_LOSS";
  return OrderType2;
})(OrderType || {});
var OrderSide = /* @__PURE__ */ ((OrderSide2) => {
  OrderSide2["BUY"] = "BUY";
  OrderSide2["SELL"] = "SELL";
  return OrderSide2;
})(OrderSide || {});
var OrderPlacementType = /* @__PURE__ */ ((OrderPlacementType2) => {
  OrderPlacementType2["MARKET"] = "MARKET";
  OrderPlacementType2["LIMIT"] = "LIMIT";
  return OrderPlacementType2;
})(OrderPlacementType || {});
var OrderStatus = /* @__PURE__ */ ((OrderStatus2) => {
  OrderStatus2["PENDING"] = "PENDING";
  OrderStatus2["FILLED"] = "FILLED";
  OrderStatus2["PARTIALLY_FILLED"] = "PARTIALLY_FILLED";
  OrderStatus2["CANCELED"] = "CANCELED";
  return OrderStatus2;
})(OrderStatus || {});
var TradeStatus = /* @__PURE__ */ ((TradeStatus2) => {
  TradeStatus2["ACTIVE"] = "ACTIVE";
  TradeStatus2["ACTIVATING"] = "ACTIVATING";
  TradeStatus2["CLOSED"] = "CLOSED";
  TradeStatus2["PENDING"] = "PENDING";
  TradeStatus2["PROCESSING"] = "PROCESSING";
  TradeStatus2["PROCESSED"] = "PROCESSED";
  TradeStatus2["FAILED"] = "FAILED";
  TradeStatus2["CANCELED"] = "CANCELED";
  TradeStatus2["BREAK_EVEN"] = "BREAK EVEN";
  return TradeStatus2;
})(TradeStatus || {});
var OrderBatchStatus = /* @__PURE__ */ ((OrderBatchStatus2) => {
  OrderBatchStatus2["PENDING"] = "PENDING";
  OrderBatchStatus2["FILLED"] = "FILLED";
  OrderBatchStatus2["PARTIALLY_FILLED"] = "PARTIALLY_FILLED";
  OrderBatchStatus2["CANCELED"] = "CANCELED";
  return OrderBatchStatus2;
})(OrderBatchStatus || {});
var TradeSide = /* @__PURE__ */ ((TradeSide2) => {
  TradeSide2["LONG"] = "LONG";
  TradeSide2["SHORT"] = "SHORT";
  return TradeSide2;
})(TradeSide || {});
var TradingRuleCategory = /* @__PURE__ */ ((TradingRuleCategory2) => {
  TradingRuleCategory2["DIVERSIFICATION"] = "DIVERSIFICATION";
  TradingRuleCategory2["RISK_MANAGEMENT"] = "RISK_MANAGEMENT";
  TradingRuleCategory2["POSITION_LIMITS"] = "POSITION_LIMITS";
  TradingRuleCategory2["DIRECTION_BALANCE"] = "DIRECTION_BALANCE";
  TradingRuleCategory2["EXIT_STRATEGY"] = "EXIT_STRATEGY";
  return TradingRuleCategory2;
})(TradingRuleCategory || {});
var TradingRuleType = /* @__PURE__ */ ((TradingRuleType2) => {
  TradingRuleType2["PERCENTAGE"] = "PERCENTAGE";
  TradingRuleType2["AMOUNT"] = "AMOUNT";
  TradingRuleType2["COUNT"] = "COUNT";
  TradingRuleType2["STRATEGY"] = "STRATEGY";
  return TradingRuleType2;
})(TradingRuleType || {});
var AccountConnectionStatus = /* @__PURE__ */ ((AccountConnectionStatus2) => {
  AccountConnectionStatus2["FAILED"] = "FAILED";
  AccountConnectionStatus2["CONNECTED"] = "CONNECTED";
  AccountConnectionStatus2["ARCHIVED"] = "ARCHIVED";
  return AccountConnectionStatus2;
})(AccountConnectionStatus || {});
var ConnectionType = /* @__PURE__ */ ((ConnectionType2) => {
  ConnectionType2["MANUAL"] = "MANUAL";
  ConnectionType2["FAST"] = "FAST";
  return ConnectionType2;
})(ConnectionType || {});
var Exchange = /* @__PURE__ */ ((Exchange2) => {
  Exchange2["binance"] = "binance";
  Exchange2["kucoin"] = "kucoin";
  return Exchange2;
})(Exchange || {});
var TradingRuleName = /* @__PURE__ */ ((TradingRuleName2) => {
  TradingRuleName2["RISK_PERCENTAGE_PER_TRADE"] = "Risk Percentage Per Trade";
  TradingRuleName2["MAXIMUM_RISK_AMOUNT_PER_TRADE"] = "Maximum Risk Amount Per Trade";
  TradingRuleName2["MAXIMUM_LEVERAGE"] = "Maximum Leverage";
  TradingRuleName2["MINIMUM_RISK_REWARD_RATIO"] = "Minimum Risk-Reward Ratio";
  TradingRuleName2["MAXIMUM_CONCURRENT_TRADES"] = "Maximum Concurrent Trades";
  TradingRuleName2["DIRECTION_BALANCE_LIMIT"] = "Direction Balance Limit";
  return TradingRuleName2;
})(TradingRuleName || {});
var InvoiceStatus = /* @__PURE__ */ ((InvoiceStatus2) => {
  InvoiceStatus2["PENDING"] = "PENDING";
  InvoiceStatus2["OVERDUE"] = "OVERDUE";
  InvoiceStatus2["LOCKED"] = "LOCKED";
  InvoiceStatus2["PAID"] = "PAID";
  InvoiceStatus2["FAILED"] = "FAILED";
  InvoiceStatus2["ARCHIVED"] = "ARCHIVED";
  return InvoiceStatus2;
})(InvoiceStatus || {});
var InvoiceType = /* @__PURE__ */ ((InvoiceType2) => {
  InvoiceType2["TRADING_FEE"] = "TRADING_FEE";
  InvoiceType2["PROFIT_SHARE"] = "PROFIT_SHARE";
  return InvoiceType2;
})(InvoiceType || {});
var CandleStick = /* @__PURE__ */ ((CandleStick2) => {
  CandleStick2["fiveMin"] = "5m";
  CandleStick2["fifteenMin"] = "15m";
  CandleStick2["thirtyMin"] = "30m";
  CandleStick2["oneHour"] = "1HR";
  CandleStick2["twoHours"] = "2HRS";
  CandleStick2["fourHours"] = "4HRS";
  CandleStick2["eightHours"] = "8HRS";
  CandleStick2["twelveHours"] = "12HRS";
  CandleStick2["oneDay"] = "1D";
  CandleStick2["threeDays"] = "3D";
  CandleStick2["oneWeek"] = "1W";
  return CandleStick2;
})(CandleStick || {});
var TradeRisk = /* @__PURE__ */ ((TradeRisk2) => {
  TradeRisk2["low"] = "LOW";
  TradeRisk2["medium"] = "MEDIUM";
  TradeRisk2["high"] = "HIGH";
  return TradeRisk2;
})(TradeRisk || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AccountConnectionStatus,
  CandleStick,
  ConnectionType,
  Exchange,
  InvoiceStatus,
  InvoiceType,
  OrderBatchStatus,
  OrderPlacementType,
  OrderSide,
  OrderStatus,
  OrderType,
  TradeRisk,
  TradeSide,
  TradeStatus,
  TradingRuleCategory,
  TradingRuleName,
  TradingRuleType
});
