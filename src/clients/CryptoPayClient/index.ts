/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import crypto from "crypto";
import CryptoJS from "crypto-js";
import {
    ITransaction,
    PaymentCategoryName,
    TransactionSource,
    TransactionStatus,
    TransactionType,
    WalletProvider,
} from "src/types/wallets-service";
// import { SecretLocation } from "src/config/secrets/enums";
// import { getSecrets } from "src/config/secrets/helpers";
// import { IWalletsServiceSecrets } from "src/config/secrets/interfaces";

export enum CryptopayWebhookEventStatus {
    pending = "pending",
    completed = "completed",
    onHold = "on_hold",
    refunded = "refunded",
    cancelled = "cancelled",
    new = "new",
    unresolved = "unresolved",
    processing = "processing",
}

export interface ICryptoPayExchangeInfo {
    fee: string;
    pair: string;
    rate: string;
    fee_currency: string;
}

export interface ICryptoPayRisk {
    score: number;
    level: "low" | "medium" | "high";
    resource_name: string;
    resource_category: string;
}

export interface ICryptoPayTransaction {
    txid: string;
    risk: ICryptoPayRisk;
}

export interface ICryptopayWebhookEvent {
    type: "ChannelPayment" | "Invoice" | "CoinWithdrawal";
    event:
        | "created"
        | "completed"
        | "on_hold"
        | "refunded"
        | "cancelled"
        | "transaction_created"
        | "transaction_confirmed"
        | "status_changed";
    data: {
        // Common fields across all types
        id: string;
        status: CryptopayWebhookEventStatus;
        status_context: string | null;
        address: string;
        network: string;
        custom_id: string;
        customer_id: string | null;
        created_at: string;

        // Fields that exist in some types
        txid?: string | null;
        fee: string;
        fee_currency: string;
        risk: ICryptoPayRisk | null;

        // ChannelPayment & Invoice specific
        paid_amount?: string;
        paid_currency?: string;
        received_amount?: string;
        received_currency?: string;
        channel_id?: string;
        hosted_page_url?: string;

        // Invoice specific
        uri?: string;
        price_amount?: string;
        price_currency?: string;
        pay_amount?: string;
        pay_currency?: string;
        transactions?: ICryptoPayTransaction[];
        name?: string;
        description?: string;
        metadata?: Record<string, any>;
        success_redirect_url?: string | null;
        expires_at?: string;
        exchange?: ICryptoPayExchangeInfo;

        // CoinWithdrawal specific
        charged_amount?: string;
        charged_currency?: string;
        network_fee?: string;
        network_fee_level?: string;
    };
}

interface ICryptoPayClientInput {
    baseUrl: string;
    apiKey: string;
    apiSecret: string;
    webhooksSharedSecret: string;
}

interface ICryptoPayExchange {
    pair: string;
    rate: string;
    fee: string;
    fee_currency: string;
}

interface ICryptoPayChannelsTransaction {
    id: string;
    channel_id: string;
    paid_amount: string;
    paid_currency: string;
    received_amount: string;
    received_currency: string;
    fee: string;
    fee_currency: string;
    txid: string;
    exchange: ICryptoPayExchange;
    risk: ICryptoPayRisk;
    status: string;
    status_context: string | null;
    refund_address: string | null;
    coin_withdrawal_id: string | null;
    custom_id: string;
    customer_id: string;
    address: string;
    network: string;
    created_at: string;
}

export class CryptoPayClient {
    private baseUrl: string;
    private apiKey: string;
    private apiSecret: string;
    private webhooksSharedSecret: string;

