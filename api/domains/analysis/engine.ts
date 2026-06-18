import type { AnalysisResult, CleanedText, SemanticGap } from "../../pipeline/pipeline.types.js";
import {
  buildIntentCoverage,
  buildPredictedIntents,
  buildSemanticGaps,
  computeLocalTextSimilarity,
  evaluateCosmoReadiness,
  scoreIntents,
} from "./intentEngine.js";

export { computeLocalTextSimilarity, evaluateCosmoReadiness };

/**
 * Analyze semantic gaps using the state-of-the-art intent engine.
 * Combines dense embeddings, lexical overlap, and signal coverage to predict
 * buyer intent coverage and produce a Rufus/COSMO-aligned score.
 */
export async function analyzeSemanticGaps(
  embedding: number[],
  cleaned: CleanedText
): Promise<AnalysisResult> {
  const intentResults = await scoreIntents(embedding, cleaned);
  const gaps = buildSemanticGaps(intentResults);
  const predictedIntents = buildPredictedIntents(intentResults);
  const intentCoverage = buildIntentCoverage(intentResults);

  // Normalize Rufus score from typical composite range [0.35, 0.85] to [0, 100]
  const avgSimilarity = intentCoverage.overall / 100;
  const rawRufusScore = Math.round(((avgSimilarity - 0.35) / 0.50) * 100);
  const rufusScore = Math.min(100, Math.max(0, rawRufusScore));

  // COSMO Score: structural readiness score combined with Rufus Score
  const cosmoReadiness = evaluateCosmoReadiness(cleaned.text);
  const cosmoScore = Math.round(rufusScore * 0.4 + cosmoReadiness * 0.6);

  return {
    rufusScore,
    cosmoScore: Math.min(100, Math.max(0, cosmoScore)),
    semanticGaps: gaps,
    predictedIntents,
    intentCoverage,
  };
}
