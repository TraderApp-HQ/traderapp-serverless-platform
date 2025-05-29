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

    private getCommunitySize(
        rank: ReferralRankType,
        isTestReferralTracking: boolean = false
    ): number {
        return isTestReferralTracking
            ? RANK_REQUIREMENTS[rank].testCommunitySize
            : RANK_REQUIREMENTS[rank].communitySize;
    }

    // Determines if the user meets the required rank referrals for a given rank.
    private hasRequiredRankReferrals(
        rank: ReferralRankType,
        maxReferralRankRequirementMet: ReferralRankType
    ): boolean {
        return (
            RANK_ORDER.indexOf(maxReferralRankRequirementMet) >=
            RANK_ORDER.indexOf(rank)
        );
    }

    private getMaxReferralRankRequirementMet(
        referrals: IUser[]
    ): ReferralRankType {
        // Precompute the rank index for each referral
        const referralRankIndices = referrals.map((referral) =>
            referral.referralRank
                ? RANK_ORDER.indexOf(referral.referralRank)
                : -1
        );

        // Prepare an array to count referrals at each rank or higher
        const countsAtOrAbove: number[] = new Array(RANK_ORDER.length).fill(0);

        // For each referral, increment the count for all ranks at or below their rank
        referralRankIndices.forEach((referralIndex) => {
            if (referralIndex >= 0) {
                for (let i = 0; i <= referralIndex; i++) {
                    countsAtOrAbove[i]++;
                }
            }
        });

        // Find the highest rank for which the requirement is met
        let maxReferralRankRequirementMet: ReferralRankType =
            ReferralRank.TA_RECRUIT;
        for (let rankIndex = 0; rankIndex < RANK_ORDER.length; rankIndex++) {
            if (countsAtOrAbove[rankIndex] >= REQUIRED_RANK_REFERRALS) {
                maxReferralRankRequirementMet = RANK_ORDER[rankIndex];
            }
        }

        return maxReferralRankRequirementMet;
    }

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

    public computeRank(criteria: IRankCriteria): ReferralRankType | null {
        const {
            personalATC,
            communityATC,
            communitySize,
            maxReferralRankRequirementMet,
            isTestReferralTracking,
        } = criteria;

        switch (true) {
            case this.hasRequiredRankReferrals(
                ReferralRank.TA_FIELD_MARSHAL,
                maxReferralRankRequirementMet
            ) &&
                personalATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL]
                        .personalATC &&
                communityATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL]
                        .communityATC &&
                communitySize >=
                    this.getCommunitySize(
                        ReferralRank.TA_FIELD_MARSHAL,
                        isTestReferralTracking
                    ):
                return ReferralRank.TA_FIELD_MARSHAL;

            case this.hasRequiredRankReferrals(
                ReferralRank.TA_GENERAL,
                maxReferralRankRequirementMet
            ) &&
                personalATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_GENERAL].personalATC &&
                communityATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_GENERAL].communityATC &&
                communitySize >=
                    this.getCommunitySize(
                        ReferralRank.TA_GENERAL,
                        isTestReferralTracking
                    ):
                return ReferralRank.TA_GENERAL;

            case this.hasRequiredRankReferrals(
                ReferralRank.TA_COLONEL,
                maxReferralRankRequirementMet
            ) &&
                personalATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_COLONEL].personalATC &&
                communityATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_COLONEL].communityATC &&
                communitySize >=
                    this.getCommunitySize(
                        ReferralRank.TA_COLONEL,
                        isTestReferralTracking
                    ):
                return ReferralRank.TA_COLONEL;

            case this.hasRequiredRankReferrals(
                ReferralRank.TA_MAJOR,
                maxReferralRankRequirementMet
            ) &&
                personalATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_MAJOR].personalATC &&
                communityATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_MAJOR].communityATC &&
                communitySize >=
                    this.getCommunitySize(
                        ReferralRank.TA_MAJOR,
                        isTestReferralTracking
                    ):
                return ReferralRank.TA_MAJOR;

            case this.hasRequiredRankReferrals(
                ReferralRank.TA_CAPTAIN,
                maxReferralRankRequirementMet
            ) &&
                personalATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC &&
                communityATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communityATC &&
                communitySize >=
                    this.getCommunitySize(
                        ReferralRank.TA_CAPTAIN,
                        isTestReferralTracking
                    ):
                return ReferralRank.TA_CAPTAIN;

            case this.hasRequiredRankReferrals(
                ReferralRank.TA_LIEUTENANT,
                maxReferralRankRequirementMet
            ) &&
                personalATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC &&
                communityATC >=
                    RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT]
                        .communityATC &&
                communitySize >=
                    this.getCommunitySize(
                        ReferralRank.TA_LIEUTENANT,
                        isTestReferralTracking
                    ):
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
