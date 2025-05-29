import { SQSEvent } from "aws-lambda";
import mongoose from "mongoose";
import log from "@dazn/lambda-powertools-logger";
import {
    RANK_ORDER,
    RANK_REQUIREMENTS,
    ReferralRank,
    REQUIRED_RANK_REFERRALS,
    TradingEngineServiceDbCollection,
    UserServiceDbCollection,
} from "src/config/constants";
import {
    DatabaseConnections,
    IBalances,
    IComputeBalanceInput,
    IRankCriteria,
    IReferralQueueMessage,
    IUpdateUserRecordInput,
    IUser,
    IUserDbConnection,
    ReferralRankType,
} from "src/config/interfaces";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";

export class ReferralsService {
    constructor() {}

    public async processUserReferralTracking(
        connections: DatabaseConnections,
        event: SQSEvent
    ): Promise<void> {
        const queueMessages =
            getParsedQueueMessagesBody<IReferralQueueMessage>(event);
        const {
            tradingEngine: tradingEngineConnection,
            users: usersConnection,
        } = connections;

        const processPromises = queueMessages.map(async (queueMessage) => {
            try {
                const { referrals, user, isTestReferralTracking } =
                    queueMessage.body;
                const balances = await this.computeUserAndReferralsBalances({
                    tradingEngineConnection,
                    referrals,
                    userId: user.id,
                });

                const maxReferralRankRequirementMet =
                    this.getMaxReferralRankRequirementMet(referrals);

                const referralRank = this.computeRank({
                    personalATC: balances.userBalance.availableBalance,
                    communityATC: balances.communityBalance,
                    communitySize: referrals.length,
                    maxReferralRankRequirementMet,
                    isTestReferralTracking,
                });

                await this.updateUserInfoInDb({
                    mongooseConnection: usersConnection,
                    balance: balances,
                    userId: user.id,
                    maxReferralRankRequirementMet,
                    referralRank,
                });
            } catch (error) {
                console.error(`An error occurred processing message: ${error}`);
                // Don't throw the error so other messages can still be processed
            }
        });
        await Promise.all(processPromises);
    }

    private getMaxReferralRankRequirementMet(
        referrals: IUser[]
    ): ReferralRankType {
        let maxReferralRankRequirementMet: ReferralRankType =
            ReferralRank.TA_RECRUIT;

        RANK_ORDER.forEach((rank, rankIndex) => {
            const meetsRequirement =
                referrals.filter((referral) => {
                    const referralRankIndex = referral.referralRank
                        ? RANK_ORDER.indexOf(referral.referralRank)
                        : -1;
                    return referralRankIndex >= rankIndex;
                }).length >= REQUIRED_RANK_REFERRALS;
            if (meetsRequirement) {
                maxReferralRankRequirementMet = rank;
            }
        });
        return maxReferralRankRequirementMet;
    }

    public async computeUserAndReferralsBalances({
        tradingEngineConnection,
        referrals,
        userId,
    }: IComputeBalanceInput): Promise<IBalances> {
        const [userBalance, ...referralBalances] = await Promise.all([
            this.getTotalUsdtBalanceFromDb({
                userId,
                mongooseConnection: tradingEngineConnection,
            }),
            ...referrals.map((ref) =>
                this.getTotalUsdtBalanceFromDb({
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
            communityBalance: sumReferralBalance,
        };
    }

    private async getTotalUsdtBalanceFromDb({
        userId,
        mongooseConnection,
    }: IUserDbConnection): Promise<{
        availableBalance: number;
        lockedBalance: number;
    }> {
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
                        total.availableBalance +
                        (balance.availableBalance || 0),
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
    }

    public computeRank(criteria: IRankCriteria): ReferralRankType | null {
        const {
            personalATC,
            communityATC,
            communitySize,
            maxReferralRankRequirementMet,
            isTestReferralTracking,
        } = criteria;

        const getCommunitySize = (rank: ReferralRankType) => {
            return isTestReferralTracking
                ? RANK_REQUIREMENTS[rank].testCommunitySize
                : RANK_REQUIREMENTS[rank].communitySize;
        };

        // Determines if the user meets the required rank referrals for a given rank.
        const hasRequiredRankReferrals = (rank: ReferralRankType): boolean => {
            return (
                RANK_ORDER.indexOf(maxReferralRankRequirementMet) >=
                RANK_ORDER.indexOf(rank)
            );
        };

        switch (true) {
            case hasRequiredRankReferrals(ReferralRank.TA_FIELD_MARSHAL) &&
                personalATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL]
                        .personalATC &&
                communityATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL]
                        .communityATC &&
                communitySize >=
                    getCommunitySize(ReferralRank.TA_FIELD_MARSHAL):
                return ReferralRank.TA_FIELD_MARSHAL;

            case hasRequiredRankReferrals(ReferralRank.TA_GENERAL) &&
                personalATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_GENERAL].personalATC &&
                communityATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_GENERAL].communityATC &&
                communitySize >= getCommunitySize(ReferralRank.TA_GENERAL):
                return ReferralRank.TA_GENERAL;

            case hasRequiredRankReferrals(ReferralRank.TA_COLONEL) &&
                personalATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_COLONEL].personalATC &&
                communityATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_COLONEL].communityATC &&
                communitySize >= getCommunitySize(ReferralRank.TA_COLONEL):
                return ReferralRank.TA_COLONEL;

            case hasRequiredRankReferrals(ReferralRank.TA_MAJOR) &&
                personalATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_MAJOR].personalATC &&
                communityATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_MAJOR].communityATC &&
                communitySize >= getCommunitySize(ReferralRank.TA_MAJOR):
                return ReferralRank.TA_MAJOR;

            case hasRequiredRankReferrals(ReferralRank.TA_CAPTAIN) &&
                personalATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC &&
                communityATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communityATC &&
                communitySize >= getCommunitySize(ReferralRank.TA_CAPTAIN):
                return ReferralRank.TA_CAPTAIN;

            case hasRequiredRankReferrals(ReferralRank.TA_LIEUTENANT) &&
                personalATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC &&
                communityATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT]
                        .communityATC &&
                communitySize >= getCommunitySize(ReferralRank.TA_LIEUTENANT):
                return ReferralRank.TA_LIEUTENANT;

            case personalATC >=
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC:
                return ReferralRank.TA_RECRUIT;

            default:
                return null;
        }
    }

    public async updateUserInfoInDb({
        userId,
        mongooseConnection,
        balance,
        referralRank,
        maxReferralRankRequirementMet,
    }: IUpdateUserRecordInput): Promise<void> {
        await mongooseConnection
            .collection(UserServiceDbCollection.users)
            .updateOne(
                { id: userId },
                {
                    $set: {
                        personalATC: balance.userBalance.availableBalance,
                        communityATC: balance.communityBalance,
                        referralRank,
                        maxReferralRankRequirementMet,
                        isTestReferralTrackingInProgress: false,
                    },
                }
            );
    }
}

export default new ReferralsService();
