import { SQSEvent } from "aws-lambda";
import mongoose from "mongoose";
import log from "@dazn/lambda-powertools-logger";
import {
    RANK_INDEX_MAP,
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
    IComputeRankResult,
    IRankCriteria,
    IReferralQueueMessage,
    IUpdateUserRecordInput,
    IUser,
    IUserDbConnection,
    ReferralRankType,
} from "src/config/interfaces";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";
import "dotenv/config";
import { getSecrets } from "src/config/secrets/helpers";
import { ICommonSecrets } from "src/config/secrets/interfaces";
import { SecretLocation } from "src/config/secrets/enums";
import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { UserOnboardingChecklist } from "src/types/users-service";

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
                return { availableBalance: 0, lockedBalance: 0 };
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
                    accountType: "FUTURES", // Only get FUTURES accounts balances
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

    // Checks if the user has enough referrals at the given rank or at a higher rank
    private hasRequiredRankReferrals(
        rank: ReferralRankType,
        maxRankFromReferrals: ReferralRankType
    ): boolean {
        return RANK_INDEX_MAP[maxRankFromReferrals] >= RANK_INDEX_MAP[rank];
    }

    // Calculates the highest rank a user qualifies for based solely on their referrals' ranks.
    // It counts how many referrals a user has at each rank level and higher, then determines the highest rank where they have at least 3 referrals at that rank or above.
    // Based on the business rule, having 3+ referrals at rank X qualifies the user for rank X+1, so this function returns that eligible rank.
    private determineMaxRankFromReferrals(
        referrals: IUser[]
    ): ReferralRankType {
        // Converts each referral's rank into a numerical index for easier comparison
        // If a referral doesn't have a rank (or has an invalid rank), assigns -1
        const referralRankIndices = referrals.map((referral) =>
            referral.referralRank &&
            RANK_INDEX_MAP[referral.referralRank] !== undefined
                ? RANK_INDEX_MAP[referral.referralRank]
                : -1
        );

        // Creates an array where each position represents a rank
        const rankCounts = new Array(RANK_ORDER.length).fill(0);

        // Counts how many referrals exist for each specific rank
        referralRankIndices.forEach((rankIndex) => {
            if (rankIndex >= 0) {
                rankCounts[rankIndex]++;
            }
        });

        // Creates another array to track cumulative counts
        // Starting from the highest rank, adds up the counts going downward
        // Each position now shows how many referrals are at that rank OR higher
        const countsAtRankOrAbove = new Array(RANK_ORDER.length).fill(0);
        let cumulativeCount = 0;
        for (let i = RANK_ORDER.length - 1; i >= 0; i--) {
            cumulativeCount += rankCounts[i];
            countsAtRankOrAbove[i] = cumulativeCount;
        }

        // Finds the highest rank where the user has at least 3 referrals at that rank or higher.
        // Loops from highest to lowest rank to check where threshold for REQUIRED_RANK_REFERRALS is first met.
        let highestRankWithEnoughReferrals: number = -1;
        for (
            let rankIndex = RANK_ORDER.length - 1;
            rankIndex >= 0;
            rankIndex--
        ) {
            if (countsAtRankOrAbove[rankIndex] >= REQUIRED_RANK_REFERRALS) {
                highestRankWithEnoughReferrals = rankIndex;
                break;
            }
        }

        // Return one rank higher as the qualified rank (or the highest rank if already at the top)
        if (highestRankWithEnoughReferrals === -1) {
            return ReferralRank.TA_RECRUIT; // Default to lowest rank if no requirements met
        } else if (highestRankWithEnoughReferrals >= RANK_ORDER.length - 1) {
            return RANK_ORDER[highestRankWithEnoughReferrals]; // Already at highest rank
        } else {
            return RANK_ORDER[highestRankWithEnoughReferrals + 1]; // Return one rank higher
        }
    }

    public async processUserReferralTracking(
        connections: DatabaseConnections,
        event: SQSEvent
    ): Promise<{ successMessageIds: string[]; failedMessageIds: string[] }> {
        const queueMessages =
            getParsedQueueMessagesBody<IReferralQueueMessage>(event);
        const {
            tradingEngine: tradingEngineConnection,
            users: usersConnection,
        } = connections;
        const env = process.env.ENV;
        const commonSecrets = await getSecrets<ICommonSecrets>(
            `${SecretLocation.commonSecrets}/${env}`
        );

        const successMessageIds: string[] = [];
        const failedMessageIds: string[] = [];

        try {
            const processingResults = await Promise.allSettled(
                queueMessages.map(async (queueMessage) => {
                    try {
                        const { referrals, user, isTestReferralTracking } =
                            queueMessage.body;

                        const balances =
                            await this.computeUserAndReferralsBalances({
                                tradingEngineConnection,
                                referrals,
                                userId: user.id,
                            });

                        const { rank, maxRankFromReferrals } = this.computeRank(
                            {
                                personalATC:
                                    balances.userBalance.availableBalance,
                                communityATC: balances.communityBalance,
                                referrals,
                                isTestReferralTracking,
                            }
                        );

                        await Promise.all([
                            this.updateUserInfoInDb({
                                mongooseConnection: usersConnection,
                                balance: balances,
                                userId: user.id,
                                maxRankFromReferrals,
                                referralRank: rank,
                            }),
                            publishMessageToQueue({
                                queueUrl:
                                    commonSecrets.TRACK_USER_ONBOARDING_CHECKLIST_QUEUE ??
                                    "",
                                message: {
                                    userId: user.id,
                                    onboardingChecklistItem:
                                        UserOnboardingChecklist.IS_PERSONAL_ATC_FUNDED,
                                    value:
                                        balances.userBalance.availableBalance >
                                        50,
                                },
                            }),
                        ]);

                        return {
                            messageId: queueMessage.messageId,
                            success: true,
                        };
                    } catch (error) {
                        log.error(
                            `Failed to process referral message ${queueMessage.messageId}:`,
                            { error }
                        );
                        return {
                            messageId: queueMessage.messageId,
                            success: false,
                        };
                    }
                })
            );

            processingResults.forEach((result) => {
                if (result.status === "fulfilled" && result.value.success) {
                    successMessageIds.push(result.value.messageId);
                } else {
                    const messageId =
                        result.status === "fulfilled"
                            ? result.value.messageId
                            : "unknown";
                    failedMessageIds.push(messageId);
                }
            });

            return { successMessageIds, failedMessageIds };
        } catch (error) {
            log.error("Error in processUserReferralTracking:", { error });
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((qm) => qm.messageId),
            };
        }
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

        return { userBalance, communityBalance: sumReferralBalance };
    }

    public computeRank(criteria: IRankCriteria): IComputeRankResult {
        const { personalATC, communityATC, referrals, isTestReferralTracking } =
            criteria;

        const communitySize = referrals.length;
        const maxRankFromReferrals =
            this.determineMaxRankFromReferrals(referrals);

        let rank: ReferralRankType | null = null;

        // Reversed copy of ranks without the lowest rank
        const descendingRanks = [...RANK_ORDER].reverse().slice(0, -1);

        // Iterate through ranks from highest to lowest
        for (const currentRank of descendingRanks) {
            const hasRequiredRankReferrals = this.hasRequiredRankReferrals(
                currentRank,
                maxRankFromReferrals
            );
            if (
                hasRequiredRankReferrals &&
                personalATC >= RANK_REQUIREMENTS[currentRank].personalATC &&
                communityATC >= RANK_REQUIREMENTS[currentRank].communityATC &&
                communitySize >=
                    this.getCommunitySize(currentRank, isTestReferralTracking)
            ) {
                rank = currentRank;
                break;
            }
        }

        // If no higher rank matched, check for TA_RECRUIT
        if (
            !rank &&
            personalATC >=
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC
        ) {
            rank = ReferralRank.TA_RECRUIT;
        }

        return { rank, maxRankFromReferrals };
    }

    public async updateUserInfoInDb({
        userId,
        mongooseConnection,
        balance,
        referralRank,
        maxRankFromReferrals,
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
                        maxRankFromReferrals,
                        isTestReferralTrackingInProgress: false,
                    },
                }
            );
    }
}

export default new ReferralsService();
