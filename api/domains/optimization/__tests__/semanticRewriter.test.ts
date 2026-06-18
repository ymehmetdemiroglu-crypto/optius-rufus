import { describe, it, expect, vi } from "vitest";
import {
  buildKeywordInventory,
  generateSemanticRewrittenContent,
  verifyKeywordPreservation,
} from "../semanticRewriter.js";
import type { RawListingData, SemanticGap } from "../../../pipeline/pipeline.types.js";

vi.mock("../../../services/llmGateway.js", () => {
  return {
    callLlm: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        title: "NutraWell Magnesium Glycinate 400mg — Sleep & Muscle Recovery Support, Third-Party Tested",
        bullets: [
          "Clinically-Formulated Magnesium Glycinate: 400mg per serving for superior absorption and gentle digestion.",
          "Supports Restful Sleep & Muscle Recovery: Ideal for athletes and active adults who need nightly relaxation and post-workout relief.",
          "Third-Party Tested & Certified: Made in a GMP-certified facility, non-GMO, vegan, and gluten-free.",
          "Optimal Timing & Dosage: Take 2 capsules daily in the morning or 30 minutes before bed for best results.",
          "180 Capsules — 3-Month Supply: Exceptional value with every batch tested for purity and potency.",
        ],
        description: "<p>NutraWell Magnesium Glycinate delivers 400mg of highly absorbable magnesium to support sleep, relaxation, and muscle recovery.</p>",
        qas: [
          { question: "Is this safe for daily use?", optimizedAnswer: "Yes. It is formulated for daily use with clean, tested ingredients.", category: "safety", priority: "critical" },
          { question: "When should I take it?", optimizedAnswer: "Take 2 capsules in the morning or 30 minutes before bed.", category: "usage", priority: "high" },
          { question: "Is it vegan?", optimizedAnswer: "Yes, it is vegan and gluten-free.", category: "safety", priority: "medium" },
          { question: "How is this different?", optimizedAnswer: "It uses glycinate for superior absorption compared to oxide forms.", category: "comparison", priority: "high" },
          { question: "When will I see results?", optimizedAnswer: "Most users notice benefits within 1-2 weeks.", category: "usage", priority: "medium" },
        ],
        variantB: {
          label: "Benefit-Focused Variant",
          title: "Wake Up Refreshed & Cramp-Free — NutraWell Magnesium Glycinate 400mg",
          bullets: [
            "Deep, Restful Sleep: Fall asleep faster and wake up recovered without grogginess.",
            "Cramp & Soreness Relief: Trusted by athletes for post-workout muscle recovery.",
            "Clean, Tested Formula: Third-party tested, non-GMO, vegan, and gentle on the stomach.",
            "Simple Morning or Night Routine: Just 2 capsules daily fits any schedule.",
            "3-Month Supply, Lasting Value: 180 capsules per bottle for consistent daily support.",
          ],
          description: "<p>Experience deeper sleep and fewer cramps with NutraWell Magnesium Glycinate.</p>",
        },
      }),
    }),
  };
});

const listing: RawListingData = {
  asin: "B00TEST",
  title: "NutraWell Magnesium Glycinate 400mg, 180 Capsules",
  bullets: [
    "High absorption magnesium glycinate.",
    "Supports sleep and relaxation.",
    "Third-party tested.",
    "180 capsules.",
    "Non-GMO.",
  ],
  description: "<p>Premium magnesium glycinate supplement.</p>",
  brand: "NutraWell",
  category: "Health & Household",
  subcategory: "Vitamins & Dietary Supplements",
  images: [],
  price: 24.99,
  rating: 4.6,
  reviewCount: 3420,
  attributes: {},
};

const gaps: SemanticGap[] = [
  { dimension: "sleep_support", currentScore: 0.4, targetScore: 0.85, gap: 0.45, priority: "critical", recommendation: "Add sleep support claims." },
  { dimension: "specific_use_cases", currentScore: 0.5, targetScore: 0.85, gap: 0.35, priority: "high", recommendation: "Add timing guidelines." },
];

describe("Semantic Rewriter", () => {
  describe("buildKeywordInventory", () => {
    it("should include brand, title tokens, and entity keywords", () => {
      const inventory = buildKeywordInventory(listing);
      expect(inventory).toContain("nutrawell");
      expect(inventory).toContain("magnesium");
      expect(inventory).toContain("glycinate");
      expect(inventory.some((k) => k.includes("400mg"))).toBe(true);
    });
  });

  describe("verifyKeywordPreservation", () => {
    it("should report preserved and missing keywords", () => {
      const inventory = ["nutrawell", "magnesium", "glycinate", "400mg", "vegan"];
      const content = {
        title: "NutraWell Magnesium Glycinate 400mg",
        bullets: ["Great product."],
        description: null,
      };
      const report = verifyKeywordPreservation(content, inventory);
      expect(report.preserved).toContain("nutrawell");
      expect(report.missing).toContain("vegan");
      expect(report.score).toBeLessThan(100);
    });
  });

  describe("generateSemanticRewrittenContent", () => {
    it("should return 5 bullets, a title <=200 chars, QAs, and a keyword report", async () => {
      const result = await generateSemanticRewrittenContent(gaps, listing);
      expect(result.title.length).toBeLessThanOrEqual(200);
      expect(result.bullets.length).toBe(5);
      expect(result.qas.length).toBeGreaterThanOrEqual(3);
      expect(result.keywordPreservationReport).toBeDefined();
      expect(result.keywordPreservationReport.score).toBeGreaterThanOrEqual(0);
    });

    it("should include a variant B when provided by the LLM", async () => {
      const result = await generateSemanticRewrittenContent(gaps, listing);
      expect(result.variantB).toBeDefined();
      expect(result.variantB!.bullets.length).toBe(5);
    });
  });
});
