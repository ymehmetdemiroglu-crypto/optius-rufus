import type { OptimizedContent, SemanticGap, RawListingData } from "../agents/types.js";

/**
 * Stub: Generate optimized title, bullets, and Q&A.
 */
export async function generateOptimizedContent(
  gaps: SemanticGap[],
  listing: RawListingData
): Promise<OptimizedContent> {
  await delay(400 + Math.random() * 400);

  const topGaps = gaps.slice(0, 3).map((g) => g.dimension.replace(/_/g, " "));
  const brand = listing.brand || "Premium Brand";
  const category = listing.category || "Health Product";
  const existingTitle = listing.title || `${brand} ${category}`;

  const title = `${brand} ${category} — ${topGaps.join(", ")} | ${existingTitle.split("|")[0]?.trim() || "Premium Quality"}, Third-Party Tested`;

  const bullets = [
    `Clinically Studied Formulation: Our ${category.toLowerCase()} delivers superior bioavailability — gentle on your system and optimized for maximum absorption.`,
    `Supports ${topGaps[0] || "Core Benefits"}: Specifically formulated to address your primary needs. Backed by research and trusted by thousands of satisfied customers.`,
    `${topGaps[1] || "Advanced Quality"} for Every Lifestyle: Perfect for health-conscious consumers looking for reliable, effective ${category.toLowerCase()} solutions.`,
    `Third-Party Tested & Certified: Manufactured in a GMP-certified facility. Every batch is independently verified for purity, potency, and safety.`,
    `Exceptional Value: Premium quality at $${listing.price || "competitive pricing"}. Non-GMO, clean-label, and free from artificial colors, fillers, and common allergens.`,
  ];

  const qas = [
    {
      question: `What makes this ${category.toLowerCase()} different from competitors?`,
      optimizedAnswer: `Our ${brand} ${category.toLowerCase()} uses a premium formulation optimized for ${topGaps[0] || "maximum effectiveness"}. Unlike generic alternatives, every batch is third-party tested for purity and potency in a GMP-certified facility.`,
      category: "product_info",
      priority: "high" as const,
    },
    {
      question: `Is this ${category.toLowerCase()} safe to use daily?`,
      optimizedAnswer: `Yes. Our ${category.toLowerCase()} is formulated for daily use with clean, tested ingredients. It is gentle on your system and free from common allergens. Always consult your healthcare provider if you have specific medical conditions.`,
      category: "safety",
      priority: "critical" as const,
    },
    {
      question: `Is this suitable for vegans and people with dietary restrictions?`,
      optimizedAnswer: `Yes, our ${brand} ${category.toLowerCase()} is designed to be inclusive. It is free from common allergens and artificial additives. Check the full ingredient list on the label for specific dietary compatibility.`,
      category: "safety",
      priority: "high" as const,
    },
    {
      question: "How long until I see results?",
      optimizedAnswer: `Most customers report noticeable benefits within 1-2 weeks of consistent daily use. Individual results may vary based on lifestyle and usage consistency.`,
      category: "usage",
      priority: "medium" as const,
    },
    {
      question: `Can I combine this with other ${category.toLowerCase()} products?`,
      optimizedAnswer: `Yes, our ${category.toLowerCase()} is designed to complement a balanced routine. For best results, follow the recommended dosage and consult your healthcare provider if combining with other supplements.`,
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
