import { scrapeAmazonListing } from "../domains/listing/scraper.js";
import { generateEmbedding } from "../services/embedding.js";
import { analyzeSemanticGaps } from "../domains/analysis/engine.js";
import { generateOptimizedContent } from "../domains/optimization/content.js";
import { fetchCompetitors } from "../services/competitor.js";
import { generateAllStageCopy } from "../domains/optimization/copywriter.js";
import { logger } from "../infra/logger.js";
import { eventBus } from "../infra/eventBus.js";
import * as listingService from "../domains/listing/service.js";
import * as prospectService from "../domains/prospect/service.js";
import { executeWithRetry } from "./executeWithRetry.js";
import { safeJsonParse } from "../lib/json.js";
import { mapListingRecordToRawListingData, mapScrapedDataToRawListingData } from "../lib/mapping.js";
import type {
  StageExecutor,
  StageContext,
  StageOutput,
  RawListingData,
  CleanedText,
  AnalysisResult,
  OptimizedContent,
  CompetitorBenchmark,
} from "./pipeline.types.js";

function getMockListingData(asin?: string): RawListingData {
  return {
    asin: asin || "B000000000",
    title: "Premium Magnesium Glycinate Supplement — 400mg per Serving, 180 Capsules",
    bullets: [
      "High Absorption Magnesium Glycinate: Gentle on the stomach and easily absorbed.",
      "Supports Restful Sleep & Relaxation: Promotes calmness and helps you fall asleep faster.",
      "Muscle Recovery & Cramp Relief: Ideal for athletes to reduce muscle soreness.",
      "Third-Party Tested & Non-GMO: Made in a GMP-certified facility.",
      "180 Capsules — 3-Month Supply: Each serving delivers 400mg of elemental magnesium.",
    ],
    description: "<p>Our Premium Magnesium Glycinate supplement...</p>",
    brand: "NutraWell",
    category: "Health & Household",
    subcategory: "Vitamins & Dietary Supplements",
    images: ["image1.jpg", "image2.jpg"],
    price: 24.99,
    rating: 4.6,
    reviewCount: 3420,
    attributes: {},
  };
}



