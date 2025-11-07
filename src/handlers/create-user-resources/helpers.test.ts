/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import log from "@dazn/lambda-powertools-logger";
import { createUserResources } from "./helpers";
import WalletsService from "src/services/WalletsService";
import { MongoDBClient } from "src/clients/MongoDBClient";
import { getSecrets } from "src/config/secrets/helpers";
import { IQueueMessageBody } from "src/config/interfaces";
import { ICreateUserResourcesInput } from "src/types/wallets-service";
import {
    ITradingRule,
    // IUserTradingRule,
} from "src/services/TradingEngineService/interfaces";
import {
    TradingRuleCategory,
    TradingRuleType,
} from "src/services/TradingEngineService/enums";

// Mock all dependencies
jest.mock("mongoose");
jest.mock("src/services/WalletsService");
jest.mock("src/clients/MongoDBClient");
jest.mock("src/config/secrets/helpers");
jest.mock("@dazn/lambda-powertools-logger");

describe("createUserResources Helper", () => {
    // Mock data
    const mockQueueMessages = [
        {
            messageId: "msg-1",
            body: { userId: "user-123" },
        },
        {
            messageId: "msg-2",
            body: { userId: "user-456" },
        },
    ] as IQueueMessageBody<ICreateUserResourcesInput>[];

    const mockPlatformTradingRules: ITradingRule[] = [
        {
            id: "rule-1",
            name: "Risk Percentage Per Trade",
            description: "Maximum risk per trade",
            tooltip: "Risk tooltip",
            category: TradingRuleCategory.RISK_MANAGEMENT,
            type: TradingRuleType.PERCENTAGE,
            value: 2,
            isEnabled: true,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
        } as ITradingRule,
        {
            id: "rule-2",
            name: "Maximum Concurrent Trades",
            description: "Max concurrent trades",
            tooltip: "Concurrent tooltip",
            category: TradingRuleCategory.POSITION_LIMITS,
            type: TradingRuleType.COUNT,
            value: 5,
            isEnabled: true,
            createdAt: "2024-01-01",
            updatedAt: "2024-01-01",
        } as ITradingRule,
    ];

    // Mock instances
    let mockConnection: any;
    let mockTradingRulesCollection: any;
    let mockUserTradingRulesCollection: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock mongoose connection
        mockConnection = {
            on: jest.fn((event: string, callback: () => void) => {
                if (event === "connected") {
                    setTimeout(callback, 0); // Simulate async connection
                }
            }),
            close: jest.fn().mockResolvedValue(undefined),
        };

        (mongoose.createConnection as jest.Mock).mockReturnValue(mockConnection);

        // Mock getSecrets
        (getSecrets as jest.Mock).mockResolvedValue({
            TRADING_ENGINE_SERVICE_DB_URL: "mongodb://test-db",
        });

        // Mock MongoDBClient collections
        mockTradingRulesCollection = {
            findAll: jest.fn().mockResolvedValue(mockPlatformTradingRules),
        };

        mockUserTradingRulesCollection = {
            insertOne: jest.fn().mockResolvedValue({}),
        };

        // Mock MongoDBClient constructor
        (MongoDBClient as jest.Mock).mockImplementation((conn, collection) => {
            if (collection === "trading-rules") {
                return mockTradingRulesCollection;
            }
            if (collection === "user-trading-rules") {
                return mockUserTradingRulesCollection;
            }
            return {};
        });

        // Mock WalletsService
        (WalletsService.createUserWallet as jest.Mock).mockResolvedValue({
            successMessageIds: ["msg-1", "msg-2"],
            failedMessageIds: [],
        });

        // Mock environment
        process.env.ENV = "test";
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe("Successful scenarios", () => {
        it("should successfully create wallets and trading rules for all users", async () => {
            const result = await createUserResources(mockQueueMessages);

            // Verify database connection was created
            expect(mongoose.createConnection).toHaveBeenCalledWith(
                "mongodb://test-db"
            );

            // Verify wallets were created
            expect(WalletsService.createUserWallet).toHaveBeenCalledWith(
                mockQueueMessages
            );

            // Verify platform trading rules were fetched
            expect(mockTradingRulesCollection.findAll).toHaveBeenCalled();

            // Verify user trading rules were created (2 users × 2 rules = 4 insertions)
            expect(mockUserTradingRulesCollection.insertOne).toHaveBeenCalledTimes(4);

            // Verify user trading rules data structure
            expect(mockUserTradingRulesCollection.insertOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: "user-123",
                    ruleId: "rule-1",
                    name: "Risk Percentage Per Trade",
                    isCustomized: false,
                    lastResetToDefault: null,
                })
            );

            // Verify connection was closed
            expect(mockConnection.close).toHaveBeenCalled();

            // Verify result
            expect(result).toEqual({
                successMessageIds: ["msg-1", "msg-2"],
                failedMessageIds: [],
            });

            // Verify logs
            expect(log.info).toHaveBeenCalledWith("Creating user wallets...");
            expect(log.info).toHaveBeenCalledWith(
                "Creating trading rules for 2 users..."
            );
        });

        it("should handle partial wallet creation success", async () => {
            (WalletsService.createUserWallet as jest.Mock).mockResolvedValue({
                successMessageIds: ["msg-1"],
                failedMessageIds: ["msg-2"],
            });

            const result = await createUserResources(mockQueueMessages);

            // Only 1 user should have trading rules created (2 rules)
            expect(mockUserTradingRulesCollection.insertOne).toHaveBeenCalledTimes(2);

            // Only first user's trading rules
            expect(mockUserTradingRulesCollection.insertOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: "user-123",
                })
            );

            expect(result).toEqual({
                successMessageIds: ["msg-1"],
                failedMessageIds: ["msg-2"],
            });
        });
    });

    describe("Error scenarios", () => {
        it("should handle wallet creation failure for all users", async () => {
            (WalletsService.createUserWallet as jest.Mock).mockResolvedValue({
                successMessageIds: [],
                failedMessageIds: ["msg-1", "msg-2"],
            });

            const result = await createUserResources(mockQueueMessages);

            // No trading rules should be created
            expect(mockTradingRulesCollection.findAll).not.toHaveBeenCalled();
            expect(mockUserTradingRulesCollection.insertOne).not.toHaveBeenCalled();

            expect(result).toEqual({
                successMessageIds: [],
                failedMessageIds: ["msg-1", "msg-2"],
            });

            expect(log.warn).toHaveBeenCalledWith(
                "No successful wallet creations, skipping trading rules creation"
            );
        });

        it("should handle trading rules creation failure for a user", async () => {
            mockUserTradingRulesCollection.insertOne
                .mockResolvedValueOnce({}) // user-123 rule-1: success
                .mockResolvedValueOnce({}) // user-123 rule-2: success
                .mockRejectedValueOnce(new Error("DB error")) // user-456 rule-1: fail
                .mockResolvedValueOnce({}); // user-456 rule-2: success (won't reach)

            const result = await createUserResources(mockQueueMessages);

            expect(result).toEqual({
                successMessageIds: ["msg-1"],
                failedMessageIds: ["msg-2"],
            });

            expect(log.error).toHaveBeenCalledWith(
                "Failed to create trading rules for user",
                expect.objectContaining({
                    userId: "user-456",
                    messageId: "msg-2",
                })
            );
        });

        it("should handle no platform trading rules found", async () => {
            mockTradingRulesCollection.findAll.mockResolvedValue([]);

            const result = await createUserResources(mockQueueMessages);

            // Wallets created but no trading rules
            expect(mockUserTradingRulesCollection.insertOne).not.toHaveBeenCalled();
            expect(log.warn).toHaveBeenCalledWith("No platform trading rules found");

            // Should still succeed since wallets were created
            expect(result).toEqual({
                successMessageIds: ["msg-1", "msg-2"],
                failedMessageIds: [],
            });
        });

        it("should handle database connection failure", async () => {
            const connectionError = new Error("Connection failed");
            mockConnection.on = jest.fn((event: string, callback: (error?: Error) => void) => {
                if (event === "error") {
                    setTimeout(() => callback(connectionError), 0);
                }
            });

            const result = await createUserResources(mockQueueMessages);

            expect(result).toEqual({
                successMessageIds: [],
                failedMessageIds: ["msg-1", "msg-2"],
            });

            expect(log.error).toHaveBeenCalledWith(
                "General error in createUserResources:",
                expect.objectContaining({ error: expect.any(Error) })
            );
        });

        it("should handle getSecrets failure", async () => {
            (getSecrets as jest.Mock).mockRejectedValue(
                new Error("Secrets fetch failed")
            );

            const result = await createUserResources(mockQueueMessages);

            expect(result).toEqual({
                successMessageIds: [],
                failedMessageIds: ["msg-1", "msg-2"],
            });

            expect(log.error).toHaveBeenCalledWith(
                "General error in createUserResources:",
                expect.any(Object)
            );
        });

        it("should handle WalletsService.createUserWallet throwing error", async () => {
            (WalletsService.createUserWallet as jest.Mock).mockRejectedValue(
                new Error("Wallet service error")
            );

            const result = await createUserResources(mockQueueMessages);

            expect(result).toEqual({
                successMessageIds: [],
                failedMessageIds: ["msg-1", "msg-2"],
            });

            expect(mockConnection.close).toHaveBeenCalled();
        });
    });

    describe("Edge cases", () => {
        it("should handle empty queue messages", async () => {
            const result = await createUserResources([]);

            expect(WalletsService.createUserWallet).toHaveBeenCalledWith([]);
            expect(mockConnection.close).toHaveBeenCalled();

            expect(result).toEqual({
                successMessageIds: [],
                failedMessageIds: [],
            });
        });

        it("should handle single user", async () => {
            const singleMessage = [mockQueueMessages[0]];
            (WalletsService.createUserWallet as jest.Mock).mockResolvedValue({
                successMessageIds: ["msg-1"],
                failedMessageIds: [],
            });

            const result = await createUserResources(singleMessage);

            // 1 user × 2 rules = 2 insertions
            expect(mockUserTradingRulesCollection.insertOne).toHaveBeenCalledTimes(2);

            expect(result).toEqual({
                successMessageIds: ["msg-1"],
                failedMessageIds: [],
            });
        });

        it("should close connection even if errors occur", async () => {
            (WalletsService.createUserWallet as jest.Mock).mockRejectedValue(
                new Error("Test error")
            );

            await createUserResources(mockQueueMessages);

            expect(mockConnection.close).toHaveBeenCalled();
        });

        it("should handle disabled trading rules", async () => {
            const mixedRules = [
                ...mockPlatformTradingRules,
                {
                    id: "rule-3",
                    name: "Disabled Rule",
                    description: "This is disabled",
                    tooltip: "Disabled",
                    category: TradingRuleCategory.RISK_MANAGEMENT,
                    type: TradingRuleType.PERCENTAGE,
                    value: 1,
                    isEnabled: false,
                    createdAt: "2024-01-01",
                    updatedAt: "2024-01-01",
                } as ITradingRule,
            ];

            mockTradingRulesCollection.findAll.mockResolvedValue(mixedRules);

            const result = await createUserResources(mockQueueMessages);

            // Should create user rules for all platform rules (including disabled ones)
            // 2 users × 3 rules = 6 insertions
            expect(mockUserTradingRulesCollection.insertOne).toHaveBeenCalledTimes(6);

            // Verify disabled rule is preserved
            expect(mockUserTradingRulesCollection.insertOne).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: "user-123",
                    ruleId: "rule-3",
                    isEnabled: false,
                })
            );

            expect(result.successMessageIds).toHaveLength(2);
        });
    });
});