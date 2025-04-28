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

// src/config/constants.ts
var constants_exports = {};
__export(constants_exports, {
  RANK_REQUIREMENTS: () => RANK_REQUIREMENTS,
  ReferralRank: () => ReferralRank
});
module.exports = __toCommonJS(constants_exports);
var ReferralRank = {
  TA_RECRUIT: "TA-Recruit",
  TA_LIEUTENANT: "TA-Lieutenant",
  TA_CAPTAIN: "TA-Captain",
  TA_MAJOR: "TA-Major",
  TA_COLONEL: "TA-Colonel",
  TA_GENERAL: "TA-General",
  TA_FIELD_MARSHAL: "TA-Field-Marshal"
};
var RANK_REQUIREMENTS = {
  [ReferralRank.TA_RECRUIT]: {
    personalATC: 50,
    communityATC: 0,
    communitySize: 0,
    testCommunitySize: 0
  },
  [ReferralRank.TA_LIEUTENANT]: {
    personalATC: 100,
    communityATC: 1e3,
    communitySize: 20,
    testCommunitySize: 2
  },
  [ReferralRank.TA_CAPTAIN]: {
    personalATC: 500,
    communityATC: 5e3,
    communitySize: 100,
    testCommunitySize: 4
  },
  [ReferralRank.TA_MAJOR]: {
    personalATC: 1e3,
    communityATC: 2e4,
    communitySize: 400,
    testCommunitySize: 6
  },
  [ReferralRank.TA_COLONEL]: {
    personalATC: 2e3,
    communityATC: 5e4,
    communitySize: 800,
    testCommunitySize: 8
  },
  [ReferralRank.TA_GENERAL]: {
    personalATC: 5e3,
    communityATC: 1e5,
    communitySize: 1500,
    testCommunitySize: 10
  },
  [ReferralRank.TA_FIELD_MARSHAL]: {
    personalATC: 1e4,
    communityATC: 5e5,
    communitySize: 5e3,
    testCommunitySize: 12
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RANK_REQUIREMENTS,
  ReferralRank
});
