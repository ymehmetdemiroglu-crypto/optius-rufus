import type { SemanticGap, AnalysisResult, CleanedText } from "../agents/types.js";

/**
 * Stub: Analyze semantic gaps and compute Rufus/COSMO scores.
 */
export async function analyzeSemanticGaps(
  _embedding: number[],
  cleaned: CleanedText
): Promise<AnalysisResult> {
  await delay(200 + Math.random() * 300);

  const text = cleaned.text.toLowerCase();

  const dimensions = [
    { name: "sleep_support", keywords: ["sleep", "restful", "insomnia"], weight: 0.12 },
    { name: "stress_relief", keywords: ["stress", "relaxation", "calm"], weight: 0.12 },
    { name: "muscle_recovery", keywords: ["muscle", "recovery", "cramp", "soreness"], weight: 0.10 },
    { name: "skin_health", keywords: ["skin", "complexion"], weight: 0.05 },
    { name: "digestive_gentle", keywords: ["gentle", "stomach", "digestion"], weight: 0.08 },
    { name: "energy", keywords: ["energy", "fatigue"], weight: 0.05 },
    { name: "clinical_evidence", keywords: ["clinical", "study", "research"], weight: 0.08 },
    { name: "third_party_tested", keywords: ["third-party", "tested", "lab"], weight: 0.08 },
    { name: "certifications", keywords: ["gmp", "non-gmo", "vegan", "certified"], weight: 0.08 },
    { name: "intent_richness", keywords: ["because", "through", "mechanism", "helps"], weight: 0.08 },
    { name: "use_cases", keywords: ["athletes", "adults", "seniors", "pregnant"], weight: 0.08 },
    { name: "differentiation", keywords: ["premium", "best", "unique", "patented"], weight: 0.06 },
  ];

  const gaps: SemanticGap[] = [];
  let totalScore = 0;

  for (const dim of dimensions) {
    const found = dim.keywords.filter((kw) => text.includes(kw)).length;
    const score = Math.min(found / Math.max(dim.keywords.length * 0.6, 1), 1);
    totalScore += score * dim.weight;

    if (score < 0.7) {
      gaps.push({
        dimension: dim.name,
        currentScore: score,
        targetScore: 0.85,
        gap: 0.85 - score,
        priority: score < 0.3 ? "critical" : score < 0.5 ? "high" : "medium",
        recommendation: `Add ${dim.keywords.slice(0, 2).join(" / ")} messaging to improve ${dim.name}.`,
      });
    }
  }

  gaps.sort((a, b) => b.gap - a.gap);

  const rufusScore = Math.round(totalScore * 100);

  return {
    rufusScore,
    cosmoScore: Math.round(rufusScore * 0.95),
    semanticGaps: gaps,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
