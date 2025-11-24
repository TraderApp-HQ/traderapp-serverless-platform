import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoDBClient } from "src/clients/MongoDBClient";
import { UsersServiceCollections } from "src/clients/MongoDBClient/constants";
import {
    IUser,
    UserRelationship,
    Role,
    Status,
    ReferralRankType,
    ICountry,
} from "src/types/users-service";

// =============================================================================
// DATABASE SETUP AND TEARDOWN
// =============================================================================

export interface TestDatabaseSetup {
    mongoServer: MongoMemoryServer;
    usersConnection: mongoose.Connection;
    cleanup: () => Promise<void>;
}

/**
 * Sets up in-memory MongoDB server for testing
 */
export const setupTestDatabase = async (): Promise<TestDatabaseSetup> => {
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    const usersConnection = mongoose.createConnection(uri + "users-test");

    // Wait for connection to be ready
    await new Promise<void>((resolve) => {
        usersConnection.on("connected", resolve);
    });

    const cleanup = async () => {
        await usersConnection.close();
        await mongoServer.stop();
    };

    return {
        mongoServer,
        usersConnection,
        cleanup,
    };
};

/**
 * Clears all collections in the test database
 */
export const clearTestDatabase = async (
    connection: mongoose.Connection
): Promise<void> => {
    if (connection.readyState === 1) {
        await connection.db?.dropDatabase();
    }
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const generateObjectId = () => new mongoose.Types.ObjectId().toString();

export const generateUserId = (prefix: string = "user") =>
    `${prefix}-${generateObjectId()}`;

// =============================================================================
// USER CREATION FUNCTIONS
// =============================================================================

export interface CreateUserOptions {
    id?: string;
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    countryId?: number;
    dob?: string;
    role?: Role[];
    status?: Status;
    referralCode?: string;
    referralRank?: ReferralRankType;
    parentId?: string;
    personalATC?: number;
    communityATC?: number;
    // Onboarding flags
    isEmailVerified?: boolean;
    isFirstDepositMade?: boolean;
    isTradingAccountConnected?: boolean;
    isPersonalATCFunded?: boolean;
    isSocialAccountConnected?: boolean;
    isOnboardingTaskDone?: boolean;
    showOnboardingSteps?: boolean;
    isPhoneVerified?: boolean;
    isIdVerified?: boolean;
    // Social accounts
    facebookUsername?: string;
    twitterUsername?: string;
    tiktokUsername?: string;
    instagramUsername?: string;
    // Test tracking
    isTestReferralTrackingInProgress?: boolean;
}

/**
 * Creates a basic user with default values
 */
export const createUser = async (
    connection: mongoose.Connection,
    options: CreateUserOptions = {}
): Promise<IUser> => {
    const userId = options.id || generateUserId();
    const userCollection = new MongoDBClient<IUser>(
        connection,
        UsersServiceCollections.users
    );

    const userData: Partial<IUser> = {
        id: userId,
        email: options.email || `${userId}@test.com`,
        password: options.password || "hashedpassword123",
        firstName: options.firstName || "Test",
        lastName: options.lastName || "User",
        phone: options.phone,
        countryId: options.countryId || 1,
        dob: options.dob || "1990-01-01",
        role: options.role || [Role.USER],
        status: options.status || Status.INACTIVE,
        referralCode: options.referralCode || `REF-${userId.slice(-8)}`,
        referralRank: options.referralRank,
        parentId: options.parentId,
        personalATC: options.personalATC || 0,
        communityATC: options.communityATC || 0,
        // Onboarding defaults
        isEmailVerified: options.isEmailVerified || false,
        isFirstDepositMade: options.isFirstDepositMade || false,
        isTradingAccountConnected: options.isTradingAccountConnected || false,
        isPersonalATCFunded: options.isPersonalATCFunded || false,
        isSocialAccountConnected: options.isSocialAccountConnected || false,
        isOnboardingTaskDone: options.isOnboardingTaskDone || false,
        showOnboardingSteps:
            options.showOnboardingSteps !== undefined
                ? options.showOnboardingSteps
                : true,
        isPhoneVerified: options.isPhoneVerified || false,
        isIdVerified: options.isIdVerified || false,
        // Social accounts
        facebookUsername: options.facebookUsername,
        twitterUsername: options.twitterUsername,
        tiktokUsername: options.tiktokUsername,
        instagramUsername: options.instagramUsername,
        // Test tracking
        isTestReferralTrackingInProgress:
            options.isTestReferralTrackingInProgress,
    };

    const result = await userCollection.insertOne(userData);
    return result;
};

/**
 * Creates a user with completed onboarding (all flags set to true)
 */
export const createUserWithCompletedOnboarding = async (
    connection: mongoose.Connection,
    options: CreateUserOptions = {}
): Promise<IUser> => {
    return createUser(connection, {
        ...options,
        status: Status.ACTIVE,
        isEmailVerified: true,
        isFirstDepositMade: true,
        isTradingAccountConnected: true,
        isPersonalATCFunded: true,
        isSocialAccountConnected: true,
        isOnboardingTaskDone: true,
        showOnboardingSteps: false,
        isPhoneVerified: true,
        isIdVerified: true,
    });
};

/**
 * Creates a user with specific referral rank and ATC balances
 */
export const createUserWithRank = async (
    connection: mongoose.Connection,
    referralRank: ReferralRankType,
    personalATC: number = 0,
    communityATC: number = 0,
    options: CreateUserOptions = {}
): Promise<IUser> => {
    return createUser(connection, {
        ...options,
        referralRank,
        personalATC,
        communityATC,
        status: Status.ACTIVE,
    });
};

// =============================================================================
// USER RELATIONSHIP FUNCTIONS
// =============================================================================

/**
 * Creates a user relationship record
 */
export const createUserRelationship = async (
    connection: mongoose.Connection,
    userId: string,
    parentId: string,
    level: number = 1
): Promise<UserRelationship> => {
    const relationshipCollection = new MongoDBClient<UserRelationship>(
        connection,
        UsersServiceCollections.userRelationships
    );

    const relationship: UserRelationship = {
        userId,
        parentId,
        level,
        createdAt: new Date(),
    };

    const result = await relationshipCollection.insertOne(relationship);
    return result;
};

/**
 * Creates a user with descendants (children and grandchildren)
 */
export const createUserWithDescendants = async (
    connection: mongoose.Connection,
    parentOptions: CreateUserOptions = {},
    descendantConfig: {
        directChildren?: number;
        grandchildren?: number;
        childrenOptions?: CreateUserOptions;
        grandchildrenOptions?: CreateUserOptions;
    } = {}
): Promise<{
    parent: IUser;
    children: IUser[];
    grandchildren: IUser[];
    relationships: UserRelationship[];
}> => {
    const {
        directChildren = 2,
        grandchildren = 4,
        childrenOptions = {},
        grandchildrenOptions = {},
    } = descendantConfig;

    // Create parent user
    const parent = await createUser(connection, parentOptions);

    // Create direct children
    const children: IUser[] = [];
    const relationships: UserRelationship[] = [];

    for (let i = 0; i < directChildren; i++) {
        const child = await createUser(connection, {
            ...childrenOptions,
            parentId: parent.id,
            id: childrenOptions.id
                ? `${childrenOptions.id}-child-${i}`
                : undefined,
        });

        const relationship = await createUserRelationship(
            connection,
            child.id!,
            parent.id!,
            1
        );

        children.push(child);
        relationships.push(relationship);
    }

    // Create grandchildren
    const grandchildrenArray: IUser[] = [];
    const grandchildrenPerChild = Math.ceil(grandchildren / children.length);

    for (
        let i = 0;
        i < children.length && grandchildrenArray.length < grandchildren;
        i++
    ) {
        const parentChild = children[i];
        const remainingGrandchildren =
            grandchildren - grandchildrenArray.length;
        const childrenToCreate = Math.min(
            grandchildrenPerChild,
            remainingGrandchildren
        );

        for (let j = 0; j < childrenToCreate; j++) {
            const grandchild = await createUser(connection, {
                ...grandchildrenOptions,
                parentId: parentChild.id,
                id: grandchildrenOptions.id
                    ? `${grandchildrenOptions.id}-grandchild-${i}-${j}`
                    : undefined,
            });

            // Create relationship with direct parent (level 1)
            const directRelationship = await createUserRelationship(
                connection,
                grandchild.id!,
                parentChild.id!,
                1
            );

            // Create relationship with grandparent (level 2)
            const grandparentRelationship = await createUserRelationship(
                connection,
                grandchild.id!,
                parent.id!,
                2
            );

            grandchildrenArray.push(grandchild);
            relationships.push(directRelationship, grandparentRelationship);
        }
    }

    return {
        parent,
        children,
        grandchildren: grandchildrenArray,
        relationships,
    };
};

/**
 * Creates multiple users with the same parent (siblings)
 */
export const createSiblingUsers = async (
    connection: mongoose.Connection,
    parentId: string,
    count: number,
    options: CreateUserOptions = {}
): Promise<{ users: IUser[]; relationships: UserRelationship[] }> => {
    const users: IUser[] = [];
    const relationships: UserRelationship[] = [];

    for (let i = 0; i < count; i++) {
        const user = await createUser(connection, {
            ...options,
            parentId,
            id: options.id ? `${options.id}-sibling-${i}` : undefined,
        });

        const relationship = await createUserRelationship(
            connection,
            user.id!,
            parentId,
            1
        );

        users.push(user);
        relationships.push(relationship);
    }

    return { users, relationships };
};

// =============================================================================
// COUNTRY HELPERS
// =============================================================================

/**
 * Creates a test country record
 */
export const createCountry = async (
    connection: mongoose.Connection,
    options: Partial<ICountry> = {}
): Promise<ICountry> => {
    const countryCollection = new MongoDBClient<ICountry>(
        connection,
        UsersServiceCollections.countries
    );

    const countryData: ICountry = {
        _id: options._id || 1,
        name: options.name || "Test Country",
        code: options.code || "TC",
        flag: options.flag || "🏳️",
        capital: options.capital || "Test Capital",
        dial_code: options.dial_code || "+1",
        currency: options.currency || {
            name: "Test Dollar",
            code: "TSD",
            symbol: "$",
        },
        continent: options.continent || "Test Continent",
    };

    return countryCollection.insertOne(countryData);
};
