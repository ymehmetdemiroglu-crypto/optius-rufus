import { ApifyFetcherAgent } from "../agents/agents/apifyFetcher.js";
import { ListingFetcherAgent } from "../agents/agents/listingFetcher.js";
import { PreprocessorAgent } from "../agents/agents/preprocessor.js";
import { EmbeddingGeneratorAgent } from "../agents/agents/embeddingGenerator.js";
import { SemanticAnalyzerAgent } from "../agents/agents/semanticAnalyzer.js";
import { ContentOptimizerAgent } from "../agents/agents/contentOptimizer.js";
import { CompetitorAnalystAgent } from "../agents/agents/competitorAnalyst.js";
import { ReviewerAgent } from "../agents/reviewer.js";
import { generateAllStageCopy } from "../services/copywriter.js";
import { simulateRufusSOV } from "../services/rufusSimulator.js";
import { logger } from "../infra/logger.js";
import { eventBus } from "../infra/eventBus.js";
import { db } from "../db/client.js";
import type { StageExecutor, StageContext, StageName, StageOutput } from "./types.js";
export { STAGE_ORDER } from "./types.js";
import type { AgentTask } from "../agents/types.js";

const reviewer = new ReviewerAgent();

async function runReviewer(
  stageName: StageName,
  output: StageOutput[keyof StageOutput]
): Promise<{ approved: boolean; issues: string[]; score: number }> {
  const task: AgentTask = {
    id: `review-${stageName}-${Date.now()}`,
    asin: "",
    marketplace: "US",
    role: stageName === "fetch" ? "apify_fetcher" :
          stageName === "preprocess" ? "preprocessor" :
          stageName === "embedding" ? "embedding_generator" :
          stageName === "semantic" ? "semantic_analyzer" :
          stageName === "optimize" ? "content_optimizer" :
          stageName === "competitor" ? "competitor_analyst" : "apify_fetcher",
    status: "completed",
    input: null,
    output,
    attempt: 1,
    maxAttempts: 3,
  };

  const review = await reviewer.review(task);
  if (!review.approved && review.issues.length > 0) {
    eventBus.emit("review:warning", {
      stage: stageName,
      issues: review.issues,
      score: review.score,
    });
  }
  return { approved: review.approved, issues: review.issues, score: review.score };
}

export const stageExecutors: StageExecutor[] = [
  {
    name: "fetch",
    dependencies: [],
    async execute(ctx: StageContext) {
      logger.info(`Stage fetch starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "fetch" }, ctx.correlationId);

      const agent = ctx.listingId
        ? new ApifyFetcherAgent()
        : new ListingFetcherAgent();

      const input = ctx.listingId
        ? { listingId: ctx.listingId }
        : { asin: ctx.stageOutputs.rawListing?.asin ?? "", marketplace: "US" };

      const output = await agent.execute(input);
      await runReviewer("fetch", output);

      eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "fetch" }, ctx.correlationId);
      return output as StageOutput["rawListing"];
    },
  },
  {
    name: "preprocess",
    dependencies: ["fetch"],
    async execute(ctx: StageContext) {
      logger.info(`Stage preprocess starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "preprocess" }, ctx.correlationId);

      const agent = new PreprocessorAgent();
      const output = await agent.execute(ctx.stageOutputs.rawListing);
      await runReviewer("preprocess", output);

      eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "preprocess" }, ctx.correlationId);
      return output as StageOutput["cleaned"];
    },
  },
  {
    name: "embedding",
    dependencies: ["preprocess"],
    async execute(ctx: StageContext) {
      logger.info(`Stage embedding starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "embedding" }, ctx.correlationId);

      const agent = new EmbeddingGeneratorAgent();
      const output = await agent.execute(ctx.stageOutputs.cleaned);
      await runReviewer("embedding", output);

      // Persist embedding to listings table
      if (ctx.stageOutputs.rawListing && Array.isArray(output)) {
        const listing = db.prepare("SELECT id FROM listings WHERE asin = ?").get(ctx.stageOutputs.rawListing.asin) as
          | { id: number }
          | undefined;
        if (listing) {
          db.prepare("UPDATE listings SET embeddingVector = ? WHERE id = ?")
            .run(JSON.stringify(output), listing.id);
        }
      }

      eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "embedding" }, ctx.correlationId);
      return output as StageOutput["embedding"];
    },
  },
  {
    name: "semantic",
    dependencies: ["embedding"],
    async execute(ctx: StageContext) {
      logger.info(`Stage semantic starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "semantic" }, ctx.correlationId);

      const agent = new SemanticAnalyzerAgent();
      const output = await agent.execute({
        embedding: ctx.stageOutputs.embedding,
        text: ctx.stageOutputs.cleaned,
      });
      await runReviewer("semantic", output);

      eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "semantic" }, ctx.correlationId);
      return output as StageOutput["analysis"];
    },
  },
  {
    name: "optimize",
    dependencies: ["semantic"],
    async execute(ctx: StageContext) {
      logger.info(`Stage optimize starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "optimize" }, ctx.correlationId);

      // Generate optimized content via LLM copywriter
      const prospect = db.prepare("SELECT firstName, lastName, email FROM prospects WHERE id = ?").get(ctx.prospectId) as
        | { firstName?: string; lastName?: string; email: string }
        | undefined;
      const prospectName = prospect?.firstName || prospect?.email?.split("@")[0] || "there";

      const analysis = ctx.stageOutputs.analysis!;
      const listing = ctx.stageOutputs.rawListing!;

      const stageCopy = await generateAllStageCopy(
        { rufusScore: analysis.rufusScore, cosmoScore: analysis.cosmoScore, semanticGaps: analysis.semanticGaps },
        listing,
        prospectName
      );

      // Also run the traditional content optimizer agent for structured output
      const agent = new ContentOptimizerAgent();
      const agentOutput = await agent.execute({
        gaps: analysis.semanticGaps,
        listing,
      });

      // Merge agent output with stage copy
      const output = {
        ...agentOutput,
        stageCopy,
      };

      await runReviewer("optimize", agentOutput);

      eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "optimize" }, ctx.correlationId);
      return output as StageOutput["optimized"];
    },
  },
  {
    name: "competitor",
    dependencies: ["fetch"],
    async execute(ctx: StageContext) {
      logger.info(`Stage competitor starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "competitor" }, ctx.correlationId);

      const agent = new CompetitorAnalystAgent();
      const output = await agent.execute({
        asin: ctx.stageOutputs.rawListing?.asin ?? "",
        category: ctx.stageOutputs.rawListing?.category ?? "",
      });
      await runReviewer("competitor", output);

      eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "competitor" }, ctx.correlationId);
      return output as StageOutput["competitors"];
    },
  },
];
