import type { SemanticGap, AnalysisResult, CleanedText } from "../../pipeline/types.js";
import { generateEmbedding } from "../../services/embedding.js";
import { cosineSimilarity } from "../../lib/math.js";

// -------------------------------------------------------------------------
// 24 Semantic Dimensions mapping to COSMO/Rufus intent signals
// Based on docs/02-research/amazon-ai-optimization.md Section 3.1
// -------------------------------------------------------------------------
const SEMANTIC_DIMENSIONS: Array<{ name: string; query: string; weight: number }> = [
  // Functional Benefits (12)
  { name: "sleep_support", query: "What supplement is best for sleep and insomnia relief without side effects?", weight: 0.08 },
  { name: "stress_anxiety_relief", query: "Which product helps with stress, anxiety, and relaxation naturally?", weight: 0.08 },
  { name: "muscle_recovery", query: "Best supplement for muscle recovery, soreness, and post-workout cramps?", weight: 0.07 },
  { name: "skin_health", query: "What product improves skin elasticity, complexion, and reduces wrinkles?", weight: 0.04 },
  { name: "joint_bone_health", query: "Which supplement supports joint mobility and bone density?", weight: 0.04 },
  { name: "digestive_gentle", query: "What is gentle on the stomach and easy to digest without causing diarrhea?", weight: 0.06 },
  { name: "energy_performance", query: "Which supplement boosts energy, reduces fatigue, and improves performance?", weight: 0.04 },
  { name: "barrier_repair", query: "Best product for skin barrier repair and restoring damaged moisture barrier?", weight: 0.04 },
  { name: "brightening_pigmentation", query: "What fades dark spots, brightens dull skin, and reduces pigmentation?", weight: 0.04 },
  { name: "anti_aging", query: "Which product has anti-aging benefits, reduces fine lines, and improves firmness?", weight: 0.04 },
  { name: "sensitive_skin_safe", query: "Is this safe for sensitive skin, eczema-prone skin, and won't cause breakouts?", weight: 0.04 },
  { name: "hair_nail_strength", query: "What strengthens hair, reduces breakage, and improves nail growth?", weight: 0.03 },
  // Target Audience (5)
  { name: "pregnant_women", query: "Is this safe for pregnant women, prenatal use, and breastfeeding mothers?", weight: 0.04 },
  { name: "athletes_active", query: "Which product is ideal for athletes, active lifestyles, and fitness enthusiasts?", weight: 0.04 },
  { name: "mature_skin", query: "What is best for mature skin, aging skin, and adults over 50?", weight: 0.03 },
  { name: "sensitive_individuals", query: "Is this safe for sensitive individuals, allergy-prone people, and those with intolerances?", weight: 0.04 },
  { name: "vegan_vegetarian", query: "Is this vegan, vegetarian, plant-based, and free from animal products?", weight: 0.04 },
  // Trust Signals (4)
  { name: "clinical_evidence", query: "Which product has clinical studies, research backing, and scientific evidence?", weight: 0.05 },
  { name: "third_party_tested", query: "What is third-party tested, lab verified, and independently certified for purity?", weight: 0.05 },
  { name: "certifications", query: "Which has GMP, Non-GMO, organic, vegan, or NSF certifications?", weight: 0.05 },
  { name: "detailed_specifications", query: "What are the exact dosage, form, concentration, pH, and ingredient percentages?", weight: 0.04 },
  // Content Richness (3)
  { name: "intent_richness", query: "Does this explain HOW it works, the mechanism, and WHY it is effective?", weight: 0.04 },
  { name: "specific_use_cases", query: "What are the specific use cases, timing, routines, and lifestyle integrations?", weight: 0.04 },
  { name: "comparison_differentiation", query: "How does this compare to alternatives, competitors, and generic versions?", weight: 0.03 },
];

// In-memory cache for intent embeddings (they are static)
const intentEmbeddingCache = new Map<string, number[]>();

async function getIntentEmbedding(query: string): Promise<number[]> {
  if (intentEmbeddingCache.has(query)) {
    return intentEmbeddingCache.get(query)!;
  }
  const embedding = await generateEmbedding(query);
  intentEmbeddingCache.set(query, embedding);
  return embedding;
}

/**
 * Analyze semantic gaps by computing cosine similarity between the listing
 * embedding and pre-defined intent vectors. Returns a real Rufus Score (0-100)
 * and prioritized gap analysis.
 */
