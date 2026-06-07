import { describe, it, expect, vi, beforeEach } from "vitest";
import * as ppcPlannerService from "../ppcPlannerService.js";
import * as listingRepo from "../../db/repositories/listingRepository.js";
import * as analysisRepo from "../../db/repositories/analysisRepository.js";

vi.mock("../../db/repositories/listingRepository.js", () => {
  return {
    getLatestByProspectId: vi.fn(),
  };
});

vi.mock("../../db/repositories/analysisRepository.js", () => {
  return {
    getLatestByProspectId: vi.fn(),
  };
});

describe("ppcPlannerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMockOrganicRank", () => {
    it("should return a deterministic rank between 1 and 48", () => {
      const rank1 = ppcPlannerService.getMockOrganicRank("test keyword 1");
      const rank2 = ppcPlannerService.getMockOrganicRank("test keyword 1");
      const rank3 = ppcPlannerService.getMockOrganicRank("another keyword");

      expect(rank1).toBe(rank2);
      expect(rank1).toBeGreaterThanOrEqual(1);
      expect(rank1).toBeLessThanOrEqual(48);
      expect(rank3).toBeGreaterThanOrEqual(1);
      expect(rank3).toBeLessThanOrEqual(48);
    });
  });

  describe("generateNegatives", () => {
    it("should exclude matches for detected form and suggest others", () => {
      const title = "Acme Organic Magnesium Capsules 500mg";
      const description = "Pure veggie caps for daily nutrition.";
      const bullets = ["Take 1 capsule daily.", "Allergen free."];
      const gaps = [{ dimension: "organic_certification", currentScore: 0 }];

      const negatives = ppcPlannerService.generateNegatives(title, description, bullets, gaps);

      // Capsule is detected, so it should suggest liquid, powder, gummy, gummies, tablet as negatives
      expect(negatives).toContain("powder");
      expect(negatives).toContain("liquid");
      expect(negatives).toContain("gummy");
      expect(negatives).toContain("gummies");
      expect(negatives).toContain("tablet");
      
      // Should also suggest synthetic / artificial since organic_certification is 0
      expect(negatives).toContain("synthetic");
      expect(negatives).toContain("artificial");

      // Capsule itself should NOT be a negative
      expect(negatives).not.toContain("capsule");
    });
  });

  describe("generatePpcPlan", () => {
    it("should fetch listing and analysis and return grouped ad groups with negatives", async () => {
      const mockListing = {
        id: 1,
        prospectId: 10,
        asin: "B07ABC1234",
        title: "Acme Super Greens Powder",
        description: "Organic supergreens powder mix.",
        bullets: ["Drink 1 scoop daily."],
        brand: "Acme Greens",
        category: "Supergreens Powder",
        createdAt: "2026-06-07T12:00:00Z",
      };

      const mockAnalysis = {
        id: 1,
        prospectId: 10,
        listingId: 1,
        overallScore: 68,
        rufusScore: 50,
        cosmoScore: 45,
        semanticScore: 40,
        contentScore: 42,
        visualScore: 30,
        gaps: JSON.stringify([]),
        copyPpcKeywords: JSON.stringify([
          { intent: "Bloating Relief", keyword: "greens powder for bloating", difficulty: "Low", searchVolume: 1000, bidEstimate: 1.00 },
          { intent: "Daily Routine", keyword: "daily greens mix", difficulty: "Medium", searchVolume: 2000, bidEstimate: 1.50 }
        ]),
        createdAt: "2026-06-07T12:00:00Z",
      };

      vi.mocked(listingRepo.getLatestByProspectId).mockResolvedValue(mockListing as any);
      vi.mocked(analysisRepo.getLatestByProspectId).mockResolvedValue(mockAnalysis as any);

      const plan = await ppcPlannerService.generatePpcPlan(10, {
        dailyBudget: 60,
        biddingStrategy: "fixedBids",
        rankBooster: true,
      });

      expect(plan.campaignName).toBe("SP_Manual_Synergy_Acme_Greens_B07ABC1234");
      expect(plan.dailyBudget).toBe(60);
      expect(plan.biddingStrategy).toBe("fixedBids");
      expect(plan.adGroups.length).toBe(2);
      expect(plan.adGroups[0].name).toBe("Intent_Bloating_Relief");
      expect(plan.negativeKeywords).toContain("capsule"); // Powder detected, so capsule should be negative
      expect(plan.negativeKeywords).not.toContain("powder");
    });
  });
});
