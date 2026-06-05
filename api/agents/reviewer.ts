import type {
  AgentTask,
  AnalysisResult,
  CleanedText,
  CompetitorBenchmark,
  OptimizedContent,
  RawListingData,
  ReviewResult,
} from "./types.js";

export class ReviewerAgent {
  async review(task: AgentTask): Promise<ReviewResult> {
    switch (task.role) {
      case "apify_fetcher":
        return this.reviewListingData(task.output as RawListingData);
      case "listing_fetcher":
        return this.reviewListingData(task.output as RawListingData);
      case "preprocessor":
        return this.reviewPreprocessedText(task.output as CleanedText);
      case "embedding_generator":
        return this.reviewEmbedding(task.output as number[]);
      case "semantic_analyzer":
        return this.reviewAnalysis(task.output as AnalysisResult);
      case "content_optimizer":
        return this.reviewOptimizedContent(task.output as OptimizedContent);
      case "competitor_analyst":
        return this.reviewCompetitors(task.output as CompetitorBenchmark[]);
      default:
        return {
          taskId: task.id,
          approved: true,
          score: 100,
          issues: [],
          suggestions: [],
          reviewedAt: new Date(),
        };
    }
  }

  private reviewListingData(data: RawListingData): ReviewResult {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!data.title || data.title.length < 10) {
      issues.push("Title is too short or empty");
    }
    if (!data.bullets || data.bullets.length < 3) {
      issues.push("Too few bullet points (minimum 3)");
    }
    if (!data.brand) {
      issues.push("Missing brand information");
    }
    if (data.bullets.some((b) => b.length < 20)) {
      suggestions.push("Some bullets are very short; consider expanding with details");
    }

    const score = Math.max(0, 100 - issues.length * 25 - suggestions.length * 5);

    return {
      taskId: "",
      approved: issues.length === 0,
      score,
      issues,
      suggestions,
      reviewedAt: new Date(),
    };
  }

  private reviewPreprocessedText(data: CleanedText): ReviewResult {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (data.text.length < 100) {
      issues.push("Preprocessed text is too short (< 100 chars)");
    }
    if (data.text.includes("<")) {
      issues.push("HTML tags may not have been fully removed");
    }

    const score = Math.max(0, 100 - issues.length * 30);

    return {
      taskId: "",
      approved: issues.length === 0,
      score,
      issues,
      suggestions,
      reviewedAt: new Date(),
    };
  }

  private reviewEmbedding(embedding: number[]): ReviewResult {
    const issues: string[] = [];

    if (embedding.length !== 1536) {
      issues.push(`Wrong embedding dimension: ${embedding.length} (expected 1536)`);
    }
    if (embedding.some((v) => !Number.isFinite(v))) {
      issues.push("Embedding contains non-finite values");
    }

    return {
      taskId: "",
      approved: issues.length === 0,
      score: issues.length === 0 ? 100 : 0,
      issues,
      suggestions: [],
      reviewedAt: new Date(),
    };
  }

  private reviewAnalysis(result: AnalysisResult): ReviewResult {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (result.rufusScore < 0 || result.rufusScore > 100) {
      issues.push(`Rufus score out of range: ${result.rufusScore}`);
    }
    if (result.semanticGaps.length === 0) {
      issues.push("No semantic gaps detected — suspicious for a real listing");
    }
    if (result.rufusScore < 40) {
      suggestions.push("Listing has significant room for improvement; prioritize critical gaps");
    }
    if (!result.semanticGaps.some((g) => g.priority === "critical" || g.priority === "high")) {
      suggestions.push("No high-priority gaps found; verify dimension coverage");
    }

    const score = Math.max(0, 100 - issues.length * 30 - Math.max(0, 40 - result.rufusScore));

    return {
      taskId: "",
      approved: issues.length === 0,
      score,
      issues,
      suggestions,
      reviewedAt: new Date(),
    };
  }

  private reviewOptimizedContent(content: OptimizedContent): ReviewResult {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (content.title.length > 200) {
      issues.push(`Title exceeds Amazon limit: ${content.title.length} chars`);
    }
    if (content.bullets.length !== 5) {
      issues.push(`Expected 5 bullets, got ${content.bullets.length}`);
    }
    if (content.qas.length < 3) {
      issues.push(`Expected at least 3 QAs, got ${content.qas.length}`);
    }
    if (content.bullets.some((b) => b.length < 30)) {
      suggestions.push("Some bullets are quite short; consider adding more detail");
    }

    const score = Math.max(0, 100 - issues.length * 25 - suggestions.length * 5);

    return {
      taskId: "",
      approved: issues.length === 0,
      score,
      issues,
      suggestions,
      reviewedAt: new Date(),
    };
  }

  private reviewCompetitors(competitors: CompetitorBenchmark[]): ReviewResult {
    const issues: string[] = [];
    const suggestions: string[] = [];

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
      taskId: "",
      approved: issues.length === 0,
      score,
      issues,
      suggestions,
      reviewedAt: new Date(),
    };
  }
}
