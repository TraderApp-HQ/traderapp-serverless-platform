import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { ReferralRank, RANK_REQUIREMENTS } from "src/config/constants";
import {
    DatabaseConnections,
    DatabaseType,
    IReferralQueueMessage,
    IUser,
} from "src/config/interfaces";
import ReferralsService from "./index";
import {
    createAccountBalance,
    createReferralsWithRankAndBalance,
    createSQSEvent,
    createTradingAccount,
    createUser,
    generateObjectId,
    getUserFromDb,
    setUpUserWithBalance,
    updateUserBalance,
} from "./integration.test.helpers";
import { publishMessageToQueue } from "src/clients/SQSClient/helpers";
import { getSecrets } from "src/config/secrets/helpers";

jest.mock("src/config/secrets/helpers", () => ({
    ...jest.requireActual("src/config/secrets/helpers"),
    getSecrets: jest.fn(),
}));

jest.mock("src/clients/SQSClient/helpers", () => ({
    ...jest.requireActual("src/clients/SQSClient/helpers"),
    publishMessageToQueue: jest.fn(),
}));

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

        // Mock getSecrets to always return a fake queue URL
        (getSecrets as jest.Mock).mockResolvedValue({
            TRACK_USER_ONBOARDING_CHECKLIST_QUEUE: "https://fake-queue-url",
        });

        // Mock publishMessageToQueue to just resolve (do nothing)
        (publishMessageToQueue as jest.Mock).mockResolvedValue(undefined);
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

    describe("Core Functionality", () => {
        it("should correctly determine rank for a user", async () => {
            const mainUserId = "rank-determination-user";
            const mainAccountId = generateObjectId();

            // Setup main user with sufficient personal balance for TA_CAPTAIN
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC
            );

            // Create mixed rank referrals that would qualify for TA_CAPTAIN
            // Add 3 high-rank referrals (TA_LIEUTENANT level) - meets the "3 referrals at required rank" rule
            const lieutenantReferralsreferrals: IUser[] =
                await createReferralsWithRankAndBalance(
                    "lieut-ref-",
                    800,
                    2,
                    usersConnection,
                    tradingEngineConnection,
                    ReferralRank.TA_LIEUTENANT
                );

            const captainReferrals: IUser[] =
                await createReferralsWithRankAndBalance(
                    "captain-ref-",
                    400,
                    2,
                    usersConnection,
                    tradingEngineConnection,
                    ReferralRank.TA_CAPTAIN
                );

            // Add some TA_RECRUIT referrals to reach community size for TA_CAPTAIN (100 total)
            const additionalRecruits =
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communitySize - 3;

            const recruitReferrals = await createReferralsWithRankAndBalance(
                "recruit-ref-",
                55,
                additionalRecruits,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_RECRUIT
            );

            const referrals: IUser[] = [
                ...lieutenantReferralsreferrals,
                ...captainReferrals,
                ...recruitReferrals,
            ];

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
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
            const updatedUser = await getUserFromDb(
                usersConnection,
                mainUserId
            );

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
            const expectedCommunityATC = 2 * 800 + 2 * 400 + 97 * 55; // 2,400 + 5,335 = 7,735
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
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL].personalATC
            );

            // Create referrals using testCommunitySize for manageable test data
            const testCommunitySize =
                RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL]
                    .testCommunitySize;

            // Add 3 referrals at TA_FIELD_MARSHAL rank (highest possible)
            const referrals: IUser[] = await createReferralsWithRankAndBalance(
                "recruit-ref-",
                fieldMarshalReferralBalance,
                3,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_FIELD_MARSHAL
            );

            // Add remaining referrals as TA_RECRUIT to meet community size requirement
            const additionalRecruits = testCommunitySize - 3;
            for (let i = 0; i < additionalRecruits; i++) {
                const userId = `recruit-referral-${i}`;
                const accountId = generateObjectId();

                await setUpUserWithBalance(
                    usersConnection,
                    tradingEngineConnection,
                    userId,
                    accountId,
                    recruitReferralBalance
                ); // Contribute to community ATC

                referrals.push({
                    id: userId,
                    referralRank: ReferralRank.TA_RECRUIT,
                } as IUser);
            }

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
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
            const updatedUser = await getUserFromDb(
                usersConnection,
                mainUserId
            );

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
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                user1Id,
                user1AccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC
            );

            // User 2 - Should succeed (meets TA_LIEUTENANT requirements)
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                user2Id,
                user2AccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );

            // User 3 - Should succeed but with zero balance (no trading account)
            await createUser(usersConnection, user3Id);
            // Intentionally not creating trading account - will default to zero balance

            // Create referrals for user 2 to meet TA_LIEUTENANT requirements
            const user2Referrals: IUser[] =
                await createReferralsWithRankAndBalance(
                    "batch-ref-",
                    50,
                    20,
                    usersConnection,
                    tradingEngineConnection,
                    ReferralRank.TA_RECRUIT
                );

            // Create batch SQS event using the helper function
            const batchSqsEvent = createSQSEvent(
                ["batch-msg-1", "batch-msg-2", "batch-msg-3"],
                [
                    {
                        user: { id: user1Id, isFirstDepositMade: true } as IUser,
                        referrals: [],
                        isTestReferralTracking: false,
                    },
                    {
                        user: { id: user2Id, isFirstDepositMade: true } as IUser,
                        referrals: user2Referrals,
                        isTestReferralTracking: false,
                    },
                    {
                        user: { id: user3Id, isFirstDepositMade: true } as IUser,
                        referrals: [],
                        isTestReferralTracking: false,
                    },
                ]
            );

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
            const updatedUser1 = await getUserFromDb(usersConnection, user1Id);
            expect(updatedUser1?.referralRank).toBe(ReferralRank.TA_RECRUIT);
            expect(updatedUser1?.isTestReferralTrackingInProgress).toBe(false);

            const updatedUser2 = await getUserFromDb(usersConnection, user2Id);
            expect(updatedUser2?.referralRank).toBe(ReferralRank.TA_LIEUTENANT);
            expect(updatedUser2?.maxRankFromReferrals).toBe(
                ReferralRank.TA_LIEUTENANT
            );
            expect(updatedUser2?.communityATC).toBe(20 * 50); // 20 referrals × 50 balance each
            expect(updatedUser2?.isTestReferralTrackingInProgress).toBe(false);

            // Verify user with no trading account gets zero balance but still processes successfully
            const updatedUser3 = await getUserFromDb(usersConnection, user3Id);
            expect(updatedUser3?.personalATC).toBe(0); // Zero balance due to no trading account
            expect(updatedUser3?.isTestReferralTrackingInProgress).toBe(false);
        });

        it("should use testCommunitySize for rank calculation when isTestReferralTracking is true", async () => {
            const mainUserId = "test-user";
            const mainAccountId = generateObjectId();

            // Setup main user
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );

            // Create referrals equal to testCommunitySize
            const testCommunitySize =
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communitySize;
            const referrals: IUser[] = await createReferralsWithRankAndBalance(
                "test-ref-",
                500,
                testCommunitySize,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_RECRUIT
            );

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
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
            const updatedUser = await getUserFromDb(
                usersConnection,
                mainUserId
            );
            expect(updatedUser?.referralRank).toBe(ReferralRank.TA_LIEUTENANT);
            expect(updatedUser?.communityATC).toBe(testCommunitySize * 500);
        });

        it("should handle database errors gracefully and return failed message IDs", async () => {
            // Close the connections to simulate database error
            await tradingEngineConnection.close().catch(() => { });
            await usersConnection.close().catch(() => { });

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

            await createUser(
                usersConnection,
                user1Id,
                50,
                0,
                ReferralRank.TA_RECRUIT
            );
            await createTradingAccount(
                tradingEngineConnection,
                user1Id,
                user1AccountId
            );
            await createAccountBalance(
                tradingEngineConnection,
                user1AccountId,
                100
            );

            // Setup second user (will fail due to event body format)
            const user2Id = "failure-user";
            await createUser(
                usersConnection,
                user2Id,
                50,
                0,
                ReferralRank.TA_RECRUIT
            );

            // Create mixed SQS event using the helper function
            const mixedSqsEvent = createSQSEvent(
                ["success-msg", "fail-msg"],
                [
                    {
                        user: { id: user1Id, isFirstDepositMade: true } as IUser,
                        referrals: [],
                        isTestReferralTracking: false,
                    } as IReferralQueueMessage,
                    {
                        entity: { id: user2Id }, // Wrong property name to trigger failure
                        referrals: [],
                        isTestReferralTracking: false,
                    } as unknown as IReferralQueueMessage,
                ]
            );

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
            const successUser = await getUserFromDb(usersConnection, user1Id);
            expect(successUser?.referralRank).toBe(ReferralRank.TA_RECRUIT);
            expect(successUser?.isTestReferralTrackingInProgress).toBe(false);
        });
    });

    describe("Rank Promotion and Demotion", () => {
        it("should progress user from TA_RECRUIT to TA_LIEUTENANT when requirements are met", async () => {
            const mainUserId = "main-user";
            const mainAccountId = generateObjectId();
            const requiredCommunitySize =
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communitySize;

            // Setup main user - initially qualifies for TA_RECRUIT
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );

            const initialQueueMessage: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
                referrals: [],
                isTestReferralTracking: false,
            };

            const initialSqsEvent = createSQSEvent(
                "test-message-1",
                initialQueueMessage
            );

            // Execute the method
            await ReferralsService.processUserReferralTracking(
                connections,
                initialSqsEvent
            );

            const recruitUser = await getUserFromDb(
                usersConnection,
                mainUserId
            );
            expect(recruitUser).toBeTruthy();
            expect(recruitUser?.referralRank).toBe(ReferralRank.TA_RECRUIT);

            const requiredCommunityBalance =
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communityATC;
            const balancePerReferral = Math.ceil(
                requiredCommunityBalance / requiredCommunitySize
            );

            // Setup referral users with TA_RECRUIT rank
            const referrals: IUser[] = await createReferralsWithRankAndBalance(
                "ref-",
                balancePerReferral,
                requiredCommunitySize,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_RECRUIT
            );

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
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
            const updatedUser = await getUserFromDb(
                usersConnection,
                mainUserId
            );
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

            // Setup main user - initially TA_LIEUTENANTS
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC
            );

            // Create 2 referrals with TA_LIEUTENANT rank
            const highRankReferrals = await createReferralsWithRankAndBalance(
                "lieutenant-ref-",
                50,
                2,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_LIEUTENANT
            );

            // Add enough lower rank referrals to meet community size requirement
            const additionalNeeded =
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communitySize -
                highRankReferrals.length;

            const additionalReferrals = await createReferralsWithRankAndBalance(
                "recruit-ref-",
                52,
                additionalNeeded,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_RECRUIT
            );

            const allReferrals = [...highRankReferrals, ...additionalReferrals];

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
                referrals: allReferrals,
                isTestReferralTracking: false,
            };

            const sqsEvent = createSQSEvent(
                "test-message-captain",
                queueMessage
            );

            // Execute the method
            await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            const user = await getUserFromDb(usersConnection, mainUserId);
            expect(user?.referralRank).toBe(ReferralRank.TA_LIEUTENANT);

            // Add one more referral equal to or higher than TA_LIEUTENANT to qualify for TA_CAPTAIN
            const fieldMarshalReferral = {
                id: "field-marshal-id",
                referralRank: ReferralRank.TA_FIELD_MARSHAL,
            } as IUser;
            allReferrals.push(fieldMarshalReferral);

            const queueMessage2: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
                referrals: allReferrals,
                isTestReferralTracking: false,
            };

            const sqsEvent2 = createSQSEvent(
                "test-message-captain",
                queueMessage2
            );

            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent2
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("test-message-captain");
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify user rank progression
            const updatedUser = await getUserFromDb(
                usersConnection,
                mainUserId
            );
            expect(updatedUser?.referralRank).toBe(ReferralRank.TA_CAPTAIN);
            expect(updatedUser?.maxRankFromReferrals).toBe(
                ReferralRank.TA_CAPTAIN
            );
        });

        it("should demote user from TA_LIEUTENANT to TA_RECRUIT when losing referrals", async () => {
            const mainUserId = "main-user";
            const mainAccountId = generateObjectId();

            // Setup main user
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );

            const referrals = await createReferralsWithRankAndBalance(
                "ref-",
                1000,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communitySize,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_RECRUIT
            );

            const initialQueueMessage: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
                referrals,
                isTestReferralTracking: false,
            };

            const initialSqsEvent = createSQSEvent(
                "test-demotion-1",
                initialQueueMessage
            );

            // Execute the method
            await ReferralsService.processUserReferralTracking(
                connections,
                initialSqsEvent
            );

            const lieutenantUser = await getUserFromDb(
                usersConnection,
                mainUserId
            );

            expect(lieutenantUser).toBeTruthy();
            expect(lieutenantUser?.referralRank).toBe(
                ReferralRank.TA_LIEUTENANT
            );

            // Lose one referral
            referrals.pop();

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
                referrals,
                isTestReferralTracking: false,
            };

            const sqsEvent = createSQSEvent("test-demotion-1", queueMessage);

            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // // Verify successful processing
            expect(result.successMessageIds).toContain("test-demotion-1");
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify user rank demotion
            const updatedUser = await getUserFromDb(
                usersConnection,
                mainUserId
            );
            expect(updatedUser?.referralRank).toBe(ReferralRank.TA_RECRUIT);
            expect(updatedUser?.maxRankFromReferrals).toBe(
                ReferralRank.TA_LIEUTENANT
            );
            expect(updatedUser?.communityATC).toBe(1000 * 19);
        });

        it("should demote user from TA_CAPTAIN to null when personal balance drops below minimum", async () => {
            const mainUserId = "main-user";
            const mainAccountId = generateObjectId();

            // Setup main user
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC // Below minimum
            );

            // Create referrals that would normally support TA_CAPTAIN
            const lieutenantReferrals = await createReferralsWithRankAndBalance(
                "lieut-ref-",
                2000,
                3,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_LIEUTENANT
            );

            // Add more referrals for community size
            const moreReferrals = await createReferralsWithRankAndBalance(
                "more-ref-",
                100,
                97,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_RECRUIT
            );

            const referrals = [...lieutenantReferrals, ...moreReferrals];

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
                referrals,
                isTestReferralTracking: false,
            };

            const sqsEvent = createSQSEvent(
                "test-demotion-balance",
                queueMessage
            );

            // Execute the method
            await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            const captainUser = await getUserFromDb(
                usersConnection,
                mainUserId
            );
            expect(captainUser?.referralRank).toBe(ReferralRank.TA_CAPTAIN);

            // Reduce user balance
            const reducedBalance =
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC - 470;

            await updateUserBalance(
                mainAccountId,
                tradingEngineConnection,
                reducedBalance
            );

            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("test-demotion-balance");
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify complete demotion due to insufficient personal balance
            const updatedUser = await getUserFromDb(
                usersConnection,
                mainUserId
            );
            expect(updatedUser?.referralRank).toBeNull();
            expect(updatedUser?.personalATC).toBe(30);
        });
    });

    describe("First Deposit Made Requirement", () => {
        it("should return null rank when user has not made first deposit but meets all other TA_RECRUIT criteria", async () => {
            const mainUserId = "no-first-deposit-recruit";
            const mainAccountId = generateObjectId();

            // Setup main user with sufficient balance for TA_RECRUIT
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC
            );

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: false } as IUser,
                referrals: [],
                isTestReferralTracking: false,
            };

            const sqsEvent = createSQSEvent("no-deposit-recruit", queueMessage);

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("no-deposit-recruit");
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify user gets null rank despite meeting balance requirement
            const updatedUser = await getUserFromDb(usersConnection, mainUserId);
            expect(updatedUser?.referralRank).toBeNull();
            expect(updatedUser?.personalATC).toBe(
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC
            );
            expect(updatedUser?.maxRankFromReferrals).toBe(ReferralRank.TA_RECRUIT);
        });

        it("should return null rank when user has not made first deposit but meets all other TA_LIEUTENANT criteria", async () => {
            const mainUserId = "no-first-deposit-lieutenant";
            const mainAccountId = generateObjectId();

            // Setup main user with sufficient balance for TA_LIEUTENANT
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );

            // Create referrals that would qualify for TA_LIEUTENANT
            const referrals: IUser[] = await createReferralsWithRankAndBalance(
                "lieutenant-ref-",
                100,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communitySize,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_RECRUIT
            );

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: false } as IUser,
                referrals,
                isTestReferralTracking: false,
            };

            const sqsEvent = createSQSEvent("no-deposit-lieutenant", queueMessage);

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("no-deposit-lieutenant");
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify user gets null rank despite meeting all other criteria
            const updatedUser = await getUserFromDb(usersConnection, mainUserId);
            expect(updatedUser?.referralRank).toBeNull();
            expect(updatedUser?.personalATC).toBe(
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );
            expect(updatedUser?.communityATC).toBeGreaterThanOrEqual(
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communityATC
            );
            expect(updatedUser?.maxRankFromReferrals).toBe(ReferralRank.TA_LIEUTENANT);
        });

        it("should return null rank when user has not made first deposit but meets all other TA_CAPTAIN criteria", async () => {
            const mainUserId = "no-first-deposit-captain";
            const mainAccountId = generateObjectId();

            // Setup main user with sufficient balance for TA_CAPTAIN
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC
            );

            // Create high-rank referrals that would qualify for TA_CAPTAIN
            const highRankReferrals = await createReferralsWithRankAndBalance(
                "captain-high-ref-",
                1000,
                3,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_LIEUTENANT
            );

            // Add enough lower rank referrals to meet community size requirement
            const additionalNeeded =
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communitySize -
                highRankReferrals.length;

            const additionalReferrals = await createReferralsWithRankAndBalance(
                "captain-low-ref-",
                100,
                additionalNeeded,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_RECRUIT
            );

            const allReferrals = [...highRankReferrals, ...additionalReferrals];

            const queueMessage: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: false } as IUser,
                referrals: allReferrals,
                isTestReferralTracking: false,
            };

            const sqsEvent = createSQSEvent("no-deposit-captain", queueMessage);

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("no-deposit-captain");
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify user gets null rank despite meeting all other criteria
            const updatedUser = await getUserFromDb(usersConnection, mainUserId);
            expect(updatedUser?.referralRank).toBeNull();
            expect(updatedUser?.personalATC).toBe(
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC
            );
            expect(updatedUser?.communityATC).toBeGreaterThanOrEqual(
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communityATC
            );
            expect(updatedUser?.maxRankFromReferrals).toBe(ReferralRank.TA_CAPTAIN);
        });

        it("should transition from null rank to TA_RECRUIT when user makes first deposit", async () => {
            const mainUserId = "first-deposit-transition";
            const mainAccountId = generateObjectId();

            // Setup main user with sufficient balance for TA_RECRUIT
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC
            );

            // First processing: no first deposit
            const queueMessage1: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: false } as IUser,
                referrals: [],
                isTestReferralTracking: false,
            };

            const sqsEvent1 = createSQSEvent("before-deposit", queueMessage1);

            await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent1
            );

            // Verify user has null rank
            const userBeforeDeposit = await getUserFromDb(usersConnection, mainUserId);
            expect(userBeforeDeposit?.referralRank).toBeNull();

            // Second processing: after first deposit
            const queueMessage2: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
                referrals: [],
                isTestReferralTracking: false,
            };

            const sqsEvent2 = createSQSEvent("after-deposit", queueMessage2);

            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent2
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("after-deposit");
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify user now gets TA_RECRUIT rank
            const userAfterDeposit = await getUserFromDb(usersConnection, mainUserId);
            expect(userAfterDeposit?.referralRank).toBe(ReferralRank.TA_RECRUIT);
            expect(userAfterDeposit?.personalATC).toBe(
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC
            );
        });

        it("should handle mixed batch where some users have made first deposit and others haven't", async () => {
            // Setup multiple users
            const user1Id = "batch-deposit-made";
            const user1AccountId = generateObjectId();
            const user2Id = "batch-no-deposit";
            const user2AccountId = generateObjectId();
            const user3Id = "batch-deposit-made-high-rank";
            const user3AccountId = generateObjectId();

            // User 1 - Made deposit, meets TA_RECRUIT
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                user1Id,
                user1AccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC
            );

            // User 2 - No deposit, would meet TA_RECRUIT if had deposit
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                user2Id,
                user2AccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC
            );

            // User 3 - Made deposit, meets TA_LIEUTENANT
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                user3Id,
                user3AccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );

            // Create referrals for user 3
            const user3Referrals: IUser[] = await createReferralsWithRankAndBalance(
                "batch-deposit-ref-",
                100,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communitySize,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_RECRUIT
            );

            const batchSqsEvent = createSQSEvent(
                ["deposit-made", "no-deposit", "deposit-made-high"],
                [
                    {
                        user: { id: user1Id, isFirstDepositMade: true } as IUser,
                        referrals: [],
                        isTestReferralTracking: false,
                    },
                    {
                        user: { id: user2Id, isFirstDepositMade: false } as IUser,
                        referrals: [],
                        isTestReferralTracking: false,
                    },
                    {
                        user: { id: user3Id, isFirstDepositMade: true } as IUser,
                        referrals: user3Referrals,
                        isTestReferralTracking: false,
                    },
                ]
            );

            // Execute the method
            const result = await ReferralsService.processUserReferralTracking(
                connections,
                batchSqsEvent
            );

            // Verify all processed successfully
            expect(result.successMessageIds).toHaveLength(3);
            expect(result.failedMessageIds).toHaveLength(0);

            // Verify results
            const updatedUser1 = await getUserFromDb(usersConnection, user1Id);
            expect(updatedUser1?.referralRank).toBe(ReferralRank.TA_RECRUIT);

            const updatedUser2 = await getUserFromDb(usersConnection, user2Id);
            expect(updatedUser2?.referralRank).toBeNull(); // No deposit

            const updatedUser3 = await getUserFromDb(usersConnection, user3Id);
            expect(updatedUser3?.referralRank).toBe(ReferralRank.TA_LIEUTENANT);
        });

        it("should handle rank demotion while maintaining first deposit requirement", async () => {
            const mainUserId = "demotion-with-deposit";
            const mainAccountId = generateObjectId();

            // Setup user who initially qualifies for TA_LIEUTENANT
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );

            const referrals = await createReferralsWithRankAndBalance(
                "demotion-ref-",
                100,
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communitySize,
                usersConnection,
                tradingEngineConnection,
                ReferralRank.TA_RECRUIT
            );

            // First: Achieve TA_LIEUTENANT with first deposit made
            const queueMessage1: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
                referrals,
                isTestReferralTracking: false,
            };

            const sqsEvent1 = createSQSEvent("achieve-lieutenant", queueMessage1);

            await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent1
            );

            const lieutenantUser = await getUserFromDb(usersConnection, mainUserId);
            expect(lieutenantUser?.referralRank).toBe(ReferralRank.TA_LIEUTENANT);

            // Second: Lose referrals but maintain first deposit status
            referrals.splice(0, 5); // Remove 5 referrals to cause demotion

            const queueMessage2: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
                referrals,
                isTestReferralTracking: false,
            };

            const sqsEvent2 = createSQSEvent("demote-to-recruit", queueMessage2);

            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent2
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("demote-to-recruit");
            expect(result.failedMessageIds).toHaveLength(0);

            // Should demote to TA_RECRUIT (not null) since first deposit is maintained
            const demotedUser = await getUserFromDb(usersConnection, mainUserId);
            expect(demotedUser?.referralRank).toBe(ReferralRank.TA_RECRUIT);
            expect(demotedUser?.personalATC).toBe(
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC
            );
        });

        it("should handle edge case where user loses first deposit status", async () => {
            const mainUserId = "lose-deposit-status";
            const mainAccountId = generateObjectId();

            // Setup user with sufficient balance for TA_RECRUIT
            await setUpUserWithBalance(
                usersConnection,
                tradingEngineConnection,
                mainUserId,
                mainAccountId,
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC
            );

            // First: User has made first deposit and gets TA_RECRUIT
            const queueMessage1: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: true } as IUser,
                referrals: [],
                isTestReferralTracking: false,
            };

            const sqsEvent1 = createSQSEvent("with-deposit", queueMessage1);

            await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent1
            );

            const userWithRank = await getUserFromDb(usersConnection, mainUserId);
            expect(userWithRank?.referralRank).toBe(ReferralRank.TA_RECRUIT);

            // Second: User somehow loses first deposit status (edge case)
            const queueMessage2: IReferralQueueMessage = {
                user: { id: mainUserId, isFirstDepositMade: false } as IUser,
                referrals: [],
                isTestReferralTracking: false,
            };

            const sqsEvent2 = createSQSEvent("without-deposit", queueMessage2);

            const result = await ReferralsService.processUserReferralTracking(
                connections,
                sqsEvent2
            );

            // Verify successful processing
            expect(result.successMessageIds).toContain("without-deposit");
            expect(result.failedMessageIds).toHaveLength(0);

            // Should lose rank and become null
            const userWithoutRank = await getUserFromDb(usersConnection, mainUserId);
            expect(userWithoutRank?.referralRank).toBeNull();
            expect(userWithoutRank?.personalATC).toBe(
                RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC
            );
        });
    });
});
