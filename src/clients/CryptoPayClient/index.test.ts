import {
    CryptoPayClient,
    CryptopayWebhookEventStatus,
    CryptopayWebhookEventType,
    ICryptopayWebhookEvent,
} from "./index";
import {
    TransactionStatus,
    WalletProvider,
} from "src/types/wallets-service";

describe("CryptoPayClient.formatTransaction", () => {
    const client = new CryptoPayClient({
        baseUrl: "https://example.crypto",
        apiKey: "k",
        apiSecret: "s",
        webhooksSharedSecret: "w",
    });

    it("uses _amount for ChannelPayment amount and includes providerFee", () => {
        const event: ICryptopayWebhookEvent = {
            type: CryptopayWebhookEventType.ChannelPayment,
            event: "completed",
            data: {
                id: "cp-1",
                status: CryptopayWebhookEventStatus.completed,
                status_context: null,
                address: "0xfrom",
                network: "ETH",
                custom_id: "",
                customer_id: null,
                created_at: new Date().toISOString(),
                paid_amount: "100.00",
                paid_currency: "USDT",
                received_amount: "99.50",
                received_currency: "USDT",
                txid: "0xtxhash",
                fee: "0.50",
                fee_currency: "USDT",
                risk: null,
            },
        };

        const tx = client.formatTransaction(event, "user-1");

        expect(tx.amount).toBe(100);
        expect(tx.toCurrencyName).toBe("USDT");
        expect(tx.paymentProviderName).toBe(WalletProvider.CRYPTOPAY);
        expect(tx.providerFee).toBe(0.5);
        expect(tx.status).toBe(TransactionStatus.SUCCESS);
        expect(tx.transactionHash).toBe("0xtxhash");
        expect(tx.fromWalletAddress).toBe("0xfrom");
        expect(tx.transactionNetwork).toBe("ETH");
    });

    it("providerFee defaults to 0 when fee is blank", () => {
        const event: ICryptopayWebhookEvent = {
            type: CryptopayWebhookEventType.ChannelPayment,
            event: "created",
            data: {
                id: "cp-2",
                status: CryptopayWebhookEventStatus.pending,
                status_context: null,
                address: "0xfrom2",
                network: "ETH",
                custom_id: "",
                customer_id: null,
                created_at: new Date().toISOString(),
                paid_amount: "10.00",
                paid_currency: "USDT",
                received_amount: "9.90",
                received_currency: "USDT",
                txid: "0xabc",
                fee: "", // parseFloat("") -> NaN -> || 0
                fee_currency: "USDT",
                risk: null,
            },
        };

        const tx = client.formatTransaction(event, "user-3");
        expect(tx.providerFee).toBe(0);
        expect(tx.amount).toBe(10); // from received_amount
    });
});