    constructor({
        baseUrl,
        apiKey,
        apiSecret,
        webhooksSharedSecret,
    }: ICryptoPayClientInput) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.webhooksSharedSecret = webhooksSharedSecret;
    }

    private validateCredentials() {
        if (!this.apiKey || !this.apiSecret) {
            return false;
        }
        return true;
    }

    private createSignature(
        method: string,
        endpoint: string,
        requestData: string
    ): string {
        const payloadMD5 = requestData
            ? CryptoJS.MD5(requestData).toString()
            : "";
        const contentType = "application/json";
        const date = new Date(Date.now()).toUTCString();
        const stringToSign =
            method +
            "\n" +
            payloadMD5 +
            "\n" +
            contentType +
            "\n" +
            date +
            "\n" +
            endpoint;

        // Generate signature
        const hmac = CryptoJS.HmacSHA1(stringToSign, this.apiSecret ?? "");
        return hmac.toString(CryptoJS.enc.Base64);
    }

    async verifyWebhookSignature(
        payload: any,
        signature: string
    ): Promise<boolean> {
        if (!this.webhooksSharedSecret) {
            throw new Error(
                "Missing CRYPTOPAY_WEBHOOK_SHARED_SECRET in secrets"
            );
        }
        const computedSignature = crypto
            .createHmac("sha256", this.webhooksSharedSecret)
            .update(JSON.stringify(payload))
            .digest("hex");
        return computedSignature === signature;
    }

    private async getHeaders() {
        if (!this.apiKey) {
            throw new Error("Missing CRYPTOPAY_DEPOSITS_API_KEY in secrets");
        }
        return {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
        };
    }

    public async confirmChannelsPayment(webhookEvent: ICryptopayWebhookEvent) {
        if (!this.validateCredentials()) {
            throw new Error("Missing required CRYPTOPAY api keys");
        }

        const CHANNELS_PAYMENT_ENDPOINT = `/api/channels/${webhookEvent.data.channel_id}/payments/${webhookEvent.data.id}`;

        // Generate signature
        const signature = this.createSignature(
            "GET",
            CHANNELS_PAYMENT_ENDPOINT,
            ""
        );

        try {
            const response = await axios({
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
                .data as ICryptoPayChannelsTransaction;
            if (
                webhookEvent.data.paid_amount !== transaction.paid_amount ||
                webhookEvent.data.paid_currency !== transaction.paid_currency
            ) {
                throw Error("Paid amont does not match");
            }
            console.log("transaction fetched#########", { transaction });
        } catch (error: any) {
            throw new Error(
                `Error confirming channels transaction from cryptopay: ${error.message}`
            );
        }
    }

    public formatTransaction(
        transaction: ICryptopayWebhookEvent,
        userId: string
    ): ITransaction {
        let status = TransactionStatus.PENDING;
        let currencyName = "";
        let amount = 0;
        let toCurrencyName: string | undefined;
        let toAmount: number | undefined;
        let fromCurrencyName: string | undefined;
        let fromAmount: number | undefined;
        let transactionHash: string | undefined;
        let fromWalletAddress: string | undefined;
        let toWalletAddress: string | undefined;

        if (transaction.data.status === CryptopayWebhookEventStatus.completed) {
            status = TransactionStatus.SUCCESS;
        } else if (
            transaction.data.status === CryptopayWebhookEventStatus.cancelled ||
            transaction.data.status === CryptopayWebhookEventStatus.onHold ||
            transaction.data.status ===
                CryptopayWebhookEventStatus.unresolved ||
            transaction.data.status === CryptopayWebhookEventStatus.refunded
        ) {
            status = TransactionStatus.FAILED;
        }

        if (transaction.type === "ChannelPayment") {
            currencyName = transaction.data.paid_currency ?? "";
            amount = parseFloat(transaction.data.paid_amount ?? "");
            toCurrencyName = transaction.data.paid_currency;
            toAmount = parseFloat(transaction.data.paid_amount ?? "");
            transactionHash = transaction.data.txid ?? "";
            fromWalletAddress = transaction.data.address;
        } else if (transaction.type === "Invoice") {
            currencyName = transaction.data.price_currency ?? "";
            amount = parseFloat(transaction.data.price_amount ?? "");
            toCurrencyName = transaction.data.price_currency;
            toAmount = parseFloat(transaction.data.price_amount ?? "");
            fromCurrencyName = transaction.data.pay_currency;
            fromAmount = parseFloat(transaction.data.pay_amount ?? "");
            transactionHash = (transaction.data.transactions ?? [])[0].txid;
            fromWalletAddress = transaction.data.address;
        } else if (transaction.type === "CoinWithdrawal") {
            currencyName = transaction.data.received_currency ?? "";
            amount = parseFloat(transaction.data.received_amount ?? "");
            transactionHash = transaction.data.txid ?? "";
            toWalletAddress = transaction.data.address;
        }

        return {
            userId,
            transactionType: TransactionType.DEPOSIT,
            transactionSource: TransactionSource.EXTERNAL,
            paymentCategoryName: PaymentCategoryName.CRYPTO,
            paymentMethodName: currencyName,
            paymentProviderName: WalletProvider.CRYPTOPAY,
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
