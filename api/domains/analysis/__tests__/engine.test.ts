import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  analyzeSemanticGaps,
  computeLocalTextSimilarity,
  evaluateCosmoReadiness
} from "../engine.js";
import { generateFallbackEmbedding } from "../../../services/embedding.js";

// Mock the LLM Gateway
vi.mock("../../../services/llmGateway.js", () => {
  return {
    callLlm: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        intents: [
          { name: "custom_intent", query: "Does it work?", weight: 1.0, recommendation: "Explain details." }
        ]
      })
    })
  };
});

// Mock the embedding service
vi.mock("../../../services/embedding.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../services/embedding.js")>();
  return {
    ...original,
    generateEmbedding: vi.fn().mockImplementation(async (text: string | string[]) => {
      if (Array.isArray(text)) {
        return text.map((t) => original.generateFallbackEmbedding(t));
      }
      return original.generateFallbackEmbedding(text);
    })
  };
});

describe("Semantic Analysis Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("computeLocalTextSimilarity", () => {
    it("should return a similarity score in the typical embedding range [0.35, 0.90]", () => {
      const sim = computeLocalTextSimilarity(
        "Premium Magnesium Glycinate Supplement for sleep and muscle recovery",
        "What supplement is best for sleep and insomnia relief?"
      );
      expect(sim).toBeGreaterThanOrEqual(0.35);
      expect(sim).toBeLessThanOrEqual(0.90);
    });

    it("should return 0.35 when there is zero non-stopword token overlap", () => {
      const sim = computeLocalTextSimilarity("completely different text here", "supplement insomnia");
      expect(sim).toBe(0.35);
    });

    it("should return higher similarity for higher keyword overlap", () => {
      const lowOverlap = computeLocalTextSimilarity(
        "Magnesium supplement for health benefits",
        "What is the dosage of this supplement?"
      );
      const highOverlap = computeLocalTextSimilarity(
        "Magnesium supplement dosage details and absorption guidelines",
        "What is the dosage of this supplement?"
      );
      expect(highOverlap).toBeGreaterThan(lowOverlap);
    });
  });

  describe("evaluateCosmoReadiness", () => {
    it("should score 0 for empty or generic text with no Cosmo cues", () => {
      expect(evaluateCosmoReadiness("hello world")).toBe(0);
    });

    it("should award points for target demographic cues", () => {
      const score = evaluateCosmoReadiness("ideal for athletes and active fitness routines");
      expect(score).toBeGreaterThan(0);
    });

    it("should award points for use cases, trust signals, and differentiation", () => {
      const text = `
        Premium quality supplement.
        Directions: Take 2 capsules daily in the morning with a meal.
        Third-party tested in a GMP certified facility. Non-GMO.
        Unlike generic brands, our formula offers superior absorption.
      `;
      const score = evaluateCosmoReadiness(text);
      expect(score).toBeGreaterThan(50); // should hit multiple categories
    });
  });

  describe("analyzeSemanticGaps", () => {
    it("should correctly identify category-specific intents and fallback when using fallback vector", async () => {
      const text = "Premium Magnesium Glycinate Supplement for sleep and muscle recovery. GMP certified facility. Take daily before sleep.";
      const cleaned = {
        text: text.toLowerCase(),
        source: {
          asin: "B00TEST",
          title: "Premium Magnesium Glycinate",
          bullets: [],
          description: "",
          brand: "NutraWell",
          category: "Health & Household",
          subcategory: "Vitamins & Dietary Supplements",
          images: [],
          price: 19.99,
          rating: 4.5,
          reviewCount: 100,
          attributes: {}
        }
      };

      // Generate a mock listing fallback vector
      const fallbackVector = generateFallbackEmbedding(cleaned.text);

      const result = await analyzeSemanticGaps(fallbackVector, cleaned);

      expect(result).toHaveProperty("rufusScore");
      expect(result).toHaveProperty("cosmoScore");
      expect(result.semanticGaps.length).toBeGreaterThan(0);
      expect(result.predictedIntents.length).toBeGreaterThan(0);
      expect(result.intentCoverage.overall).toBeGreaterThanOrEqual(0);
      expect(result.intentCoverage.overall).toBeLessThanOrEqual(100);
      expect(Object.keys(result.intentCoverage.byJourney)).toContain("usage");

      // Verify that Rufus score is in range 0-100
      expect(result.rufusScore).toBeGreaterThanOrEqual(0);
      expect(result.rufusScore).toBeLessThanOrEqual(100);

      // Verify COSMO score calculation combines Rufus and structural cues
      expect(result.cosmoScore).toBeGreaterThanOrEqual(0);
      expect(result.cosmoScore).toBeLessThanOrEqual(100);
    });
  });
});
