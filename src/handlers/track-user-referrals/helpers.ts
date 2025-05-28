import { SQSEvent } from "aws-lambda";
import {
    DatabaseConnections,
    IReferralQueueMessage,
    ReferralRankType,
} from "src/config/interfaces";
import {
    computeRank,
    computeUserAndReferralsBalances,
    updateUserBalanceInDb,
} from "src/helpers/referrals-helpers";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";
import {
    RANK_ORDER,
    ReferralRank,
    REQUIRED_RANK_REFERRALS,
} from "src/config/constants";

export const processUserReferralTracking = async (
    connections: DatabaseConnections,
    event: SQSEvent
): Promise<void> => {
    const queueMessages =
        getParsedQueueMessagesBody<IReferralQueueMessage>(event);
    const { tradingEngine: tradingEngineConnection, users: usersConnection } =
        connections;

    // Process each message in the batch
    const processPromises = queueMessages.map(async (queueMessage) => {
        try {
            const { referrals, user, isTestReferralTracking } =
                queueMessage.body;
            const balances = await computeUserAndReferralsBalances({
                tradingEngineConnection,
                referrals,
                userId: user.id,
            });

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

            const referralRank = computeRank({
                personalATC: balances.userBalance.availableBalance,
                communityATC: balances.communityBalance,
                communitySize: referrals.length,
                maxReferralRankRequirementMet,
                isTestReferralTracking,
            });

            await updateUserBalanceInDb({
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

    // Wait for all messages to be processed
    await Promise.all(processPromises);
};

// export const processUserReferralTracking = async (
//     connections: DatabaseConnections,
//     event: SQSEvent
// ): Promise<void> => {
//     const queueMessage: IReferralQueueMessage = JSON.parse(
//         event.Records[0].body
//     );
//     const { tradingEngine: tradingEngineConnection, users: usersConnection } =
//         connections;

//     try {
//         const balances = await computeUserAndReferralsBalances({
//             tradingEngineConnection,
//             referrals: queueMessage.referrals,
//             userId: queueMessage.user.id,
//         });

//         const referralRank = computeRank({
//             personalATC: balances.userBalance.availableBalance,
//             communityATC: balances.communityBalance,
//             communitySize: queueMessage.referrals.length,
//             isTestReferralTracking: queueMessage.isTestReferralTracking,
//         });

//         await updateUserBalanceInDb({
//             mongooseConnection: usersConnection,
//             balance: balances,
//             userId: queueMessage.user.id,
//             referralRank,
//         });
//     } catch (error) {
//         console.error(`An error occurred: ${error}`);
//     }
// };
