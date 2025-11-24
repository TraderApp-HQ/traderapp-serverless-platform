export const ReferralRank = {
    TA_RECRUIT: "TA-Recruit",
    TA_LIEUTENANT: "TA-Lieutenant",
    TA_CAPTAIN: "TA-Captain",
    TA_MAJOR: "TA-Major",
    TA_COLONEL: "TA-Colonel",
    TA_GENERAL: "TA-General",
    TA_FIELD_MARSHAL: "TA-Field-Marshal",
} as const;

export const RANK_REQUIREMENTS = {
    [ReferralRank.TA_RECRUIT]: {
        personalATC: 50,
        communityATC: 0,
        communitySize: 0,
        testCommunitySize: 0,
    },
    [ReferralRank.TA_LIEUTENANT]: {
        personalATC: 100,
        communityATC: 1000,
        communitySize: 20,
        testCommunitySize: 2,
    },
    [ReferralRank.TA_CAPTAIN]: {
        personalATC: 500,
        communityATC: 5000,
        communitySize: 100,
        testCommunitySize: 4,
    },
    [ReferralRank.TA_MAJOR]: {
        personalATC: 1000,
        communityATC: 20000,
        communitySize: 400,
        testCommunitySize: 6,
    },
    [ReferralRank.TA_COLONEL]: {
        personalATC: 2000,
        communityATC: 50000,
        communitySize: 800,
        testCommunitySize: 8,
    },
    [ReferralRank.TA_GENERAL]: {
        personalATC: 5000,
        communityATC: 100000,
        communitySize: 1500,
        testCommunitySize: 10,
    },
    [ReferralRank.TA_FIELD_MARSHAL]: {
        personalATC: 10000,
        communityATC: 500000,
        communitySize: 5000,
        testCommunitySize: 12,
    },
} as const;

export const RANK_ORDER = [
    ReferralRank.TA_RECRUIT,
    ReferralRank.TA_LIEUTENANT,
    ReferralRank.TA_CAPTAIN,
    ReferralRank.TA_MAJOR,
    ReferralRank.TA_COLONEL,
    ReferralRank.TA_GENERAL,
    ReferralRank.TA_FIELD_MARSHAL,
];

export const RANK_INDEX_MAP = Object.fromEntries(
    RANK_ORDER.map((r, i) => [r, i])
);

export const REQUIRED_RANK_REFERRALS = 3;

export const TradingEngineServiceDbCollection = {
    userTradingAccountsCollection: "user-trading-accounts",
    userTradingAccountBalanceCollection: "user-trading-account-balances",
};

export const UserServiceDbCollection = {
    users: "users",
};

export const TraderAppActivationFee = 20;