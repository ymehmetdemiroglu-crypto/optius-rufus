import { callLlm } from "./llmGateway.js";
import type { OptimizedContent, SemanticGap, RawListingData } from "../pipeline/types.js";

/**
 * Generate optimized title, bullets, description, and Q&A using an LLM.
 * Falls back to template-based generation if no API keys are configured.
 */
export async function generateOptimizedContent(
  gaps: SemanticGap[],
  listing: RawListingData
): Promise<OptimizedContent> {
  const fallback = buildFallbackContent(gaps, listing);

  const topGaps = gaps
    .filter((g) => g.priority === "critical" || g.priority === "high")
    .slice(0, 5)
    .map((g) => `${g.dimension} (gap: ${Math.round(g.gap * 100)}%): ${g.recommendation}`)
    .join("\n");

  const prompt = `You are an elite Amazon listing optimization expert specializing in COSMO and Rufus AI alignment.
Your task is to rewrite an Amazon product listing to maximize semantic alignment with Amazon's AI discovery systems.

## INPUT PRODUCT DATA
- ASIN: ${listing.asin}
- Brand: ${listing.brand || "Unknown"}
- Category: ${listing.category || "Unknown"}
- Current Title: ${listing.title || "N/A"}
- Current Bullets:
${(listing.bullets || []).map((b, i) => `  ${i + 1}. ${b}`).join("\n")}
- Current Description: ${listing.description || "N/A"}

## TOP SEMANTIC GAPS TO ADDRESS
${topGaps || "No critical gaps detected."}

## OPTIMIZATION RULES (5-Bullet Intent Architecture)
1. Bullet 1 (Primary Differentiator): Lead with the unique mechanism, form, or technology. Explain WHY this form is superior.
2. Bullet 2 (Core Use Case / Audience): State the primary benefit with mechanism. Include target audience explicitly.
3. Bullet 3 (Safety / Certifications): List all trust signals: third-party tested, GMP, Non-GMO, vegan, COA available.
4. Bullet 4 (Specific Specifications): Exact dosage, serving size, form, pH, concentration, timeline to results.
5. Bullet 5 (Social Proof / Comparison): Include user-reported outcomes, preference data, or comparison to generic alternatives.

TITLE RULES:
- Include brand, product name, key benefit, form/dosage, and certifications
- Max 200 characters
- Must read naturally, not keyword-stuffed

Q&A RULES:
- Generate 5 strategic Q&A pairs that seed Rufus ground truth
- Answers must be detailed and conversational (not one-word)
- Cover: safety, usage timing, comparisons, pregnancy/dietary restrictions, results timeline
- Categories must be one of: product_info, safety, usage, comparison, ingredients

## OUTPUT FORMAT
Return ONLY a valid JSON object with these exact keys:
{
  "title": "string (max 200 chars)",
  "bullets": ["string", "string", "string", "string", "string"],
  "description": "string (HTML paragraph with key claims)",
  "qas": [
    {
      "question": "string",
      "optimizedAnswer": "string (detailed, 2-4 sentences)",
      "category": "product_info|safety|usage|comparison|ingredients",
      "priority": "critical|high|medium|low"
    }
  ]
}`;

  try {
    const llmResponse = await callLlm(
      {
        messages: [
          {
            role: "system",
            content:
              "You are an Amazon listing optimization AI. Respond only with valid JSON. Never use markdown formatting.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2500,
        response_format: { type: "json_object" },
      },
      { service: "optimization", estimatedCostCents: 25 }
    );

    const content = JSON.parse(llmResponse.content);

    return {
      title: (content.title || fallback.title).slice(0, 200),
      bullets: Array.isArray(content.bullets) && content.bullets.length === 5
        ? content.bullets
        : fallback.bullets,
      description: content.description || fallback.description,
      qas: Array.isArray(content.qas) && content.qas.length >= 3
        ? content.qas.map((qa: unknown) => ({
            question: String((qa as Record<string, unknown>).question || ""),
            optimizedAnswer: String((qa as Record<string, unknown>).optimizedAnswer || ""),
            category: String((qa as Record<string, unknown>).category || "product_info"),
            priority: ["critical", "high", "medium", "low"].includes(String((qa as Record<string, unknown>).priority))
              ? (String((qa as Record<string, unknown>).priority) as "critical" | "high" | "medium" | "low")
              : "medium",
          }))
        : fallback.qas,
    };
  } catch (err) {
    console.error("[Optimization] Failed to generate optimized content:", err);
    return fallback;
  }
}

function buildFallbackContent(gaps: SemanticGap[], listing: RawListingData): OptimizedContent {
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
      category: "product_info" as const,
      priority: "high" as const,
    },
    {
      question: `Is this ${category.toLowerCase()} safe to use daily?`,
      optimizedAnswer: `Yes. Our ${category.toLowerCase()} is formulated for daily use with clean, tested ingredients. It is gentle on your system and free from common allergens. Always consult your healthcare provider if you have specific medical conditions.`,
      category: "safety" as const,
      priority: "critical" as const,
    },
    {
      question: `Is this suitable for vegans and people with dietary restrictions?`,
      optimizedAnswer: `Yes, our ${brand} ${category.toLowerCase()} is designed to be inclusive. It is free from common allergens and artificial additives. Check the full ingredient list on the label for specific dietary compatibility.`,
      category: "safety" as const,
      priority: "high" as const,
    },
    {
      question: "How long until I see results?",
      optimizedAnswer: `Most customers report noticeable benefits within 1-2 weeks of consistent daily use. Individual results may vary based on lifestyle and usage consistency.`,
      category: "usage" as const,
      priority: "medium" as const,
    },
    {
      question: `Can I combine this with other ${category.toLowerCase()} products?`,
      optimizedAnswer: `Yes, our ${category.toLowerCase()} is designed to complement a balanced routine. For best results, follow the recommended dosage and consult your healthcare provider if combining with other supplements.`,
      category: "usage" as const,
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
