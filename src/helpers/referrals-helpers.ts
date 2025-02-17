import mongoose from "mongoose";
import log from "@dazn/lambda-powertools-logger";
import {
    IBalances,
    IComputeBalanceInput,
    IUpdateUserRecordInput,
    IUserDbConnection,
} from "src/config/interfaces";

const TradingEngineServiceDbCollection = {
    userTradingAccountsCollection: "user-trading-accounts",
    userTradingAccountBalanceCollection: "user-trading-account-balances",
};

const UserServiceDbCollection = {
    users: "users",
};

export const getTotalUsdtBalanceFromDb = async ({
    userId,
    mongooseConnection,
}: IUserDbConnection): Promise<{
    availableBalance: number;
    lockedBalance: number;
}> => {
    try {
        // Get trading accounts that are not archived
        const tradingAccounts = await mongooseConnection
            .collection(
                TradingEngineServiceDbCollection.userTradingAccountsCollection
            )
            .find({ userId, connectionStatus: { $ne: "ARCHIVED" } })
            .toArray();

        if (!tradingAccounts.length) {
            return {
                availableBalance: 0,
                lockedBalance: 0,
            };
        }

        // Get all trading account IDs
        const tradingAccountIds = tradingAccounts.map(
            (account) => new mongoose.Types.ObjectId(account._id)
        );

        // Get USDT balances for these accounts
        const balances = await mongooseConnection
            .collection(
                TradingEngineServiceDbCollection.userTradingAccountBalanceCollection
            )
            .find({
                tradingAccountId: { $in: tradingAccountIds },
                currency: "USDT",
            })
            .toArray();

        // Sum up the balances
        const totalBalance = balances.reduce(
            (total, balance) => ({
                availableBalance:
                    total.availableBalance + (balance.availableBalance || 0),
                lockedBalance:
                    total.lockedBalance + (balance.lockedBalance || 0),
            }),
            { availableBalance: 0, lockedBalance: 0 }
        );

        return totalBalance;
    } catch (error) {
        log.error("Failed to get total USDT balance", { error, userId });
        throw new Error(`Failed to get total USDT balance: ${error}`);
    }
};

export const updateUserBalanceInDb = async ({
    userId,
    mongooseConnection,
    balance,
}: IUpdateUserRecordInput): Promise<void> => {
    await mongooseConnection
        .collection(UserServiceDbCollection.users)
        .updateOne(
            { id: userId },
            {
                $set: {
                    balance: balance.userBalance,
                    communityATC: balance.communityBalance,
                },
            }
        );
};

export async function computeUserAndReferralsBalances({
    tradingEngineConnection,
    referrals,
    userId,
}: IComputeBalanceInput): Promise<IBalances> {
    const [userBalance, ...referralBalances] = await Promise.all([
        getTotalUsdtBalanceFromDb({
            userId,
            mongooseConnection: tradingEngineConnection,
        }),
        ...referrals.map((ref) =>
            getTotalUsdtBalanceFromDb({
                userId: ref.id,
                mongooseConnection: tradingEngineConnection,
            })
        ),
    ]);
    const sumReferralBalance = referralBalances.reduce(
        (total, balance) => total + balance.availableBalance,
        0
    );

    return {
        userBalance,
        communityBalance: sumReferralBalance + userBalance.availableBalance,
    };
}
