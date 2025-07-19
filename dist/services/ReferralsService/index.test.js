"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = __importDefault(require("."));
const constants_1 = require("src/config/constants");
describe("ReferralsService.computeRank", () => {
    const service = _1.default;
    it("should return TA_RECRUIT when only personal ATC criteria is met", () => {
        const criteria = {
            personalATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_RECRUIT].personalATC,
            communityATC: 0,
            referrals: [],
            isTestReferralTracking: false,
        };
        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        expect(rank).toBe(constants_1.ReferralRank.TA_RECRUIT);
        expect(maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_RECRUIT);
    });
    it("should consider referral ranks requirement for ranks above TA_RECRUIT", () => {
        const referrals = [
            { id: "1", referralRank: constants_1.ReferralRank.TA_LIEUTENANT },
            { id: "2", referralRank: constants_1.ReferralRank.TA_RECRUIT },
            { id: "3", referralRank: constants_1.ReferralRank.TA_RECRUIT },
        ];
        const criteria = {
            personalATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].personalATC,
            communityATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].communityATC,
            referrals: [
                ...referrals,
                ...Array.from({
                    length: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT]
                        .communitySize - referrals.length,
                }, (_, i) => ({
                    id: `${i + 4}`,
                    referralRank: constants_1.ReferralRank.TA_RECRUIT,
                })),
            ],
            isTestReferralTracking: false,
        };
        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        expect(rank).not.toBe(constants_1.ReferralRank.TA_CAPTAIN);
        expect(rank).toBe(constants_1.ReferralRank.TA_LIEUTENANT);
        expect(maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_LIEUTENANT);
    });
    it("should use testCommunitySize when isTestReferralTracking is true", () => {
        const testCommunitySize = constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].testCommunitySize;
        const referrals = Array.from({ length: testCommunitySize + 20 }, (_, i) => ({
            id: `${i + 1}`,
            referralRank: constants_1.ReferralRank.TA_GENERAL,
        }));
        const criteria = {
            personalATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].personalATC,
            communityATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].communityATC,
            referrals,
            isTestReferralTracking: true,
        };
        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        expect(rank).toBe(constants_1.ReferralRank.TA_LIEUTENANT);
        expect(maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_FIELD_MARSHAL);
    });
    it("should correctly determine TA_CAPTAIN rank when all criteria are met", () => {
        const referrals = [
            { id: "1", referralRank: constants_1.ReferralRank.TA_LIEUTENANT },
            { id: "2", referralRank: constants_1.ReferralRank.TA_CAPTAIN },
            { id: "3", referralRank: constants_1.ReferralRank.TA_MAJOR },
        ];
        const criteria = {
            personalATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].personalATC,
            communityATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN].communityATC,
            referrals: [
                ...referrals,
                ...Array.from({
                    length: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_CAPTAIN]
                        .communitySize - referrals.length,
                }, (_, i) => ({
                    id: `${i + 4}`,
                    referralRank: constants_1.ReferralRank.TA_RECRUIT,
                })),
            ],
            isTestReferralTracking: false,
        };
        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        expect(rank).toBe(constants_1.ReferralRank.TA_CAPTAIN);
        expect(maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_CAPTAIN);
    });
    it("should qualify for specific rank with exactly 3 referrals at required rank", () => {
        const referrals = [
            { id: "1", referralRank: constants_1.ReferralRank.TA_CAPTAIN },
            { id: "2", referralRank: constants_1.ReferralRank.TA_CAPTAIN },
            { id: "3", referralRank: constants_1.ReferralRank.TA_CAPTAIN },
        ];
        const criteria = {
            personalATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_MAJOR].personalATC,
            communityATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_MAJOR].communityATC,
            referrals: [
                ...referrals,
                ...Array.from({
                    length: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_MAJOR]
                        .communitySize - referrals.length,
                }, (_, i) => ({
                    id: `${i + 4}`,
                    referralRank: constants_1.ReferralRank.TA_RECRUIT,
                })),
            ],
            isTestReferralTracking: false,
        };
        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        expect(maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_MAJOR);
        expect(rank).toBe(constants_1.ReferralRank.TA_MAJOR);
    });
    it("should limit rank when user has less than 3 referrals total", () => {
        const referrals = [
            { id: "1", referralRank: constants_1.ReferralRank.TA_RECRUIT },
            { id: "2", referralRank: constants_1.ReferralRank.TA_LIEUTENANT },
        ];
        const criteria = {
            personalATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].personalATC,
            communityATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].communityATC,
            referrals,
            isTestReferralTracking: false,
        };
        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        // With only 2 referrals, they don't meet any rank above TA_RECRUIT for referral requirements
        expect(maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_RECRUIT);
        expect(rank).toBe(constants_1.ReferralRank.TA_RECRUIT);
    });
    it("should determine correct rank with mixed referral ranks", () => {
        const referrals = [
            { id: "1", referralRank: constants_1.ReferralRank.TA_CAPTAIN },
            { id: "2", referralRank: constants_1.ReferralRank.TA_MAJOR },
            { id: "3", referralRank: constants_1.ReferralRank.TA_COLONEL },
        ];
        const criteria = {
            personalATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_COLONEL].personalATC,
            communityATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_COLONEL].communityATC,
            referrals: [
                ...referrals,
                ...Array.from({
                    length: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_COLONEL]
                        .communitySize - referrals.length,
                }, (_, i) => ({
                    id: `${i + 4}`,
                    referralRank: constants_1.ReferralRank.TA_RECRUIT,
                })),
            ],
            isTestReferralTracking: false,
        };
        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        expect(maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_MAJOR);
        expect(rank).toBe(constants_1.ReferralRank.TA_MAJOR);
    });
    it("should correctly handle referrals at highest possible rank", () => {
        const referrals = Array.from({ length: 3 }, () => ({
            id: "high-rank",
            referralRank: constants_1.ReferralRank.TA_FIELD_MARSHAL,
        }));
        const criteria = {
            personalATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_FIELD_MARSHAL].personalATC,
            communityATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_FIELD_MARSHAL].communityATC,
            referrals: [
                ...referrals,
                ...Array.from({
                    length: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_FIELD_MARSHAL]
                        .communitySize - referrals.length,
                }, (_, i) => ({
                    id: `${i + 4}`,
                    referralRank: constants_1.ReferralRank.TA_RECRUIT,
                })),
            ],
            isTestReferralTracking: false,
        };
        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        expect(maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_FIELD_MARSHAL);
        expect(rank).toBe(constants_1.ReferralRank.TA_FIELD_MARSHAL);
    });
    it("should return null rank when personalATC is below minimum requirement", () => {
        const referrals = [
            { id: "1", referralRank: constants_1.ReferralRank.TA_CAPTAIN },
            { id: "2", referralRank: constants_1.ReferralRank.TA_CAPTAIN },
            { id: "3", referralRank: constants_1.ReferralRank.TA_CAPTAIN },
        ];
        const criteria = {
            personalATC: 0,
            communityATC: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT].communityATC,
            referrals: [
                ...referrals,
                ...Array.from({
                    length: constants_1.RANK_REQUIREMENTS[constants_1.ReferralRank.TA_LIEUTENANT]
                        .communitySize - referrals.length,
                }, (_, i) => ({
                    id: `${i + 4}`,
                    referralRank: constants_1.ReferralRank.TA_RECRUIT,
                })),
            ],
            isTestReferralTracking: false,
        };
        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        // Should have null rank due to insufficient personalATC
        expect(rank).toBeNull();
        // maxRankFromReferrals should still be calculated correctly
        expect(maxRankFromReferrals).toBe(constants_1.ReferralRank.TA_MAJOR);
    });
});
