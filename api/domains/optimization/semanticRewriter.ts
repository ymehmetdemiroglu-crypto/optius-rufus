import { callLlm } from "../../services/llmGateway.js";
import type {
  ContentVariant,
  KeywordPreservationReport,
  OptimizedContent,
  QAPair,
  RawListingData,
  SemanticGap,
} from "../../pipeline/pipeline.types.js";

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "he",
  "in", "is", "it", "its", "of", "on", "that", "the", "to", "was", "will", "with",
  "the", "this", "but", "they", "have", "had", "what", "when", "where", "who",
  "which", "why", "how", "all", "any", "both", "each", "few", "more", "most",
  "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so",
  "than", "too", "very", "can", "will", "just", "should", "now",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

/**
 * Extract a keyword inventory from the original listing that must be preserved
 * in the optimized copy. Includes brand, product form/dosage, certifications,
 * and high-intent category nouns.
 */
export function buildKeywordInventory(listing: RawListingData): string[] {
  const inventory: string[] = [];

  if (listing.brand) inventory.push(...tokenize(listing.brand));
  if (listing.title) inventory.push(...tokenize(listing.title));
  if (listing.category) inventory.push(...tokenize(listing.category));

  const allText = [
    listing.title,
    ...listing.bullets,
    listing.description,
    listing.category,
    listing.subcategory,
  ]
    .filter(Boolean)
    .join(" ");

  // High-intent entities we never want to drop
  const entityPatterns = [
    /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|oz|capsules?|caps?|tablets?|pills?|softgels?|servings?)\b/gi,
    /\b(gmp|non-gmo|organic|vegan|gluten-free|third-party tested|lab tested|coa|nsf|usda|fda|ul|ce|fcc)\b/gi,
    /\b(sensitive|pregnant|athletes|daily|morning|night|absorption|clinically studied)\b/gi,
  ];

  for (const pattern of entityPatterns) {
    const matches = allText.match(pattern);
    if (matches) inventory.push(...matches.map((m) => m.toLowerCase()));
  }

  return unique(inventory).filter((k) => k.length > 2).slice(0, 40);
}

function containsKeyword(text: string, keyword: string): boolean {
  const normalized = text.toLowerCase();
  // Whole-word match for short keywords, substring for compound ones
  if (keyword.length <= 5) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(normalized);
  }
  return normalized.includes(keyword);
}

export function verifyKeywordPreservation(
  content: { title: string; bullets: string[]; description: string | null },
  inventory: string[]
): KeywordPreservationReport {
  const fullText = [content.title, ...content.bullets, content.description || ""].join(" ");
  const preserved: string[] = [];
  const missing: string[] = [];

  for (const keyword of inventory) {
    if (containsKeyword(fullText, keyword)) {
      preserved.push(keyword);
    } else {
      missing.push(keyword);
    }
  }

  const score = inventory.length > 0 ? Math.round((preserved.length / inventory.length) * 100) : 100;
  return { inventory, preserved, missing, score };
}

