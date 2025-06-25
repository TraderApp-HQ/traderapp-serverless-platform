"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/types/users-service.ts
var users_service_exports = {};
__export(users_service_exports, {
  ReferralRank: () => ReferralRank,
  Role: () => Role,
  Status: () => Status,
  UserOnboardingStatusField: () => UserOnboardingStatusField
});
module.exports = __toCommonJS(users_service_exports);
var ReferralRank = {
  TA_RECRUIT: "TA-Recruit",
  TA_LIEUTENANT: "TA-Lieutenant",
  TA_CAPTAIN: "TA-Captain",
  TA_MAJOR: "TA-Major",
  TA_COLONEL: "TA-Colonel",
  TA_GENERAL: "TA-General",
  TA_FIELD_MARSHAL: "TA-Field-Marshal"
};
var Role = /* @__PURE__ */ ((Role2) => {
  Role2["USER"] = "USER";
  Role2["SUBSCRIBER"] = "SUBSCRIBER";
  Role2["ADMIN"] = "ADMIN";
  Role2["SUPER_ADMIN"] = "SUPER_ADMIN";
  return Role2;
})(Role || {});
var Status = /* @__PURE__ */ ((Status2) => {
  Status2["ACTIVE"] = "ACTIVE";
  Status2["INACTIVE"] = "INACTIVE";
  return Status2;
})(Status || {});
var UserOnboardingStatusField = /* @__PURE__ */ ((UserOnboardingStatusField2) => {
  UserOnboardingStatusField2["IS_EMAIL_VERIFIED"] = "isEmailVerified";
  UserOnboardingStatusField2["IS_FIRST_DEPOSIT_MADE"] = "isFirstDepositMade";
  UserOnboardingStatusField2["IS_TRADING_ACCOUNT_CONNECTED"] = "isTradingAccountConnected";
  UserOnboardingStatusField2["IS_SOCIAL_ACCOUNT_CONNECTED"] = "isSocialAccountConnected";
  UserOnboardingStatusField2["IS_ONBOARDING_TASK_DONE"] = "isOnboardingTaskDone";
  UserOnboardingStatusField2["SHOW_ONBOARDING_STEPS"] = "showOnboardingSteps";
  UserOnboardingStatusField2["IS_PHONE_VERIFIED"] = "isPhoneVerified";
  UserOnboardingStatusField2["IS_ID_VERIFIED"] = "isIdVerified";
  return UserOnboardingStatusField2;
})(UserOnboardingStatusField || {});
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ReferralRank,
  Role,
  Status,
  UserOnboardingStatusField
});
