import { describe, it, expect, vi } from "vitest";
import {
  buildKeywordInventory,
  computeLocalTextSimilarity,
  evaluateCosmoReadiness,
  extractAttributeInventory,
  resolveIntentTaxonomy,
  scoreIntents,
  buildIntentCoverage,
  buildPredictedIntents,
  buildSemanticGaps,
} from "../intentEngine.js";
import { generateFallbackEmbedding } from "../../../services/embedding.js";

vi.mock("../../../services/llmGateway.js", () => {
  return {
    callLlm: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        intents: [
          {
            name: "custom_intent",
            query: "Does it work?",
            weight: 1,
            recommendation: "Explain details.",
            journey: "informational",
            signals: ["detail", "quality"],
          },
        ],
      }),
    }),
  };
});

vi.mock("../../../services/embedding.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../../services/embedding.js")>();
  return {
    ...original,
    generateEmbedding: vi.fn().mockImplementation(async (text: string | string[]) => {
      if (Array.isArray(text)) {
        return text.map((t) => original.generateFallbackEmbedding(t));
      }
      return original.generateFallbackEmbedding(text);
    }),
  };
});

describe("Intent Engine", () => {
  describe("extractAttributeInventory", () => {
    it("should detect dosage, form, certifications, and timing", () => {
      const text =
        "Take 2 capsules daily in the morning. GMP certified, third-party tested, vegan, safe for daily use.";
      const inventory = extractAttributeInventory(text);
      expect(inventory.dosage.length).toBeGreaterThan(0);
      expect(inventory.form).toContain("capsules");
      expect(inventory.certifications.length).toBeGreaterThan(0);
      expect(inventory.timing).toContain("morning");
      expect(inventory.safety).toContain("safe");
    });
  });

  describe("computeLocalTextSimilarity", () => {
    it("should score higher overlap higher", () => {
      const low = computeLocalTextSimilarity("random furniture", "magnesium dosage");
      const high = computeLocalTextSimilarity(
        "Premium Magnesium Glycinate 400mg dosage",
        "What is the dosage of this magnesium?"
      );
      expect(high).toBeGreaterThan(low);
    });
  });

  describe("resolveIntentTaxonomy", () => {
    it("should return category-specific taxonomy for supplements", async () => {
      const taxonomy = await resolveIntentTaxonomy(
        "Health & Household",
        "Vitamins & Dietary Supplements",
        "Magnesium Glycinate"
      );
      expect(taxonomy.length).toBeGreaterThan(10);
      expect(taxonomy.some((d) => d.name === "sleep_support")).toBe(true);
      expect(taxonomy[0].journey).toBeDefined();
      expect(taxonomy[0].signals.length).toBeGreaterThan(0);
    });

    it("should generate dynamic taxonomy for unknown categories", async () => {
      const taxonomy = await resolveIntentTaxonomy(
        "Obscure Widgets",
        "Custom Gadgets",
        "Widget Pro 3000"
      );
      expect(taxonomy.length).toBeGreaterThan(0);
    });
  });

  describe("scoreIntents", () => {
    it("should score intents with hybrid signals and return coverage data", async () => {
      const text =
        "Premium Magnesium Glycinate 400mg capsules. Third-party tested. Take daily in the morning for sleep and muscle recovery.";
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
          attributes: {},
        },
      };
      const embedding = generateFallbackEmbedding(cleaned.text);
      const results = await scoreIntents(embedding, cleaned);

      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty("compositeScore");
      expect(results[0]).toHaveProperty("matchedSignals");
      expect(results[0]).toHaveProperty("missingSignals");

      // Sleep intent should have matched sleep signal
      const sleepIntent = results.find((r) => r.dimension.name === "sleep_support");
      expect(sleepIntent).toBeDefined();
      expect(sleepIntent!.matchedSignals).toContain("sleep");
    });
  });

  describe("buildPredictedIntents / buildIntentCoverage / buildSemanticGaps", () => {
    it("should produce structured coverage and gap objects", async () => {
      const text = "Premium supplement. Safe daily use.";
      const cleaned = {
        text: text.toLowerCase(),
        source: {
          asin: "B00TEST",
          title: "Premium Supplement",
          bullets: [],
          description: "",
          brand: "Brand",
          category: "Health & Household",
          subcategory: "Vitamins & Dietary Supplements",
          images: [],
          price: 19.99,
          rating: 4.5,
          reviewCount: 100,
          attributes: {},
        },
      };
      const embedding = generateFallbackEmbedding(cleaned.text);
      const results = await scoreIntents(embedding, cleaned);

      const predicted = buildPredictedIntents(results);
      expect(predicted[0]).toHaveProperty("journey");
      expect(predicted[0]).toHaveProperty("coverage");
      expect(predicted[0]).toHaveProperty("signals");

      const coverage = buildIntentCoverage(results);
      expect(coverage.overall).toBeGreaterThanOrEqual(0);
      expect(coverage.overall).toBeLessThanOrEqual(100);
      expect(Object.keys(coverage.byJourney)).toContain("usage");

      const gaps = buildSemanticGaps(results);
      expect(gaps.every((g) => g.priority)).toBe(true);
    });
  });

  describe("evaluateCosmoReadiness", () => {
    it("should award points for demographics, use cases, trust, and differentiation", () => {
      const text =
        "Ideal for athletes. Take 2 capsules daily in the morning. Third-party tested in a GMP certified facility. Unlike generic brands, superior absorption.";
      const score = evaluateCosmoReadiness(text);
      expect(score).toBeGreaterThan(50);
    });
  });
});
