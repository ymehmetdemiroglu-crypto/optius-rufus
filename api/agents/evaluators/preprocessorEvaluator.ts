import type { CleanedText } from "../../pipeline/types.js";
import type { Evaluator, EvaluationResult } from "./types.js";

export class PreprocessorEvaluator implements Evaluator<CleanedText> {
  async evaluate(data: CleanedText): Promise<EvaluationResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!data || !data.text) {
      return {
        approved: false,
        score: 0,
        issues: ["Cleaned text is empty or undefined"],
        suggestions: [],
        reviewedAt: new Date(),
      };
    }

    if (data.text.length < 100) {
      issues.push("Preprocessed text is too short (< 100 chars)");
    }
    if (data.text.includes("<")) {
      issues.push("HTML tags may not have been fully removed");
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
