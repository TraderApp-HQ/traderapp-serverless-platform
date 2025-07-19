"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserServiceDbCollection = exports.TradingEngineServiceDbCollection = exports.REQUIRED_RANK_REFERRALS = exports.RANK_INDEX_MAP = exports.RANK_ORDER = exports.RANK_REQUIREMENTS = exports.ReferralRank = void 0;
exports.ReferralRank = {
    TA_RECRUIT: "TA-Recruit",
    TA_LIEUTENANT: "TA-Lieutenant",
    TA_CAPTAIN: "TA-Captain",
    TA_MAJOR: "TA-Major",
    TA_COLONEL: "TA-Colonel",
    TA_GENERAL: "TA-General",
    TA_FIELD_MARSHAL: "TA-Field-Marshal",
};
exports.RANK_REQUIREMENTS = {
    [exports.ReferralRank.TA_RECRUIT]: {
        personalATC: 50,
        communityATC: 0,
        communitySize: 0,
        testCommunitySize: 0,
    },
    [exports.ReferralRank.TA_LIEUTENANT]: {
        personalATC: 100,
        communityATC: 1000,
        communitySize: 20,
        testCommunitySize: 2,
    },
    [exports.ReferralRank.TA_CAPTAIN]: {
        personalATC: 500,
        communityATC: 5000,
        communitySize: 100,
        testCommunitySize: 4,
    },
    [exports.ReferralRank.TA_MAJOR]: {
        personalATC: 1000,
        communityATC: 20000,
        communitySize: 400,
        testCommunitySize: 6,
    },
    [exports.ReferralRank.TA_COLONEL]: {
        personalATC: 2000,
        communityATC: 50000,
        communitySize: 800,
        testCommunitySize: 8,
    },
    [exports.ReferralRank.TA_GENERAL]: {
        personalATC: 5000,
        communityATC: 100000,
        communitySize: 1500,
        testCommunitySize: 10,
    },
    [exports.ReferralRank.TA_FIELD_MARSHAL]: {
        personalATC: 10000,
        communityATC: 500000,
        communitySize: 5000,
        testCommunitySize: 12,
    },
};
exports.RANK_ORDER = [
    exports.ReferralRank.TA_RECRUIT,
    exports.ReferralRank.TA_LIEUTENANT,
    exports.ReferralRank.TA_CAPTAIN,
    exports.ReferralRank.TA_MAJOR,
    exports.ReferralRank.TA_COLONEL,
    exports.ReferralRank.TA_GENERAL,
    exports.ReferralRank.TA_FIELD_MARSHAL,
];
exports.RANK_INDEX_MAP = Object.fromEntries(exports.RANK_ORDER.map((r, i) => [r, i]));
exports.REQUIRED_RANK_REFERRALS = 3;
exports.TradingEngineServiceDbCollection = {
    userTradingAccountsCollection: "user-trading-accounts",
    userTradingAccountBalanceCollection: "user-trading-account-balances",
};
exports.UserServiceDbCollection = {
    users: "users",
};
