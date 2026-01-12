# type: ignore
import MetaTrader5 as mt5

def connect_and_fetch_account(login: int, password: str, server: str) -> dict:
    if not mt5.initialize():
        raise RuntimeError("MT5 initialize failed")

    if not mt5.login(int(login), password=password, server=server):
        mt5.shutdown()
        raise RuntimeError("MT5 login failed")

    info = mt5.account_info()
    if info is None:
        mt5.shutdown()
        raise RuntimeError("Account info fetch failed")

    data = {
        "login": info.login,
        "balance": info.balance,
        "equity": info.equity,
        "margin": info.margin,
        "free_margin": info.margin_free,
        "currency": info.currency,
        "leverage": info.leverage,
    }

    mt5.shutdown()
    return data
