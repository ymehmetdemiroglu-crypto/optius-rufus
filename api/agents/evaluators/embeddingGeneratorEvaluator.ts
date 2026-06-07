import type { Evaluator, EvaluationResult } from "./types.js";

export class EmbeddingGeneratorEvaluator implements Evaluator<number[]> {
  async evaluate(embedding: number[]): Promise<EvaluationResult> {
    const issues: string[] = [];

    if (!embedding || !Array.isArray(embedding)) {
      return {
        approved: false,
        score: 0,
        issues: ["Embedding vector is not an array or is empty"],
        suggestions: [],
        reviewedAt: new Date(),
      };
    }

    if (embedding.length !== 1536) {
      issues.push(`Wrong embedding dimension: ${embedding.length} (expected 1536)`);
    }
    if (embedding.some((v) => !Number.isFinite(v))) {
      issues.push("Embedding contains non-finite values");
    }

    return {
      approved: issues.length === 0,
      score: issues.length === 0 ? 100 : 0,
      issues,
      suggestions: [],
      reviewedAt: new Date(),
    };
  }
}
