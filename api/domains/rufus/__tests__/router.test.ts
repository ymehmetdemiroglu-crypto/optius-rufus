import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

vi.mock("../../db/drizzle.js", () => {
  return {
    db: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    },
  };
});

vi.mock("../../listing/repository", () => {
  return {
    getLatestByProspectId: vi.fn(),
  };
});

vi.mock("../../../services/competitor", () => {
  return {
    fetchCompetitors: vi.fn(),
  };
});

vi.mock("../service", () => {
  return {
    simulateRufusSOV: vi.fn(),
  };
});

vi.mock("../../rufus/repository.js", () => {
  return {
    createQuery: vi.fn(),
    createQueryRun: vi.fn(),
    getSOVHistoryForProspect: vi.fn(),
  };
});

import * as listingRepo from "../../listing/repository.js";
import { fetchCompetitors } from "../../../services/competitor.js";
import { simulateRufusSOV } from "../service.js";
import * as rufusRepo from '../../rufus/repository.js';

describe("rufusTrackerRouter", () => {
  let caller: any;

  beforeAll(async () => {
    const { appRouter } = await import("../../../trpc/router.js");
    caller = appRouter.createCaller({ req: new Request("http://localhost/api/trpc") } as any);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("runSOVSimulation", () => {
    it("should run Rufus simulation and save new metrics to the database", async () => {
      const mockListing = {
        id: 1,
        prospectId: 10,
        asin: "B07ABC1234",
        title: "Acme Super Greens",
        bullets: ["Bullet 1", "Bullet 2"],
        description: "Greens powder.",
        aPlusText: "APlus info.",
        brand: "Acme",
        category: "Health & Household",
      };

      const mockCompetitors = [
        { asin: "B09DEF5678", title: "Comp 1", brand: "CompBrand", price: 20, rating: 4.5, reviewCount: 1000, score: 70 }
      ];

      const mockSimulationResult = {
        questions: [
          {
            queryText: "Is it safe?",
            rankings: [{ asin: "target_product", rank: 1, recommended: true, reason: "Good copy." }]
          }
        ],
        sovPercent: 100,
        cosmoReadinessScore: 85,
        qaCoverageRatio: 78,
        rufusAnsweredRate: 90,
      };

      vi.mocked(listingRepo.getLatestByProspectId).mockResolvedValue(mockListing as any);
      vi.mocked(fetchCompetitors).mockResolvedValue(mockCompetitors as any);
      vi.mocked(simulateRufusSOV).mockResolvedValue(mockSimulationResult as any);
      vi.mocked(rufusRepo.createQuery).mockResolvedValue({ id: 100 } as any);
      vi.mocked(rufusRepo.createQueryRun).mockResolvedValue({ id: 200 } as any);

      const result = await caller.rufusTracker.runSOVSimulation({
        prospectId: 10,
        category: "Health & Household",
      });

      expect(listingRepo.getLatestByProspectId).toHaveBeenCalledWith(10);
      expect(fetchCompetitors).toHaveBeenCalledWith("B07ABC1234", "Health & Household");
      expect(simulateRufusSOV).toHaveBeenCalled();
      
      expect(rufusRepo.createQuery).toHaveBeenCalledWith({
        prospectId: 10,
        queryText: "Is it safe?",
        category: "Health & Household",
      });

      expect(rufusRepo.createQueryRun).toHaveBeenCalledWith({
        queryId: 100,
        asinRankings: mockSimulationResult.questions[0].rankings,
        sovPercent: 100,
        cosmoReadinessScore: 85,
        qaCoverageRatio: 78,
        rufusAnsweredRate: 90,
      });

      expect(result).toEqual({
        success: true,
        sovPercent: 100,
        questions: mockSimulationResult.questions,
        cosmoReadinessScore: 85,
        qaCoverageRatio: 78,
        rufusAnsweredRate: 90,
      });
    });
  });

  describe("getSOVHistory", () => {
    it("should fetch history and calculate timeline and averages", async () => {
      const mockHistoryRows = [
        {
          id: 100,
          queryText: "Is it organic?",
          category: "Health & Household",
          createdAt: new Date("2026-06-07T12:00:00Z"),
          asinRankings: [{ asin: "target_product", rank: 1, recommended: true, reason: "Organic claims." }],
          sovPercent: 80,
          cosmoReadinessScore: 75,
          qaCoverageRatio: 70,
          rufusAnsweredRate: 85,
        }
      ];

      vi.mocked(rufusRepo.getSOVHistoryForProspect).mockResolvedValue(mockHistoryRows as any);

      const result = await caller.rufusTracker.getSOVHistory({ prospectId: 10 });

      expect(rufusRepo.getSOVHistoryForProspect).toHaveBeenCalledWith(10);
      expect(result.currentSOV).toBe(80);
      expect(result.currentCosmoReadiness).toBe(75);
      expect(result.currentQaCoverage).toBe(70);
      expect(result.currentRufusAnsweredRate).toBe(85);
      expect(result.history.length).toBe(1);
      expect(result.timeline).toEqual([{ date: "2026-06-07", sovPercent: 80 }]);
    });
  });
});
