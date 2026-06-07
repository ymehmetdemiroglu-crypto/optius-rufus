import type { CompetitorBenchmark } from "../../pipeline/types.js";
import type { Evaluator, EvaluationResult } from "./types.js";

export class CompetitorAnalystEvaluator implements Evaluator<CompetitorBenchmark[]> {
  async evaluate(competitors: CompetitorBenchmark[]): Promise<EvaluationResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!competitors || !Array.isArray(competitors)) {
      return {
        approved: false,
        score: 0,
        issues: ["Competitors list is not an array or is empty"],
        suggestions: [],
        reviewedAt: new Date(),
      };
    }

    if (competitors.length > 5) {
      issues.push(`Too many competitors: ${competitors.length} (max 5)`);
    }
    for (const comp of competitors) {
      if (comp.score < 0 || comp.score > 100) {
        issues.push(`Invalid score for ${comp.asin}: ${comp.score}`);
      }
    }
    if (competitors.length === 0) {
      suggestions.push("No competitors found; category may be too niche or API issue");
    }

    const score = Math.max(0, 100 - issues.length * 30);

    return {
      approved: issues.length === 0,
      score,
      issues,
      suggestions,
      reviewedAt: new Date(),
    };
  }
}
