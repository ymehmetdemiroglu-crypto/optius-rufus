import { pipelineEngine } from "../../pipeline/engine.js";
import { logger } from "../../infra/logger.js";
import { generateAllStageCopy } from "../optimization/copywriter.js";
import type {
  RawListingData,
  AnalysisResult,
  SemanticGap,
} from "../../pipeline/pipeline.types.js";
import type { PipelineJob } from "../../pipeline/pipeline.types.js";
import type { StageCopy } from "../optimization/copywriter.js";
import * as listingRepo from "../listing/repository.js";
import * as prospectRepo from "../prospect/repository.js";
import * as analysisRepo from "./repository.js";
import type {
  ProspectRecord,
  ListingAnalysisRecord,
  InsertAnalysisInput,
} from "../../db/schema.types.js";
import { mapListingRecordToRawListingData } from "../../lib/mapping.js";
import { safeJsonParse } from "../../lib/json.js";
import type { ListingRecord } from "../../db/schema.types.js";
import type { OptimizedContent } from "../../pipeline/pipeline.types.js";



function buildProspectName(prospect: ProspectRecord): string {
  const firstName = prospect.firstName || "";
  const lastName = prospect.lastName || "";
  return [firstName, lastName].filter(Boolean).join(" ") || "there";
}

interface PipelineOutputs {
  analysisResult: AnalysisResult | undefined;
  optimized: ({ stageCopy?: unknown } & Record<string, unknown>) | undefined;
  competitors: Array<Record<string, unknown>> | undefined;
}

function extractPipelineOutputs(job: PipelineJob): PipelineOutputs {
  return {
    analysisResult: job.stages.semantic?.output as AnalysisResult | undefined,
    optimized: job.stages.optimize?.output as
      | ({ stageCopy?: unknown } & Record<string, unknown>)
      | undefined,
    competitors: job.stages.competitor?.output as
      | Array<Record<string, unknown>>
      | undefined,
  };
}

interface AnalysisMetrics {
  gaps: SemanticGap[];
  topIssues: SemanticGap[];
  strengths: string[];
  opportunities: string[];
  rufusScore: number;
  optimizedRufusScore: number;
  cosmoScore: number;
  semanticScore: number;
  contentScore: number;
  visualScore: number;
  predictedIntents: AnalysisResult["predictedIntents"];
  intentCoverage: AnalysisResult["intentCoverage"];
}

function computeMetrics(analysisResult: AnalysisResult | undefined): AnalysisMetrics {
  const gaps = analysisResult?.semanticGaps || [];
  const topIssues = gaps
    .filter((g) => g.priority === "critical" || g.priority === "high")
    .slice(0, 5);
  const strengths = gaps.filter((g) => g.gap < 0.3).map((g) => g.dimension);
  const opportunities = gaps.filter((g) => g.gap >= 0.3).map((g) => g.dimension);

  const rufusScore = analysisResult?.rufusScore ?? 0;
  const criticalGaps = gaps.filter(
    (g) => g.priority === "critical" || g.priority === "high"
  );
  const gapRemediationPotential =
    criticalGaps.length > 0 ? Math.min(25, criticalGaps.length * 5) : 10;
  const optimizedRufusScore = Math.min(100, rufusScore + gapRemediationPotential);

  return {
    gaps,
    topIssues,
    strengths,
    opportunities,
    rufusScore,
    optimizedRufusScore,
    cosmoScore: analysisResult?.cosmoScore || 0,
    semanticScore: Math.round(rufusScore * 0.9),
    contentScore: Math.round(optimizedRufusScore * 0.95),
    visualScore: Math.round((analysisResult?.cosmoScore || 0) * 0.85),
    predictedIntents: analysisResult?.predictedIntents ?? [],
    intentCoverage: analysisResult?.intentCoverage ?? {
      overall: 0,
      byJourney: { informational: 0, transactional: 0, comparison: 0, safety_trust: 0, usage: 0 },
      totalIntents: 0,
      criticalCount: 0,
      highCount: 0,
    },
  };
}

async function resolveStageCopy(
  analysisResult: AnalysisResult | undefined,
  rawListing: RawListingData,
  prospectName: string,
  optimized: ({ stageCopy?: unknown } & Record<string, unknown>) | undefined,
  expectedRevenue?: string
): Promise<StageCopy> {
  const existing = optimized?.stageCopy as StageCopy | undefined;
  if (existing) return existing;

  return generateAllStageCopy(
    analysisResult ?? { rufusScore: 0, cosmoScore: 0, semanticGaps: [], predictedIntents: [], intentCoverage: { overall: 0, byJourney: { informational: 0, transactional: 0, comparison: 0, safety_trust: 0, usage: 0 }, totalIntents: 0, criticalCount: 0, highCount: 0 } },
    rawListing,
    prospectName,
    expectedRevenue
  );
}

