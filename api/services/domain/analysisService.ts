import { pipelineEngine } from "../../pipeline/engine.js";
import { generateAllStageCopy } from "../copywriter.js";
import type {
  RawListingData,
  AnalysisResult,
  SemanticGap,
} from "../../agents/types.js";
import type { PipelineJob } from "../../pipeline/types.js";
import type { StageCopy } from "../copywriter.js";
import * as listingRepo from "../../db/repositories/listingRepository.js";
import * as prospectRepo from "../../db/repositories/prospectRepository.js";
import * as analysisRepo from "../../db/repositories/analysisRepository.js";
import type {
  ListingRecord,
  ProspectRecord,
  ListingAnalysisRecord,
  InsertAnalysisInput,
} from "../../db/types.js";

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

function buildRawListing(listing: ListingRecord): RawListingData {
  return {
    asin: listing.asin,
    title: listing.title || "",
    bullets: safeJsonParse(listing.bullets, []),
    description: listing.description || "",
    brand: listing.brand || "",
    category: listing.category || "",
    subcategory: listing.category || "",
    images: safeJsonParse(listing.images, []),
    price: listing.price || 0,
    rating: listing.rating || 0,
    reviewCount: listing.reviewCount || 0,
    attributes: safeJsonParse(listing.rawScrapeData, {}),
  };
}

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
  };
}

async function resolveStageCopy(
  analysisResult: AnalysisResult | undefined,
  rawListing: RawListingData,
  prospectName: string,
  optimized: ({ stageCopy?: unknown } & Record<string, unknown>) | undefined
): Promise<StageCopy> {
  const existing = optimized?.stageCopy as StageCopy | undefined;
  if (existing) return existing;

  const gaps = analysisResult?.semanticGaps || [];
  return generateAllStageCopy(
    {
      rufusScore: analysisResult?.rufusScore ?? 0,
      cosmoScore: analysisResult?.cosmoScore ?? 0,
      semanticGaps: gaps,
    },
    rawListing,
    prospectName
  );
}

function buildAnalysisInsertInput(
  listing: ListingRecord,
  prospect: ProspectRecord,
  metrics: AnalysisMetrics,
  stageCopy: StageCopy,
  job: PipelineJob
): InsertAnalysisInput {
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
  const rawListing = buildRawListing(listing);
  const metrics = computeMetrics(analysisResult);
  const prospectName = buildProspectName(prospect);
  const stageCopy = await resolveStageCopy(
    analysisResult,
    rawListing,
    prospectName,
    optimized
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

  const rawListing = buildRawListing(listing);
  const prospectName = prospect ? buildProspectName(prospect) : "there";

  const gaps = safeJsonParse<SemanticGap[]>(analysisRow.gaps, []);
  let stageCopy: StageCopy;
  try {
    stageCopy = await generateAllStageCopy(
      {
        rufusScore: analysisRow.rufusScore,
        cosmoScore: analysisRow.cosmoScore,
        semanticGaps: gaps,
      },
      rawListing,
      prospectName
    );
  } catch (err) {
    throw new Error(`Failed to regenerate copy for analysis ${analysisId}`, {
      cause: err,
    });
  }

  try {
    await analysisRepo.updateCopy(analysisId, {
      personalizedHook: stageCopy.heroHeadline,
      problemNarrative: stageCopy.autopsyBody,
      solutionPitch: stageCopy.roadmapBody,
      urgencyCTA: stageCopy.urgencyCTA,
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
