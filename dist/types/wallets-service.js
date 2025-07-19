"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentCategoryName = exports.WalletProvider = exports.TransactionStatus = exports.TransactionSource = exports.TransactionType = exports.WalletType = void 0;
var WalletType;
(function (WalletType) {
    WalletType["MAIN"] = "MAIN";
    WalletType["SPOT"] = "SPOT";
    WalletType["FUTURES"] = "FUTURES";
})(WalletType || (exports.WalletType = WalletType = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["DEPOSIT"] = "DEPOSIT";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
    TransactionType["TRANSFER"] = "TRANSFER";
    TransactionType["CONVERT"] = "CONVERT";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionSource;
(function (TransactionSource) {
    TransactionSource["INTERNAL"] = "INTERNAL";
    TransactionSource["EXTERNAL"] = "EXTERNAL";
})(TransactionSource || (exports.TransactionSource = TransactionSource = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["SUCCESS"] = "SUCCESS";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["BLOCKED"] = "BLOCKED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var WalletProvider;
(function (WalletProvider) {
    WalletProvider["CRYPTOPAY"] = "CryptoPay";
})(WalletProvider || (exports.WalletProvider = WalletProvider = {}));
var PaymentCategoryName;
(function (PaymentCategoryName) {
    PaymentCategoryName["CRYPTO"] = "Crypto";
})(PaymentCategoryName || (exports.PaymentCategoryName = PaymentCategoryName = {}));
