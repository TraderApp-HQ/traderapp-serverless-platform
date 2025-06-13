export interface ICommonSecrets {
    PORT: string;
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
}
export interface IWalletsServiceSecrets {
    CRYPTOPAY_BASE_URL: string;
    CRYPTOPAY_DEPOSITS_API_KEY: string;
    CRYPTOPAY_DEPOSITS_API_SECRET: string;
    CRYPTOPAY_WEBHOOK_SHARED_SECRET: string;
    WALLET_SERVICE_DB_URL: string;
}
