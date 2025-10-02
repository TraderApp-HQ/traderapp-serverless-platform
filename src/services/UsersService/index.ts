import log from "@dazn/lambda-powertools-logger";
import mongoose from "mongoose";
import { MongoDBClient } from "src/clients/MongoDBClient";
import { UsersServiceCollections } from "src/clients/MongoDBClient/constants";
import { IQueueMessageBody } from "src/config/interfaces";
import { SecretLocation } from "src/config/secrets/enums";
import { getSecrets } from "src/config/secrets/helpers";
import { IUsersServiceSecrets } from "src/config/secrets/interfaces";
import {
    IUser,
    ITrackUserOnboardingChecklistInput,
    UserOnboardingChecklist,
    TradingStatus,
} from "src/types/users-service";
import "dotenv/config";

class UsersService {
    private connection: mongoose.Connection | null = null;
    private secrets: IUsersServiceSecrets | null = null;
    private initialized: boolean = false;
    private initializationPromise: Promise<void> | null = null;

    constructor() {}

    // Initialize the service once
    private async initialize(): Promise<void> {
        if (this.initialized) return;

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
                console.log(
                    `=============== Getting secrets  for ${SecretLocation.usersServiceSecrets}/${env} =====================`
                );
                this.secrets = await getSecrets<IUsersServiceSecrets>(
                    `${SecretLocation.usersServiceSecrets}/${env}`
                );

                // Create connection
                this.connection = mongoose.createConnection(
                    this.secrets.USERS_SERVICE_DB_URL
                );

                this.initialized = true;
            } catch (error) {
                log.error("Failed to initialize UsersService:", { error });
                throw error;
            } finally {
                this.initializationPromise = null;
            }
        })();

        await this.initializationPromise;
    }

    // Close resources
    private async closeResources(): Promise<void> {
        if (this.connection) {
            await this.connection.close();
            this.connection = null;
        }
    }

    // For cleanup, especially in testing
    public async cleanup(): Promise<void> {
        await this.closeResources();
        this.initialized = false;
    }

    // Get connection (ensures initialization first)
    private async getConnection(): Promise<mongoose.Connection> {
        await this.initialize();
        if (!this.connection) {
            throw new Error("Database connection not available");
        }
        return this.connection;
    }

    // Get secrets (ensures initialization first)
    private async getSecrets(): Promise<IUsersServiceSecrets> {
        await this.initialize();
        if (!this.secrets) {
            throw new Error("Secrets not available");
        }
        return this.secrets;
    }

    // Get user by ID
    public async getUserById(userId: string): Promise<IUser | null> {
        try {
            const connection = await this.getConnection();
            const usersCollection = new MongoDBClient<IUser>(
                connection,
                UsersServiceCollections.users
            );

            // Find user by ID
            const user = await usersCollection.findOne({ id: userId });

            return user;
        } catch (error) {
            log.error(`Failed to get user by ID ${userId}:`, { error });
            throw error;
        }
    }

    // Update user onboarding task
    public async trackUserOnboardingChecklist(
        queueMessages: IQueueMessageBody<ITrackUserOnboardingChecklistInput>[]
    ): Promise<{
        successMessageIds: string[];
        failedMessageIds: string[];
    }> {
        try {
            const connection = await this.getConnection();
            const usersCollection = new MongoDBClient<IUser>(
                connection,
                UsersServiceCollections.users
            );

            const successMessageIds: string[] = [];
            const failedMessageIds: string[] = [];

            // Process each message and update each user onboarding task field
            const userOnboardingTaskResult = await Promise.allSettled(
                queueMessages.map(async (queue) => {
                    try {
                        const { userId, onboardingChecklistItem, value } =
                            queue.body;

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
                        if (
                            (onboardingChecklistItem !==
                                UserOnboardingChecklist.SHOW_ONBOARDING_STEPS &&
                                !user[onboardingChecklistItem]) ||
                            onboardingChecklistItem ===
                                UserOnboardingChecklist.IS_PERSONAL_ATC_FUNDED
                        ) {
                            // Update the user onboarding task field
                            const updatedUser =
                                await usersCollection.findOneAndUpdate(
                                    { id: userId },
                                    {
                                        $set: {
                                            [onboardingChecklistItem]:
                                                value ?? true,
                                        },
                                    }
                                );

                            if (updatedUser) {
                                const {
                                    showOnboardingSteps,
                                    isSocialAccountConnected,
                                    isOnboardingTaskDone,
                                    isPersonalATCFunded,
                                } = updatedUser;

                                await usersCollection.updateOne(
                                    {
                                        id: userId,
                                        isEmailVerified: true,
                                        isFirstDepositMade: true,
                                        isTradingAccountConnected: true,
                                    },
                                    {
                                        $set: {
                                            // If the user has completed all compulsory onboarding tasks, update the showOnboardingSteps field
                                            ...(showOnboardingSteps &&
                                                isSocialAccountConnected &&
                                                isOnboardingTaskDone && {
                                                    showOnboardingSteps: false,
                                                }),
                                            // and update the trading status of the user depending on the personal ATC status after checking isEmailVerified -> isFirstDepositMade -> isTradingAccountConnected
                                            tradingStatus: isPersonalATCFunded
                                                ? TradingStatus.ACTIVE
                                                : TradingStatus.INACTIVE,
                                        },
                                    }
                                );
                            }

                            // The block below accounts for manual dismisal of the onboarding tasks using the optional dismiss button after the comulsory tasks are completed.
                        } else if (
                            onboardingChecklistItem ===
                                UserOnboardingChecklist.SHOW_ONBOARDING_STEPS &&
                            user[onboardingChecklistItem]
                        ) {
                            await usersCollection.updateOne(
                                {
                                    id: userId,
                                    isEmailVerified: true,
                                    isFirstDepositMade: true,
                                    isTradingAccountConnected: true,
                                },
                                {
                                    $set: {
                                        [onboardingChecklistItem]: false,
                                    },
                                }
                            );
                        }

                        return {
                            messageId: queue.messageId,
                            success: true,
                        };
                    } catch (error) {
                        log.error(
                            `Failed to update onboarding task (${queue.body.onboardingChecklistItem}) for user ${queue.body.userId}:`,
                            {
                                error,
                            }
                        );
                        return {
                            messageId: queue.messageId,
                            success: false,
                        };
                    }
                })
            );

            // Process update onboarding task operation result
            userOnboardingTaskResult.forEach((result) => {
                if (result.status === "fulfilled") {
                    if (result.value.success) {
                        successMessageIds.push(result.value.messageId);
                    } else {
                        failedMessageIds.push(result.value.messageId);
                    }
                } else {
                    // Handle rejected promises
                    const messageId = queueMessages.find(
                        (qm) => qm.messageId === result.reason.messageId
                    )?.messageId;
                    if (messageId) {
                        failedMessageIds.push(messageId);
                    }
                }
            });

            return {
                successMessageIds,
                failedMessageIds,
            };
        } catch (error) {
            log.debug("General error in updating User Onboarding Task:", {
                error,
            });
            return {
                successMessageIds: [],
                failedMessageIds: queueMessages.map((qm) => qm.messageId),
            };
        }
    }
}

export default new UsersService();
