/**
 * SQLite → PostgreSQL data migration script.
 *
 * Reads from the existing SQLite database (via api/db/client.ts)
 * and writes to PostgreSQL via Drizzle ORM.
 *
 * Run with:
 *   DATABASE_URL=postgres://... npx tsx scripts/migrateSqliteToPostgres.ts
 */

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { db as sqliteDb } from "../api/db/client.js";
import * as schema from "../api/db/schema.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Set it before running this script, e.g.:\n" +
      "  DATABASE_URL=postgres://user:pass@localhost:5432/optimus npx tsx scripts/migrateSqliteToPostgres.ts"
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
});

const pgDb = drizzle(pool, { schema });

/* ------------------------------------------------------------------ */
// Structured logger (migration script must not use bare console.log)
/* ------------------------------------------------------------------ */

interface LogContext {
  table?: string;
  rows?: number;
  error?: string;
  [key: string]: unknown;
}

function log(level: "info" | "warn" | "error", message: string, ctx?: LogContext): void {
  const timestamp = new Date().toISOString();
  const ctxStr = ctx ? " " + JSON.stringify(ctx) : "";
  console.log(`[MIGRATION:${level.toUpperCase()}] ${timestamp} ${message}${ctxStr}`);
}

/* ------------------------------------------------------------------ */
// Helpers
/* ------------------------------------------------------------------ */

/**
 * Safely parse a JSON string. If the value is already an object, return it.
 * If parsing fails, return null.
 * NOTE: We cast via `as T` because SQLite stores JSON as text and we trust
 * the schema that wrote it. Production data should always be valid JSON.
 */
function safeJsonParse<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return null;
  }
}

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return isNaN(n) ? null : n;
}

function toInteger(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return isNaN(n) ? null : Math.floor(n);
}

/* ------------------------------------------------------------------ */
// Table migrations (in dependency order)
/* ------------------------------------------------------------------ */

async function migrateProspects(): Promise<void> {
  log("info", "Migrating prospects...", { table: "prospects" });
  const rows = sqliteDb
    .prepare("SELECT * FROM prospects")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "prospects" });
    return;
  }

  const values = rows.map((r) => ({
    id: toInteger(r.id)!,
    slug: toText(r.slug)!,
    email: toText(r.email)!,
    firstName: toText(r.firstName),
    lastName: toText(r.lastName),
    company: toText(r.company),
    apolloContactId: toText(r.apolloContactId),
    apolloSequenceId: toText(r.apolloSequenceId),
    status: toText(r.status) ?? "new",
    landingPageViews: toInteger(r.landingPageViews) ?? 0,
    packageType: toText(r.packageType) ?? "package_2",
    pricePoint: toNumber(r.pricePoint),
    createdAt: toDate(r.createdAt) ?? new Date(),
  }));

  await pgDb.insert(schema.prospects).values(values).onConflictDoNothing({
    target: schema.prospects.id,
  });
  log("info", "Migration complete", { table: "prospects", rows: rows.length });
}

async function migrateListings(): Promise<void> {
  log("info", "Migrating listings...", { table: "listings" });
  const rows = sqliteDb
    .prepare("SELECT * FROM listings")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "listings" });
    return;
  }

  const values = rows.map((r) => ({
    id: toInteger(r.id)!,
    prospectId: toInteger(r.prospectId)!,
    asin: toText(r.asin)!,
    marketplace: toText(r.marketplace) ?? "US",
    url: toText(r.url),
    title: toText(r.title),
    bullets: safeJsonParse<string[]>(r.bullets),
    description: toText(r.description),
    brand: toText(r.brand),
    category: toText(r.category),
    price: toNumber(r.price),
    rating: toNumber(r.rating),
    reviewCount: toInteger(r.reviewCount),
    images: safeJsonParse<string[]>(r.images),
    aPlusText: toText(r.aPlusText),
    rawScrapeData: safeJsonParse<Record<string, unknown>>(r.rawScrapeData),
    embeddingVector: toText(r.embeddingVector),
    scrapedAt: toDate(r.scrapedAt),
    createdAt: toDate(r.createdAt) ?? new Date(),
  }));

  await pgDb.insert(schema.listings).values(values).onConflictDoNothing({
    target: schema.listings.id,
  });
  log("info", "Migration complete", { table: "listings", rows: rows.length });
}

