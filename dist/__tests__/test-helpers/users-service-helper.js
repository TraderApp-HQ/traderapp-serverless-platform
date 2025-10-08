"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCountry = exports.createSiblingUsers = exports.createUserWithDescendants = exports.createUserRelationship = exports.createUserWithRank = exports.createUserWithCompletedOnboarding = exports.createUser = exports.generateUserId = exports.generateObjectId = exports.clearTestDatabase = exports.setupTestDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
const MongoDBClient_1 = require("src/clients/MongoDBClient");
const constants_1 = require("src/clients/MongoDBClient/constants");
const users_service_1 = require("src/types/users-service");
/**
 * Sets up in-memory MongoDB server for testing
 */
const setupTestDatabase = async () => {
    const mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    const usersConnection = mongoose_1.default.createConnection(uri + "users-test");
    // Wait for connection to be ready
    await new Promise((resolve) => {
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
exports.setupTestDatabase = setupTestDatabase;
/**
 * Clears all collections in the test database
 */
const clearTestDatabase = async (connection) => {
    if (connection.readyState === 1) {
        await connection.db?.dropDatabase();
    }
};
exports.clearTestDatabase = clearTestDatabase;
// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================
const generateObjectId = () => new mongoose_1.default.Types.ObjectId().toString();
exports.generateObjectId = generateObjectId;
const generateUserId = (prefix = "user") => `${prefix}-${(0, exports.generateObjectId)()}`;
exports.generateUserId = generateUserId;
/**
 * Creates a basic user with default values
 */
const createUser = async (connection, options = {}) => {
    const userId = options.id || (0, exports.generateUserId)();
    const userCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.UsersServiceCollections.users);
    const userData = {
        id: userId,
        email: options.email || `${userId}@test.com`,
        password: options.password || "hashedpassword123",
        firstName: options.firstName || "Test",
        lastName: options.lastName || "User",
        phone: options.phone,
        countryId: options.countryId || 1,
        dob: options.dob || "1990-01-01",
        role: options.role || [users_service_1.Role.USER],
        status: options.status || users_service_1.Status.INACTIVE,
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
        showOnboardingSteps: options.showOnboardingSteps !== undefined
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
        isTestReferralTrackingInProgress: options.isTestReferralTrackingInProgress,
    };
    const result = await userCollection.insertOne(userData);
    return result;
};
exports.createUser = createUser;
/**
 * Creates a user with completed onboarding (all flags set to true)
 */
const createUserWithCompletedOnboarding = async (connection, options = {}) => {
    return (0, exports.createUser)(connection, {
        ...options,
        status: users_service_1.Status.ACTIVE,
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
exports.createUserWithCompletedOnboarding = createUserWithCompletedOnboarding;
/**
 * Creates a user with specific referral rank and ATC balances
 */
const createUserWithRank = async (connection, referralRank, personalATC = 0, communityATC = 0, options = {}) => {
    return (0, exports.createUser)(connection, {
        ...options,
        referralRank,
        personalATC,
        communityATC,
        status: users_service_1.Status.ACTIVE,
    });
};
exports.createUserWithRank = createUserWithRank;
// =============================================================================
// USER RELATIONSHIP FUNCTIONS
// =============================================================================
/**
 * Creates a user relationship record
 */
const createUserRelationship = async (connection, userId, parentId, level = 1) => {
    const relationshipCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.UsersServiceCollections.userRelationships);
    const relationship = {
        userId,
        parentId,
        level,
        createdAt: new Date(),
    };
    const result = await relationshipCollection.insertOne(relationship);
    return result;
};
exports.createUserRelationship = createUserRelationship;
/**
 * Creates a user with descendants (children and grandchildren)
 */
const createUserWithDescendants = async (connection, parentOptions = {}, descendantConfig = {}) => {
    const { directChildren = 2, grandchildren = 4, childrenOptions = {}, grandchildrenOptions = {}, } = descendantConfig;
    // Create parent user
    const parent = await (0, exports.createUser)(connection, parentOptions);
    // Create direct children
    const children = [];
    const relationships = [];
    for (let i = 0; i < directChildren; i++) {
        const child = await (0, exports.createUser)(connection, {
            ...childrenOptions,
            parentId: parent.id,
            id: childrenOptions.id
                ? `${childrenOptions.id}-child-${i}`
                : undefined,
        });
        const relationship = await (0, exports.createUserRelationship)(connection, child.id, parent.id, 1);
        children.push(child);
        relationships.push(relationship);
    }
    // Create grandchildren
    const grandchildrenArray = [];
    const grandchildrenPerChild = Math.ceil(grandchildren / children.length);
    for (let i = 0; i < children.length && grandchildrenArray.length < grandchildren; i++) {
        const parentChild = children[i];
        const remainingGrandchildren = grandchildren - grandchildrenArray.length;
        const childrenToCreate = Math.min(grandchildrenPerChild, remainingGrandchildren);
        for (let j = 0; j < childrenToCreate; j++) {
            const grandchild = await (0, exports.createUser)(connection, {
                ...grandchildrenOptions,
                parentId: parentChild.id,
                id: grandchildrenOptions.id
                    ? `${grandchildrenOptions.id}-grandchild-${i}-${j}`
                    : undefined,
            });
            // Create relationship with direct parent (level 1)
            const directRelationship = await (0, exports.createUserRelationship)(connection, grandchild.id, parentChild.id, 1);
            // Create relationship with grandparent (level 2)
            const grandparentRelationship = await (0, exports.createUserRelationship)(connection, grandchild.id, parent.id, 2);
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
exports.createUserWithDescendants = createUserWithDescendants;
/**
 * Creates multiple users with the same parent (siblings)
 */
const createSiblingUsers = async (connection, parentId, count, options = {}) => {
    const users = [];
    const relationships = [];
    for (let i = 0; i < count; i++) {
        const user = await (0, exports.createUser)(connection, {
            ...options,
            parentId,
            id: options.id ? `${options.id}-sibling-${i}` : undefined,
        });
        const relationship = await (0, exports.createUserRelationship)(connection, user.id, parentId, 1);
        users.push(user);
        relationships.push(relationship);
    }
    return { users, relationships };
};
exports.createSiblingUsers = createSiblingUsers;
// =============================================================================
// COUNTRY HELPERS
// =============================================================================
/**
 * Creates a test country record
 */
const createCountry = async (connection, options = {}) => {
    const countryCollection = new MongoDBClient_1.MongoDBClient(connection, constants_1.UsersServiceCollections.countries);
    const countryData = {
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
exports.createCountry = createCountry;
