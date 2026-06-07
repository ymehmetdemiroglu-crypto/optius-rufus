import { ApifyFetcherAgent } from "../agents/agents/apifyFetcher.js";
import { ListingFetcherAgent } from "../agents/agents/listingFetcher.js";
import { PreprocessorAgent } from "../agents/agents/preprocessor.js";
import { EmbeddingGeneratorAgent } from "../agents/agents/embeddingGenerator.js";
import { SemanticAnalyzerAgent } from "../agents/agents/semanticAnalyzer.js";
import { ContentOptimizerAgent } from "../agents/agents/contentOptimizer.js";
import { CompetitorAnalystAgent } from "../agents/agents/competitorAnalyst.js";
import { generateAllStageCopy } from "../services/copywriter.js";
import { logger } from "../infra/logger.js";
import { eventBus } from "../infra/eventBus.js";
import * as listingService from "../services/domain/listingService.js";
import * as prospectService from "../services/domain/prospectService.js";
import type { StageExecutor, StageContext, StageOutput, RawListingData, CleanedText, AnalysisResult, OptimizedContent, CompetitorBenchmark } from "./types.js";
import {
  ApifyFetcherEvaluator,
  PreprocessorEvaluator,
  EmbeddingGeneratorEvaluator,
  SemanticAnalyzerEvaluator,
  ContentOptimizerEvaluator,
  CompetitorAnalystEvaluator,
} from "../agents/evaluators/index.js";