async function migrateListingAnalyses(): Promise<void> {
  log("info", "Migrating listing_analyses...", { table: "listing_analyses" });
  const rows = sqliteDb
    .prepare("SELECT * FROM listing_analyses")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "listing_analyses" });
    return;
  }

  const values = rows.map((r) => ({
    id: toInteger(r.id)!,
    listingId: toInteger(r.listingId)!,
    prospectId: toInteger(r.prospectId)!,
    overallScore: toInteger(r.overallScore),
    rufusScore: toInteger(r.rufusScore),
    cosmoScore: toInteger(r.cosmoScore),
    semanticScore: toInteger(r.semanticScore),
    contentScore: toInteger(r.contentScore),
    visualScore: toInteger(r.visualScore),
    gaps: safeJsonParse<unknown>(r.gaps),
    topIssues: safeJsonParse<unknown>(r.topIssues),
    strengths: safeJsonParse<unknown>(r.strengths),
    opportunities: safeJsonParse<unknown>(r.opportunities),
    aiAnalysisRaw: toText(r.aiAnalysisRaw),

    copyPersonalizedHook: toText(r.copyPersonalizedHook),
    copyProblemNarrative: toText(r.copyProblemNarrative),
    copySolutionPitch: toText(r.copySolutionPitch),
    copyUrgencyCTA: toText(r.copyUrgencyCTA),

    copyHeroHeadline: toText(r.copyHeroHeadline),
    copyHeroSubheadline: toText(r.copyHeroSubheadline),

    copyAutopsyHeadline: toText(r.copyAutopsyHeadline),
    copyAutopsyBody: toText(r.copyAutopsyBody),

    copyBleedHeadline: toText(r.copyBleedHeadline),
    copyBleedBody: toText(r.copyBleedBody),

    copySimulatorIntro: toText(r.copySimulatorIntro),
    copySimulatorScenarios: safeJsonParse<unknown>(r.copySimulatorScenarios),

    copyTransformHeadline: toText(r.copyTransformHeadline),
    copyTransformBefore: safeJsonParse<unknown>(r.copyTransformBefore),
    copyTransformAfter: safeJsonParse<unknown>(r.copyTransformAfter),

    copyRoadmapHeadline: toText(r.copyRoadmapHeadline),
    copyRoadmapBody: toText(r.copyRoadmapBody),

    copySocialProofHeadline: toText(r.copySocialProofHeadline),

    copyCtaHeadline: toText(r.copyCtaHeadline),
    copyCtaGuarantee: toText(r.copyCtaGuarantee),

    copyFreeQAs: toText(r.copyFreeQAs),
    copyReviewSentiment: toText(r.copyReviewSentiment),
    copyCompetitorAudit: toText(r.copyCompetitorAudit),
    copyPpcKeywords: toText(r.copyPpcKeywords),
    copyCosmoBundling: toText(r.copyCosmoBundling),
    copyCosmoGraphData: toText(r.copyCosmoGraphData),

    packageType: toText(r.packageType) ?? "package_2",
    pricePoint: toNumber(r.pricePoint),
    createdAt: toDate(r.createdAt) ?? new Date(),
  }));

  await pgDb.insert(schema.listingAnalyses).values(values).onConflictDoNothing({
    target: schema.listingAnalyses.id,
  });
  log("info", "Migration complete", { table: "listing_analyses", rows: rows.length });
}

async function migrateBookings(): Promise<void> {
  log("info", "Migrating bookings...", { table: "bookings" });
  const rows = sqliteDb
    .prepare("SELECT * FROM bookings")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "bookings" });
    return;
  }

  const values = rows.map((r) => ({
    id: toInteger(r.id)!,
    prospectId: toInteger(r.prospectId)!,
    name: toText(r.name)!,
    email: toText(r.email)!,
    company: toText(r.company),
    revenue: toText(r.revenue),
    notes: toText(r.notes),
    scheduledDate: toText(r.scheduledDate),
    status: toText(r.status) ?? "pending",
    createdAt: toDate(r.createdAt) ?? new Date(),
  }));

  await pgDb.insert(schema.bookings).values(values).onConflictDoNothing({
    target: schema.bookings.id,
  });
  log("info", "Migration complete", { table: "bookings", rows: rows.length });
}

async function migrateProspectActivities(): Promise<void> {
  log("info", "Migrating prospect_activities...", { table: "prospect_activities" });
  const rows = sqliteDb
    .prepare("SELECT * FROM prospect_activities")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "prospect_activities" });
    return;
  }

  const values = rows.map((r) => ({
    id: toInteger(r.id)!,
    prospectId: toInteger(r.prospectId)!,
    eventType: toText(r.eventType)!,
    eventData: safeJsonParse<unknown>(r.eventData),
    createdAt: toDate(r.createdAt) ?? new Date(),
  }));

  await pgDb
    .insert(schema.prospectActivities)
    .values(values)
    .onConflictDoNothing({
      target: schema.prospectActivities.id,
    });
  log("info", "Migration complete", { table: "prospect_activities", rows: rows.length });
}