function cleanBullet(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function enforceBulletCount(bullets: string[], listing: RawListingData): string[] {
  const cleaned = bullets.map(cleanBullet).filter((b) => b.length > 0);
  if (cleaned.length >= 5) return cleaned.slice(0, 5);

  const fillers = [
    `Premium quality ${listing.category || "product"} designed for reliable daily results.`,
    `Backed by rigorous quality standards and transparent ingredient sourcing.`,
    `Easy to integrate into your routine with clear usage guidelines.`,
    `Trusted by customers who value safety, consistency, and performance.`,
    `Great value with every batch tested for purity and potency.`,
  ];

  while (cleaned.length < 5) {
    cleaned.push(fillers[cleaned.length % fillers.length]);
  }
  return cleaned;
}

function enforceQAs(qas: unknown[]): QAPair[] {
  const validCategories = ["product_info", "safety", "usage", "comparison", "ingredients"];
  const cleaned: QAPair[] = [];

  for (const qa of qas) {
    const record = qa as Record<string, unknown>;
    const category = validCategories.includes(String(record.category))
      ? (String(record.category) as QAPair["category"])
      : "product_info";
    const priority = ["critical", "high", "medium", "low"].includes(String(record.priority))
      ? (String(record.priority) as QAPair["priority"])
      : "medium";
    cleaned.push({
      question: String(record.question || ""),
      optimizedAnswer: String(record.optimizedAnswer || ""),
      category,
      priority,
    });
  }

  return cleaned;
}

function buildDefaultDescription(title: string, bullets: string[]): string {
  return `<p>${title}</p><ul>${bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`;
}

function injectMissingKeywords(
  content: { title: string; bullets: string[]; description: string | null },
  missing: string[]
): { title: string; bullets: string[]; description: string | null } {
  if (missing.length === 0) return content;

  let title = content.title;
  const bullets = content.bullets.map((b) => b);

  // Try to append missing brand/product terms to the title without blowing the limit
  const titleKeywords = missing.filter((k) => k.length <= 12).slice(0, 2);
  if (titleKeywords.length > 0 && title.length + titleKeywords.join(" | ").length + 3 <= 200) {
    title = `${title} | ${titleKeywords.join(" | ")}`;
  }

  // Distribute remaining missing keywords across bullets
  let keywordIndex = 0;
  for (let i = 0; i < bullets.length && keywordIndex < missing.length; i++) {
    const kw = missing[keywordIndex];
    if (!containsKeyword(bullets[i], kw)) {
      bullets[i] = `${bullets[i]} ${kw.charAt(0).toUpperCase() + kw.slice(1)}.`.replace(/\.\s*\./g, ".");
      keywordIndex++;
    }
  }

  return { title, bullets, description: content.description };
}

interface LlmOptimizedOutput {
  title: string;
  bullets: string[];
  description: string;
  qas: QAPair[];
  variantB?: ContentVariant;
}

/**
 * Generate optimized listing copy that closes semantic gaps while preserving
 * the original keyword inventory and keeping the copy readable for humans.
 */
export async function generateSemanticRewrittenContent(
  gaps: SemanticGap[],
  listing: RawListingData
): Promise<OptimizedContent> {
  const keywordInventory = buildKeywordInventory(listing);
  const topGaps = gaps
    .filter((g) => g.priority === "critical" || g.priority === "high")
    .slice(0, 5)
    .map((g) => `${g.dimension} (gap: ${Math.round(g.gap * 100)}%): ${g.recommendation}`)
    .join("\n");

  const prompt = `You are an elite Amazon listing optimization expert specializing in COSMO and Rufus AI alignment.
Your task is to rewrite an Amazon product listing to maximize semantic alignment with Amazon's AI discovery systems, while preserving every keyword in the inventory and keeping the copy natural for human readers.

## INPUT PRODUCT DATA
- ASIN: ${listing.asin}
- Brand: ${listing.brand || "Unknown"}
- Category: ${listing.category || "Unknown"}
- Current Title: ${listing.title || "N/A"}
- Current Bullets:
${(listing.bullets || []).map((b, i) => `  ${i + 1}. ${b}`).join("\n")}
- Current Description: ${listing.description || "N/A"}

## KEYWORD INVENTORY (MUST BE PRESERVED EXACTLY)
${keywordInventory.map((k) => `- ${k}`).join("\n")}

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

VARIANT B RULES:
- Provide a second version of title, bullets, and description that emphasizes emotional benefits and buyer outcomes (not features).
- Keep keyword inventory intact.

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
  ],
  "variantB": {
    "label": "Benefit-Focused Variant",
    "title": "string",
    "bullets": ["string", "string", "string", "string", "string"],
    "description": "string"
  }
}`;

  const fallback = buildFallbackContent(gaps, listing, keywordInventory);

  try {
    const llmResponse = await callLlm(
      {
        messages: [
          {
            role: "system",
            content:
              "You are an Amazon listing optimization AI. Respond only with valid JSON. Never use markdown formatting. Do not drop keywords from the provided inventory.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      },
      { service: "semantic-rewriter", estimatedCostCents: 30 }
    );

    const content = JSON.parse(llmResponse.content) as Partial<LlmOptimizedOutput>;

    let title = (content.title || fallback.title).slice(0, 200);
    let bullets = enforceBulletCount(Array.isArray(content.bullets) ? content.bullets : fallback.bullets, listing);
    let description = content.description || fallback.description;
    let qas = Array.isArray(content.qas) && content.qas.length >= 3 ? enforceQAs(content.qas) : fallback.qas;

    // Keyword preservation guard
    let report = verifyKeywordPreservation({ title, bullets, description }, keywordInventory);
    if (report.missing.length > 0) {
      const injected = injectMissingKeywords({ title, bullets, description }, report.missing);
      title = injected.title.slice(0, 200);
      bullets = injected.bullets;
      description = injected.description || description;
      report = verifyKeywordPreservation({ title, bullets, description }, keywordInventory);
    }

    const variantB: ContentVariant | undefined = content.variantB && Array.isArray(content.variantB.bullets)
      ? {
          label: content.variantB.label || "Benefit-Focused Variant",
          title: content.variantB.title.slice(0, 200),
          bullets: enforceBulletCount(content.variantB.bullets, listing),
          description: content.variantB.description || buildDefaultDescription(content.variantB.title, content.variantB.bullets),
        }
      : undefined;

    return {
      title,
      bullets,
      description,
      qas,
      keywordPreservationReport: report,
      variantB,
    };
  } catch (err) {
    console.error("[Semantic Rewriter] Failed to generate optimized content:", err);
    return fallback;
  }
}

function buildFallbackContent(
  gaps: SemanticGap[],
  listing: RawListingData,
  keywordInventory: string[]
): OptimizedContent {
  const topGaps = gaps.slice(0, 3).map((g) => g.dimension.replace(/_/g, " "));
  const brand = listing.brand || "Premium Brand";
  const category = listing.category || "Health Product";
  const existingTitle = listing.title || `${brand} ${category}`;

  const title = `${brand} ${category} — ${topGaps.join(", ")} | ${existingTitle.split("|")[0]?.trim() || "Premium Quality"}, Third-Party Tested`.slice(0, 200);

  const bullets = [
    `Clinically Studied Formulation: Our ${category.toLowerCase()} delivers superior bioavailability — gentle on your system and optimized for maximum absorption.`,
    `Supports ${topGaps[0] || "Core Benefits"}: Specifically formulated to address your primary needs. Backed by research and trusted by thousands of satisfied customers.`,
    `${topGaps[1] || "Advanced Quality"} for Every Lifestyle: Perfect for health-conscious consumers looking for reliable, effective ${category.toLowerCase()} solutions.`,
    `Third-Party Tested & Certified: Manufactured in a GMP-certified facility. Every batch is independently verified for purity, potency, and safety.`,
    `Exceptional Value: Premium quality at $${listing.price || "competitive pricing"}. Non-GMO, clean-label, and free from artificial colors, fillers, and common allergens.`,
  ];

  const qas: QAPair[] = [
    {
      question: `What makes this ${category.toLowerCase()} different from competitors?`,
      optimizedAnswer: `Our ${brand} ${category.toLowerCase()} uses a premium formulation optimized for ${topGaps[0] || "maximum effectiveness"}. Unlike generic alternatives, every batch is third-party tested for purity and potency in a GMP-certified facility.`,
      category: "product_info",
      priority: "high",
    },
    {
      question: `Is this ${category.toLowerCase()} safe to use daily?`,
      optimizedAnswer: `Yes. Our ${category.toLowerCase()} is formulated for daily use with clean, tested ingredients. It is gentle on your system and free from common allergens. Always consult your healthcare provider if you have specific medical conditions.`,
      category: "safety",
      priority: "critical",
    },
    {
      question: `Is this suitable for vegans and people with dietary restrictions?`,
      optimizedAnswer: `Yes, our ${brand} ${category.toLowerCase()} is designed to be inclusive. It is free from common allergens and artificial additives. Check the full ingredient list on the label for specific dietary compatibility.`,
      category: "safety",
      priority: "high",
    },
    {
      question: "How long until I see results?",
      optimizedAnswer: `Most customers report noticeable benefits within 1-2 weeks of consistent daily use. Individual results may vary based on lifestyle and usage consistency.`,
      category: "usage",
      priority: "medium",
    },
    {
      question: `Can I combine this with other ${category.toLowerCase()} products?`,
      optimizedAnswer: `Yes, our ${category.toLowerCase()} is designed to complement a balanced routine. For best results, follow the recommended dosage and consult your healthcare provider if combining with other supplements.`,
      category: "usage",
      priority: "medium",
    },
  ];

  const description = buildDefaultDescription(title, bullets);

  const report = verifyKeywordPreservation({ title, bullets, description }, keywordInventory);

  return {
    title,
    bullets,
    description,
    qas,
    keywordPreservationReport: report,
  };
}
