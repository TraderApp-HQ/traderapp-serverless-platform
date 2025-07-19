import mongoose, { Document } from "mongoose";
import {
    AccountConnectionStatus,
    ConnectionType,
    Exchange,
    OrderBatchStatus,
    OrderPlacementType,
    OrderStatus,
    OrderType,
    TradeSide,
    TradeStatus,
    TradingRuleCategory,
    TradingRuleType,
} from "./enums";
import {
    AccountType,
    Category,
    Currency,
    TradingPlatform,
} from "src/config/enums";

export interface IOrder extends Document {
    id: string;
    userId: string;
    tradeId: mongoose.Types.ObjectId; // reference to the Trade model
    orderBatchId: mongoose.Types.ObjectId; // reference to the OrderBatch model
    baseAsset: string;
    baseQuantity: number;
    type: OrderType;
    placementType: OrderPlacementType;
    price: number;
    total: number;
    quoteCurrency: string;
    quoteTotal: number;
    status: OrderStatus;
    createdAt: string;
    updatedAt: string;
}

export interface IOrderBatch extends Document {
    id: string;
    orderId: mongoose.Types.ObjectId; // reference to order _id
    baseAsset: string;
    quoteCurrency: string;
    baseQuantity: number;
    quoteTotal: number;
    status: OrderBatchStatus;
    tradingAccountId: mongoose.Types.ObjectId; // reference to the user-trading-account _id
    platformName: TradingPlatform;
    platformId: number;
    createdAt: string;
    updatedAt: string;
}

export interface ITrade extends Document {
    id: string;
    userId: string;
    signalId: string;
    baseAsset: string;
    quoteCurrency: string;
    baseQuantity: number;
    avgBuyPrice: number;
    quoteTotal: number;
    pair: string;
    side: TradeSide;
    pnl: number;
    status: TradeStatus;
    createdAt: string;
    updatedAt: string;
}

export interface ITradingRule extends Document {
    id: string;
    name: string;
    description: string;
    tooltip: string;
    category: TradingRuleCategory;
    type: TradingRuleType;
    value: number | string;
    isEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface IUserTradingAccount extends Document {
    id: string;
    userId: string;
    platformName: TradingPlatform;
    platformId: number; // e.g., 112
    apiKey?: string;
    apiSecret?: string;
    passphrase?: string;
    accessToken?: string;
    refreshToken?: string;
    externalAccountUserId: string; // Unique userId identifier returned by trading plaforms like Binance
    isWithdrawalEnabled: boolean;
    isFuturesTradingEnabled: boolean;
    isSpotTradingEnabled: boolean;
    isIpAddressWhitelisted?: boolean;
    connectionStatus: AccountConnectionStatus;
    errorMessages: string[]; // List of reasons/messages for the unhealthy status
    category: Category;
    connectionType: ConnectionType;
    createdAt: string;
    updatedAt: string;
}

export interface IUserTradingAccountBalance extends Document {
    id: string;
    userId: string; // Reference to the user
    platformName: TradingPlatform;
    platformId: number;
    currency: Currency;
    accountType: AccountType;
    availableBalance: number;
    lockedBalance?: number; // Locked balance (e.g., in open orders)
    tradingAccountId: mongoose.Types.ObjectId; // reference to the user-trading-account _id
    createdAt: string;
    updatedAt: string;
}

export interface IUserTradingRule extends Document {
    id: string;
    userId: string;
    ruleId: string; // Reference to TradingRule id (will be the _id as string)
    name: string;
    description: string;
    tooltip: string;
    category: TradingRuleCategory;
    type: TradingRuleType;
    value: number | string;
    isEnabled: boolean;
    isCustomized: boolean; // Flag to indicate if user has modified from default
    lastResetToDefault: string | null;
    createdAt: string;
    updatedAt: string;
}

// export interface IActiveSignalsData {
//     signalId: string;
//     stopLoss: ISignalMilestone;
//     targetProfits: ISignalMilestone[];
//     entryPrice: number;
//     isSignalTradable: boolean;
//     assetName: string;
//     baseCurrencyName: string;
//     assetPair: string;
//     exchanges: Exchange[];
//     entryPriceUpperBound: number;
//     entryPriceLowerBound: number;
//     tradeSide: TradeSide;
//     maxGain: number;
// }

export interface ISignalMilestone {
    price: number;
    percent: number;
    isReached: boolean;
}

export interface IProcessUserTradingWithActiveSignalEvent {
    signalId: string;
    stopLoss: ISignalMilestone;
    targetProfits: ISignalMilestone[];
    entryPrice: number;
    isSignalTradable: boolean;
    baseAsset: string;
    quoteCurrency: string;
    assetPair: string;
    exchange: Exchange;
    entryPriceUpperBound: number;
    entryPriceLowerBound: number;
    tradeSide: TradeSide;
    maxGain: number;
    targetAmountToFill: number;
    validUntil: string; // ISO date/time format
    orderPlacementType?: OrderPlacementType; // default is MARKET if not provided
    accountType?: AccountType; // default is FUTURES if not provided
}
