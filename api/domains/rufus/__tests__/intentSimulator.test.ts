import { describe, it, expect } from "vitest";
import { generateGroundedRufusSimulation } from "../intentSimulator.js";
import type { AnalysisResult, RawListingData } from "../../../pipeline/pipeline.types.js";

const listing: RawListingData = {
  asin: "B00TEST",
  title: "NutraWell Magnesium Glycinate 400mg",
  bullets: ["Supports sleep and muscle recovery."],
  description: "",
  brand: "NutraWell",
  category: "Health & Household",
  subcategory: "Vitamins & Dietary Supplements",
  images: [],
  price: 24.99,
  rating: 4.6,
  reviewCount: 3420,
  attributes: {},
};

const analysis: AnalysisResult = {
  rufusScore: 42,
  cosmoScore: 38,
  semanticGaps: [
    { dimension: "sleep_support", currentScore: 0.4, targetScore: 0.85, gap: 0.45, priority: "critical", recommendation: "Add sleep claims." },
    { dimension: "specific_use_cases", currentScore: 0.5, targetScore: 0.85, gap: 0.35, priority: "high", recommendation: "Add timing." },
    { dimension: "third_party_tested", currentScore: 0.6, targetScore: 0.85, gap: 0.25, priority: "high", recommendation: "Add testing." },
  ],
  predictedIntents: [
    { dimension: "sleep_support", query: "Which magnesium is best for sleep?", journey: "usage", coverage: 40, weight: 0.08, priority: "critical", signals: ["sleep"], missingSignals: ["insomnia", "melatonin"] },
    { dimension: "specific_use_cases", query: "When should I take magnesium?", journey: "usage", coverage: 50, weight: 0.04, priority: "high", signals: ["daily"], missingSignals: ["morning", "bedtime"] },
    { dimension: "third_party_tested", query: "Is this third-party tested?", journey: "safety_trust", coverage: 60, weight: 0.05, priority: "high", signals: ["tested"], missingSignals: ["lab", "coa"] },
  ],
  intentCoverage: { overall: 50, byJourney: { informational: 50, transactional: 50, comparison: 50, safety_trust: 60, usage: 45 }, totalIntents: 3, criticalCount: 1, highCount: 2 },
};

describe("Grounded Rufus Intent Simulator", () => {
  it("should generate scenarios and audits grounded in predicted intents", () => {
    const result = generateGroundedRufusSimulation(analysis, listing);
    expect(result.scenarios.length).toBe(3);
    expect(result.competitorAudit.length).toBe(3);

    const firstScenario = result.scenarios[0];
    expect(firstScenario.buyerQuestion).toBe(analysis.predictedIntents[0].query);
    expect(firstScenario.failReason.length).toBeGreaterThan(0);
    expect(firstScenario.rufusAnswer).toContain(listing.brand);

    const firstAudit = result.competitorAudit[0];
    expect(firstAudit.query).toBe(firstScenario.buyerQuestion);
    expect(firstAudit.yourGap.length).toBeGreaterThan(0);
    expect(firstAudit.competitorAdvantage.length).toBeGreaterThan(0);
  });

  it("should use real competitor names when available", () => {
    const competitors = [
      { asin: "B07ABC", title: "Nature's Bounty Magnesium", brand: "Nature's Bounty", price: 19.99, rating: 4.5, reviewCount: 1000, score: 72, embeddingSimilarity: 0 },
      { asin: "B09DEF", title: "Doctor's Best Magnesium", brand: "Doctor's Best", price: 21.5, rating: 4.7, reviewCount: 900, score: 78, embeddingSimilarity: 0 },
    ];
    const result = generateGroundedRufusSimulation(analysis, listing, competitors);
    expect(result.scenarios[0].competitorName).toBe("Nature's Bounty");
    expect(result.competitorAudit[1].competitorName).toBe("Doctor's Best");
  });
});
