import type { InferInsertModel } from "drizzle-orm";
import type {
  prospects,
  listings,
  listingAnalyses,
  bookings,
  prospectActivities,
  brandSettings,
  rufusQueries,
  rufusQueryRuns,
  catalogLinks,
  pipelineJobs,
  pipelineJobStages,
  usageEvents,
  jobs,
} from "./schema.js";

// ── Record interfaces (mirrors api/db/client.ts for backward compat) ──

export interface ProspectRecord {
  id: number;
  slug: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  apolloContactId?: string;
  apolloSequenceId?: string;
  status: string;
  landingPageViews: number;
  packageType?: string;
  pricePoint?: number;
  createdAt: string;
}

export interface ListingRecord {
  id: number;
  prospectId: number;
  asin: string;
  marketplace: string;
  url?: string;
  title?: string;
  bullets?: string;
  description?: string;
  brand?: string;
  category?: string;
  price?: number;
  rating?: number;
  reviewCount?: number;
  images?: string;
  aPlusText?: string;
  rawScrapeData?: string;
  embeddingVector?: string;
  scrapedAt?: string;
  createdAt: string;
}

export interface ListingAnalysisRecord {
  id: number;
  listingId: number;
  prospectId: number;
  overallScore: number;
  rufusScore: number;
  cosmoScore: number;
  semanticScore: number;
  contentScore: number;
  visualScore: number;
  gaps: string;
  topIssues: string;
  strengths: string;
  opportunities: string;
  aiAnalysisRaw: string;

  copyPersonalizedHook?: string;
  copyProblemNarrative?: string;
  copySolutionPitch?: string;
  copyUrgencyCTA?: string;

  copyHeroHeadline?: string;
  copyHeroSubheadline?: string;

  copyAutopsyHeadline?: string;
  copyAutopsyBody?: string;

  copyBleedHeadline?: string;
  copyBleedBody?: string;

  copySimulatorIntro?: string;
  copySimulatorScenarios?: string;

  copyTransformHeadline?: string;
  copyTransformBefore?: string;
  copyTransformAfter?: string;

  copyRoadmapHeadline?: string;
  copyRoadmapBody?: string;

  copySocialProofHeadline?: string;

  copyCtaHeadline?: string;
  copyCtaGuarantee?: string;

  copyFreeQAs?: string;
  copyReviewSentiment?: string;
  copyCompetitorAudit?: string;
  copyPpcKeywords?: string;
  copyCosmoBundling?: string;
  copyCosmoGraphData?: string;

  packageType?: string;
  pricePoint?: number;
  createdAt: string;
}

export interface BookingRecord {
  id: number;
  prospectId: number;
  name: string;
  email: string;
  company?: string;
  revenue?: string;
  notes?: string;
  scheduledDate?: string;
  status: string;
  createdAt: string;
}

export interface BrandSettingsRecord {
  id: number;
  companyName?: string;
  logoUrl?: string;
  logoBase64?: string;
  primaryColor?: string;
  website?: string;
  createdAt: string;
}

export interface RufusQueryRecord {
  id: number;
  prospectId: number;
  queryText: string;
  category: string;
  createdAt: string;
}

export interface RufusQueryRunRecord {
  id: number;
  queryId: number;
  asinRankings: string;
  sovPercent: number;
  cosmoReadinessScore?: number;
  qaCoverageRatio?: number;
  rufusAnsweredRate?: number;
  createdAt: string;
}

export interface CatalogLinkRecord {
  id: number;
  prospectId: number;
  sourceAsin: string;
  targetAsin: string;
  relationshipType: string;
  strengthScore: number;
  createdAt: string;
}

export interface UsageEventRecord {
  id: number;
  prospectId: number;
  jobId?: number;
  service: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costCents: number;
  createdAt: string;
}

export interface JobQueueRecord {
  id: number;
  queue: string;
  name: string;
  dataJSON: string;
  optsJSON?: string;
  progress: number;
  delay: number;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  processedOn?: number;
  finishedOn?: number;
  returnValueJSON?: string;
  failedReason?: string;
  stacktraceJSON?: string;
  status: string;
  createdAt: string;
}

// ── Insert types (Drizzle ORM) ──

export type InsertProspectInput = InferInsertModel<typeof prospects>;
export type InsertListingInput = InferInsertModel<typeof listings>;
export type InsertAnalysisInput = InferInsertModel<typeof listingAnalyses>;
export type InsertBookingInput = InferInsertModel<typeof bookings>;
export type InsertBrandSettingsInput = InferInsertModel<typeof brandSettings>;
export type InsertRufusQueryInput = InferInsertModel<typeof rufusQueries>;
export type InsertRufusQueryRunInput = InferInsertModel<typeof rufusQueryRuns>;
export type InsertCatalogLinkInput = InferInsertModel<typeof catalogLinks>;
export type InsertPipelineJobInput = InferInsertModel<typeof pipelineJobs>;
export type InsertPipelineJobStageInput = InferInsertModel<typeof pipelineJobStages>;