async function migrateBrandSettings(): Promise<void> {
  log("info", "Migrating brand_settings...", { table: "brand_settings" });
  const rows = sqliteDb
    .prepare("SELECT * FROM brand_settings")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "brand_settings" });
    return;
  }

  const values = rows.map((r) => ({
    id: toInteger(r.id)!,
    companyName: toText(r.companyName),
    logoUrl: toText(r.logoUrl),
    logoBase64: toText(r.logoBase64),
    primaryColor: toText(r.primaryColor) ?? "#b8860b",
    website: toText(r.website),
    createdAt: toDate(r.createdAt) ?? new Date(),
  }));

  await pgDb.insert(schema.brandSettings).values(values).onConflictDoNothing({
    target: schema.brandSettings.id,
  });
  log("info", "Migration complete", { table: "brand_settings", rows: rows.length });
}

async function migrateRufusQueries(): Promise<void> {
  log("info", "Migrating rufus_queries...", { table: "rufus_queries" });
  const rows = sqliteDb
    .prepare("SELECT * FROM rufus_queries")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "rufus_queries" });
    return;
  }

  const values = rows.map((r) => ({
    id: toInteger(r.id)!,
    prospectId: toInteger(r.prospectId)!,
    queryText: toText(r.queryText)!,
    category: toText(r.category)!,
    createdAt: toDate(r.createdAt) ?? new Date(),
  }));

  await pgDb.insert(schema.rufusQueries).values(values).onConflictDoNothing({
    target: schema.rufusQueries.id,
  });
  log("info", "Migration complete", { table: "rufus_queries", rows: rows.length });
}

async function migrateRufusQueryRuns(): Promise<void> {
  log("info", "Migrating rufus_query_runs...", { table: "rufus_query_runs" });
  const rows = sqliteDb
    .prepare("SELECT * FROM rufus_query_runs")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "rufus_query_runs" });
    return;
  }

  const values = rows.map((r) => ({
    id: toInteger(r.id)!,
    queryId: toInteger(r.queryId)!,
    asinRankings: safeJsonParse<unknown>(r.asinRankings) ?? {},
    sovPercent: toNumber(r.sovPercent) ?? 0,
    createdAt: toDate(r.createdAt) ?? new Date(),
  }));

  await pgDb
    .insert(schema.rufusQueryRuns)
    .values(values)
    .onConflictDoNothing({
      target: schema.rufusQueryRuns.id,
    });
  log("info", "Migration complete", { table: "rufus_query_runs", rows: rows.length });
}

async function migrateCatalogLinks(): Promise<void> {
  log("info", "Migrating catalog_links...", { table: "catalog_links" });
  const rows = sqliteDb
    .prepare("SELECT * FROM catalog_links")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "catalog_links" });
    return;
  }

  const values = rows.map((r) => ({
    id: toInteger(r.id)!,
    prospectId: toInteger(r.prospectId)!,
    sourceAsin: toText(r.sourceAsin)!,
    targetAsin: toText(r.targetAsin)!,
    relationshipType: toText(r.relationshipType)!,
    strengthScore: toNumber(r.strengthScore) ?? 0.5,
    createdAt: toDate(r.createdAt) ?? new Date(),
  }));

  await pgDb.insert(schema.catalogLinks).values(values).onConflictDoNothing({
    target: schema.catalogLinks.id,
  });
  log("info", "Migration complete", { table: "catalog_links", rows: rows.length });
}

async function migratePipelineJobs(): Promise<void> {
  log("info", "Migrating pipeline_jobs...", { table: "pipeline_jobs" });
  const rows = sqliteDb
    .prepare("SELECT * FROM pipeline_jobs")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "pipeline_jobs" });
    return;
  }

  const values = rows.map((r) => ({
    id: toInteger(r.id)!,
    prospectId: toInteger(r.prospectId)!,
    listingId: toInteger(r.listingId),
    packageType: toText(r.packageType) ?? "package_2",
    status: toText(r.status) ?? "pending",
    currentStage: toText(r.currentStage),
    stagesJSON: safeJsonParse<unknown>(r.stagesJSON),
    tokenUsage: toInteger(r.tokenUsage) ?? 0,
    errorLog: toText(r.errorLog),
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
  }));

  await pgDb.insert(schema.pipelineJobs).values(values).onConflictDoNothing({
    target: schema.pipelineJobs.id,
  });
  log("info", "Migration complete", { table: "pipeline_jobs", rows: rows.length });
}

async function migratePipelineJobStages(): Promise<void> {
  log("info", "Migrating pipeline_job_stages...", { table: "pipeline_job_stages" });
  const rows = sqliteDb
    .prepare("SELECT * FROM pipeline_job_stages")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "pipeline_job_stages" });
    return;
  }

  const values = rows.map((r) => ({
    id: toInteger(r.id)!,
    jobId: toInteger(r.jobId)!,
    stageName: toText(r.stageName)!,
    status: toText(r.status) ?? "pending",
    outputJSON: safeJsonParse<unknown>(r.outputJSON),
    errorMessage: toText(r.errorMessage),
    startedAt: toDate(r.startedAt),
    completedAt: toDate(r.completedAt),
    createdAt: toDate(r.createdAt) ?? new Date(),
  }));

  await pgDb
    .insert(schema.pipelineJobStages)
    .values(values)
    .onConflictDoNothing({
      target: schema.pipelineJobStages.id,
    });
  log("info", "Migration complete", { table: "pipeline_job_stages", rows: rows.length });
}

