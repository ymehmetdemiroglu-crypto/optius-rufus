import type { AnalysisResult } from "../../pipeline/types.js";
import type { Evaluator, EvaluationResult } from "./types.js";

export class SemanticAnalyzerEvaluator implements Evaluator<AnalysisResult> {
  async evaluate(result: AnalysisResult): Promise<EvaluationResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!result) {
      return {
        approved: false,
        score: 0,
        issues: ["Analysis result is empty or undefined"],
        suggestions: [],
        reviewedAt: new Date(),
      };
    }

    if (result.rufusScore < 0 || result.rufusScore > 100) {
      issues.push(`Rufus score out of range: ${result.rufusScore}`);
    }
    if (!result.semanticGaps || result.semanticGaps.length === 0) {
      issues.push("No semantic gaps detected — suspicious for a real listing");
    }
    if (result.rufusScore < 40) {
      suggestions.push("Listing has significant room for improvement; prioritize critical gaps");
    }
    if (result.semanticGaps && !result.semanticGaps.some((g) => g.priority === "critical" || g.priority === "high")) {
      suggestions.push("No high-priority gaps found; verify dimension coverage");
    }

    const score = Math.max(0, 100 - issues.length * 30 - Math.max(0, 40 - result.rufusScore));

    return {
      approved: issues.length === 0,
      score,
      issues,
      suggestions,
      reviewedAt: new Date(),
    };
  }
}
