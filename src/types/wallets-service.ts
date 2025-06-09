import mongoose, { Document } from "mongoose";

export interface IUserWalletDepositDetail extends Document {
    id: string;
    userId: string;
    paymentMethod: mongoose.Types.ObjectId;
    provider: mongoose.Types.ObjectId;
    paymentCategoryName: string;
    paymentMethodName: string;
    paymentProviderName: string;
    isActive: boolean;
    walletAddress?: string;
    network?: string;
    paymentUrl?: string;
    shouldRedirect: boolean;
    customWalletId?: string;
    externalWalletId?: string;
}

export enum WalletType {
    MAIN = "MAIN",
    SPOT = "SPOT",
    FUTURES = "FUTURES",
}

export enum TransactionType {
    DEPOSIT = "DEPOSIT",
    WITHDRAWAL = "WITHDRAWAL",
    TRANSFER = "TRANSFER",
    CONVERT = "CONVERT",
}

export enum TransactionSource {
    INTERNAL = "INTERNAL",
    EXTERNAL = "EXTERNAL",
}

export enum TransactionStatus {
    PENDING = "PENDING",
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    BLOCKED = "BLOCKED",
}

export enum WalletProvider {
    CRYPTOPAY = "CryptoPay",
}

export enum PaymentCategoryName {
    CRYPTO = "Crypto",
}

export interface ITransaction {
    _id?: string;
    transactionNetwork: string;
    userId: string;
    fromWallet?: WalletType;
    toWallet?: WalletType;
    currencyName: string;
    fromCurrencyName?: string;
    toCurrencyName?: string;
    conversionRate?: number;
    amount: number;
    fromAmount?: number;
    toAmount?: number;
    transactionType: TransactionType;
    fromWalletAddress?: string;
    toWalletAddress?: string;
    status: TransactionStatus;
    transactionSource: TransactionSource;
    paymentCategoryName: string;
    paymentMethodName: string;
    paymentProviderName: string;
    externalTransactionId: string;
    transactionHash?: string;
    createdAt: string;
    updatedAt: string;
}

export interface IUserWallet {
    id: string;
    userId: string;
    walletType: mongoose.Types.ObjectId;
    walletTypeName: WalletType;
    currencyName: string;
    currencySymbol: string;
    currency: mongoose.Types.ObjectId;
    availableBalance: number;
    lockedBalance: number;
}

export interface IWalletInput {
    userId: string;
}

export interface IWalletType {
    id: string;
    walletTypeName: WalletType; // WalletType enum value
    currencies: mongoose.Types.ObjectId[]; // Array of Currency references
}

export interface IWalletCurrency {
    _id: string;
    name: string;
    symbol: string;
    logoUrl: string;
}
