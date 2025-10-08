"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("src/config/constants");
const interfaces_1 = require("src/config/interfaces");
const index_1 = __importDefault(require("./index"));
const integration_test_helpers_1 = require("./integration.test.helpers");
const helpers_1 = require("src/clients/SQSClient/helpers");
const helpers_2 = require("src/config/secrets/helpers");
jest.mock("src/config/secrets/helpers", () => ({
    ...jest.requireActual("src/config/secrets/helpers"),
    getSecrets: jest.fn(),
}));
jest.mock("src/clients/SQSClient/helpers", () => ({
    ...jest.requireActual("src/clients/SQSClient/helpers"),
    publishMessageToQueue: jest.fn(),
}));
describe("ReferralsService Integration Tests", () => {
    let mongoServer;
    let tradingEngineConnection;
    let usersConnection;
    let connections;
    beforeAll(async () => {
        mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        // Create separate connections for trading engine and users databases
        tradingEngineConnection = mongoose_1.default.createConnection(uri + "trading-engine");
        usersConnection = mongoose_1.default.createConnection(uri + "users");
        connections = {
            [interfaces_1.DatabaseType.TRADING_ENGINE]: tradingEngineConnection,
            [interfaces_1.DatabaseType.USERS]: usersConnection,
        };
        // Wait for connections to be ready
        await new Promise((resolve) => {
            let connectionsReady = 0;
            const checkReady = () => {
                connectionsReady++;
                if (connectionsReady === 2)
                    resolve();
            };
            tradingEngineConnection.on("connected", checkReady);
            usersConnection.on("connected", checkReady);
        });
        // Mock getSecrets to always return a fake queue URL
        helpers_2.getSecrets.mockResolvedValue({
            TRACK_USER_ONBOARDING_CHECKLIST_QUEUE: "https://fake-queue-url",
        });
        // Mock publishMessageToQueue to just resolve (do nothing)
        helpers_1.publishMessageToQueue.mockResolvedValue(undefined);
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
            const mainAccountId = (0, integration_test_helpers_1.generateObjectId)();
            // Setup main user with sufficient personal balance for TA_CAPTAIN
            await (0, integration_test_helpers_1.setUpUserWithBalance)(usersConnection, tradingEngineConnection, mainUserId, mainAccountId, constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].personalATC);
            // Create mixed rank referrals that would qualify for TA_CAPTAIN
            // Add 3 high-rank referrals (TA_LIEUTENANT level) - meets the "3 referrals at required rank" rule
            const lieutenantReferralsreferrals = await (0, integration_test_helpers_1.createReferralsWithRankAndBalance)("lieut-ref-", 800, 2, usersConnection, tradingEngineConnection, constants_1.ReferralRank.TA_LIEUTENANT);
            const captainReferrals = await (0, integration_test_helpers_1.createReferralsWithRankAndBalance)("captain-ref-", 400, 2, usersConnection, tradingEngineConnection, constants_1.ReferralRank.TA_CAPTAIN);
            // Add some TA_RECRUIT referrals to reach community size for TA_CAPTAIN (100 total)
            const additionalRecruits = constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].communitySize - 3;
            const recruitReferrals = await (0, integration_test_helpers_1.createReferralsWithRankAndBalance)("recruit-ref-", 55, additionalRecruits, usersConnection, tradingEngineConnection, constants_1.ReferralRank.TA_RECRUIT);
            const referrals = [
                ...lieutenantReferralsreferrals,
                ...captainReferrals,
                ...recruitReferrals,
            ];
            const queueMessage = {
                user: { id: mainUserId },
                referrals,
                isTestReferralTracking: false,
            };
            const sqsEvent = (0, integration_test_helpers_1.createSQSEvent)("rank-determination-msg", queueMessage);
            // Execute the method
            const result = await index_1.default.processUserReferralTracking(connections, sqsEvent);
            // Verify successful processing
            expect(result.successMessageIds).toContain("rank-determination-msg");
            expect(result.failedMessageIds).toHaveLength(0);
            // Verify the user's rank was correctly determined
            const updatedUser = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, mainUserId);
            // Should be promoted to TA_CAPTAIN based on:
            // - Personal ATC: 500 (meets TA_CAPTAIN requirement)
            // - Community size: 100 (meets TA_CAPTAIN requirement)
            // - Community ATC: 3 * 800 + 97 * 55 = 7,735 (exceeds TA_CAPTAIN requirement of 5,000)
            // - Has 3 TA_LIEUTENANT referrals (meets referral rank requirement)
            expect(updatedUser?.referralRank).toBe(constants_1.ReferralRank.TA_CAPTAIN);
            // maxRankFromReferrals should be TA_CAPTAIN since we have 3 TA_LIEUTENANT referrals
            expect(updatedUser?.maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_CAPTAIN);
            // Personal ATC should match the trading account balance
            expect(updatedUser?.personalATC).toBe(constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].personalATC);
            // Community ATC should be sum of all referral balances
            const expectedCommunityATC = 2 * 800 + 2 * 400 + 97 * 55; // 2,400 + 5,335 = 7,735
            expect(updatedUser?.communityATC).toBe(expectedCommunityATC);
            // Verify it meets the minimum requirements for TA_CAPTAIN
            expect(updatedUser?.personalATC).toBeGreaterThanOrEqual(constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].personalATC);
            expect(updatedUser?.communityATC).toBeGreaterThanOrEqual(constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].communityATC);
            expect(updatedUser?.isTestReferralTrackingInProgress).toBe(false);
        });
        it("should handle user with maximum possible referral rank (TA_FIELD_MARSHAL)", async () => {
            const mainUserId = "field-marshal-integration-user";
            const mainAccountId = (0, integration_test_helpers_1.generateObjectId)();
            // Balance variables for reuse
            const fieldMarshalReferralBalance = 100000;
            const recruitReferralBalance = 25000;
            // Setup main user with sufficient personal balance for TA_FIELD_MARSHAL
            await (0, integration_test_helpers_1.setUpUserWithBalance)(usersConnection, tradingEngineConnection, mainUserId, mainAccountId, constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_FIELD_MARSHAL].personalATC);
            // Create referrals using testCommunitySize for manageable test data
            const testCommunitySize = constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_FIELD_MARSHAL]
                .testCommunitySize;
            // Add 3 referrals at TA_FIELD_MARSHAL rank (highest possible)
            const referrals = await (0, integration_test_helpers_1.createReferralsWithRankAndBalance)("recruit-ref-", fieldMarshalReferralBalance, 3, usersConnection, tradingEngineConnection, constants_1.ReferralRank.TA_FIELD_MARSHAL);
            // Add remaining referrals as TA_RECRUIT to meet community size requirement
            const additionalRecruits = testCommunitySize - 3;
            for (let i = 0; i < additionalRecruits; i++) {
                const userId = `recruit-referral-${i}`;
                const accountId = (0, integration_test_helpers_1.generateObjectId)();
                await (0, integration_test_helpers_1.setUpUserWithBalance)(usersConnection, tradingEngineConnection, userId, accountId, recruitReferralBalance); // Contribute to community ATC
                referrals.push({
                    id: userId,
                    referralRank: constants_1.ReferralRank.TA_RECRUIT,
                });
            }
            const queueMessage = {
                user: { id: mainUserId },
                referrals,
                isTestReferralTracking: true, // Use testCommunitySize for smaller test data
            };
            const sqsEvent = (0, integration_test_helpers_1.createSQSEvent)("field-marshal-integration-msg", queueMessage);
            // Execute the method
            const result = await index_1.default.processUserReferralTracking(connections, sqsEvent);
            // Verify successful processing
            expect(result.successMessageIds).toContain("field-marshal-integration-msg");
            expect(result.failedMessageIds).toHaveLength(0);
            // Verify the user achieved the highest possible rank
            const updatedUser = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, mainUserId);
            // Should be promoted to TA_FIELD_MARSHAL (highest rank)
            expect(updatedUser?.referralRank).toBe(constants_1.ReferralRank.TA_FIELD_MARSHAL);
            // maxRankFromReferrals should also be TA_FIELD_MARSHAL (tests the integration of the untested branch)
            expect(updatedUser?.maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_FIELD_MARSHAL);
            // Personal ATC should match the trading account balance
            expect(updatedUser?.personalATC).toBe(constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_FIELD_MARSHAL].personalATC);
            // Community ATC should be sum of all referral balances
            const expectedCommunityATC = 3 * fieldMarshalReferralBalance +
                additionalRecruits * recruitReferralBalance;
            expect(updatedUser?.communityATC).toBe(expectedCommunityATC);
            // Verify it meets all requirements for TA_FIELD_MARSHAL
            expect(updatedUser?.personalATC).toBeGreaterThanOrEqual(constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_FIELD_MARSHAL].personalATC);
            expect(updatedUser?.communityATC).toBeGreaterThanOrEqual(constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_FIELD_MARSHAL].communityATC);
            expect(updatedUser?.isTestReferralTrackingInProgress).toBe(false);
        });
        it("should process multiple messages in batch", async () => {
            // Setup multiple users with different scenarios
            const user1Id = "batch-user-1";
            const user1AccountId = (0, integration_test_helpers_1.generateObjectId)();
            const user2Id = "batch-user-2";
            const user2AccountId = (0, integration_test_helpers_1.generateObjectId)();
            const user3Id = "batch-user-3";
            // User 1 - Should succeed (meets TA_RECRUIT requirements)
            await (0, integration_test_helpers_1.setUpUserWithBalance)(usersConnection, tradingEngineConnection, user1Id, user1AccountId, constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_RECRUIT].personalATC);
            // User 2 - Should succeed (meets TA_LIEUTENANT requirements)
            await (0, integration_test_helpers_1.setUpUserWithBalance)(usersConnection, tradingEngineConnection, user2Id, user2AccountId, constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].personalATC);
            // User 3 - Should succeed but with zero balance (no trading account)
            await (0, integration_test_helpers_1.createUser)(usersConnection, user3Id);
            // Intentionally not creating trading account - will default to zero balance
            // Create referrals for user 2 to meet TA_LIEUTENANT requirements
            const user2Referrals = await (0, integration_test_helpers_1.createReferralsWithRankAndBalance)("batch-ref-", 50, 20, usersConnection, tradingEngineConnection, constants_1.ReferralRank.TA_RECRUIT);
            // Create batch SQS event using the helper function
            const batchSqsEvent = (0, integration_test_helpers_1.createSQSEvent)(["batch-msg-1", "batch-msg-2", "batch-msg-3"], [
                {
                    user: { id: user1Id },
                    referrals: [],
                    isTestReferralTracking: false,
                },
                {
                    user: { id: user2Id },
                    referrals: user2Referrals,
                    isTestReferralTracking: false,
                },
                {
                    user: { id: user3Id },
                    referrals: [],
                    isTestReferralTracking: false,
                },
            ]);
            // Execute the method
            const result = await index_1.default.processUserReferralTracking(connections, batchSqsEvent);
            // Verify batch processing results - all should succeed
            expect(result.successMessageIds).toHaveLength(3);
            expect(result.failedMessageIds).toHaveLength(0);
            expect(result.successMessageIds).toContain("batch-msg-1");
            expect(result.successMessageIds).toContain("batch-msg-2");
            expect(result.successMessageIds).toContain("batch-msg-3");
            // Verify users were updated correctly
            const updatedUser1 = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, user1Id);
            expect(updatedUser1?.referralRank).toBe(constants_1.ReferralRank.TA_RECRUIT);
            expect(updatedUser1?.isTestReferralTrackingInProgress).toBe(false);
            const updatedUser2 = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, user2Id);
            expect(updatedUser2?.referralRank).toBe(constants_1.ReferralRank.TA_LIEUTENANT);
            expect(updatedUser2?.maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_LIEUTENANT);
            expect(updatedUser2?.communityATC).toBe(20 * 50); // 20 referrals × 50 balance each
            expect(updatedUser2?.isTestReferralTrackingInProgress).toBe(false);
            // Verify user with no trading account gets zero balance but still processes successfully
            const updatedUser3 = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, user3Id);
            expect(updatedUser3?.personalATC).toBe(0); // Zero balance due to no trading account
            expect(updatedUser3?.isTestReferralTrackingInProgress).toBe(false);
        });
        it("should use testCommunitySize for rank calculation when isTestReferralTracking is true", async () => {
            const mainUserId = "test-user";
            const mainAccountId = (0, integration_test_helpers_1.generateObjectId)();
            // Setup main user
            await (0, integration_test_helpers_1.setUpUserWithBalance)(usersConnection, tradingEngineConnection, mainUserId, mainAccountId, constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].personalATC);
            // Create referrals equal to testCommunitySize
            const testCommunitySize = constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].communitySize;
            const referrals = await (0, integration_test_helpers_1.createReferralsWithRankAndBalance)("test-ref-", 500, testCommunitySize, usersConnection, tradingEngineConnection, constants_1.ReferralRank.TA_RECRUIT);
            const queueMessage = {
                user: { id: mainUserId },
                referrals,
                isTestReferralTracking: true,
            };
            const sqsEvent = (0, integration_test_helpers_1.createSQSEvent)("test-mode-message", queueMessage);
            // Execute the method
            const result = await index_1.default.processUserReferralTracking(connections, sqsEvent);
            // Verify successful processing
            expect(result.successMessageIds).toContain("test-mode-message");
            expect(result.failedMessageIds).toHaveLength(0);
            // Verify user rank progression using test community size
            const updatedUser = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, mainUserId);
            expect(updatedUser?.referralRank).toBe(constants_1.ReferralRank.TA_LIEUTENANT);
            expect(updatedUser?.communityATC).toBe(testCommunitySize * 500);
        });
        it("should handle database errors gracefully and return failed message IDs", async () => {
            // Close the connections to simulate database error
            await tradingEngineConnection.close().catch(() => { });
            await usersConnection.close().catch(() => { });
            const queueMessage = {
                user: { id: "non-existent-user" },
                referrals: [],
                isTestReferralTracking: false,
            };
            const sqsEvent = (0, integration_test_helpers_1.createSQSEvent)("error-message", queueMessage);
            // Execute the method
            const result = await index_1.default.processUserReferralTracking(connections, sqsEvent);
            // Verify that the processing failed
            expect(result.failedMessageIds).toContain("error-message");
            expect(result.successMessageIds).toHaveLength(0);
        });
        it("should handle mixed success and failure scenarios", async () => {
            // Recreate connections if they were closed in previous test
            if (tradingEngineConnection.readyState === 0 ||
                usersConnection.readyState === 0) {
                const uri = mongoServer.getUri();
                tradingEngineConnection = mongoose_1.default.createConnection(uri + "trading-engine");
                usersConnection = mongoose_1.default.createConnection(uri + "users");
                connections = {
                    [interfaces_1.DatabaseType.TRADING_ENGINE]: tradingEngineConnection,
                    [interfaces_1.DatabaseType.USERS]: usersConnection,
                };
                // Wait for reconnection
                await new Promise((resolve) => {
                    let connectionsReady = 0;
                    const checkReady = () => {
                        connectionsReady++;
                        if (connectionsReady === 2)
                            resolve();
                    };
                    tradingEngineConnection.on("connected", checkReady);
                    usersConnection.on("connected", checkReady);
                });
            }
            // Setup first user (should succeed)
            const user1Id = "success-user";
            const user1AccountId = (0, integration_test_helpers_1.generateObjectId)();
            await (0, integration_test_helpers_1.createUser)(usersConnection, user1Id, 50, 0, constants_1.ReferralRank.TA_RECRUIT);
            await (0, integration_test_helpers_1.createTradingAccount)(tradingEngineConnection, user1Id, user1AccountId);
            await (0, integration_test_helpers_1.createAccountBalance)(tradingEngineConnection, user1AccountId, 100);
            // Setup second user (will fail due to event body format)
            const user2Id = "failure-user";
            await (0, integration_test_helpers_1.createUser)(usersConnection, user2Id, 50, 0, constants_1.ReferralRank.TA_RECRUIT);
            // Create mixed SQS event using the helper function
            const mixedSqsEvent = (0, integration_test_helpers_1.createSQSEvent)(["success-msg", "fail-msg"], [
                {
                    user: { id: user1Id },
                    referrals: [],
                    isTestReferralTracking: false,
                },
                {
                    entity: { id: user2Id }, // Wrong property name to trigger failure
                    referrals: [],
                    isTestReferralTracking: false,
                },
            ]);
            // Execute the method
            const result = await index_1.default.processUserReferralTracking(connections, mixedSqsEvent);
            // Verify mixed results
            expect(result.successMessageIds).toContain("success-msg");
            expect(result.failedMessageIds).toContain("fail-msg");
            expect(result.successMessageIds).toHaveLength(1);
            expect(result.failedMessageIds).toHaveLength(1);
            // Verify successful user was updated
            const successUser = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, user1Id);
            expect(successUser?.referralRank).toBe(constants_1.ReferralRank.TA_RECRUIT);
            expect(successUser?.isTestReferralTrackingInProgress).toBe(false);
        });
    });
    describe("Rank Promotion and Demotion", () => {
        it("should progress user from TA_RECRUIT to TA_LIEUTENANT when requirements are met", async () => {
            const mainUserId = "main-user";
            const mainAccountId = (0, integration_test_helpers_1.generateObjectId)();
            const requiredCommunitySize = constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].communitySize;
            // Setup main user - initially qualifies for TA_RECRUIT
            await (0, integration_test_helpers_1.setUpUserWithBalance)(usersConnection, tradingEngineConnection, mainUserId, mainAccountId, constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].personalATC);
            const initialQueueMessage = {
                user: { id: mainUserId },
                referrals: [],
                isTestReferralTracking: false,
            };
            const initialSqsEvent = (0, integration_test_helpers_1.createSQSEvent)("test-message-1", initialQueueMessage);
            // Execute the method
            await index_1.default.processUserReferralTracking(connections, initialSqsEvent);
            const recruitUser = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, mainUserId);
            expect(recruitUser).toBeTruthy();
            expect(recruitUser?.referralRank).toBe(constants_1.ReferralRank.TA_RECRUIT);
            const requiredCommunityBalance = constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].communityATC;
            const balancePerReferral = Math.ceil(requiredCommunityBalance / requiredCommunitySize);
            // Setup referral users with TA_RECRUIT rank
            const referrals = await (0, integration_test_helpers_1.createReferralsWithRankAndBalance)("ref-", balancePerReferral, requiredCommunitySize, usersConnection, tradingEngineConnection, constants_1.ReferralRank.TA_RECRUIT);
            const queueMessage = {
                user: { id: mainUserId },
                referrals,
                isTestReferralTracking: false,
            };
            const sqsEvent = (0, integration_test_helpers_1.createSQSEvent)("test-message-1", queueMessage);
            // Execute the method
            const result = await index_1.default.processUserReferralTracking(connections, sqsEvent);
            // Verify successful processing
            expect(result.successMessageIds).toContain("test-message-1");
            expect(result.failedMessageIds).toHaveLength(0);
            // Verify user rank progression
            const updatedUser = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, mainUserId);
            expect(updatedUser).toBeTruthy();
            expect(updatedUser?.referralRank).toBe(constants_1.ReferralRank.TA_LIEUTENANT);
            expect(updatedUser?.maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_LIEUTENANT);
            expect(updatedUser?.personalATC).toBe(constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].personalATC);
            expect(updatedUser?.communityATC).toBeGreaterThanOrEqual(constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].communityATC);
            expect(updatedUser?.isTestReferralTrackingInProgress).toBe(false);
        });
        it("should progress user from TA_LIEUTENANT to TA_CAPTAIN with higher rank referrals", async () => {
            const mainUserId = "main-user";
            const mainAccountId = (0, integration_test_helpers_1.generateObjectId)();
            // Setup main user - initially TA_LIEUTENANTS
            await (0, integration_test_helpers_1.setUpUserWithBalance)(usersConnection, tradingEngineConnection, mainUserId, mainAccountId, constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].personalATC);
            // Create 2 referrals with TA_LIEUTENANT rank
            const highRankReferrals = await (0, integration_test_helpers_1.createReferralsWithRankAndBalance)("lieutenant-ref-", 50, 2, usersConnection, tradingEngineConnection, constants_1.ReferralRank.TA_LIEUTENANT);
            // Add enough lower rank referrals to meet community size requirement
            const additionalNeeded = constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].communitySize -
                highRankReferrals.length;
            const additionalReferrals = await (0, integration_test_helpers_1.createReferralsWithRankAndBalance)("recruit-ref-", 52, additionalNeeded, usersConnection, tradingEngineConnection, constants_1.ReferralRank.TA_RECRUIT);
            const allReferrals = [...highRankReferrals, ...additionalReferrals];
            const queueMessage = {
                user: { id: mainUserId },
                referrals: allReferrals,
                isTestReferralTracking: false,
            };
            const sqsEvent = (0, integration_test_helpers_1.createSQSEvent)("test-message-captain", queueMessage);
            // Execute the method
            await index_1.default.processUserReferralTracking(connections, sqsEvent);
            const user = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, mainUserId);
            expect(user?.referralRank).toBe(constants_1.ReferralRank.TA_LIEUTENANT);
            // Add one more referral equal to or higher than TA_LIEUTENANT to qualify for TA_CAPTAIN
            const fieldMarshalReferral = {
                id: "field-marshal-id",
                referralRank: constants_1.ReferralRank.TA_FIELD_MARSHAL,
            };
            allReferrals.push(fieldMarshalReferral);
            const queueMessage2 = {
                user: { id: mainUserId },
                referrals: allReferrals,
                isTestReferralTracking: false,
            };
            const sqsEvent2 = (0, integration_test_helpers_1.createSQSEvent)("test-message-captain", queueMessage2);
            const result = await index_1.default.processUserReferralTracking(connections, sqsEvent2);
            // Verify successful processing
            expect(result.successMessageIds).toContain("test-message-captain");
            expect(result.failedMessageIds).toHaveLength(0);
            // Verify user rank progression
            const updatedUser = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, mainUserId);
            expect(updatedUser?.referralRank).toBe(constants_1.ReferralRank.TA_CAPTAIN);
            expect(updatedUser?.maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_CAPTAIN);
        });
        it("should demote user from TA_LIEUTENANT to TA_RECRUIT when losing referrals", async () => {
            const mainUserId = "main-user";
            const mainAccountId = (0, integration_test_helpers_1.generateObjectId)();
            // Setup main user
            await (0, integration_test_helpers_1.setUpUserWithBalance)(usersConnection, tradingEngineConnection, mainUserId, mainAccountId, constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].personalATC);
            const referrals = await (0, integration_test_helpers_1.createReferralsWithRankAndBalance)("ref-", 1000, constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].communitySize, usersConnection, tradingEngineConnection, constants_1.ReferralRank.TA_RECRUIT);
            const initialQueueMessage = {
                user: { id: mainUserId },
                referrals,
                isTestReferralTracking: false,
            };
            const initialSqsEvent = (0, integration_test_helpers_1.createSQSEvent)("test-demotion-1", initialQueueMessage);
            // Execute the method
            await index_1.default.processUserReferralTracking(connections, initialSqsEvent);
            const lieutenantUser = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, mainUserId);
            expect(lieutenantUser).toBeTruthy();
            expect(lieutenantUser?.referralRank).toBe(constants_1.ReferralRank.TA_LIEUTENANT);
            // Lose one referral
            referrals.pop();
            const queueMessage = {
                user: { id: mainUserId },
                referrals,
                isTestReferralTracking: false,
            };
            const sqsEvent = (0, integration_test_helpers_1.createSQSEvent)("test-demotion-1", queueMessage);
            const result = await index_1.default.processUserReferralTracking(connections, sqsEvent);
            // // Verify successful processing
            expect(result.successMessageIds).toContain("test-demotion-1");
            expect(result.failedMessageIds).toHaveLength(0);
            // Verify user rank demotion
            const updatedUser = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, mainUserId);
            expect(updatedUser?.referralRank).toBe(constants_1.ReferralRank.TA_RECRUIT);
            expect(updatedUser?.maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_LIEUTENANT);
            expect(updatedUser?.communityATC).toBe(1000 * 19);
        });
        it("should demote user from TA_CAPTAIN to null when personal balance drops below minimum", async () => {
            const mainUserId = "main-user";
            const mainAccountId = (0, integration_test_helpers_1.generateObjectId)();
            // Setup main user
            await (0, integration_test_helpers_1.setUpUserWithBalance)(usersConnection, tradingEngineConnection, mainUserId, mainAccountId, constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].personalATC // Below minimum
            );
            // Create referrals that would normally support TA_CAPTAIN
            const lieutenantReferrals = await (0, integration_test_helpers_1.createReferralsWithRankAndBalance)("lieut-ref-", 2000, 3, usersConnection, tradingEngineConnection, constants_1.ReferralRank.TA_LIEUTENANT);
            // Add more referrals for community size
            const moreReferrals = await (0, integration_test_helpers_1.createReferralsWithRankAndBalance)("more-ref-", 100, 97, usersConnection, tradingEngineConnection, constants_1.ReferralRank.TA_RECRUIT);
            const referrals = [...lieutenantReferrals, ...moreReferrals];
            const queueMessage = {
                user: { id: mainUserId },
                referrals,
                isTestReferralTracking: false,
            };
            const sqsEvent = (0, integration_test_helpers_1.createSQSEvent)("test-demotion-balance", queueMessage);
            // Execute the method
            await index_1.default.processUserReferralTracking(connections, sqsEvent);
            const captainUser = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, mainUserId);
            expect(captainUser?.referralRank).toBe(constants_1.ReferralRank.TA_CAPTAIN);
            // Reduce user balance
            const reducedBalance = constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].personalATC - 470;
            await (0, integration_test_helpers_1.updateUserBalance)(mainAccountId, tradingEngineConnection, reducedBalance);
            const result = await index_1.default.processUserReferralTracking(connections, sqsEvent);
            // Verify successful processing
            expect(result.successMessageIds).toContain("test-demotion-balance");
            expect(result.failedMessageIds).toHaveLength(0);
            // Verify complete demotion due to insufficient personal balance
            const updatedUser = await (0, integration_test_helpers_1.getUserFromDb)(usersConnection, mainUserId);
            expect(updatedUser?.referralRank).toBeNull();
            expect(updatedUser?.personalATC).toBe(30);
        });
    });
});
