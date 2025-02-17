import { SQSEvent } from "aws-lambda";
import {
    DatabaseConnections,
    IReferralQueueMessage,
} from "src/config/interfaces";
import {
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

        await updateUserBalanceInDb({
            mongooseConnection: usersConnection,
            balance: balances,
            userId: queueMessage.user.id,
        });
    } catch (error) {
        console.error(`An error occurred: ${error}`);
    }
};
