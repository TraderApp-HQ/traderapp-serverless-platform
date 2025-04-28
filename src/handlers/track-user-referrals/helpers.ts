import { SQSEvent } from "aws-lambda";
import {
    DatabaseConnections,
    IReferralQueueMessage,
} from "src/config/interfaces";
import {
    computeRank,
    computeUserAndReferralsBalances,
    updateUserBalanceInDb,
} from "src/helpers/referrals-helpers";
import { getParsedQueueMessagesBody } from "src/config/sqs/helpers";

export const processUserReferralTracking = async (
    connections: DatabaseConnections,
    event: SQSEvent
): Promise<void> => {
    const queueMessages = getParsedQueueMessagesBody<IReferralQueueMessage>(event);
    const { tradingEngine: tradingEngineConnection, users: usersConnection } = connections;

    // Process each message in the batch
    const processPromises = queueMessages.map(async (queueMessage) => {
        try {
            const balances = await computeUserAndReferralsBalances({
                tradingEngineConnection,
                referrals: queueMessage.body.referrals,
                userId: queueMessage.body.user.id,
            });

            const referralRank = computeRank({
                personalATC: balances.userBalance.availableBalance,
                communityATC: balances.communityBalance,
                communitySize: queueMessage.body.referrals.length,
                isTestReferralTracking: queueMessage.body.isTestReferralTracking,
            });

            await updateUserBalanceInDb({
                mongooseConnection: usersConnection,
                balance: balances,
                userId: queueMessage.body.user.id,
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