function buildAnalysisInsertInput(
  listing: ListingRecord,
  prospect: ProspectRecord,
  metrics: AnalysisMetrics,
  stageCopy: StageCopy,
  job: PipelineJob
): InsertAnalysisInput {
  const optimizedOutput = job.stages.optimize?.output as OptimizedContent | undefined;

  return {
    listingId: listing.id,
    prospectId: prospect.id,
    overallScore: metrics.optimizedRufusScore,
    rufusScore: metrics.rufusScore,
    cosmoScore: metrics.cosmoScore,
    semanticScore: metrics.semanticScore,
    contentScore: metrics.contentScore,
    visualScore: metrics.visualScore,
    gaps: metrics.gaps,
    topIssues: metrics.topIssues,
    strengths: metrics.strengths,
    opportunities: metrics.opportunities,
    aiAnalysisRaw: JSON.stringify({
      jobId: job.id,
      stages: Object.keys(job.stages),
      predictedIntents: metrics.predictedIntents,
      intentCoverage: metrics.intentCoverage,
      keywordPreservation: optimizedOutput?.keywordPreservationReport,
      variantB: optimizedOutput?.variantB,
    }),
    copyPersonalizedHook: stageCopy.heroHeadline,
    copyProblemNarrative: stageCopy.autopsyBody,
    copySolutionPitch: stageCopy.roadmapBody,
    copyUrgencyCTA: stageCopy.urgencyCTA,
    copyHeroHeadline: stageCopy.heroHeadline,
    copyHeroSubheadline: stageCopy.heroSubheadline,
    copyAutopsyHeadline: stageCopy.autopsyHeadline,
    copyAutopsyBody: stageCopy.autopsyBody,
    copyBleedHeadline: stageCopy.bleedHeadline,
    copyBleedBody: stageCopy.bleedBody,
    copySimulatorIntro: stageCopy.simulatorIntro,
    copySimulatorScenarios: stageCopy.simulatorScenarios,
    copyTransformHeadline: stageCopy.transformHeadline,
    copyTransformBefore: stageCopy.transformBefore,
    copyTransformAfter: stageCopy.transformAfter,
    copyRoadmapHeadline: stageCopy.roadmapHeadline,
    copyRoadmapBody: stageCopy.roadmapBody,
    copySocialProofHeadline: stageCopy.socialProofHeadline,
    copyCtaHeadline: stageCopy.ctaHeadline,
    copyCtaGuarantee: stageCopy.ctaGuarantee,
    copyCompetitorAudit: JSON.stringify(stageCopy.competitorAudit),
    copyFreeQAs: JSON.stringify(optimizedOutput?.qas || []),
    packageType: prospect.packageType || "package_2",
    pricePoint: prospect.pricePoint ?? 1500,
  };
}

async function fetchListing(listingId: number): Promise<ListingRecord> {
  let listing: ListingRecord | undefined;
  try {
    listing = await listingRepo.getById(listingId);
  } catch (err) {
    throw new Error(`Failed to fetch listing ${listingId}`, { cause: err });
  }
  if (!listing) {
    throw new Error(`Listing not found: ${listingId}`);
  }
  return listing;
}

async function fetchProspect(prospectId: number): Promise<ProspectRecord> {
  let prospect: ProspectRecord | undefined;
  try {
    prospect = await prospectRepo.getById(prospectId);
  } catch (err) {
    throw new Error(`Failed to fetch prospect ${prospectId}`, { cause: err });
  }
  if (!prospect) {
    throw new Error(`Prospect not found: ${prospectId}`);
  }
  return prospect;
}

async function executePipeline(
  listing: ListingRecord,
  prospect: ProspectRecord
): Promise<PipelineJob> {
  let job: PipelineJob;
  try {
    job = await pipelineEngine.createAndRunJob(
      listing.prospectId,
      listing.id,
      prospect.packageType || "package_2"
    );
  } catch (err) {
    throw new Error(`Pipeline execution failed for listing ${listing.id}`, {
      cause: err,
    });
  }
  if (job.status === "failed") {
    throw new Error(`Pipeline failed: ${job.errorLog || "Unknown error"}`);
  }
  return job;
}

