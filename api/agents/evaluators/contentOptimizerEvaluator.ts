import type { OptimizedContent } from "../../pipeline/types.js";
import type { Evaluator, EvaluationResult } from "./types.js";

export class ContentOptimizerEvaluator implements Evaluator<OptimizedContent> {
  async evaluate(content: OptimizedContent): Promise<EvaluationResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!content) {
      return {
        approved: false,
        score: 0,
        issues: ["Optimized content is empty or undefined"],
        suggestions: [],
        reviewedAt: new Date(),
      };
    }

    if (content.title && content.title.length > 200) {
      issues.push(`Title exceeds Amazon limit: ${content.title.length} chars`);
    }
    if (!content.bullets || content.bullets.length !== 5) {
      issues.push(`Expected 5 bullets, got ${content.bullets ? content.bullets.length : 0}`);
    }
    if (!content.qas || content.qas.length < 3) {
      issues.push(`Expected at least 3 QAs, got ${content.qas ? content.qas.length : 0}`);
    }
    if (content.bullets && content.bullets.some((b) => b.length < 30)) {
      suggestions.push("Some bullets are quite short; consider adding more detail");
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
