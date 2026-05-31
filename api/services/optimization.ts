import type { OptimizedContent, SemanticGap, RawListingData } from "../agents/types.js";

/**
 * Stub: Generate optimized title, bullets, and Q&A.
 */
export async function generateOptimizedContent(
  gaps: SemanticGap[],
  listing: RawListingData
): Promise<OptimizedContent> {
  await delay(400 + Math.random() * 400);

  const topGaps = gaps.slice(0, 3).map((g) => g.dimension.replace("_", " "));

  const title = `${listing.brand} Magnesium Glycinate 400mg — ${topGaps.join(", ")} | 180 Capsules, Third-Party Tested`;

  const bullets = [
    `Clinically Studied Absorption: Our magnesium glycinate delivers 400mg elemental magnesium with superior bioavailability — gentle on your stomach and free from laxative effects.`,
    `Supports ${topGaps[0] || "Restful Sleep"}: Formulated to help you relax, fall asleep faster, and wake up feeling refreshed and energized every morning.`,
    `${topGaps[1] || "Muscle Recovery"} for Active Lifestyles: Perfect for athletes and fitness enthusiasts looking to reduce soreness and prevent post-workout cramps.`,
    `Third-Party Tested & Certified: Manufactured in a GMP-certified, NSF-registered facility. Every batch is independently verified for purity and potency.`,
    `180-Capsule 3-Month Supply: Exceptional value with 400mg per serving. Non-GMO, vegan-friendly, and free from artificial colors, fillers, and allergens.`,
  ];

  const qas = [
    {
      question: "What form of magnesium is this?",
      optimizedAnswer: "This is Magnesium Glycinate (bisglycinate), a chelated form bound to the amino acid glycine. It offers superior absorption compared to oxide or citrate and is gentle on digestion.",
      category: "product_info",
      priority: "high" as const,
    },
    {
      question: "Will this cause diarrhea?",
      optimizedAnswer: "No. Magnesium glycinate is the gentlest form and does not cause diarrhea at recommended doses. Unlike oxide or citrate, it bypasses the osmotic effect in the intestines.",
      category: "safety",
      priority: "critical" as const,
    },
    {
      question: "Is this safe for vegetarians?",
      optimizedAnswer: "Yes, our magnesium glycinate is 100% vegan and vegetarian-friendly. The capsules are made from plant-based cellulose with no gelatin or animal-derived ingredients.",
      category: "safety",
      priority: "high" as const,
    },
    {
      question: "How long until I feel results?",
      optimizedAnswer: "Most users notice improved sleep quality within 3-7 days. Muscle recovery benefits typically appear after 2-3 weeks of consistent daily use at the recommended 400mg dose.",
      category: "usage",
      priority: "medium" as const,
    },
    {
      question: "Can I take this with other supplements?",
      optimizedAnswer: "Yes, magnesium glycinate pairs well with Vitamin D, Zinc, and B-Complex. We recommend spacing calcium supplements 2 hours apart as they compete for absorption.",
      category: "usage",
      priority: "medium" as const,
    },
  ];

  return {
    title: title.slice(0, 200),
    bullets,
    description: `<p>${title}</p><ul>${bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`,
    qas,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
