import type { RawListingData } from "../../pipeline/types.js";
import type { Evaluator, EvaluationResult } from "./types.js";

export class ApifyFetcherEvaluator implements Evaluator<RawListingData> {
  async evaluate(data: RawListingData): Promise<EvaluationResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!data) {
      return {
        approved: false,
        score: 0,
        issues: ["Listing data is completely empty or undefined"],
        suggestions: [],
        reviewedAt: new Date(),
      };
    }

    if (!data.title || data.title.length < 10) {
      issues.push("Title is too short or empty");
    }
    if (!data.bullets || data.bullets.length < 3) {
      issues.push("Too few bullet points (minimum 3)");
    }
    if (!data.brand) {
      issues.push("Missing brand information");
    }
    if (data.bullets && data.bullets.some((b) => b.length < 20)) {
      suggestions.push("Some bullets are very short; consider expanding with details");
    }

    const score = Math.max(0, 100 - issues.length * 25 - suggestions.length * 5);

    return {
      approved: issues.length === 0,
      score,
      issues,
      suggestions,
      reviewedAt: new Date(),
    };
  }
}