export async function analyzeSemanticGaps(
  embedding: number[],
  cleaned: CleanedText
): Promise<AnalysisResult> {
  const gaps: SemanticGap[] = [];
  let weightedScore = 0;
  let totalWeight = 0;

  for (const dim of SEMANTIC_DIMENSIONS) {
    const intentEmbedding = await getIntentEmbedding(dim.query);
    const similarity = cosineSimilarity(embedding, intentEmbedding);

    // Similarity is in [-1, 1]; for product-intent alignment we expect [0, 1]
    // Scale to a 0-1 score where >0.70 is strong alignment
    const normalizedScore = Math.max(0, similarity);

    // Target is 0.85 (strong semantic alignment)
    const targetScore = 0.85;
    const gap = Math.max(0, targetScore - normalizedScore);

    weightedScore += normalizedScore * dim.weight;
    totalWeight += dim.weight;

    if (gap > 0.05) {
      gaps.push({
        dimension: dim.name,
        currentScore: Math.round(normalizedScore * 100) / 100,
        targetScore: Math.round(targetScore * 100) / 100,
        gap: Math.round(gap * 100) / 100,
        priority: gap > 0.40 ? "critical" : gap > 0.20 ? "high" : gap > 0.10 ? "medium" : "low",
        recommendation: buildRecommendation(dim.name, normalizedScore, cleaned.text),
      });
    }
  }

  gaps.sort((a, b) => b.gap - a.gap);

  // Rufus Score: weighted average similarity scaled to 0-100
  const rufusScore = Math.round((weightedScore / totalWeight) * 100);

  return {
    rufusScore: Math.min(100, Math.max(0, rufusScore)),
    cosmoScore: Math.round(Math.min(100, Math.max(0, rufusScore * 0.95))),
    semanticGaps: gaps,
  };
}

function buildRecommendation(dimension: string, score: number, text: string): string {
  const lowerText = text.toLowerCase();

  const recommendations: Record<string, string> = {
    sleep_support: "Add explicit sleep support claims with mechanism (e.g., 'promotes melatonin production').",
    stress_anxiety_relief: "Include stress/anxiety relief messaging with calming mechanism details.",
    muscle_recovery: "Detail muscle recovery benefits, timing post-workout, and cramp prevention.",
    skin_health: "Add skin health claims with specific ingredient mechanisms and expected timelines.",
    joint_bone_health: "Include joint mobility and bone density support language.",
    digestive_gentle: "Explicitly state gentleness on stomach, no laxative effect, and easy digestion.",
    energy_performance: "Add energy-boosting claims with sustained-release or non-jitter mechanism.",
    barrier_repair: "Detail skin barrier repair with ceramide complex or lipid matrix language.",
    brightening_pigmentation: "Include brightening claims with specific ingredient concentrations and pH levels.",
    anti_aging: "Add anti-aging mechanism language (collagen support, cell renewal, etc.).",
    sensitive_skin_safe: "Explicitly state safety for sensitive/eczema-prone skin with dermatologist testing.",
    hair_nail_strength: "Include hair and nail strengthening claims with biotin or keratin support.",
    pregnant_women: "Add pregnancy safety language and breastfeeding compatibility statements.",
    athletes_active: "Target athletes with performance, recovery, and routine integration details.",
    mature_skin: "Include age-specific benefits and language targeting adults over 50.",
    sensitive_individuals: "Explicitly state hypoallergenic, free-from common allergens, and sensitivity-safe.",
    vegan_vegetarian: "Add vegan/vegetarian/plant-based certifications and explicit labeling.",
    clinical_evidence: "Reference clinical studies, research, trials, or scientific backing.",
    third_party_tested: " prominently feature third-party testing, COA availability, and lab verification.",
    certifications: "List all certifications: GMP, Non-GMO, Organic, NSF, Vegan, etc.",
    detailed_specifications: "Add exact dosage, form, concentration percentages, pH, and serving sizes.",
    intent_richness: "Explain HOW the product works at a cellular/mechanism level, not just WHAT it does.",
    specific_use_cases: "Add timing guidelines, routine integration, and lifestyle-specific use cases.",
    comparison_differentiation: "Explicitly compare against generic alternatives and state unique differentiators.",
  };

  return recommendations[dimension] || `Improve ${dimension.replace(/_/g, " ")} coverage in listing copy.`;
}
