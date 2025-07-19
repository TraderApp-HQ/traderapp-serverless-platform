"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lambda_powertools_logger_1 = __importDefault(require("@dazn/lambda-powertools-logger"));
const mongoose_1 = __importDefault(require("mongoose"));
const MongoDBClient_1 = require("src/clients/MongoDBClient");
const constants_1 = require("src/clients/MongoDBClient/constants");
const enums_1 = require("src/config/secrets/enums");
const helpers_1 = require("src/config/secrets/helpers");
const users_service_1 = require("src/types/users-service");
require("dotenv/config");
class UsersService {
    constructor() {
        this.connection = null;
        this.secrets = null;
        this.initialized = false;
        this.initializationPromise = null;
    }
    // Initialize the service once
    async initialize() {
        if (this.initialized)
            return;
        // If initialization is already in progress, wait for it
        if (this.initializationPromise) {
            await this.initializationPromise;
            return;
        }
        // Set up initialization promise
        this.initializationPromise = (async () => {
            try {
                // Fetch secrets once
                const env = process.env.ENV;
                console.log(`=============== Getting secrets  for ${enums_1.SecretLocation.usersServiceSecrets}/${env} =====================`);
                this.secrets = await (0, helpers_1.getSecrets)(`${enums_1.SecretLocation.usersServiceSecrets}/${env}`);
                // Create connection
                this.connection = mongoose_1.default.createConnection(this.secrets.USERS_SERVICE_DB_URL);
                this.initialized = true;
            }
            catch (error) {
                lambda_powertools_logger_1.default.error("Failed to initialize UsersService:", { error });
                throw error;
            }
            finally {
                this.initializationPromise = null;
            }
        })();
        await this.initializationPromise;
    }
    // Close resources
    async closeResources() {
        if (this.connection) {
            await this.connection.close();
            this.connection = null;
        }
    }
    // For cleanup, especially in testing
    async cleanup() {
        await this.closeResources();
        this.initialized = false;
    }
    // Get connection (ensures initialization first)
    async getConnection() {
        await this.initialize();
        if (!this.connection) {
            throw new Error("Database connection not available");
        }
        return this.connection;
    }
    // Get secrets (ensures initialization first)
    async getSecrets() {
        await this.initialize();
        if (!this.secrets) {
            throw new Error("Secrets not available");
        }
        return this.secrets;
    }
    // Get user by ID
    async getUserById(userId) {
        try {
            const connection = await this.getConnection();
            const usersCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.UsersServiceCollections.users);
            // Find user by ID
            const user = await usersCollection.findOne({ id: userId });
            return user;
        }
        catch (error) {
            lambda_powertools_logger_1.default.error(`Failed to get user by ID ${userId}:`, { error });
            throw error;
        }
    }
    // Update user onboarding task
    async trackUserOnboardingChecklist(queueMessages) {
        try {
            const connection = await this.getConnection();
            const usersCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.UsersServiceCollections.users);
            const successMessageIds = [];
            const failedMessageIds = [];
            // Process each message and update each user onboarding task field
            const userOnboardingTaskResult = await Promise.allSettled(queueMessages.map(async (queue) => {
                try {
                    const { userId, onboardingChecklistItem } = queue.body;
                    // Get user
                    const user = await this.getUserById(userId);
                    // Confirm user exists and ...
                    if (!user) {
                        return {
                            messageId: queue.messageId,
                            success: false,
                        };
                    }
                    // Check that flag is not showOnboardingTask flag and flag is not turned on yet
                    if (onboardingChecklistItem !==
                        users_service_1.UserOnboardingChecklist.SHOW_ONBOARDING_STEPS &&
                        !user[onboardingChecklistItem]) {
                        // Update the user onboarding task field
                        const updatedUser = await usersCollection.findOneAndUpdate({ id: userId }, {
                            $set: {
                                [onboardingChecklistItem]: true,
                            },
                        });
                        // After the selected field is updated, confirm if other fields have been updated and and update the showOnboardingTask field to false
                        if (updatedUser &&
                            updatedUser.showOnboardingSteps) {
                            await usersCollection.updateOne({
                                id: userId,
                                isEmailVerified: true,
                                isFirstDepositMade: true,
                                isTradingAccountConnected: true,
                                isSocialAccountConnected: true,
                                isOnboardingTaskDone: true,
                            }, {
                                $set: {
                                    showOnboardingSteps: false,
                                },
                            });
                        }
                        // The block below accounts for manual dismisal of the onboarding tasks using the optional dismiss button after the comulsory tasks are completed.
                    }
                    else if (onboardingChecklistItem ===
                        users_service_1.UserOnboardingChecklist.SHOW_ONBOARDING_STEPS &&
                        user[onboardingChecklistItem]) {
                        await usersCollection.updateOne({
                            id: userId,
                            isEmailVerified: true,
                            isFirstDepositMade: true,
                            isTradingAccountConnected: true,
                        }, {
                            $set: {
                                [onboardingChecklistItem]: false,
                            },
                        });
                    }
                    return {
                        messageId: queue.messageId,
                        success: true,
                    };
                }
                catch (error) {
                    lambda_powertools_logger_1.default.error(`Failed to update onboarding task (${queue.body.onboardingChecklistItem}) for user ${queue.body.userId}:`, {
                        error,
                    });
                    return {
                        messageId: queue.messageId,
                        success: false,
                    };
                }
            }));
            // Process update onboarding task operation result
            userOnboardingTaskResult.forEach((result) => {
                if (result.status === "fulfilled") {
                    if (result.value.success) {
                        successMessageIds.push(result.value.messageId);
                    }
                    else {
                        failedMessageIds.push(result.value.messageId);
                    }
                }
                else {
                    // Handle rejected promises
                    const messageId = queueMessages.find((qm) => qm.messageId === result.reason.messageId)?.messageId;
                    if (messageId) {
                        failedMessageIds.push(messageId);
                    }
                }
            });
            return {
                successMessageIds,
                failedMessageIds,
            };
        }
        catch (error) {
            lambda_powertools_logger_1.default.debug("General error in updating User Onboarding Task:", {
                error,
            });
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((qm) => qm.messageId),
            };
        }
    }
}
exports.default = new UsersService();