export const stageExecutors: StageExecutor[] = [
  {
    name: "fetch",
    dependencies: [],
    async execute(ctx: StageContext): Promise<StageOutput["rawListing"]> {
      logger.info(`Stage fetch starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "fetch" }, ctx.correlationId);

      try {
        const agent = ctx.listingId
          ? new ApifyFetcherAgent()
          : new ListingFetcherAgent();

        const input = ctx.listingId
          ? { listingId: ctx.listingId }
          : { asin: ctx.stageOutputs.rawListing?.asin ?? "", marketplace: "US" };

        const evaluator = new ApifyFetcherEvaluator();

        let output: RawListingData | undefined;
        let attempts = 1;
        let approved = false;
        let issues: string[] = [];

        while (attempts <= 3 && !approved) {
          try {
            output = await agent.execute(input) as RawListingData;
            const evaluation = await evaluator.evaluate(output);
            if (evaluation.approved) {
              approved = true;
            } else {
              issues = evaluation.issues;
              logger.warn(`Stage fetch evaluation failed on attempt ${attempts}`, { jobId: ctx.jobId, issues, score: evaluation.score });
              eventBus.emit("review:warning", {
                stage: "fetch",
                issues,
                score: evaluation.score,
              });
              attempts++;
            }
          } catch (execErr) {
            const message = execErr instanceof Error ? execErr.message : String(execErr);
            issues = [`Agent execution error: ${message}`];
            logger.error(`Agent execution failed in stage fetch (attempt ${attempts}): ${message}`, { jobId: ctx.jobId });
            attempts++;
          }
        }

        if (!approved || !output) {
          throw new Error(`Stage fetch failed evaluation after 3 attempts. Issues: ${issues.join("; ")}`);
        }

        eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "fetch" }, ctx.correlationId);
        return output;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Stage fetch execution failed: ${message}`, { cause: err });
      }
    },
  },
  {
    name: "preprocess",
    dependencies: ["fetch"],
    async execute(ctx: StageContext): Promise<StageOutput["cleaned"]> {
      logger.info(`Stage preprocess starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "preprocess" }, ctx.correlationId);

      try {
        if (!ctx.stageOutputs.rawListing) {
          throw new Error("Missing dependency output: rawListing");
        }

        const agent = new PreprocessorAgent();
        const evaluator = new PreprocessorEvaluator();

        let output: CleanedText | undefined;
        let attempts = 1;
        let approved = false;
        let issues: string[] = [];

        while (attempts <= 3 && !approved) {
          try {
            output = await agent.execute(ctx.stageOutputs.rawListing) as CleanedText;
            const evaluation = await evaluator.evaluate(output);
            if (evaluation.approved) {
              approved = true;
            } else {
              issues = evaluation.issues;
              logger.warn(`Stage preprocess evaluation failed on attempt ${attempts}`, { jobId: ctx.jobId, issues, score: evaluation.score });
              eventBus.emit("review:warning", {
                stage: "preprocess",
                issues,
                score: evaluation.score,
              });
              attempts++;
            }
          } catch (execErr) {
            const message = execErr instanceof Error ? execErr.message : String(execErr);
            issues = [`Agent execution error: ${message}`];
            attempts++;
          }
        }

        if (!approved || !output) {
          throw new Error(`Stage preprocess failed evaluation after 3 attempts. Issues: ${issues.join("; ")}`);
        }

        eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "preprocess" }, ctx.correlationId);
        return output;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Stage preprocess execution failed: ${message}`, { cause: err });
      }
    },
  },
  {
    name: "embedding",
    dependencies: ["preprocess"],
    async execute(ctx: StageContext): Promise<StageOutput["embedding"]> {
      logger.info(`Stage embedding starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "embedding" }, ctx.correlationId);

      try {
        if (!ctx.stageOutputs.cleaned) {
          throw new Error("Missing dependency output: cleaned");
        }

        const agent = new EmbeddingGeneratorAgent();
        const evaluator = new EmbeddingGeneratorEvaluator();

        let output: number[] | undefined;
        let attempts = 1;
        let approved = false;
        let issues: string[] = [];

        while (attempts <= 3 && !approved) {
          try {
            output = await agent.execute(ctx.stageOutputs.cleaned) as number[];
            const evaluation = await evaluator.evaluate(output);
            if (evaluation.approved) {
              approved = true;
            } else {
              issues = evaluation.issues;
              logger.warn(`Stage embedding evaluation failed on attempt ${attempts}`, { jobId: ctx.jobId, issues, score: evaluation.score });
              eventBus.emit("review:warning", {
                stage: "embedding",
                issues,
                score: evaluation.score,
              });
              attempts++;
            }
          } catch (execErr) {
            const message = execErr instanceof Error ? execErr.message : String(execErr);
            issues = [`Agent execution error: ${message}`];
            attempts++;
          }
        }

        if (!approved || !output) {
          throw new Error(`Stage embedding failed evaluation after 3 attempts. Issues: ${issues.join("; ")}`);
        }

        // Persist embedding to listings table
        if (ctx.stageOutputs.rawListing && Array.isArray(output)) {
          const listing = await listingService.getLatestListingByProspectId(ctx.prospectId);
          if (listing) {
            await listingService.updateEmbedding(listing.id, output);
          }
        }

        eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "embedding" }, ctx.correlationId);
        return output;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Stage embedding execution failed: ${message}`, { cause: err });
      }
    },
  },
  {
    name: "semantic",
    dependencies: ["embedding"],
    async execute(ctx: StageContext): Promise<StageOutput["analysis"]> {
      logger.info(`Stage semantic starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "semantic" }, ctx.correlationId);

      try {
        if (!ctx.stageOutputs.embedding || !ctx.stageOutputs.cleaned) {
          throw new Error("Missing dependency outputs: embedding or cleaned");
        }

        const agent = new SemanticAnalyzerAgent();
        const evaluator = new SemanticAnalyzerEvaluator();

        let output: AnalysisResult | undefined;
        let attempts = 1;
        let approved = false;
        let issues: string[] = [];

        while (attempts <= 3 && !approved) {
          try {
            output = await agent.execute({
              embedding: ctx.stageOutputs.embedding,
              text: ctx.stageOutputs.cleaned,
            }) as AnalysisResult;
            const evaluation = await evaluator.evaluate(output);
            if (evaluation.approved) {
              approved = true;
            } else {
              issues = evaluation.issues;
              logger.warn(`Stage semantic evaluation failed on attempt ${attempts}`, { jobId: ctx.jobId, issues, score: evaluation.score });
              eventBus.emit("review:warning", {
                stage: "semantic",
                issues,
                score: evaluation.score,
              });
              attempts++;
            }
          } catch (execErr) {
            const message = execErr instanceof Error ? execErr.message : String(execErr);
            issues = [`Agent execution error: ${message}`];
            attempts++;
          }
        }

        if (!approved || !output) {
          throw new Error(`Stage semantic failed evaluation after 3 attempts. Issues: ${issues.join("; ")}`);
        }

        eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "semantic" }, ctx.correlationId);
        return output;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Stage semantic execution failed: ${message}`, { cause: err });
      }
    },
  },
  {
    name: "optimize",
    dependencies: ["semantic"],
    async execute(ctx: StageContext): Promise<StageOutput["optimized"]> {
      logger.info(`Stage optimize starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "optimize" }, ctx.correlationId);

      try {
        if (!ctx.stageOutputs.analysis || !ctx.stageOutputs.rawListing) {
          throw new Error("Missing dependency outputs: analysis or rawListing");
        }

        // Fetch prospect details using domain service instead of raw DB
        const prospectData = await prospectService.getProspectById(ctx.prospectId);
        const prospect = prospectData.prospect;
        const prospectName = prospect.firstName || prospect.email?.split("@")[0] || "there";

        const analysis = ctx.stageOutputs.analysis;
        const listing = ctx.stageOutputs.rawListing;

        const stageCopy = await generateAllStageCopy(
          { rufusScore: analysis.rufusScore, cosmoScore: 0, semanticGaps: analysis.semanticGaps },
          listing,
          prospectName
        );

        const agent = new ContentOptimizerAgent();
        const evaluator = new ContentOptimizerEvaluator();

        let agentOutput: OptimizedContent | undefined;
        let attempts = 1;
        let approved = false;
        let issues: string[] = [];

        while (attempts <= 3 && !approved) {
          try {
            agentOutput = await agent.execute({
              gaps: analysis.semanticGaps,
              listing,
            }) as OptimizedContent;
            const evaluation = await evaluator.evaluate(agentOutput);
            if (evaluation.approved) {
              approved = true;
            } else {
              issues = evaluation.issues;
              logger.warn(`Stage optimize evaluation failed on attempt ${attempts}`, { jobId: ctx.jobId, issues, score: evaluation.score });
              eventBus.emit("review:warning", {
                stage: "optimize",
                issues,
                score: evaluation.score,
              });
              attempts++;
            }
          } catch (execErr) {
            const message = execErr instanceof Error ? execErr.message : String(execErr);
            issues = [`Agent execution error: ${message}`];
            attempts++;
          }
        }

        if (!approved || !agentOutput) {
          throw new Error(`Stage optimize failed evaluation after 3 attempts. Issues: ${issues.join("; ")}`);
        }

        const output = {
          ...agentOutput,
          stageCopy,
        };

        eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "optimize" }, ctx.correlationId);
        return output;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Stage optimize execution failed: ${message}`, { cause: err });
      }
    },
  },
  {
    name: "competitor",
    dependencies: ["fetch"],
    async execute(ctx: StageContext): Promise<StageOutput["competitors"]> {
      logger.info(`Stage competitor starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "competitor" }, ctx.correlationId);

      try {
        const agent = new CompetitorAnalystAgent();
        const evaluator = new CompetitorAnalystEvaluator();

        let output: CompetitorBenchmark[] | undefined;
        let attempts = 1;
        let approved = false;
        let issues: string[] = [];

        while (attempts <= 3 && !approved) {
          try {
            output = await agent.execute({
              asin: ctx.stageOutputs.rawListing?.asin ?? "",
              category: ctx.stageOutputs.rawListing?.category ?? "",
            }) as CompetitorBenchmark[];
            const evaluation = await evaluator.evaluate(output);
            if (evaluation.approved) {
              approved = true;
            } else {
              issues = evaluation.issues;
              logger.warn(`Stage competitor evaluation failed on attempt ${attempts}`, { jobId: ctx.jobId, issues, score: evaluation.score });
              eventBus.emit("review:warning", {
                stage: "competitor",
                issues,
                score: evaluation.score,
              });
              attempts++;
            }
          } catch (execErr) {
            const message = execErr instanceof Error ? execErr.message : String(execErr);
            issues = [`Agent execution error: ${message}`];
            attempts++;
          }
        }

        if (!approved || !output) {
          throw new Error(`Stage competitor failed evaluation after 3 attempts. Issues: ${issues.join("; ")}`);
        }

        eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "competitor" }, ctx.correlationId);
        return output;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Stage competitor execution failed: ${message}`, { cause: err });
      }
    },
  },
];
