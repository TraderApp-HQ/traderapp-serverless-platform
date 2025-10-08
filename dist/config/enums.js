"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoles = exports.Category = exports.TradingPlatform = exports.Currency = exports.AccountType = exports.EventTemplate = void 0;
var EventTemplate;
(function (EventTemplate) {
    EventTemplate["WELCOME"] = "WELCOME";
    EventTemplate["LOGIN"] = "LOGIN";
    EventTemplate["GENERAL"] = "GENERAL";
    EventTemplate["RESET_PASSWORD"] = "RESET_PASSWORD";
    EventTemplate["OTP"] = "OTP";
    EventTemplate["CREATE_USER"] = "CREATE_USER";
    EventTemplate["INVITE_USER"] = "INVITE_USER";
    EventTemplate["SEND_EMAIL"] = "SEND_EMAIL";
    EventTemplate["SEND_DEPOSIT_CONFIRMATION_EMAIL"] = "SEND_DEPOSIT_CONFIRMATION_EMAIL";
})(EventTemplate || (exports.EventTemplate = EventTemplate = {}));
var AccountType;
(function (AccountType) {
    AccountType["SPOT"] = "SPOT";
    AccountType["FUTURES"] = "FUTURES";
    AccountType["MARGIN"] = "MARGIN";
})(AccountType || (exports.AccountType = AccountType = {}));
var Currency;
(function (Currency) {
    Currency["USDT"] = "USDT";
    Currency["BTC"] = "BTC";
})(Currency || (exports.Currency = Currency = {}));
var TradingPlatform;
(function (TradingPlatform) {
    TradingPlatform["BINANCE"] = "BINANCE";
    TradingPlatform["KUCOIN"] = "KUCOIN";
})(TradingPlatform || (exports.TradingPlatform = TradingPlatform = {}));
var Category;
(function (Category) {
    Category["FOREX"] = "FOREX";
    Category["CRYPTO"] = "CRYPTO";
})(Category || (exports.Category = Category = {}));
var UserRoles;
(function (UserRoles) {
    UserRoles["USER"] = "USER";
    UserRoles["SUBSCRIBER"] = "SUBSCRIBER";
    UserRoles["ADMIN"] = "ADMIN";
    UserRoles["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRoles || (exports.UserRoles = UserRoles = {}));
