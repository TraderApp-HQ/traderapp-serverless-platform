export const ReferralRank = {
    TA_RECRUIT: "TA-Recruit",
    TA_LIEUTENANT: "TA-Lieutenant",
    TA_CAPTAIN: "TA-Captain",
    TA_MAJOR: "TA-Major",
    TA_COLONEL: "TA-Colonel",
    TA_GENERAL: "TA-General",
    TA_FIELD_MARSHAL: "TA-Field-Marshal",
} as const;

export enum Role {
    USER = "USER",
    SUBSCRIBER = "SUBSCRIBER",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN",
}

export enum Status {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
}

export enum TradingStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
}

export enum UserOnboardingChecklist {
    IS_EMAIL_VERIFIED = "isEmailVerified",
    IS_FIRST_DEPOSIT_MADE = "isFirstDepositMade",
    IS_TRADING_ACCOUNT_CONNECTED = "isTradingAccountConnected",
    IS_SOCIAL_ACCOUNT_CONNECTED = "isSocialAccountConnected",
    IS_ONBOARDING_TASK_DONE = "isOnboardingTaskDone",
    SHOW_ONBOARDING_STEPS = "showOnboardingSteps",
    IS_PHONE_VERIFIED = "isPhoneVerified",
    IS_ID_VERIFIED = "isIdVerified",
    IS_PERSONAL_ATC_FUNDED = "isPersonalATCFunded",
}

export type ReferralRankType = (typeof ReferralRank)[keyof typeof ReferralRank];

export interface IUser {
    _id?: string;
    id?: string;
    email: string;
    password: string;
    phone?: string;
    firstName: string;
    lastName: string;
    countryId: number;
    dob: string;
    isEmailVerified?: boolean;
    isFirstDepositMade?: boolean;
    isTradingAccountConnected?: boolean;
    isPersonalATCFunded?: boolean;
    isSocialAccountConnected?: boolean;
    isOnboardingTaskDone?: boolean;
    showOnboardingSteps?: boolean;
    facebookUsername?: string;
    twitterUsername?: string;
    tiktokUsername?: string;
    instagramUsername?: string;
    isPhoneVerified?: boolean;
    isIdVerified?: boolean;
    role: Role[];
    status: Status;
    tradingStatus: TradingStatus;
    referralCode: string;
    parentId?: string;
    referralRank?: ReferralRankType;
    personalATC?: number;
    communityATC?: number;
    isTestReferralTrackingInProgress?: boolean;
    activationFee?: number;
}

export interface ITrackUserOnboardingChecklistInput {
    userId: string;
    onboardingChecklistItem: UserOnboardingChecklist;
    value?: boolean;
}

export interface UserRelationship {
    userId: string; // The user (descendant)
    parentId: string; // The ancestor (direct parent)
    level: number; // Level of the ancestor (1 for direct parent, 2 for grandparent, etc.)
    createdAt: Date;
}

export interface ICountry {
    _id: number;
    name: string;
    code: string;
    flag: string;
    capital: string;
    dial_code: string;
    currency: { name: string; code: string; symbol: string };
    continent: string;
}
