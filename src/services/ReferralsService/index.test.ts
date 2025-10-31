import { IRankCriteria, IUser } from "src/config/interfaces";
import ReferralsService from ".";
import { RANK_REQUIREMENTS, ReferralRank } from "src/config/constants";

describe("ReferralsService.computeRank", () => {
    const service = ReferralsService;

    it("should return TA_RECRUIT when only personal ATC criteria is met", () => {
        const criteria: IRankCriteria = {
            personalATC: RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC,
            communityATC: 0,
            referrals: [],
            isTestReferralTracking: false,
            isFirstDepositMade: true,
        };

        const { rank, maxRankFromReferrals } = service.computeRank(criteria);

        expect(rank).toBe(ReferralRank.TA_RECRUIT);
        expect(maxRankFromReferrals).toBe(ReferralRank.TA_RECRUIT);
    });

    it("should consider referral ranks requirement for ranks above TA_RECRUIT", () => {
        const referrals: IUser[] = [
            { id: "1", referralRank: ReferralRank.TA_LIEUTENANT } as IUser,
            { id: "2", referralRank: ReferralRank.TA_RECRUIT } as IUser,
            { id: "3", referralRank: ReferralRank.TA_RECRUIT } as IUser,
        ];

        const criteria: IRankCriteria = {
            personalATC: RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC,
            communityATC:
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communityATC,
            referrals: [
                ...referrals,
                ...(Array.from(
                    {
                        length:
                            RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT]
                                .communitySize - referrals.length,
                    },
                    (_, i) => ({
                        id: `${i + 4}`,
                        referralRank: ReferralRank.TA_RECRUIT,
                    })
                ) as IUser[]),
            ],
            isTestReferralTracking: false,
            isFirstDepositMade: true,
        };

        const { rank, maxRankFromReferrals } = service.computeRank(criteria);

        expect(rank).not.toBe(ReferralRank.TA_CAPTAIN);
        expect(rank).toBe(ReferralRank.TA_LIEUTENANT);
        expect(maxRankFromReferrals).toBe(ReferralRank.TA_LIEUTENANT);
    });

    it("should use testCommunitySize when isTestReferralTracking is true", () => {
        const testCommunitySize =
            RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].testCommunitySize;
        const referrals: IUser[] = Array.from(
            { length: testCommunitySize + 20 },
            (_, i) => ({
                id: `${i + 1}`,
                referralRank: ReferralRank.TA_GENERAL,
            })
        ) as IUser[];

        const criteria: IRankCriteria = {
            personalATC:
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC,
            communityATC:
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communityATC,
            referrals,
            isTestReferralTracking: true,
            isFirstDepositMade: true,
        };

        const { rank, maxRankFromReferrals } = service.computeRank(criteria);

        expect(rank).toBe(ReferralRank.TA_LIEUTENANT);
        expect(maxRankFromReferrals).toBe(ReferralRank.TA_FIELD_MARSHAL);
    });

    it("should correctly determine TA_CAPTAIN rank when all criteria are met", () => {
        const referrals: IUser[] = [
            { id: "1", referralRank: ReferralRank.TA_LIEUTENANT } as IUser,
            { id: "2", referralRank: ReferralRank.TA_CAPTAIN } as IUser,
            { id: "3", referralRank: ReferralRank.TA_MAJOR } as IUser,
        ];

        const criteria: IRankCriteria = {
            personalATC: RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC,
            communityATC:
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communityATC,
            referrals: [
                ...referrals,
                ...(Array.from(
                    {
                        length:
                            RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN]
                                .communitySize - referrals.length,
                    },
                    (_, i) => ({
                        id: `${i + 4}`,
                        referralRank: ReferralRank.TA_RECRUIT,
                    })
                ) as IUser[]),
            ],
            isTestReferralTracking: false,
            isFirstDepositMade: true,
        };

        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        expect(rank).toBe(ReferralRank.TA_CAPTAIN);
        expect(maxRankFromReferrals).toBe(ReferralRank.TA_CAPTAIN);
    });

    it("should qualify for specific rank with exactly 3 referrals at required rank", () => {
        const referrals: IUser[] = [
            { id: "1", referralRank: ReferralRank.TA_CAPTAIN } as IUser,
            { id: "2", referralRank: ReferralRank.TA_CAPTAIN } as IUser,
            { id: "3", referralRank: ReferralRank.TA_CAPTAIN } as IUser,
        ];

        const criteria: IRankCriteria = {
            personalATC: RANK_REQUIREMENTS[ReferralRank.TA_MAJOR].personalATC,
            communityATC: RANK_REQUIREMENTS[ReferralRank.TA_MAJOR].communityATC,
            referrals: [
                ...referrals,
                ...(Array.from(
                    {
                        length:
                            RANK_REQUIREMENTS[ReferralRank.TA_MAJOR]
                                .communitySize - referrals.length,
                    },
                    (_, i) => ({
                        id: `${i + 4}`,
                        referralRank: ReferralRank.TA_RECRUIT,
                    })
                ) as IUser[]),
            ],
            isTestReferralTracking: false,
            isFirstDepositMade: true,
        };

        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        expect(maxRankFromReferrals).toBe(ReferralRank.TA_MAJOR);
        expect(rank).toBe(ReferralRank.TA_MAJOR);
    });

    it("should limit rank when user has less than 3 referrals total", () => {
        const referrals: IUser[] = [
            { id: "1", referralRank: ReferralRank.TA_RECRUIT } as IUser,
            { id: "2", referralRank: ReferralRank.TA_LIEUTENANT } as IUser,
        ];

        const criteria: IRankCriteria = {
            personalATC:
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].personalATC,
            communityATC:
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communityATC,
            referrals,
            isTestReferralTracking: false,
            isFirstDepositMade: true,
        };

        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        // With only 2 referrals, they don't meet any rank above TA_RECRUIT for referral requirements
        expect(maxRankFromReferrals).toBe(ReferralRank.TA_RECRUIT);
        expect(rank).toBe(ReferralRank.TA_RECRUIT);
    });

    it("should determine correct rank with mixed referral ranks", () => {
        const referrals: IUser[] = [
            { id: "1", referralRank: ReferralRank.TA_CAPTAIN } as IUser,
            { id: "2", referralRank: ReferralRank.TA_MAJOR } as IUser,
            { id: "3", referralRank: ReferralRank.TA_COLONEL } as IUser,
        ];

        const criteria: IRankCriteria = {
            personalATC: RANK_REQUIREMENTS[ReferralRank.TA_COLONEL].personalATC,
            communityATC:
                RANK_REQUIREMENTS[ReferralRank.TA_COLONEL].communityATC,
            referrals: [
                ...referrals,
                ...(Array.from(
                    {
                        length:
                            RANK_REQUIREMENTS[ReferralRank.TA_COLONEL]
                                .communitySize - referrals.length,
                    },
                    (_, i) => ({
                        id: `${i + 4}`,
                        referralRank: ReferralRank.TA_RECRUIT,
                    })
                ) as IUser[]),
            ],
            isTestReferralTracking: false,
            isFirstDepositMade: true,
        };

        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        expect(maxRankFromReferrals).toBe(ReferralRank.TA_MAJOR);
        expect(rank).toBe(ReferralRank.TA_MAJOR);
    });

    it("should correctly handle referrals at highest possible rank", () => {
        const referrals: IUser[] = Array.from(
            { length: 3 },
            () =>
                ({
                    id: "high-rank",
                    referralRank: ReferralRank.TA_FIELD_MARSHAL,
                }) as IUser
        );

        const criteria: IRankCriteria = {
            personalATC:
                RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL].personalATC,
            communityATC:
                RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL].communityATC,
            referrals: [
                ...referrals,
                ...(Array.from(
                    {
                        length:
                            RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL]
                                .communitySize - referrals.length,
                    },
                    (_, i) => ({
                        id: `${i + 4}`,
                        referralRank: ReferralRank.TA_RECRUIT,
                    })
                ) as IUser[]),
            ],
            isTestReferralTracking: false,
            isFirstDepositMade: true,
        };

        const { rank, maxRankFromReferrals } = service.computeRank(criteria);
        expect(maxRankFromReferrals).toBe(ReferralRank.TA_FIELD_MARSHAL);
        expect(rank).toBe(ReferralRank.TA_FIELD_MARSHAL);
    });

    it("should return null rank when personalATC is below minimum requirement", () => {
        const referrals: IUser[] = [
            { id: "1", referralRank: ReferralRank.TA_CAPTAIN } as IUser,
            { id: "2", referralRank: ReferralRank.TA_CAPTAIN } as IUser,
            { id: "3", referralRank: ReferralRank.TA_CAPTAIN } as IUser,
        ];

        const criteria: IRankCriteria = {
            personalATC: 0,
            communityATC:
                RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT].communityATC,
            referrals: [
                ...referrals,
                ...(Array.from(
                    {
                        length:
                            RANK_REQUIREMENTS[ReferralRank.TA_LIEUTENANT]
                                .communitySize - referrals.length,
                    },
                    (_, i) => ({
                        id: `${i + 4}`,
                        referralRank: ReferralRank.TA_RECRUIT,
                    })
                ) as IUser[]),
            ],
            isTestReferralTracking: false,
            isFirstDepositMade: false,
        };

        const { rank, maxRankFromReferrals } = service.computeRank(criteria);

        // Should have null rank due to insufficient personalATC
        expect(rank).toBeNull();

        // maxRankFromReferrals should still be calculated correctly
        expect(maxRankFromReferrals).toBe(ReferralRank.TA_MAJOR);
    });

    it("should return null rank when isFirstDepositMade is false for TA_RECRUIT", () => {
        const criteria: IRankCriteria = {
            personalATC: RANK_REQUIREMENTS[ReferralRank.TA_RECRUIT].personalATC,
            communityATC: 0,
            referrals: [],
            isTestReferralTracking: false,
            isFirstDepositMade: false,
        };

        const { rank, maxRankFromReferrals } = service.computeRank(criteria);

        expect(rank).toBeNull();
        expect(maxRankFromReferrals).toBe(ReferralRank.TA_RECRUIT);
    });

    it("should return null rank when isFirstDepositMade is false for TA_CAPTAIN", () => {
        const referrals: IUser[] = [
            { id: "1", referralRank: ReferralRank.TA_LIEUTENANT } as IUser,
            { id: "2", referralRank: ReferralRank.TA_CAPTAIN } as IUser,
            { id: "3", referralRank: ReferralRank.TA_MAJOR } as IUser,
        ];

        const criteria: IRankCriteria = {
            personalATC: RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].personalATC,
            communityATC:
                RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN].communityATC,
            referrals: [
                ...referrals,
                ...(Array.from(
                    {
                        length:
                            RANK_REQUIREMENTS[ReferralRank.TA_CAPTAIN]
                                .communitySize - referrals.length,
                    },
                    (_, i) => ({
                        id: `${i + 4}`,
                        referralRank: ReferralRank.TA_RECRUIT,
                    })
                ) as IUser[]),
            ],
            isTestReferralTracking: false,
            isFirstDepositMade: false,
        };

        const { rank, maxRankFromReferrals } = service.computeRank(criteria);

        expect(rank).toBeNull();
        expect(maxRankFromReferrals).toBe(ReferralRank.TA_CAPTAIN);
    });

    it("should return null rank when isFirstDepositMade is false for TA_FIELD_MARSHAL", () => {
        const referrals: IUser[] = Array.from(
            { length: 3 },
            () =>
                ({
                    id: "high-rank",
                    referralRank: ReferralRank.TA_FIELD_MARSHAL,
                }) as IUser
        );

        const criteria: IRankCriteria = {
            personalATC:
                RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL].personalATC,
            communityATC:
                RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL].communityATC,
            referrals: [
                ...referrals,
                ...(Array.from(
                    {
                        length:
                            RANK_REQUIREMENTS[ReferralRank.TA_FIELD_MARSHAL]
                                .communitySize - referrals.length,
                    },
                    (_, i) => ({
                        id: `${i + 4}`,
                        referralRank: ReferralRank.TA_RECRUIT,
                    })
                ) as IUser[]),
            ],
            isTestReferralTracking: false,
            isFirstDepositMade: false,
        };

        const { rank, maxRankFromReferrals } = service.computeRank(criteria);

        expect(rank).toBeNull();
        expect(maxRankFromReferrals).toBe(ReferralRank.TA_FIELD_MARSHAL);
    });
});
