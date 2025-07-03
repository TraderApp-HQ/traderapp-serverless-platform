import mongoose from "mongoose";
import { SQSEvent, SQSRecord } from "aws-lambda";
import {
    IReferralQueueMessage,
    IUser,
    ReferralRankType,
} from "src/config/interfaces";
import {
    ReferralRank,
    TradingEngineServiceDbCollection,
    UserServiceDbCollection,
} from "src/config/constants";

export interface TestHelperConfig {
    tradingEngineConnection: mongoose.Connection;
    usersConnection: mongoose.Connection;
}

export const generateObjectId = () => new mongoose.Types.ObjectId().toString();

export const createTradingAccount = async (
    connection: mongoose.Connection,
    userId: string,
    accountId?: string
) => {
    const validAccountId = accountId || generateObjectId();
    return await connection
        .collection(
            TradingEngineServiceDbCollection.userTradingAccountsCollection
        )
        .insertOne({
            _id: new mongoose.Types.ObjectId(validAccountId),
            userId,
            connectionStatus: "ACTIVE",
            createdAt: new Date(),
        });
};

export const createAccountBalance = async (
    connection: mongoose.Connection,
    tradingAccountId: string,
    availableBalance: number,
    lockedBalance: number = 0
) => {
    return await connection
        .collection(
            TradingEngineServiceDbCollection.userTradingAccountBalanceCollection
        )
        .insertOne({
            tradingAccountId: new mongoose.Types.ObjectId(tradingAccountId),
            currency: "USDT",
            availableBalance,
            lockedBalance,
            updatedAt: new Date(),
        });
};

export const createUser = async (
    connection: mongoose.Connection,
    userId: string,
    personalATC: number = 0,
    communityATC: number = 0,
    referralRank: string | null = null,
    maxRankFromReferrals: string = ReferralRank.TA_RECRUIT
) => {
    return await connection
        .collection(UserServiceDbCollection.users)
        .insertOne({
            id: userId,
            personalATC,
            communityATC,
            referralRank,
            maxRankFromReferrals,
            isTestReferralTrackingInProgress: true,
            createdAt: new Date(),
        });
};

export const setUpUserWithBalance = async (
    userConnection: mongoose.Connection,
    tradingEngineConnection: mongoose.Connection,
    userId: string,
    tradingAccountId: string,
    availableBalance: number
) => {
    const [user, tradingAccount, balance] = await Promise.all([
        createUser(userConnection, userId),
        createTradingAccount(tradingEngineConnection, userId, tradingAccountId),
        createAccountBalance(
            tradingEngineConnection,
            tradingAccountId,
            availableBalance
        ),
    ]);

    return { user, tradingAccount, balance };
};

export const createSQSEvent = (
    messageId: string | string[],
    queueMessage: IReferralQueueMessage | IReferralQueueMessage[]
): SQSEvent => {
    const defaultSqsAttributes = {
        ApproximateReceiveCount: "1",
        SentTimestamp: "1234567890000",
        SenderId: "test-sender",
        ApproximateFirstReceiveTimestamp: "1234567890000",
    };

    // Handle single message case (backward compatibility)
    if (typeof messageId === "string" && !Array.isArray(queueMessage)) {
        return {
            Records: [
                {
                    messageId: messageId,
                    receiptHandle: "test-receipt-handle",
                    body: JSON.stringify(queueMessage),
                    attributes: { ...defaultSqsAttributes },
                    messageAttributes: {},
                    md5OfBody: "test-md5",
                    eventSource: "aws:sqs",
                    eventSourceARN:
                        "arn:aws:sqs:us-east-1:123456789012:test-queue",
                    awsRegion: "us-east-1",
                } as SQSRecord,
            ],
        };
    }

    // Handle multiple messages case
    const messageIds = Array.isArray(messageId) ? messageId : [messageId];
    const queueMessages = Array.isArray(queueMessage)
        ? queueMessage
        : [queueMessage];

    if (messageIds.length !== queueMessages.length) {
        throw new Error(
            "messageId and queueMessage arrays must have the same length"
        );
    }

    return {
        Records: messageIds.map(
            (id, index) =>
                ({
                    messageId: id,
                    receiptHandle: `test-receipt-${index + 1}`,
                    body: JSON.stringify(queueMessages[index]),
                    attributes: { ...defaultSqsAttributes },
                    messageAttributes: {},
                    md5OfBody: `test-md5-${index + 1}`,
                    eventSource: "aws:sqs",
                    eventSourceARN:
                        "arn:aws:sqs:us-east-1:123456789012:test-queue",
                    awsRegion: "us-east-1",
                }) as SQSRecord
        ),
    };
};

export const getUserFromDb = async (
    connection: mongoose.Connection,
    userId: string
) => {
    return await connection
        .collection(UserServiceDbCollection.users)
        .findOne({ id: userId });
};

export const createReferralsWithRankAndBalance = async (
    idPrefix: string,
    balance: number,
    count: number,
    userConnection: mongoose.Connection,
    tradingEngineConnection: mongoose.Connection,
    referralRank: ReferralRankType
): Promise<IUser[]> => {
    const userSetupData = Array.from({ length: count }, (_, i) => ({
        userId: `${idPrefix}-${i}`,
        accountId: generateObjectId(),
    }));

    await Promise.all(
        userSetupData.map(({ userId, accountId }) =>
            setUpUserWithBalance(
                userConnection,
                tradingEngineConnection,
                userId,
                accountId,
                balance
            )
        )
    );

    const referrals: IUser[] = userSetupData.map(
        ({ userId }) =>
            ({
                id: userId,
                referralRank,
            }) as IUser
    );

    return referrals;
};

export const updateUserBalance = async (
    accountId: string,
    tradingEngineConnection: mongoose.Connection,
    balance: number
) => {
    const result = await tradingEngineConnection
        .collection(
            TradingEngineServiceDbCollection.userTradingAccountBalanceCollection
        )
        .updateOne(
            {
                tradingAccountId: new mongoose.Types.ObjectId(accountId),
            },
            { $set: { availableBalance: balance } }
        );

    return result;
};

// export const updateUserBalance = async (
//     accountId: string,
//     tradingEngineConnection: mongoose.Connection,
//     delta: number
// ) => {
//     const result = await tradingEngineConnection
//         .collection(
//             TradingEngineServiceDbCollection.userTradingAccountBalanceCollection
//         )
//         .findOneAndUpdate(
//             { tradingAccountId: new mongoose.Types.ObjectId(accountId) },
//             { $inc: { availableBalance: delta } },
//             { returnDocument: "after" }
//         );
//     return result; // optionally return the updated doc
// };
