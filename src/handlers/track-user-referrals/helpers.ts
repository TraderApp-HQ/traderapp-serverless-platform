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

export const processUserReferralTracking = async (
    connections: DatabaseConnections,
    event: SQSEvent
): Promise<void> => {
    const queueMessage: IReferralQueueMessage = JSON.parse(
        event.Records[0].body
    );
    const { tradingEngine: tradingEngineConnection, users: usersConnection } =
        connections;

    try {
        const balances = await computeUserAndReferralsBalances({
            tradingEngineConnection,
            referrals: queueMessage.referrals,
            userId: queueMessage.user.id,
        });

        const referralRank = computeRank({
            personalATC: balances.userBalance.availableBalance,
            communityATC: balances.communityBalance,
            communitySize: queueMessage.referrals.length,
            isTestReferralTracking: queueMessage.isTestReferralTracking,
        });

        await updateUserBalanceInDb({
            mongooseConnection: usersConnection,
            balance: balances,
            userId: queueMessage.user.id,
            referralRank,
        });
    } catch (error) {
        console.error(`An error occurred: ${error}`);
    }
};
