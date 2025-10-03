export interface ICommonSecrets {
    PORT: string;
    SPLIT_IO_CLIENT_KEY: string;
    TRACK_USER_ONBOARDING_CHECKLIST_QUEUE: string;
}
export interface INotificationsServiceSecrets {
    SENDPULSE_API_USER_ID: string;
    SENDPULSE_API_SECRET: string;
    SENDPULSE_TOKEN_STORAGE: string;
}
export interface IUsersServiceSecrets {
    USERS_SERVICE_DB_URL: string;
}
export interface ITradingEngineServiceSecrets {
    TRADING_ENGINE_SERVICE_DB_URL: string;
    API_SECRET_KEY_ENCRYPTION_KEY: string;
    PROCESS_INCOMING_SIGNALS_QUEUE: string;
    PROCESS_USER_TRADES_QUEUE: string;
    PROCESS_BINANCE_ORDERS_QUEUE: string;
}
export interface IWalletsServiceSecrets {
    CRYPTOPAY_BASE_URL: string;
    CRYPTOPAY_DEPOSITS_API_KEY: string;
    CRYPTOPAY_DEPOSITS_API_SECRET: string;
    CRYPTOPAY_WEBHOOK_SHARED_SECRET: string;
    WALLET_SERVICE_DB_URL: string;
}
