import mongoose from "mongoose";
import log from "@dazn/lambda-powertools-logger";
import {
    IBalances,
    IComputeBalanceInput,
    IRankCriteria,
    IUpdateUserRecordInput,
    IUserDbConnection,
    ReferralRankType,
} from "src/config/interfaces";
import { RANK_REQUIREMENTS, ReferralRank } from "src/config/constants";

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
    referralRank,
}: IUpdateUserRecordInput): Promise<void> => {
    await mongooseConnection
        .collection(UserServiceDbCollection.users)
        .updateOne(
            { id: userId },
            {
                $set: {
                    personalATC: balance.userBalance.availableBalance,
                    communityATC: balance.communityBalance,
                    referralRank,
                    isTestReferralTrackingInProgress: false,
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

export function computeRank(criteria: IRankCriteria): ReferralRankType | null {
    const { personalATC, communityATC, communitySize, isTestReferralTracking } =
        criteria;

    const getCommunitySize = (rank: ReferralRankType) => {
        return isTestReferralTracking
            ? RANK_REQUIREMENTS[rank].testCommunitySize
            : RANK_REQUIREMENTS[rank].communitySize;
    };

    switch (true) {
        case personalATC >=
            RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL].personalATC &&
            communityATC >=
                RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL].communityATC &&
            communitySize >= getCommunitySize(ReferralRank.TA_FIELD_MARSHAL):
            return ReferralRank.TA_FIELD_MARSHAL;

        case personalATC >=
            RANK_REQUIREMENTS[ReferralRank.TA_GENERAL].personalATC &&
            communityATC >=
                RANK_REQUIREMENTS[ReferralRank.TA_GENERAL].communityATC &&
            communitySize >= getCommunitySize(ReferralRank.TA_GENERAL):
            return ReferralRank.TA_GENERAL;

        case personalATC >=
            RANK_REQUIREMENTS[ReferralRank.TA_COLONEL].personalATC &&
            communityATC >=
                RANK_REQUIREMENTS[ReferralRank.TA_COLONEL].communityATC &&
            communitySize >= getCommunitySize(ReferralRank.TA_COLONEL):
            return ReferralRank.TA_COLONEL;

        case personalATC >=
            RANK_REQUIREMENTS[ReferralRank.TA_MAJOR].personalATC &&
            communityATC >=
                RANK_REQUIREMENTS[ReferralRank.TA_MAJOR].communityATC &&
            communitySize >= getCommunitySize(ReferralRank.TA_MAJOR):
            return ReferralRank.TA_MAJOR;

        case personalATC >=
            RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC &&
            communityATC >=
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communityATC &&
            communitySize >= getCommunitySize(ReferralRank.TA_CAPTAIN):
            return ReferralRank.TA_CAPTAIN;

        case personalATC >=
            RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC &&
            communityATC >=
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communityATC &&
            communitySize >= getCommunitySize(ReferralRank.TA_LIEUTENANT):
            return ReferralRank.TA_LIEUTENANT;

        case personalATC >=
            RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC:
            return ReferralRank.TA_RECRUIT;

        default:
            return null;
    }
}
