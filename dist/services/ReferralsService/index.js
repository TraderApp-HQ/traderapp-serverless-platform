"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralsService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
const constants_1 = require("src/config/constants");
const helpers_1 = require("src/config/sqs/helpers");
require("dotenv/config");
const helpers_2 = require("src/config/secrets/helpers");
const enums_1 = require("src/config/secrets/enums");
const helpers_3 = require("src/clients/SQSClient/helpers");
const users_service_1 = require("src/types/users-service");
class ReferralsService {
    constructor() { }
    async getTotalUsdtBalanceFromDb({ userId, mongooseConnection, }) {
        try {
            // Get trading accounts that are not archived
            const tradingAccounts = await mongooseConnection
                .collection(constants_1.TradingEngineServiceDbCollection.userTradingAccountsCollection)
                .find({ userId, connectionStatus: { $ne: "ARCHIVED" } })
                .toArray();
            if (!tradingAccounts.length) {
                return { availableBalance: 0, lockedBalance: 0 };
            }
            // Get all trading account IDs
            const tradingAccountIds = tradingAccounts.map((account) => new mongoose_1.default.Types.ObjectId(account._id));
            // Get USDT balances for these accounts
            const balances = await mongooseConnection
                .collection(constants_1.TradingEngineServiceDbCollection.userTradingAccountBalanceCollection)
                .find({
                tradingAccountId: { $in: tradingAccountIds },
                currency: "USDT",
                accountType: "FUTURES", // Only get FUTURES accounts balances
            })
                .toArray();
            // Sum up the balances
            const totalBalance = balances.reduce((total, balance) => ({
                availableBalance: total.availableBalance +
                    (balance.availableBalance || 0),
                lockedBalance: total.lockedBalance + (balance.lockedBalance || 0),
            }), { availableBalance: 0, lockedBalance: 0 });
            return totalBalance;
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("Failed to get total USDT balance", { error, userId });
            throw new Error(`Failed to get total USDT balance: ${error}`);
        }
    }
    getCommunitySize(rank, isTestReferralTracking = false) {
        return isTestReferralTracking
            ? constants_1.RANK_REQUIREMENTS[rank].testCommunitySize
            : constants_1.RANK_REQUIREMENTS[rank].communitySize;
    }
    // Checks if the user has enough referrals at the given rank or at a higher rank
    hasRequiredRankReferrals(rank, maxRankFromReferrals) {
        return constants_1.RANK_INDEX_MAP[maxRankFromReferrals] >= constants_1.RANK_INDEX_MAP[rank];
    }
    // Calculates the highest rank a user qualifies for based solely on their referrals' ranks.
    // It counts how many referrals a user has at each rank level and higher, then determines the highest rank where they have at least 3 referrals at that rank or above.
    // Based on the business rule, having 3+ referrals at rank X qualifies the user for rank X+1, so this function returns that eligible rank.
    determineMaxRankFromReferrals(referrals) {
        // Converts each referral's rank into a numerical index for easier comparison
        // If a referral doesn't have a rank (or has an invalid rank), assigns -1
        const referralRankIndices = referrals.map((referral) => referral.referralRank &&
            constants_1.RANK_INDEX_MAP[referral.referralRank] !== undefined
            ? constants_1.RANK_INDEX_MAP[referral.referralRank]
            : -1);
        // Creates an array where each position represents a rank
        const rankCounts = new Array(constants_1.RANK_ORDER.length).fill(0);
        // Counts how many referrals exist for each specific rank
        referralRankIndices.forEach((rankIndex) => {
            if (rankIndex >= 0) {
                rankCounts[rankIndex]++;
            }
        });
        // Creates another array to track cumulative counts
        // Starting from the highest rank, adds up the counts going downward
        // Each position now shows how many referrals are at that rank OR higher
        const countsAtRankOrAbove = new Array(constants_1.RANK_ORDER.length).fill(0);
        let cumulativeCount = 0;
        for (let i = constants_1.RANK_ORDER.length - 1; i >= 0; i--) {
            cumulativeCount += rankCounts[i];
            countsAtRankOrAbove[i] = cumulativeCount;
        }
        // Finds the highest rank where the user has at least 3 referrals at that rank or higher.
        // Loops from highest to lowest rank to check where threshold for REQUIRED_RANK_REFERRALS is first met.
        let highestRankWithEnoughReferrals = -1;
        for (let rankIndex = constants_1.RANK_ORDER.length - 1; rankIndex >= 0; rankIndex--) {
            if (countsAtRankOrAbove[rankIndex] >= constants_1.REQUIRED_RANK_REFERRALS) {
                highestRankWithEnoughReferrals = rankIndex;
                break;
            }
        }
        // Return one rank higher as the qualified rank (or the highest rank if already at the top)
        if (highestRankWithEnoughReferrals === -1) {
            return constants_1.ReferralRank.TA_RECRUIT; // Default to lowest rank if no requirements met
        }
        else if (highestRankWithEnoughReferrals >= constants_1.RANK_ORDER.length - 1) {
            return constants_1.RANK_ORDER[highestRankWithEnoughReferrals]; // Already at highest rank
        }
        else {
            return constants_1.RANK_ORDER[highestRankWithEnoughReferrals + 1]; // Return one rank higher
        }
    }
    async processUserReferralTracking(connections, event) {
        const queueMessages = (0, helpers_1.getParsedQueueMessagesBody)(event);
        const { tradingEngine: tradingEngineConnection, users: usersConnection, } = connections;
        const env = process.env.ENV;
        const commonSecrets = await (0, helpers_2.getSecrets)(`${enums_1.SecretLocation.commonSecrets}/${env}`);
        const successMessageIds = [];
        const failedMessageIds = [];
        try {
            const processingResults = await Promise.allSettled(queueMessages.map(async (queueMessage) => {
                try {
                    const { referrals, user, isTestReferralTracking } = queueMessage.body;
                    const balances = await this.computeUserAndReferralsBalances({
                        tradingEngineConnection,
                        referrals,
                        userId: user.id,
                    });
                    const { rank, maxRankFromReferrals } = this.computeRank({
                        personalATC: balances.userBalance.availableBalance,
                        communityATC: balances.communityBalance,
                        referrals,
                        isTestReferralTracking,
                    });
                    await Promise.all([
                        this.updateUserInfoInDb({
                            mongooseConnection: usersConnection,
                            balance: balances,
                            userId: user.id,
                            maxRankFromReferrals,
                            referralRank: rank,
                        }),
                        (0, helpers_3.publishMessageToQueue)({
                            queueUrl: commonSecrets.TRACK_USER_ONBOARDING_CHECKLIST_QUEUE ??
                                "",
                            message: JSON.stringify({
                                userId: user.id,
                                onboardingChecklistItem: users_service_1.UserOnboardingChecklist.IS_PERSONAL_ATC_FUNDED,
                                value: balances.userBalance.availableBalance >
                                    50,
                            }),
                        }),
                    ]);
                    return {
                        messageId: queueMessage.messageId,
                        success: true,
                    };
                }
                catch (error) {
                    lambda_powertools_logger_1.default.error(`Failed to process referral message ${queueMessage.messageId}:`, { error });
                    return {
                        messageId: queueMessage.messageId,
                        success: false,
                    };
                }
            }));
            processingResults.forEach((result) => {
                if (result.status === "fulfilled" && result.value.success) {
                    successMessageIds.push(result.value.messageId);
                }
                else {
                    const messageId = result.status === "fulfilled"
                        ? result.value.messageId
                        : "unknown";
                    failedMessageIds.push(messageId);
                }
            });
            return { successMessageIds, failedMessageIds };
        }
        catch (error) {
            lambda_powertools_logger_1.default.error("Error in processUserReferralTracking:", { error });
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((qm) => qm.messageId),
            };
        }
    }
    async computeUserAndReferralsBalances({ tradingEngineConnection, referrals, userId, }) {
        const [userBalance, ...referralBalances] = await Promise.all([
            this.getTotalUsdtBalanceFromDb({
                userId,
                mongooseConnection: tradingEngineConnection,
            }),
            ...referrals.map((ref) => this.getTotalUsdtBalanceFromDb({
                userId: ref.id,
                mongooseConnection: tradingEngineConnection,
            })),
        ]);
        const sumReferralBalance = referralBalances.reduce((total, balance) => total + balance.availableBalance, 0);
        return { userBalance, communityBalance: sumReferralBalance };
    }
    computeRank(criteria) {
        const { personalATC, communityATC, referrals, isTestReferralTracking } = criteria;
        const communitySize = referrals.length;
        const maxRankFromReferrals = this.determineMaxRankFromReferrals(referrals);
        let rank = null;
        // Reversed copy of ranks without the lowest rank
        const descendingRanks = [...constants_1.RANK_ORDER].reverse().slice(0, -1);
        // Iterate through ranks from highest to lowest
        for (const currentRank of descendingRanks) {
            const hasRequiredRankReferrals = this.hasRequiredRankReferrals(currentRank, maxRankFromReferrals);
            if (hasRequiredRankReferrals &&
                personalATC >= constants_1.RANK_REQUIREMENTS[currentRank].personalATC &&
                communityATC >= constants_1.RANK_REQUIREMENTS[currentRank].communityATC &&
                communitySize >=
                    this.getCommunitySize(currentRank, isTestReferralTracking)) {
                rank = currentRank;
                break;
            }
        }
        // If no higher rank matched, check for TA_RECRUIT
        if (!rank &&
            personalATC >=
                constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_RECRUIT].personalATC) {
            rank = constants_1.ReferralRank.TA_RECRUIT;
        }
        return { rank, maxRankFromReferrals };
    }
    async updateUserInfoInDb({ userId, mongooseConnection, balance, referralRank, maxRankFromReferrals, }) {
        await mongooseConnection
            .collection(constants_1.UserServiceDbCollection.users)
            .updateOne({ id: userId }, {
            $set: {
                personalATC: balance.userBalance.availableBalance,
                communityATC: balance.communityBalance,
                referralRank,
                maxRankFromReferrals,
                isTestReferralTrackingInProgress: false,
            },
        });
    }
}
exports.ReferralsService = ReferralsService;
exports.default = new ReferralsService();
