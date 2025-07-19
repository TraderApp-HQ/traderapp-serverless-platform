"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserBalance = exports.createReferralsWithRankAndBalance = exports.getUserFromDb = exports.createSQSEvent = exports.setUpUserWithBalance = exports.createUser = exports.createAccountBalance = exports.createTradingAccount = exports.generateObjectId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("src/config/constants");
const generateObjectId = () => new mongoose_1.default.Types.ObjectId().toString();
exports.generateObjectId = generateObjectId;
const createTradingAccount = async (connection, userId, accountId) => {
    const validAccountId = accountId || (0, exports.generateObjectId)();
    return await connection
        .collection(constants_1.TradingEngineServiceDbCollection.userTradingAccountsCollection)
        .insertOne({
        _id: new mongoose_1.default.Types.ObjectId(validAccountId),
        userId,
        connectionStatus: "ACTIVE",
        createdAt: new Date(),
    });
};
exports.createTradingAccount = createTradingAccount;
const createAccountBalance = async (connection, tradingAccountId, availableBalance, lockedBalance = 0) => {
    return await connection
        .collection(constants_1.TradingEngineServiceDbCollection.userTradingAccountBalanceCollection)
        .insertOne({
        tradingAccountId: new mongoose_1.default.Types.ObjectId(tradingAccountId),
        currency: "USDT",
        availableBalance,
        lockedBalance,
        updatedAt: new Date(),
    });
};
exports.createAccountBalance = createAccountBalance;
const createUser = async (connection, userId, personalATC = 0, communityATC = 0, referralRank = null, maxRankFromReferrals = constants_1.ReferralRank.TA_RECRUIT) => {
    return await connection
        .collection(constants_1.UserServiceDbCollection.users)
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
exports.createUser = createUser;
const setUpUserWithBalance = async (userConnection, tradingEngineConnection, userId, tradingAccountId, availableBalance) => {
    const [user, tradingAccount, balance] = await Promise.all([
        (0, exports.createUser)(userConnection, userId),
        (0, exports.createTradingAccount)(tradingEngineConnection, userId, tradingAccountId),
        (0, exports.createAccountBalance)(tradingEngineConnection, tradingAccountId, availableBalance),
    ]);
    return { user, tradingAccount, balance };
};
exports.setUpUserWithBalance = setUpUserWithBalance;
const createSQSEvent = (messageId, queueMessage) => {
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
                    eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
                    awsRegion: "us-east-1",
                },
            ],
        };
    }
    // Handle multiple messages case
    const messageIds = Array.isArray(messageId) ? messageId : [messageId];
    const queueMessages = Array.isArray(queueMessage)
        ? queueMessage
        : [queueMessage];
    if (messageIds.length !== queueMessages.length) {
        throw new Error("messageId and queueMessage arrays must have the same length");
    }
    return {
        Records: messageIds.map((id, index) => ({
            messageId: id,
            receiptHandle: `test-receipt-${index + 1}`,
            body: JSON.stringify(queueMessages[index]),
            attributes: { ...defaultSqsAttributes },
            messageAttributes: {},
            md5OfBody: `test-md5-${index + 1}`,
            eventSource: "aws:sqs",
            eventSourceARN: "arn:aws:sqs:us-east-1:123456789012:test-queue",
            awsRegion: "us-east-1",
        })),
    };
};
exports.createSQSEvent = createSQSEvent;
const getUserFromDb = async (connection, userId) => {
    return await connection
        .collection(constants_1.UserServiceDbCollection.users)
        .findOne({ id: userId });
};
exports.getUserFromDb = getUserFromDb;
const createReferralsWithRankAndBalance = async (idPrefix, balance, count, userConnection, tradingEngineConnection, referralRank) => {
    const userSetupData = Array.from({ length: count }, (_, i) => ({
        userId: `${idPrefix}-${i}`,
        accountId: (0, exports.generateObjectId)(),
    }));
    await Promise.all(userSetupData.map(({ userId, accountId }) => (0, exports.setUpUserWithBalance)(userConnection, tradingEngineConnection, userId, accountId, balance)));
    const referrals = userSetupData.map(({ userId }) => ({
        id: userId,
        referralRank,
    }));
    return referrals;
};
exports.createReferralsWithRankAndBalance = createReferralsWithRankAndBalance;
const updateUserBalance = async (accountId, tradingEngineConnection, balance) => {
    const result = await tradingEngineConnection
        .collection(constants_1.TradingEngineServiceDbCollection.userTradingAccountBalanceCollection)
        .updateOne({
        tradingAccountId: new mongoose_1.default.Types.ObjectId(accountId),
    }, { $set: { availableBalance: balance } });
    return result;
};
exports.updateUserBalance = updateUserBalance;
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