async function migrateUsageEvents(): Promise<void> {
  log("info", "Migrating usage_events...", { table: "usage_events" });
  const rows = sqliteDb
    .prepare("SELECT * FROM usage_events")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "usage_events" });
    return;
  }

  const values = rows.map((r) => ({
    id: toInteger(r.id)!,
    prospectId: toInteger(r.prospectId)!,
    jobId: toInteger(r.jobId),
    service: toText(r.service)!,
    promptTokens: toInteger(r.promptTokens) ?? 0,
    completionTokens: toInteger(r.completionTokens) ?? 0,
    totalTokens: toInteger(r.totalTokens) ?? 0,
    costCents: toInteger(r.costCents) ?? 0,
    createdAt: toDate(r.createdAt) ?? new Date(),
  }));

  await pgDb.insert(schema.usageEvents).values(values).onConflictDoNothing({
    target: schema.usageEvents.id,
  });
  log("info", "Migration complete", { table: "usage_events", rows: rows.length });
}

async function migrateJobs(): Promise<void> {
  log("info", "Migrating jobs...", { table: "jobs" });
  const rows = sqliteDb
    .prepare("SELECT * FROM jobs")
    .all() as Record<string, unknown>[];
  if (rows.length === 0) {
    log("info", "No rows to migrate", { table: "jobs" });
    return;
  }

  const values = rows.map((r) => ({
    id: String(r.id),
    queue: toText(r.queue)!,
    name: toText(r.name)!,
    dataJSON: safeJsonParse<unknown>(r.dataJSON) ?? {},
    optsJSON: safeJsonParse<unknown>(r.optsJSON) ?? {},
    progress: toInteger(r.progress) ?? 0,
    delay: toInteger(r.delay) ?? 0,
    timestamp: toNumber(r.timestamp) ?? Date.now(),
    attempts: toInteger(r.attempts) ?? 0,
    maxAttempts: toInteger(r.maxAttempts) ?? 3,
    processedOn: toNumber(r.processedOn),
    finishedOn: toNumber(r.finishedOn),
    returnValueJSON: safeJsonParse<unknown>(r.returnValueJSON),
    failedReason: toText(r.failedReason),
    stacktraceJSON: safeJsonParse<unknown[]>(r.stacktraceJSON) ?? [],
    status: toText(r.status) ?? "pending",
    createdAt: toDate(r.createdAt) ?? new Date(),
  }));

  await pgDb.insert(schema.jobs).values(values).onConflictDoNothing({
    target: schema.jobs.id,
  });
  log("info", "Migration complete", { table: "jobs", rows: rows.length });
}

/* ------------------------------------------------------------------ */
// Sequence reset (so serial IDs continue from max value)
/* ------------------------------------------------------------------ */

async function resetSequences(): Promise<void> {
  log("info", "Resetting sequences...");
  const tables = [
    "prospects",
    "listings",
    "listing_analyses",
    "bookings",
    "prospect_activities",
    "brand_settings",
    "rufus_queries",
    "rufus_query_runs",
    "catalog_links",
    "pipeline_jobs",
    "pipeline_job_stages",
    "usage_events",
  ];

  for (const table of tables) {
    const seqName = `${table}_id_seq`;
    try {
      // NOTE: pg does not support parameterizing identifiers, so the table
      // name is interpolated. Table names come from a hardcoded whitelist
      // array defined in this function — external input cannot reach it.
      await pool.query(
        `SELECT setval($1, (SELECT COALESCE(MAX(id), 1) FROM "${table}"), true)`,
        [seqName]
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      log("warn", "Failed to reset sequence — may not exist for empty table", {
        table,
        seqName,
        error: message,
      });
    }
  }
  log("info", "Sequences reset");
}

/* ------------------------------------------------------------------ */
// Main
/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  log("info", "Starting SQLite → PostgreSQL migration");

  await migrateProspects();
  await migrateListings();
  await migrateListingAnalyses();
  await migrateBookings();
  await migrateProspectActivities();
  await migrateBrandSettings();
  await migrateRufusQueries();
  await migrateRufusQueryRuns();
  await migrateCatalogLinks();
  await migratePipelineJobs();
  await migratePipelineJobStages();
  await migrateUsageEvents();
  await migrateJobs();

  await resetSequences();

  log("info", "Migration complete");
  await pool.end();
  process.exit(0);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  log("error", "Migration failed", { error: message });
  process.exit(1);
});
