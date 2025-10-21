export enum EventTemplate {
    WELCOME = "WELCOME",
    LOGIN = "LOGIN",
    GENERAL = "GENERAL",
    RESET_PASSWORD = "RESET_PASSWORD",
    OTP = "OTP",
    CREATE_USER = "CREATE_USER",
    INVITE_USER = "INVITE_USER",
    SEND_EMAIL = "SEND_EMAIL",
    SEND_DEPOSIT_CONFIRMATION_EMAIL = "SEND_DEPOSIT_CONFIRMATION_EMAIL",
    SEND_WITHDRAWAL_CONFIRMATION_EMAIL = "SEND_WITHDRAWAL_CONFIRMATION_EMAIL",
}

export enum AccountType {
    SPOT = "SPOT",
    FUTURES = "FUTURES",
    MARGIN = "MARGIN",
}

export enum Currency {
    USDT = "USDT",
    BTC = "BTC",
}

export enum TradingPlatform {
    BINANCE = "BINANCE",
    KUCOIN = "KUCOIN",
}

export enum Category {
    FOREX = "FOREX",
    CRYPTO = "CRYPTO",
}

export enum UserRoles {
    USER = "USER",
    SUBSCRIBER = "SUBSCRIBER",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN",
}
