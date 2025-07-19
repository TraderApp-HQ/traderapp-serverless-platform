export enum OrderType {
    BUY = "BUY",
    SELL = "SELL",
}

export enum OrderPlacementType {
    MARKET = "MARKET",
    LIMIT = "LIMIT",
}

export enum OrderStatus {
    PENDING = "PENDING",
    FILLED = "FILLED",
    PARTIALLY_FILLED = "PARTIALLY_FILLED",
    CANCELED = "CANCELED",
}

// Status of trades
export enum TradeStatus {
    ACTIVE = "ACTIVE",
    CLOSED = "CLOSED",
    PENDING = "PENDING",
}

export enum OrderBatchStatus {
    PENDING = "PENDING",
    FILLED = "FILLED",
    PARTIALLY_FILLED = "PARTIALLY_FILLED",
    CANCELED = "CANCELED",
}

// Trade sides
export enum TradeSide {
    LONG = "LONG",
    SHORT = "SHORT",
}

export enum TradingRuleCategory {
    DIVERSIFICATION = "DIVERSIFICATION",
    RISK_MANAGEMENT = "RISK_MANAGEMENT",
    POSITION_LIMITS = "POSITION_LIMITS", // Better name for "Overtrading"
    DIRECTION_BALANCE = "DIRECTION_BALANCE", // Better name for balancing LONG/SHORT
    EXIT_STRATEGY = "EXIT_STRATEGY",
}

export enum TradingRuleType {
    PERCENTAGE = "PERCENTAGE",
    AMOUNT = "AMOUNT",
    COUNT = "COUNT",
    STRATEGY = "STRATEGY",
}

export enum AccountConnectionStatus {
    FAILED = "FAILED",
    CONNECTED = "CONNECTED",
    ARCHIVED = "ARCHIVED",
}

export enum ConnectionType {
    MANUAL = "MANUAL",
    FAST = "FAST",
}

export enum Exchange {
    binance = "binance",
    kucoin = "kucoin",
}

export enum TradingRuleName {
    RISK_PERCENTAGE_PER_TRADE = "Risk Percentage Per Trade",
    MAXIMUM_RISK_AMOUNT_PER_TRADE = "Maximum Risk Amount Per Trade",
    MAXIMUM_LEVERAGE = "Maximum Leverage",
    MINIMUM_RISK_REWARD_RATIO = "Minimum Risk-Reward Ratio",
    MAXIMUM_CONCURRENT_TRADES = "Maximum Concurrent Trades",
    DIRECTION_BALANCE_LIMIT = "Direction Balance Limit",
}