export const stageExecutors: StageExecutor[] = [
  {
    name: "fetch",
    dependencies: [],
    async execute(ctx: StageContext): Promise<StageOutput["rawListing"]> {
      logger.info(`Stage fetch starting`, { jobId: ctx.jobId, correlationId: ctx.correlationId });
      eventBus.emit("stage:start", { jobId: ctx.jobId, stage: "fetch" }, ctx.correlationId);

      try {
        const output = await executeWithRetry<RawListingData>(
          async () => {
            if (ctx.listingId) {
              const listing = await listingService.getListingById(ctx.listingId);
              if (listing) {
                return mapListingRecordToRawListingData(listing);
              } else {
                return getMockListingData();
              }
            } else {
              const asin = ctx.stageOutputs.rawListing?.asin ?? "";
              const marketplace = "US";
              if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
                throw new Error(`Invalid ASIN format: ${asin}`);
              }
              const scraped = await scrapeAmazonListing(asin, marketplace);
              return mapScrapedDataToRawListingData(scraped);
            }
          },
          (output) => {
            const evalIssues: string[] = [];
            const evalSuggestions: string[] = [];
            if (!output.title || output.title.length < 10) evalIssues.push("Title is too short or empty");
            if (!output.bullets || output.bullets.length < 3) evalIssues.push("Too few bullet points (minimum 3)");
            if (!output.brand) evalIssues.push("Missing brand information");
            if (output.bullets && output.bullets.some((b) => b.length < 20)) {
              evalSuggestions.push("Some bullets are very short; consider expanding with details");
            }
            const score = Math.max(0, 100 - evalIssues.length * 25 - evalSuggestions.length * 5);
            return { approved: evalIssues.length === 0, issues: evalIssues, score };
          },
          { stage: "fetch", ctx }
        );

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

        const data = ctx.stageOutputs.rawListing;

        const output = await executeWithRetry<CleanedText>(
          async () => {
            const rawText = [
              data.title,
              ...data.bullets,
              data.description,
              data.brand,
              data.category,
              data.subcategory,
            ].join(" ");

            const noHtml = rawText.replace(/<[^>]+>/g, " ");
            const lowercased = noHtml.toLowerCase();
            const normalized = lowercased
              .replace(/[\u2018\u2019]/g, "'")
              .replace(/[\u201C\u201D]/g, '"')
              .replace(/[\u2013\u2014]/g, "-");
            const cleaned = normalized.replace(/\s+/g, " ").trim();
            const truncated = cleaned.slice(0, 32000);

            return { text: truncated, source: data };
          },
          (output) => {
            const evalIssues: string[] = [];
            if (!output.text) evalIssues.push("Cleaned text is empty or undefined");
            else if (output.text.length < 100) evalIssues.push("Preprocessed text is too short (< 100 chars)");
            if (output.text.includes("<")) evalIssues.push("HTML tags may not have been fully removed");
            const score = Math.max(0, 100 - evalIssues.length * 30);
            return { approved: evalIssues.length === 0, issues: evalIssues, score };
          },
          { stage: "preprocess", ctx }
        );

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

        const output = await executeWithRetry<number[]>(
          async () => {
            const text = ctx.stageOutputs.cleaned!.text;
            if (!text || text.length < 10) {
              throw new Error("Text too short for embedding generation");
            }
            return await generateEmbedding(text);
          },
          (output) => {
            const evalIssues: string[] = [];
            if (!output || !Array.isArray(output)) evalIssues.push("Embedding vector is not an array or is empty");
            else {
              if (output.length !== 1536) evalIssues.push(`Wrong embedding dimension: ${output.length} (expected 1536)`);
              if (output.some((v) => !Number.isFinite(v))) evalIssues.push("Embedding contains non-finite values");
            }
            const score = output && Array.isArray(output) && output.length === 1536 && output.every((v) => Number.isFinite(v)) ? 100 : 0;
            return { approved: evalIssues.length === 0, issues: evalIssues, score };
          },
          { stage: "embedding", ctx }
        );

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

        const output = await executeWithRetry<AnalysisResult>(
          async () => {
            return await analyzeSemanticGaps(ctx.stageOutputs.embedding!, ctx.stageOutputs.cleaned!);
          },
          (output) => {
            const evalIssues: string[] = [];
            const evalSuggestions: string[] = [];
            if (!output) evalIssues.push("Analysis result is empty or undefined");
            else {
              if (output.rufusScore < 0 || output.rufusScore > 100) evalIssues.push(`Rufus score out of range: ${output.rufusScore}`);
              if (!output.semanticGaps || output.semanticGaps.length === 0) evalIssues.push("No semantic gaps detected — suspicious for a real listing");
              if (output.rufusScore < 40) evalSuggestions.push("Listing has significant room for improvement; prioritize critical gaps");
              if (output.semanticGaps && !output.semanticGaps.some((g) => g.priority === "critical" || g.priority === "high")) {
                evalSuggestions.push("No high-priority gaps found; verify dimension coverage");
              }
            }
            const score = output ? Math.max(0, 100 - evalIssues.length * 30 - Math.max(0, 40 - output.rufusScore)) : 0;
            return { approved: evalIssues.length === 0, issues: evalIssues, score };
          },
          { stage: "semantic", ctx }
        );

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

        const agentOutput = await executeWithRetry<OptimizedContent>(
          async () => {
            return await generateOptimizedContent(analysis.semanticGaps, listing);
          },
          (agentOutput) => {
            const evalIssues: string[] = [];
            const evalSuggestions: string[] = [];
            if (!agentOutput) evalIssues.push("Optimized content is empty or undefined");
            else {
              if (agentOutput.title && agentOutput.title.length > 200) evalIssues.push(`Title exceeds Amazon limit: ${agentOutput.title.length} chars`);
              if (!agentOutput.bullets || agentOutput.bullets.length !== 5) evalIssues.push(`Expected 5 bullets, got ${agentOutput.bullets ? agentOutput.bullets.length : 0}`);
              if (!agentOutput.qas || agentOutput.qas.length < 3) evalIssues.push(`Expected at least 3 QAs, got ${agentOutput.qas ? agentOutput.qas.length : 0}`);
              if (agentOutput.bullets && agentOutput.bullets.some((b) => b.length < 30)) evalSuggestions.push("Some bullets are quite short; consider adding more detail");
            }
            const score = agentOutput ? Math.max(0, 100 - evalIssues.length * 25 - evalSuggestions.length * 5) : 0;
            return { approved: evalIssues.length === 0, issues: evalIssues, score };
          },
          { stage: "optimize", ctx }
        );

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
        const output = await executeWithRetry<CompetitorBenchmark[]>(
          async () => {
            return await fetchCompetitors(
              ctx.stageOutputs.rawListing?.asin ?? "",
              ctx.stageOutputs.rawListing?.category ?? ""
            );
          },
          (output) => {
            const evalIssues: string[] = [];
            const evalSuggestions: string[] = [];
            if (!output || !Array.isArray(output)) evalIssues.push("Competitors list is not an array or is empty");
            else {
              if (output.length > 5) evalIssues.push(`Too many competitors: ${output.length} (max 5)`);
              for (const comp of output) {
                if (comp.score < 0 || comp.score > 100) evalIssues.push(`Invalid score for ${comp.asin}: ${comp.score}`);
              }
              if (output.length === 0) evalSuggestions.push("No competitors found; category may be too niche or API issue");
            }
            const score = output ? Math.max(0, 100 - evalIssues.length * 30) : 0;
            return { approved: evalIssues.length === 0, issues: evalIssues, score };
          },
          { stage: "competitor", ctx }
        );

        eventBus.emit("stage:complete", { jobId: ctx.jobId, stage: "competitor" }, ctx.correlationId);
        return output;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Stage competitor execution failed: ${message}`, { cause: err });
      }
    },
  },
];
