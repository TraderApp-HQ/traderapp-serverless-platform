"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingRuleName = exports.Exchange = exports.ConnectionType = exports.AccountConnectionStatus = exports.TradingRuleType = exports.TradingRuleCategory = exports.TradeSide = exports.OrderBatchStatus = exports.TradeStatus = exports.OrderStatus = exports.OrderPlacementType = exports.OrderType = void 0;
var OrderType;
(function (OrderType) {
    OrderType["BUY"] = "BUY";
    OrderType["SELL"] = "SELL";
})(OrderType || (exports.OrderType = OrderType = {}));
var OrderPlacementType;
(function (OrderPlacementType) {
    OrderPlacementType["MARKET"] = "MARKET";
    OrderPlacementType["LIMIT"] = "LIMIT";
})(OrderPlacementType || (exports.OrderPlacementType = OrderPlacementType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["FILLED"] = "FILLED";
    OrderStatus["PARTIALLY_FILLED"] = "PARTIALLY_FILLED";
    OrderStatus["CANCELED"] = "CANCELED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
// Status of trades
var TradeStatus;
(function (TradeStatus) {
    TradeStatus["ACTIVE"] = "ACTIVE";
    TradeStatus["CLOSED"] = "CLOSED";
    TradeStatus["PENDING"] = "PENDING";
})(TradeStatus || (exports.TradeStatus = TradeStatus = {}));
var OrderBatchStatus;
(function (OrderBatchStatus) {
    OrderBatchStatus["PENDING"] = "PENDING";
    OrderBatchStatus["FILLED"] = "FILLED";
    OrderBatchStatus["PARTIALLY_FILLED"] = "PARTIALLY_FILLED";
    OrderBatchStatus["CANCELED"] = "CANCELED";
})(OrderBatchStatus || (exports.OrderBatchStatus = OrderBatchStatus = {}));
// Trade sides
var TradeSide;
(function (TradeSide) {
    TradeSide["LONG"] = "LONG";
    TradeSide["SHORT"] = "SHORT";
})(TradeSide || (exports.TradeSide = TradeSide = {}));
var TradingRuleCategory;
(function (TradingRuleCategory) {
    TradingRuleCategory["DIVERSIFICATION"] = "DIVERSIFICATION";
    TradingRuleCategory["RISK_MANAGEMENT"] = "RISK_MANAGEMENT";
    TradingRuleCategory["POSITION_LIMITS"] = "POSITION_LIMITS";
    TradingRuleCategory["DIRECTION_BALANCE"] = "DIRECTION_BALANCE";
    TradingRuleCategory["EXIT_STRATEGY"] = "EXIT_STRATEGY";
})(TradingRuleCategory || (exports.TradingRuleCategory = TradingRuleCategory = {}));
var TradingRuleType;
(function (TradingRuleType) {
    TradingRuleType["PERCENTAGE"] = "PERCENTAGE";
    TradingRuleType["AMOUNT"] = "AMOUNT";
    TradingRuleType["COUNT"] = "COUNT";
    TradingRuleType["STRATEGY"] = "STRATEGY";
})(TradingRuleType || (exports.TradingRuleType = TradingRuleType = {}));
var AccountConnectionStatus;
(function (AccountConnectionStatus) {
    AccountConnectionStatus["FAILED"] = "FAILED";
    AccountConnectionStatus["CONNECTED"] = "CONNECTED";
    AccountConnectionStatus["ARCHIVED"] = "ARCHIVED";
})(AccountConnectionStatus || (exports.AccountConnectionStatus = AccountConnectionStatus = {}));
var ConnectionType;
(function (ConnectionType) {
    ConnectionType["MANUAL"] = "MANUAL";
    ConnectionType["FAST"] = "FAST";
})(ConnectionType || (exports.ConnectionType = ConnectionType = {}));
var Exchange;
(function (Exchange) {
    Exchange["binance"] = "binance";
    Exchange["kucoin"] = "kucoin";
})(Exchange || (exports.Exchange = Exchange = {}));
var TradingRuleName;
(function (TradingRuleName) {
    TradingRuleName["RISK_PERCENTAGE_PER_TRADE"] = "Risk Percentage Per Trade";
    TradingRuleName["MAXIMUM_RISK_AMOUNT_PER_TRADE"] = "Maximum Risk Amount Per Trade";
    TradingRuleName["MAXIMUM_LEVERAGE"] = "Maximum Leverage";
    TradingRuleName["MINIMUM_RISK_REWARD_RATIO"] = "Minimum Risk-Reward Ratio";
    TradingRuleName["MAXIMUM_CONCURRENT_TRADES"] = "Maximum Concurrent Trades";
    TradingRuleName["DIRECTION_BALANCE_LIMIT"] = "Direction Balance Limit";
})(TradingRuleName || (exports.TradingRuleName = TradingRuleName = {}));
