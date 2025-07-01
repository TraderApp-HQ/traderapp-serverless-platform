import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { SQSEvent, SQSRecord } from "aws-lambda";
import {
    ReferralRank,
    RANK_REQUIREMENTS,
    TradingEngineServiceDbCollection,
    UserServiceDbCollection,
} from "src/config/constants";
import {
    DatabaseConnections,
    DatabaseType,
    IReferralQueueMessage,
    IUser,
} from "src/config/interfaces";
import ReferralsService from "./index";

describe("ReferralsService Integration Tests", () => {
    let mongoServer: MongoMemoryServer;
    let tradingEngineConnection: mongoose.Connection;
    let usersConnection: mongoose.Connection;
    let connections: DatabaseConnections;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();

        // Create separate connections for trading engine and users databases
        tradingEngineConnection = mongoose.createConnection(
            uri + "trading-engine"
        );
        usersConnection = mongoose.createConnection(uri + "users");

        connections = {
            [DatabaseType.TRADING_ENGINE]: tradingEngineConnection,
            [DatabaseType.USERS]: usersConnection,
        };

        // Wait for connections to be ready
        await new Promise<void>((resolve) => {
            let connectionsReady = 0;
            const checkReady = () => {
                connectionsReady++;
                if (connectionsReady === 2) resolve();
            };

            tradingEngineConnection.on("connected", checkReady);
            usersConnection.on("connected", checkReady);
        });
    });

    afterAll(async () => {
        await tradingEngineConnection.close();
        await usersConnection.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear all collections before each test
        if (tradingEngineConnection.readyState === 1) {
            await tradingEngineConnection.db?.dropDatabase();
        }
        if (usersConnection.readyState === 1) {
            await usersConnection.db?.dropDatabase();
        }
    });

    // Helper function to generate valid ObjectId
    const generateObjectId = () => new mongoose.Types.ObjectId().toString();

    const createTradingAccount = async (userId: string, accountId?: string) => {
        const validAccountId = accountId || generateObjectId();
        return await tradingEngineConnection
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

    const createAccountBalance = async (
        tradingAccountId: string,
        availableBalance: number,
        lockedBalance: number = 0
    ) => {
        return await tradingEngineConnection
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

    const createUser = async (
        userId: string,
        personalATC: number = 0,
        communityATC: number = 0,
        referralRank: string | null = null,
        maxRankFromReferrals: string = ReferralRank.TA_RECRUIT
    ) => {
        return await usersConnection
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

    const createSQSEvent = (
        messageId: string,
        queueMessage: IReferralQueueMessage
    ): SQSEvent => {
        return {
            Records: [
                {
                    messageId: messageId,
                    receiptHandle: "test-receipt-handle",
                    body: JSON.stringify(queueMessage),
                    attributes: {
                        ApproximateReceiveCount: "1",
                        SentTimestamp: "1234567890000",
                        SenderId: "test-sender",
                        ApproximateFirstReceiveTimestamp: "1234567890000",
                    },
                    messageAttributes: {},
                    md5OfBody: "test-md5",
                    eventSource: "aws:sqs",
                    eventSourceARN:
                        "arn:aws:sqs:us-east-1:123456789012:test-queue",
                    awsRegion: "us-east-1",
                } as SQSRecord,
            ],
        };
    };

    const getUserFromDb = async (userId: string) => {
        return await usersConnection
            .collection(UserServiceDbCollection.users)
            .findOne({ id: userId });
    };

    describe("Core Functionality", () => {
        it("should correctly determine rank for a user", async () => {
            const mainUserId = "rank-determination-user";
            const mainAccountId = generateObjectId();

            // Setup main user with sufficient personal balance for TA_CAPTAIN
            await createUser(mainUserId, 0, 0, null); // Start with no rank
            await createTradingAccount(mainUserId, mainAccountId);
            await createAccountBalance(
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC
            );

            // Create mixed rank referrals that would qualify for TA_CAPTAIN
            const referrals: IUser[] = [];

            // Add 3 high-rank referrals (TA_LIEUTENANT level) - meets the "3 referrals at required rank" rule
            for (let i = 0; i < 3; i++) {
                const userId = `lieutenant-referral-${i}`;
                const accountId = generateObjectId();

                await createUser(userId, 100, 0, ReferralRank.TA_LIEUTENANT);
                await createTradingAccount(userId, accountId);
                await createAccountBalance(accountId, 800); // Good balance for community ATC

                referrals.push({
                    id: userId,
                    referralRank: ReferralRank.TA_LIEUTENANT,
                } as IUser);
            }

            // Add some TA_RECRUIT referrals to reach community size for TA_CAPTAIN (100 total)
            const additionalRecruits =
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communitySize - 3;
            for (let i = 0; i < additionalRecruits; i++) {
                const userId = `recruit-referral-${i}`;
                const accountId = generateObjectId();

                await createUser(userId, 50, 0, ReferralRank.TA_RECRUIT);
                await createTradingAccount(userId, accountId);
                await createAccountBalance(accountId, 55); // Contribute to community ATC

                referrals.push({
                    id: userId,
                    referralRank: ReferralRank.TA_RECRUIT,
                } as IUser);
            }

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId } as IUser,
                referrals,
                isTestReferralTracking: false,
            };

            const sqsEvent = createSQSEvent(
                "rank-determination-msg",
                queueMessage
            );

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain(
                "rank-determination-msg"
            );
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify the user's rank was correctly determined
            const updatedUser = await getUserFromDb(mainUserId);

            // Should be promoted to TA_CAPTAIN based on:
            // - Personal ATC: 500 (meets TA_CAPTAIN requirement)
            // - Community size: 100 (meets TA_CAPTAIN requirement)
            // - Community ATC: 3 * 800 + 97 * 55 = 7,735 (exceeds TA_CAPTAIN requirement of 5,000)
            // - Has 3 TA_LIEUTENANT referrals (meets referral rank requirement)
            expect(updatedUser?.referralRank).toBe(ReferralRank.TA_CAPTAIN);

            // maxRankFromReferrals should be TA_CAPTAIN since we have 3 TA_LIEUTENANT referrals
            expect(updatedUser?.maxRankFromReferrals).toBe(
                ReferralRank.TA_CAPTAIN
            );

            // Personal ATC should match the trading account balance
            expect(updatedUser?.personalATC).toBe(
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC
            );

            // Community ATC should be sum of all referral balances
            const expectedCommunityATC = 3 * 800 + 97 * 55; // 2,400 + 5,335 = 7,735
            expect(updatedUser?.communityATC).toBe(expectedCommunityATC);

            // Verify it meets the minimum requirements for TA_CAPTAIN
            expect(updatedUser?.personalATC).toBeGreaterThanOrEqual(
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC
            );
            expect(updatedUser?.communityATC).toBeGreaterThanOrEqual(
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communityATC
            );

            expect(updatedUser?.isTestReferralTrackingInProgress).toBe(false);
        });

        it("should handle user with maximum possible referral rank (TA_FIELD_MARSHAL)", async () => {
            const mainUserId = "field-marshal-integration-user";
            const mainAccountId = generateObjectId();

            // Balance variables for reuse
            const fieldMarshalReferralBalance = 100000;
            const recruitReferralBalance = 25000;

            // Setup main user with sufficient personal balance for TA_FIELD_MARSHAL
            await createUser(mainUserId, 0, 0, null); // Start with no rank
            await createTradingAccount(mainUserId, mainAccountId);
            await createAccountBalance(
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL].personalATC
            );

            // Create referrals using testCommunitySize for manageable test data
            const referrals: IUser[] = [];
            const testCommunitySize =
                RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL]
                    .testCommunitySize;

            // Add 3 referrals at TA_FIELD_MARSHAL rank (highest possible)
            for (let i = 0; i < 3; i++) {
                const userId = `field-marshal-referral-${i}`;
                const accountId = generateObjectId();

                await createUser(userId, 100, 0, ReferralRank.TA_FIELD_MARSHAL);
                await createTradingAccount(userId, accountId);
                await createAccountBalance(
                    accountId,
                    fieldMarshalReferralBalance
                ); // High balance for community ATC

                referrals.push({
                    id: userId,
                    referralRank: ReferralRank.TA_FIELD_MARSHAL,
                } as IUser);
            }

            // Add remaining referrals as TA_RECRUIT to meet community size requirement
            const additionalRecruits = testCommunitySize - 3;
            for (let i = 0; i < additionalRecruits; i++) {
                const userId = `recruit-referral-${i}`;
                const accountId = generateObjectId();

                await createUser(userId, 50, 0, ReferralRank.TA_RECRUIT);
                await createTradingAccount(userId, accountId);
                await createAccountBalance(accountId, recruitReferralBalance); // Contribute to community ATC

                referrals.push({
                    id: userId,
                    referralRank: ReferralRank.TA_RECRUIT,
                } as IUser);
            }

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId } as IUser,
                referrals,
                isTestReferralTracking: true, // Use testCommunitySize for smaller test data
            };

            const sqsEvent = createSQSEvent(
                "field-marshal-integration-msg",
                queueMessage
            );

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain(
                "field-marshal-integration-msg"
            );
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify the user achieved the highest possible rank
            const updatedUser = await getUserFromDb(mainUserId);

            // Should be promoted to TA_FIELD_MARSHAL (highest rank)
            expect(updatedUser?.referralRank).toBe(
                ReferralRank.TA_FIELD_MARSHAL
            );

            // maxRankFromReferrals should also be TA_FIELD_MARSHAL (tests the integration of the untested branch)
            expect(updatedUser?.maxRankFromReferrals).toBe(
                ReferralRank.TA_FIELD_MARSHAL
            );

            // Personal ATC should match the trading account balance
            expect(updatedUser?.personalATC).toBe(
                RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL].personalATC
            );

            // Community ATC should be sum of all referral balances
            const expectedCommunityATC =
                3 * fieldMarshalReferralBalance +
                additionalRecruits * recruitReferralBalance;
            expect(updatedUser?.communityATC).toBe(expectedCommunityATC);

            // Verify it meets all requirements for TA_FIELD_MARSHAL
            expect(updatedUser?.personalATC).toBeGreaterThanOrEqual(
                RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL].personalATC
            );
            expect(updatedUser?.communityATC).toBeGreaterThanOrEqual(
                RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL].communityATC
            );

            expect(updatedUser?.isTestReferralTrackingInProgress).toBe(false);
        });

        it("should process multiple messages in batch", async () => {
            // Setup multiple users with different scenarios
            const user1Id = "batch-user-1";
            const user1AccountId = generateObjectId();
            const user2Id = "batch-user-2";
            const user2AccountId = generateObjectId();
            const user3Id = "batch-user-3";

            // User 1 - Should succeed (meets TA_RECRUIT requirements)
            await createUser(user1Id, 30, 0, null);
            await createTradingAccount(user1Id, user1AccountId);
            await createAccountBalance(
                user1AccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC
            );

            // User 2 - Should succeed (meets TA_LIEUTENANT requirements)
            await createUser(user2Id, 50, 0, ReferralRank.TA_RECRUIT);
            await createTradingAccount(user2Id, user2AccountId);
            await createAccountBalance(
                user2AccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );

            // User 3 - Should succeed but with zero balance (no trading account)
            await createUser(user3Id, 100, 0, ReferralRank.TA_RECRUIT);
            // Intentionally not creating trading account - will default to zero balance

            // Create referrals for user 2 to meet TA_LIEUTENANT requirements
            const user2Referrals: IUser[] = [];
            for (let i = 0; i < 20; i++) {
                const refUserId = `batch-ref-${i}`;
                const refAccountId = generateObjectId();

                await createUser(refUserId, 50, 0, ReferralRank.TA_RECRUIT);
                await createTradingAccount(refUserId, refAccountId);
                await createAccountBalance(refAccountId, 50);

                user2Referrals.push({
                    id: refUserId,
                    referralRank: ReferralRank.TA_RECRUIT,
                } as IUser);
            }

            // Create batch SQS event with multiple messages (all should succeed)
            const batchSqsEvent: SQSEvent = {
                Records: [
                    {
                        messageId: "batch-msg-1",
                        body: JSON.stringify({
                            user: { id: user1Id } as IUser,
                            referrals: [],
                            isTestReferralTracking: false,
                        }),
                        receiptHandle: "test-receipt-1",
                        attributes: {
                            ApproximateReceiveCount: "1",
                            SentTimestamp: "1234567890000",
                            SenderId: "test-sender",
                            ApproximateFirstReceiveTimestamp: "1234567890000",
                        },
                        messageAttributes: {},
                        md5OfBody: "test-md5-1",
                        eventSource: "aws:sqs",
                        eventSourceARN:
                            "arn:aws:sqs:us-east-1:123456789012:test-queue",
                        awsRegion: "us-east-1",
                    } as SQSRecord,
                    {
                        messageId: "batch-msg-2",
                        body: JSON.stringify({
                            user: { id: user2Id } as IUser,
                            referrals: user2Referrals,
                            isTestReferralTracking: false,
                        }),
                        receiptHandle: "test-receipt-2",
                        attributes: {
                            ApproximateReceiveCount: "1",
                            SentTimestamp: "1234567890000",
                            SenderId: "test-sender",
                            ApproximateFirstReceiveTimestamp: "1234567890000",
                        },
                        messageAttributes: {},
                        md5OfBody: "test-md5-2",
                        eventSource: "aws:sqs",
                        eventSourceARN:
                            "arn:aws:sqs:us-east-1:123456789012:test-queue",
                        awsRegion: "us-east-1",
                    } as SQSRecord,
                    {
                        messageId: "batch-msg-3",
                        body: JSON.stringify({
                            user: { id: user3Id } as IUser,
                            referrals: [],
                            isTestReferralTracking: false,
                        }),
                        receiptHandle: "test-receipt-3",
                        attributes: {
                            ApproximateReceiveCount: "1",
                            SentTimestamp: "1234567890000",
                            SenderId: "test-sender",
                            ApproximateFirstReceiveTimestamp: "1234567890000",
                        },
                        messageAttributes: {},
                        md5OfBody: "test-md5-3",
                        eventSource: "aws:sqs",
                        eventSourceARN:
                            "arn:aws:sqs:us-east-1:123456789012:test-queue",
                        awsRegion: "us-east-1",
                    } as SQSRecord,
                ],
            };

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                batchSqsEvent
            );

            // Verify batch processing results - all should succeed
            expect(result.successMessageIds).toHaveLength(3);
            expect(result.failedMessageIds).toHaveLength(0);
            expect(result.successMessageIds).toContain("batch-msg-1");
            expect(result.successMessageIds).toContain("batch-msg-2");
            expect(result.successMessageIds).toContain("batch-msg-3");

            // Verify users were updated correctly
            const updatedUser1 = await getUserFromDb(user1Id);
            expect(updatedUser1?.referralRank).toBe(ReferralRank.TA_RECRUIT);
            expect(updatedUser1?.isTestReferralTrackingInProgress).toBe(false);

            const updatedUser2 = await getUserFromDb(user2Id);
            expect(updatedUser2?.referralRank).toBe(ReferralRank.TA_LIEUTENANT);
            expect(updatedUser2?.maxRankFromReferrals).toBe(
                ReferralRank.TA_LIEUTENANT
            );
            expect(updatedUser2?.communityATC).toBe(20 * 50); // 20 referrals × 50 balance each
            expect(updatedUser2?.isTestReferralTrackingInProgress).toBe(false);

            // Verify user with no trading account gets zero balance but still processes successfully
            const updatedUser3 = await getUserFromDb(user3Id);
            expect(updatedUser3?.personalATC).toBe(0); // Zero balance due to no trading account
            expect(updatedUser3?.isTestReferralTrackingInProgress).toBe(false);
        });

        it("should use testCommunitySize for rank calculation when isTestReferralTracking is true", async () => {
            const mainUserId = "test-user";
            const mainAccountId = generateObjectId();

            // Setup main user
            await createUser(mainUserId, 50, 0, ReferralRank.TA_RECRUIT);
            await createTradingAccount(mainUserId, mainAccountId);
            await createAccountBalance(
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );

            // Create referrals equal to testCommunitySize
            const testCommunitySize = 3;
            const referrals: IUser[] = [];

            for (let i = 0; i < testCommunitySize; i++) {
                const userId = `test-ref-${i}`;
                const accountId = generateObjectId();

                await createUser(userId, 50, 0, ReferralRank.TA_RECRUIT);
                await createTradingAccount(userId, accountId);
                await createAccountBalance(accountId, 500);

                referrals.push({
                    id: userId,
                    referralRank: ReferralRank.TA_RECRUIT,
                } as IUser);
            }

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId } as IUser,
                referrals,
                isTestReferralTracking: true,
            };

            const sqsEvent = createSQSEvent("test-mode-message", queueMessage);

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("test-mode-message");
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify user rank progression using test community size
            const updatedUser = await getUserFromDb(mainUserId);
            expect(updatedUser?.referralRank).toBe(ReferralRank.TA_LIEUTENANT);
            expect(updatedUser?.communityATC).toBe(testCommunitySize * 500);
        });

        it("should handle database errors gracefully and return failed message IDs", async () => {
            // Close the connections to simulate database error
            await tradingEngineConnection.close().catch(() => {});
            await usersConnection.close().catch(() => {});

            const queueMessage: IReferralQueueMessage = {
                user: { id: "non-existent-user" } as IUser,
                referrals: [],
                isTestReferralTracking: false,
            };

            const sqsEvent = createSQSEvent("error-message", queueMessage);

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // Verify that the processing failed
            expect(result.failedMessageIds).toContain("error-message");
            expect(result.successMessageIds).toHaveLength(0);
        });

        it("should handle mixed success and failure scenarios", async () => {
            // Recreate connections if they were closed in previous test
            if (
                tradingEngineConnection.readyState === 0 ||
                usersConnection.readyState === 0
            ) {
                const uri = mongoServer.getUri();
                tradingEngineConnection = mongoose.createConnection(
                    uri + "trading-engine"
                );
                usersConnection = mongoose.createConnection(uri + "users");
                connections = {
                    [DatabaseType.TRADING_ENGINE]: tradingEngineConnection,
                    [DatabaseType.USERS]: usersConnection,
                };

                // Wait for reconnection
                await new Promise<void>((resolve) => {
                    let connectionsReady = 0;
                    const checkReady = () => {
                        connectionsReady++;
                        if (connectionsReady === 2) resolve();
                    };

                    tradingEngineConnection.on("connected", checkReady);
                    usersConnection.on("connected", checkReady);
                });
            }

            // Setup first user (should succeed)
            const user1Id = "success-user";
            const user1AccountId = generateObjectId();

            await createUser(user1Id, 50, 0, ReferralRank.TA_RECRUIT);
            await createTradingAccount(user1Id, user1AccountId);
            await createAccountBalance(user1AccountId, 100);

            // Setup second user (will fail due to event body format)
            const user2Id = "failure-user";
            await createUser(user2Id, 50, 0, ReferralRank.TA_RECRUIT);

            const mixedSqsEvent: SQSEvent = {
                Records: [
                    {
                        messageId: "success-msg",
                        body: JSON.stringify({
                            user: { id: user1Id },
                            referrals: [],
                            isTestReferralTracking: false,
                        }),
                        receiptHandle: "test-receipt-1",
                        attributes: {
                            ApproximateReceiveCount: "1",
                            SentTimestamp: "1234567890000",
                            SenderId: "test-sender",
                            ApproximateFirstReceiveTimestamp: "1234567890000",
                        },
                        messageAttributes: {},
                        md5OfBody: "test-md5-1",
                        eventSource: "aws:sqs",
                        eventSourceARN:
                            "arn:aws:sqs:us-east-1:123456789012:test-queue",
                        awsRegion: "us-east-1",
                    } as SQSRecord,
                    {
                        messageId: "fail-msg",
                        body: JSON.stringify({
                            entity: { id: user2Id },
                            referrals: [],
                            isTestReferralTracking: false,
                        }),
                        receiptHandle: "test-receipt-2",
                        attributes: {
                            ApproximateReceiveCount: "1",
                            SentTimestamp: "1234567890000",
                            SenderId: "test-sender",
                            ApproximateFirstReceiveTimestamp: "1234567890000",
                        },
                        messageAttributes: {},
                        md5OfBody: "test-md5-2",
                        eventSource: "aws:sqs",
                        eventSourceARN:
                            "arn:aws:sqs:us-east-1:123456789012:test-queue",
                        awsRegion: "us-east-1",
                    } as SQSRecord,
                ],
            };

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                mixedSqsEvent
            );

            // Verify mixed results
            expect(result.successMessageIds).toContain("success-msg");
            expect(result.failedMessageIds).toContain("fail-msg");
            expect(result.successMessageIds).toHaveLength(1);
            expect(result.failedMessageIds).toHaveLength(1);

            // Verify successful user was updated
            const successUser = await getUserFromDb(user1Id);
            expect(successUser?.referralRank).toBe(ReferralRank.TA_RECRUIT);
            expect(successUser?.isTestReferralTrackingInProgress).toBe(false);
        });
    });

    describe("Rank Promotion and Demotion", () => {
        it("should progress user from TA_RECRUIT to TA_LIEUTENANT when requirements are met", async () => {
            const mainUserId = "main-user";
            const mainAccountId = generateObjectId();
            const referralUserIds = ["ref-1", "ref-2", "ref-3"];
            const referralAccountIds = [
                generateObjectId(),
                generateObjectId(),
                generateObjectId(),
            ];

            // Setup main user - initially qualifies for TA_RECRUIT
            await createUser(
                mainUserId,
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC,
                0,
                ReferralRank.TA_RECRUIT,
                ReferralRank.TA_RECRUIT
            );
            await createTradingAccount(mainUserId, mainAccountId);
            await createAccountBalance(
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );

            // Setup referral users with TA_RECRUIT rank
            const referrals: IUser[] = [];
            for (let i = 0; i < referralUserIds.length; i++) {
                const userId = referralUserIds[i];
                const accountId = referralAccountIds[i];

                await createUser(
                    userId,
                    RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC,
                    0,
                    ReferralRank.TA_RECRUIT,
                    ReferralRank.TA_RECRUIT
                );
                await createTradingAccount(userId, accountId);
                await createAccountBalance(
                    accountId,
                    RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC
                );

                referrals.push({
                    id: userId,
                    referralRank: ReferralRank.TA_RECRUIT,
                } as IUser);
            }

            // Add enough community balance to meet TA_LIEUTENANT requirements
            const additionalCommunityUsers = 17; // Need 20 total for TA_LIEUTENANT
            for (let i = 0; i < additionalCommunityUsers; i++) {
                const userId = `community-${i}`;
                const accountId = generateObjectId();

                await createUser(userId, 50, 0, ReferralRank.TA_RECRUIT);
                await createTradingAccount(userId, accountId);
                await createAccountBalance(accountId, 50);

                referrals.push({
                    id: userId,
                    referralRank: ReferralRank.TA_RECRUIT,
                } as IUser);
            }

            // Calculate community balance to meet requirements
            const requiredCommunityBalance =
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communityATC;
            const balancePerReferral = Math.ceil(
                requiredCommunityBalance / referrals.length
            );

            // Update referral balances
            for (let i = 0; i < referrals.length; i++) {
                const accountId =
                    i < 3 ? referralAccountIds[i] : generateObjectId();
                await tradingEngineConnection
                    .collection(
                        TradingEngineServiceDbCollection.userTradingAccountBalanceCollection
                    )
                    .updateOne(
                        {
                            tradingAccountId: new mongoose.Types.ObjectId(
                                accountId
                            ),
                        },
                        { $set: { availableBalance: balancePerReferral } }
                    );
            }

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId } as IUser,
                referrals,
                isTestReferralTracking: false,
            };

            const sqsEvent = createSQSEvent("test-message-1", queueMessage);

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("test-message-1");
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify user rank progression
            const updatedUser = await getUserFromDb(mainUserId);
            expect(updatedUser).toBeTruthy();
            expect(updatedUser?.referralRank).toBe(ReferralRank.TA_LIEUTENANT);
            expect(updatedUser?.maxRankFromReferrals).toBe(
                ReferralRank.TA_LIEUTENANT
            );
            expect(updatedUser?.personalATC).toBe(
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );
            expect(updatedUser?.communityATC).toBeGreaterThanOrEqual(
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communityATC
            );
            expect(updatedUser?.isTestReferralTrackingInProgress).toBe(false);
        });

        it("should progress user from TA_LIEUTENANT to TA_CAPTAIN with higher rank referrals", async () => {
            const mainUserId = "main-user";
            const mainAccountId = generateObjectId();

            // Setup main user - initially TA_LIEUTENANT
            await createUser(
                mainUserId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communityATC,
                ReferralRank.TA_LIEUTENANT,
                ReferralRank.TA_LIEUTENANT
            );
            await createTradingAccount(mainUserId, mainAccountId);
            await createAccountBalance(
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC
            );

            // Create 3 referrals with TA_LIEUTENANT rank
            const highRankReferrals: IUser[] = [];
            for (let i = 0; i < 3; i++) {
                const userId = `lieutenant-ref-${i}`;
                const accountId = generateObjectId();

                await createUser(
                    userId,
                    RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC,
                    0,
                    ReferralRank.TA_LIEUTENANT
                );
                await createTradingAccount(userId, accountId);
                await createAccountBalance(
                    accountId,
                    RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
                );

                highRankReferrals.push({
                    id: userId,
                    referralRank: ReferralRank.TA_LIEUTENANT,
                } as IUser);
            }

            // Add enough lower rank referrals to meet community size requirement
            const additionalReferrals: IUser[] = [];
            const requiredCommunitySize =
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communitySize;
            const additionalNeeded =
                requiredCommunitySize - highRankReferrals.length;

            for (let i = 0; i < additionalNeeded; i++) {
                const userId = `recruit-ref-${i}`;
                const accountId = generateObjectId();

                await createUser(userId, 50, 0, ReferralRank.TA_RECRUIT);
                await createTradingAccount(userId, accountId);
                await createAccountBalance(accountId, 52);

                additionalReferrals.push({
                    id: userId,
                    referralRank: ReferralRank.TA_RECRUIT,
                } as IUser);
            }

            const allReferrals = [...highRankReferrals, ...additionalReferrals];

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId } as IUser,
                referrals: allReferrals,
                isTestReferralTracking: false,
            };

            const sqsEvent = createSQSEvent(
                "test-message-captain",
                queueMessage
            );

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("test-message-captain");
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify user rank progression
            const updatedUser = await getUserFromDb(mainUserId);
            expect(updatedUser?.referralRank).toBe(ReferralRank.TA_CAPTAIN);
            expect(updatedUser?.maxRankFromReferrals).toBe(
                ReferralRank.TA_CAPTAIN
            );
        });

        it("should demote user from TA_LIEUTENANT to TA_RECRUIT when losing referrals", async () => {
            const mainUserId = "main-user";
            const mainAccountId = generateObjectId();

            // Setup main user
            await createUser(
                mainUserId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communityATC,
                ReferralRank.TA_LIEUTENANT,
                ReferralRank.TA_LIEUTENANT
            );
            await createTradingAccount(mainUserId, mainAccountId);
            await createAccountBalance(
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );

            // Create only 1 referral (insufficient for TA_LIEUTENANT)
            const referrals: IUser[] = [
                {
                    id: "lonely-referral",
                    referralRank: ReferralRank.TA_RECRUIT,
                } as IUser,
            ];

            // Setup the lonely referral
            const lonelyAccountId = generateObjectId();
            await createUser("lonely-referral", 50, 0, ReferralRank.TA_RECRUIT);
            await createTradingAccount("lonely-referral", lonelyAccountId);
            await createAccountBalance(lonelyAccountId, 50);

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId } as IUser,
                referrals,
                isTestReferralTracking: false,
            };

            const sqsEvent = createSQSEvent("test-demotion-1", queueMessage);

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("test-demotion-1");
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify user rank demotion
            const updatedUser = await getUserFromDb(mainUserId);
            expect(updatedUser?.referralRank).toBe(ReferralRank.TA_RECRUIT);
            expect(updatedUser?.maxRankFromReferrals).toBe(
                ReferralRank.TA_RECRUIT
            );
            expect(updatedUser?.communityATC).toBe(50);
        });

        it("should demote user from TA_CAPTAIN to null when personal balance drops below minimum", async () => {
            const mainUserId = "main-user";
            const mainAccountId = generateObjectId();

            // Setup main user
            await createUser(
                mainUserId,
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC,
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communityATC,
                ReferralRank.TA_CAPTAIN,
                ReferralRank.TA_CAPTAIN
            );
            await createTradingAccount(mainUserId, mainAccountId);
            await createAccountBalance(mainAccountId, 25); // Below minimum

            // Create referrals that would normally support TA_CAPTAIN
            const referrals: IUser[] = [];
            for (let i = 0; i < 3; i++) {
                const userId = `captain-ref-${i}`;
                const accountId = generateObjectId();

                await createUser(userId, 100, 0, ReferralRank.TA_LIEUTENANT);
                await createTradingAccount(userId, accountId);
                await createAccountBalance(accountId, 2000);

                referrals.push({
                    id: userId,
                    referralRank: ReferralRank.TA_LIEUTENANT,
                } as IUser);
            }

            // Add more referrals for community size
            for (let i = 0; i < 97; i++) {
                const userId = `extra-ref-${i}`;
                const accountId = generateObjectId();

                await createUser(userId, 50, 0, ReferralRank.TA_RECRUIT);
                await createTradingAccount(userId, accountId);
                await createAccountBalance(accountId, 100);

                referrals.push({
                    id: userId,
                    referralRank: ReferralRank.TA_RECRUIT,
                } as IUser);
            }

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId } as IUser,
                referrals,
                isTestReferralTracking: false,
            };

            const sqsEvent = createSQSEvent(
                "test-demotion-balance",
                queueMessage
            );

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("test-demotion-balance");
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify complete demotion due to insufficient personal balance
            const updatedUser = await getUserFromDb(mainUserId);
            expect(updatedUser?.referralRank).toBeNull();
            expect(updatedUser?.personalATC).toBe(25);
        });
    });
});