async function persistAnalysis(
  listing: ListingRecord,
  prospect: ProspectRecord,
  metrics: AnalysisMetrics,
  stageCopy: StageCopy,
  job: PipelineJob
): Promise<ListingAnalysisRecord> {
  const insertInput = buildAnalysisInsertInput(
    listing,
    prospect,
    metrics,
    stageCopy,
    job
  );
  let analysis: ListingAnalysisRecord;
  try {
    analysis = await analysisRepo.create(insertInput);
  } catch (err) {
    throw new Error(`Failed to create analysis for listing ${listing.id}`, {
      cause: err,
    });
  }
  try {
    await prospectRepo.updateStatus(prospect.id, "analyzed");
    
    // Auto-generate AI outreach email drafts
    try {
      const { generateOutreachCopy } = await import("../prospect/outreach.js");
      const outreachEmails = await generateOutreachCopy(prospect.id);
      await prospectRepo.updateOutreachEmails(prospect.id, outreachEmails);
      await prospectRepo.updateStatus(prospect.id, "drafted");
    } catch (outreachErr) {
      logger.error("Failed to generate cold outreach email drafts during analysis pipeline:", {
        prospectId: prospect.id,
        error: outreachErr instanceof Error ? outreachErr.message : String(outreachErr),
      });
      // Do not throw so that the main analysis pipeline succeeds
    }
  } catch (err) {
    throw new Error("Failed to update prospect status after analysis", {
      cause: err,
    });
  }
  return analysis;
}

export async function runAnalysis(
  listingId: number
): Promise<{
  analysis: ListingAnalysisRecord;
  listing: ListingRecord;
  prospect: ProspectRecord;
}> {
  const listing = await fetchListing(listingId);
  const prospect = await fetchProspect(listing.prospectId);
  const job = await executePipeline(listing, prospect);
  const { analysisResult, optimized } = extractPipelineOutputs(job);
  const rawListing = mapListingRecordToRawListingData(listing);
  const metrics = computeMetrics(analysisResult);
  const prospectName = buildProspectName(prospect);
  const stageCopy = await resolveStageCopy(
    analysisResult,
    rawListing,
    prospectName,
    optimized,
    prospect.expectedRevenue || undefined
  );
  const analysis = await persistAnalysis(
    listing,
    prospect,
    metrics,
    stageCopy,
    job
  );
  return { analysis, listing, prospect };
}

export async function runAnalysisByProspect(
  prospectId: number
): Promise<{
  analysis: ListingAnalysisRecord;
  listing: ListingRecord;
  prospect: ProspectRecord;
}> {
  let listing: ListingRecord | undefined;
  try {
    listing = await listingRepo.getLatestByProspectId(prospectId);
  } catch (err) {
    throw new Error(`Failed to fetch listing for prospect ${prospectId}`, {
      cause: err,
    });
  }
  if (!listing) {
    throw new Error(`No listing found for prospect: ${prospectId}`);
  }
  return runAnalysis(listing.id);
}

export async function getAnalysisByProspect(
  prospectId: number
): Promise<{
  analysis: ListingAnalysisRecord | null;
  listing: ListingRecord | null;
}> {
  let listing: ListingRecord | undefined;
  try {
    listing = await listingRepo.getLatestByProspectId(prospectId);
  } catch (err) {
    throw new Error(`Failed to fetch listing for prospect ${prospectId}`, {
      cause: err,
    });
  }

  let analysis: ListingAnalysisRecord | undefined;
  if (listing) {
    try {
      analysis = await analysisRepo.getLatestByProspectId(prospectId);
    } catch (err) {
      throw new Error(`Failed to fetch analysis for prospect ${prospectId}`, {
        cause: err,
      });
    }
  }

  return { analysis: analysis || null, listing: listing || null };
}

