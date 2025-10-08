"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserOnboardingChecklist = exports.TradingStatus = exports.Status = exports.Role = exports.ReferralRank = void 0;
exports.ReferralRank = {
    TA_RECRUIT: "TA-Recruit",
    TA_LIEUTENANT: "TA-Lieutenant",
    TA_CAPTAIN: "TA-Captain",
    TA_MAJOR: "TA-Major",
    TA_COLONEL: "TA-Colonel",
    TA_GENERAL: "TA-General",
    TA_FIELD_MARSHAL: "TA-Field-Marshal",
};
var Role;
(function (Role) {
    Role["USER"] = "USER";
    Role["SUBSCRIBER"] = "SUBSCRIBER";
    Role["ADMIN"] = "ADMIN";
    Role["SUPER_ADMIN"] = "SUPER_ADMIN";
})(Role || (exports.Role = Role = {}));
var Status;
(function (Status) {
    Status["ACTIVE"] = "ACTIVE";
    Status["INACTIVE"] = "INACTIVE";
})(Status || (exports.Status = Status = {}));
var TradingStatus;
(function (TradingStatus) {
    TradingStatus["ACTIVE"] = "ACTIVE";
    TradingStatus["INACTIVE"] = "INACTIVE";
})(TradingStatus || (exports.TradingStatus = TradingStatus = {}));
var UserOnboardingChecklist;
(function (UserOnboardingChecklist) {
    UserOnboardingChecklist["IS_EMAIL_VERIFIED"] = "isEmailVerified";
    UserOnboardingChecklist["IS_FIRST_DEPOSIT_MADE"] = "isFirstDepositMade";
    UserOnboardingChecklist["IS_TRADING_ACCOUNT_CONNECTED"] = "isTradingAccountConnected";
    UserOnboardingChecklist["IS_SOCIAL_ACCOUNT_CONNECTED"] = "isSocialAccountConnected";
    UserOnboardingChecklist["IS_ONBOARDING_TASK_DONE"] = "isOnboardingTaskDone";
    UserOnboardingChecklist["SHOW_ONBOARDING_STEPS"] = "showOnboardingSteps";
    UserOnboardingChecklist["IS_PHONE_VERIFIED"] = "isPhoneVerified";
    UserOnboardingChecklist["IS_ID_VERIFIED"] = "isIdVerified";
    UserOnboardingChecklist["IS_PERSONAL_ATC_FUNDED"] = "isPersonalATCFunded";
})(UserOnboardingChecklist || (exports.UserOnboardingChecklist = UserOnboardingChecklist = {}));
