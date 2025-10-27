import TradingEngineService from "src/services/TradingEngineService";
import { AccountType, Currency, TradingPlatform } from "src/config/enums";

(async () => {
    const tradingEngineService = TradingEngineService;
    const users = await tradingEngineService.getUsersTradingAccountsAndBalances(
        {
            platforms: [TradingPlatform.BINANCE],
            currency: Currency.USDT,
            accountType: AccountType.FUTURES,
        }
    );
    console.log("users with trading accounts and balances", {
        usersAccountsAndBalances: JSON.stringify(users, null, 2),
    });
})().catch((error) => {
    console.error("Error getting users with trading accounts and balances", {
        error: error.message,
    });
    process.exit(1);
});