export async function regenerateCopy(
  analysisId: number
): Promise<ListingAnalysisRecord> {
  let analysisRow: ListingAnalysisRecord | undefined;
  try {
    analysisRow = await analysisRepo.getById(analysisId);
  } catch (err) {
    throw new Error(`Failed to fetch analysis ${analysisId}`, { cause: err });
  }
  if (!analysisRow) {
    throw new Error(`Analysis not found: ${analysisId}`);
  }

  let listing: ListingRecord | undefined;
  try {
    listing = await listingRepo.getById(analysisRow.listingId);
  } catch (err) {
    throw new Error(`Failed to fetch listing for analysis ${analysisId}`, {
      cause: err,
    });
  }
  if (!listing) {
    throw new Error(`Listing not found for analysis: ${analysisId}`);
  }

  let prospect: ProspectRecord | undefined;
  try {
    prospect = await prospectRepo.getById(analysisRow.prospectId);
  } catch (err) {
    throw new Error(`Failed to fetch prospect for analysis ${analysisId}`, {
      cause: err,
    });
  }

  const rawListing = mapListingRecordToRawListingData(listing);
  const prospectName = prospect ? buildProspectName(prospect) : "there";

  const gaps = safeJsonParse<SemanticGap[]>(analysisRow.gaps, []);
  let stageCopy: StageCopy;
  try {
    stageCopy = await generateAllStageCopy(
      {
        rufusScore: analysisRow.rufusScore,
        cosmoScore: analysisRow.cosmoScore,
        semanticGaps: gaps,
        predictedIntents: [],
        intentCoverage: { overall: 0, byJourney: { informational: 0, transactional: 0, comparison: 0, safety_trust: 0, usage: 0 }, totalIntents: 0, criticalCount: 0, highCount: 0 },
      },
      rawListing,
      prospectName,
      prospect?.expectedRevenue || undefined
    );
  } catch (err) {
    throw new Error(`Failed to regenerate copy for analysis ${analysisId}`, {
      cause: err,
    });
  }

  try {
    await analysisRepo.updateCopy(analysisId, {
      heroHeadline: stageCopy.heroHeadline,
      heroSubheadline: stageCopy.heroSubheadline,
      autopsyHeadline: stageCopy.autopsyHeadline,
      autopsyBody: stageCopy.autopsyBody,
      bleedHeadline: stageCopy.bleedHeadline,
      bleedBody: stageCopy.bleedBody,
      simulatorIntro: stageCopy.simulatorIntro,
      simulatorScenarios: stageCopy.simulatorScenarios,
      transformHeadline: stageCopy.transformHeadline,
      transformBefore: stageCopy.transformBefore,
      transformAfter: stageCopy.transformAfter,
      roadmapHeadline: stageCopy.roadmapHeadline,
      roadmapBody: stageCopy.roadmapBody,
      socialProofHeadline: stageCopy.socialProofHeadline,
      ctaHeadline: stageCopy.ctaHeadline,
      ctaGuarantee: stageCopy.ctaGuarantee,
      competitorAudit: JSON.stringify(stageCopy.competitorAudit) as unknown as StageCopy["competitorAudit"],
    });
  } catch (err) {
    throw new Error(`Failed to update copy for analysis ${analysisId}`, {
      cause: err,
    });
  }

  let updated: ListingAnalysisRecord | undefined;
  try {
    updated = await analysisRepo.getById(analysisId);
  } catch (err) {
    throw new Error(`Failed to fetch updated analysis ${analysisId}`, {
      cause: err,
    });
  }
  if (!updated) {
    throw new Error(`Analysis ${analysisId} disappeared after update`);
  }
  return updated;
}

export async function scrapeAndAudit(
  prospectId: number,
  asin: string,
  marketplace = "US"
): Promise<void> {
  logger.info(`Starting background scrape and audit for prospect ${prospectId}, ASIN ${asin}`);
  try {
    await prospectRepo.updateStatus(prospectId, "analyzing");

    // 1. Scrape listing
    const item = await scrapeAmazonListing(asin, marketplace);
    let rawScrapeData: Record<string, unknown> = {};
    if (item.rawScrapeData) {
      try {
        rawScrapeData = JSON.parse(item.rawScrapeData);
      } catch {
        rawScrapeData = {};
      }
    }

    // 2. Create listing
    const listing = await listingService.createListing({
      prospectId,
      asin: item.asin,
      marketplace,
      url: `https://www.amazon.com/dp/${item.asin}`,
      title: item.title,
      bullets: item.bullets,
      description: item.description,
      brand: item.brand,
      category: item.category,
      price: item.price,
      rating: item.rating,
      reviewCount: item.reviewCount,
      images: item.images,
      aPlusText: item.aPlusText,
      rawScrapeData,
    });

    await prospectRepo.updateStatus(prospectId, "scraped");

    // 3. Run analysis
    await runAnalysis(listing.id);
    logger.info(`Background scrape and audit completed for prospect ${prospectId}, ASIN ${asin}`);

    // 4. Send email notification
    await sendAuditReadyEmail(prospectId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Failed background scrape and audit for prospect ${prospectId}: ${message}`);
    await prospectRepo.updateStatus(prospectId, "failed");
    throw err;
  }
}

import { scrapeAmazonListing } from "../listing/scraper.js";
import * as listingService from "../listing/service.js";
import { sendAuditReadyEmail } from "../../services/email.js";
