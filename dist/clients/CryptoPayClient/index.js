"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoPayClient = exports.CryptopayWebhookEventStatus = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const crypto_js_1 = __importDefault(require("crypto-js"));
const wallets_service_1 = require("src/types/wallets-service");
// import { SecretLocation } from "src/config/secrets/enums";
// import { getSecrets } from "src/config/secrets/helpers";
// import { IWalletsServiceSecrets } from "src/config/secrets/interfaces";
var CryptopayWebhookEventStatus;
(function (CryptopayWebhookEventStatus) {
    CryptopayWebhookEventStatus["pending"] = "pending";
    CryptopayWebhookEventStatus["completed"] = "completed";
    CryptopayWebhookEventStatus["onHold"] = "on_hold";
    CryptopayWebhookEventStatus["refunded"] = "refunded";
    CryptopayWebhookEventStatus["cancelled"] = "cancelled";
    CryptopayWebhookEventStatus["new"] = "new";
    CryptopayWebhookEventStatus["unresolved"] = "unresolved";
    CryptopayWebhookEventStatus["processing"] = "processing";
})(CryptopayWebhookEventStatus || (exports.CryptopayWebhookEventStatus = CryptopayWebhookEventStatus = {}));
class CryptoPayClient {
    constructor({ baseUrl, apiKey, apiSecret, webhooksSharedSecret, }) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.webhooksSharedSecret = webhooksSharedSecret;
    }
    validateCredentials() {
        if (!this.apiKey || !this.apiSecret) {
            return false;
        }
        return true;
    }
    createSignature(method, endpoint, requestData) {
        const payloadMD5 = requestData
            ? crypto_js_1.default.MD5(requestData).toString()
            : "";
        const contentType = "application/json";
        const date = new Date(Date.now()).toUTCString();
        const stringToSign = method +
            "\n" +
            payloadMD5 +
            "\n" +
            contentType +
            "\n" +
            date +
            "\n" +
            endpoint;
        // Generate signature
        const hmac = crypto_js_1.default.HmacSHA1(stringToSign, this.apiSecret ?? "");
        return hmac.toString(crypto_js_1.default.enc.Base64);
    }
    async verifyWebhookSignature(payload, signature) {
        if (!this.webhooksSharedSecret) {
            throw new Error("Missing CRYPTOPAY_WEBHOOK_SHARED_SECRET in secrets");
        }
        const computedSignature = crypto_1.default
            .createHmac("sha256", this.webhooksSharedSecret)
            .update(JSON.stringify(payload))
            .digest("hex");
        return computedSignature === signature;
    }
    async getHeaders() {
        if (!this.apiKey) {
            throw new Error("Missing CRYPTOPAY_DEPOSITS_API_KEY in secrets");
        }
        return {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
        };
    }
    async confirmChannelsPayment(webhookEvent) {
        if (!this.validateCredentials()) {
            throw new Error("Missing required CRYPTOPAY api keys");
        }
        const CHANNELS_PAYMENT_ENDPOINT = `/api/channels/${webhookEvent.data.channel_id}/payments/${webhookEvent.data.id}`;
        // Generate signature
        const signature = this.createSignature("GET", CHANNELS_PAYMENT_ENDPOINT, "");
        try {
            const response = await (0, axios_1.default)({
                method: "GET",
                url: `${this.baseUrl}${CHANNELS_PAYMENT_ENDPOINT}`,
                headers: {
                    "Content-Type": "application/json",
                    "Content-MD5": "",
                    Date: new Date(Date.now()).toUTCString(),
                    Authorization: `HMAC ${this.apiKey}:${signature}`,
                },
            });
            const transaction = response.data
                .data;
            if (webhookEvent.data.paid_amount !== transaction.paid_amount ||
                webhookEvent.data.paid_currency !== transaction.paid_currency) {
                throw Error("Paid amont does not match");
            }
            console.log("transaction fetched#########", { transaction });
        }
        catch (error) {
            throw new Error(`Error confirming channels transaction from cryptopay: ${error.message}`);
        }
    }
    formatTransaction(transaction, userId) {
        let status = wallets_service_1.TransactionStatus.PENDING;
        let currencyName = "";
        let amount = 0;
        let toCurrencyName;
        let toAmount;
        let fromCurrencyName;
        let fromAmount;
        let transactionHash;
        let fromWalletAddress;
        let toWalletAddress;
        if (transaction.data.status === CryptopayWebhookEventStatus.completed) {
            status = wallets_service_1.TransactionStatus.SUCCESS;
        }
        else if (transaction.data.status === CryptopayWebhookEventStatus.cancelled ||
            transaction.data.status === CryptopayWebhookEventStatus.onHold ||
            transaction.data.status ===
                CryptopayWebhookEventStatus.unresolved ||
            transaction.data.status === CryptopayWebhookEventStatus.refunded) {
            status = wallets_service_1.TransactionStatus.FAILED;
        }
        if (transaction.type === "ChannelPayment") {
            currencyName = transaction.data.paid_currency ?? "";
            amount = parseFloat(transaction.data.paid_amount ?? "");
            toCurrencyName = transaction.data.paid_currency;
            toAmount = parseFloat(transaction.data.paid_amount ?? "");
            transactionHash = transaction.data.txid ?? "";
            fromWalletAddress = transaction.data.address;
        }
        else if (transaction.type === "Invoice") {
            currencyName = transaction.data.price_currency ?? "";
            amount = parseFloat(transaction.data.price_amount ?? "");
            toCurrencyName = transaction.data.price_currency;
            toAmount = parseFloat(transaction.data.price_amount ?? "");
            fromCurrencyName = transaction.data.pay_currency;
            fromAmount = parseFloat(transaction.data.pay_amount ?? "");
            transactionHash = (transaction.data.transactions ?? [])[0].txid;
            fromWalletAddress = transaction.data.address;
        }
        else if (transaction.type === "CoinWithdrawal") {
            currencyName = transaction.data.received_currency ?? "";
            amount = parseFloat(transaction.data.received_amount ?? "");
            transactionHash = transaction.data.txid ?? "";
            toWalletAddress = transaction.data.address;
        }
        return {
            userId,
            transactionType: wallets_service_1.TransactionType.DEPOSIT,
            transactionSource: wallets_service_1.TransactionSource.EXTERNAL,
            paymentCategoryName: wallets_service_1.PaymentCategoryName.CRYPTO,
            paymentMethodName: currencyName,
            paymentProviderName: wallets_service_1.WalletProvider.CRYPTOPAY,
            externalTransactionId: transaction.data.id,
            transactionHash,
            status,
            currencyName,
            amount,
            toCurrencyName,
            toAmount,
            fromCurrencyName,
            fromAmount,
            fromWalletAddress,
            toWalletAddress,
            transactionNetwork: transaction.data.network,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }
}
exports.CryptoPayClient = CryptoPayClient;
