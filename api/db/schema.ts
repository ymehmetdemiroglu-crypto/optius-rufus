import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  bigint,
} from "drizzle-orm/pg-core";

export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  company: text("company"),
  apolloContactId: text("apollo_contact_id"),
  apolloSequenceId: text("apollo_sequence_id"),
  status: text("status").default("new"),
  landingPageViews: integer("landing_page_views").default(0),
  packageType: text("package_type").default("package_2"),
  pricePoint: real("price_point").default(1500),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const listings = pgTable("listings", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id")
    .notNull()
    .references(() => prospects.id),
  asin: text("asin").notNull(),
  marketplace: text("marketplace").default("US"),
  url: text("url"),
  title: text("title"),
  bullets: jsonb("bullets"),
  description: text("description"),
  brand: text("brand"),
  category: text("category"),
  price: real("price"),
  rating: real("rating"),
  reviewCount: integer("review_count"),
  images: jsonb("images"),
  aPlusText: text("a_plus_text"),
  rawScrapeData: jsonb("raw_scrape_data"),
  embeddingVector: text("embedding_vector"),
  scrapedAt: timestamp("scraped_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const listingAnalyses = pgTable("listing_analyses", {
  id: serial("id").primaryKey(),
  listingId: integer("listing_id")
    .notNull()
    .references(() => listings.id),
  prospectId: integer("prospect_id")
    .notNull()
    .references(() => prospects.id),
  overallScore: integer("overall_score"),
  rufusScore: integer("rufus_score"),
  cosmoScore: integer("cosmo_score"),
  semanticScore: integer("semantic_score"),
  contentScore: integer("content_score"),
  visualScore: integer("visual_score"),
  gaps: jsonb("gaps"),
  topIssues: jsonb("top_issues"),
  strengths: jsonb("strengths"),
  opportunities: jsonb("opportunities"),
  aiAnalysisRaw: text("ai_analysis_raw"),

  copyPersonalizedHook: text("copy_personalized_hook"),
  copyProblemNarrative: text("copy_problem_narrative"),
  copySolutionPitch: text("copy_solution_pitch"),
  copyUrgencyCTA: text("copy_urgency_cta"),

  copyHeroHeadline: text("copy_hero_headline"),
  copyHeroSubheadline: text("copy_hero_subheadline"),

  copyAutopsyHeadline: text("copy_autopsy_headline"),
  copyAutopsyBody: text("copy_autopsy_body"),

  copyBleedHeadline: text("copy_bleed_headline"),
  copyBleedBody: text("copy_bleed_body"),

  copySimulatorIntro: text("copy_simulator_intro"),
  copySimulatorScenarios: jsonb("copy_simulator_scenarios"),

  copyTransformHeadline: text("copy_transform_headline"),
  copyTransformBefore: jsonb("copy_transform_before"),
  copyTransformAfter: jsonb("copy_transform_after"),

  copyRoadmapHeadline: text("copy_roadmap_headline"),
  copyRoadmapBody: text("copy_roadmap_body"),

  copySocialProofHeadline: text("copy_social_proof_headline"),

  copyCtaHeadline: text("copy_cta_headline"),
  copyCtaGuarantee: text("copy_cta_guarantee"),

  copyFreeQAs: text("copy_free_q_as"),
  copyReviewSentiment: text("copy_review_sentiment"),
  copyCompetitorAudit: text("copy_competitor_audit"),
  copyPpcKeywords: text("copy_ppc_keywords"),
  copyCosmoBundling: text("copy_cosmo_bundling"),
  copyCosmoGraphData: text("copy_cosmo_graph_data"),

  packageType: text("package_type").default("package_2"),
  pricePoint: real("price_point").default(1500),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id")
    .notNull()
    .references(() => prospects.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  revenue: text("revenue"),
  notes: text("notes"),
  scheduledDate: text("scheduled_date"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const prospectActivities = pgTable("prospect_activities", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id")
    .notNull()
    .references(() => prospects.id),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const brandSettings = pgTable("brand_settings", {
  id: serial("id").primaryKey(),
  companyName: text("company_name"),
  logoUrl: text("logo_url"),
  logoBase64: text("logo_base64"),
  primaryColor: text("primary_color").default("#b8860b"),
  website: text("website"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const rufusQueries = pgTable("rufus_queries", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id")
    .notNull()
    .references(() => prospects.id, { onDelete: "cascade" }),
  queryText: text("query_text").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const rufusQueryRuns = pgTable("rufus_query_runs", {
  id: serial("id").primaryKey(),
  queryId: integer("query_id")
    .notNull()
    .references(() => rufusQueries.id, { onDelete: "cascade" }),
  asinRankings: jsonb("asin_rankings").notNull(),
  sovPercent: real("sov_percent").notNull(),
  cosmoReadinessScore: integer("cosmo_readiness_score"),
  qaCoverageRatio: integer("qa_coverage_ratio"),
  rufusAnsweredRate: integer("rufus_answered_rate"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const catalogLinks = pgTable("catalog_links", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id")
    .notNull()
    .references(() => prospects.id, { onDelete: "cascade" }),
  sourceAsin: text("source_asin").notNull(),
  targetAsin: text("target_asin").notNull(),
  relationshipType: text("relationship_type").notNull(),
  strengthScore: real("strength_score").default(0.5),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const pipelineJobs = pgTable("pipeline_jobs", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id")
    .notNull()
    .references(() => prospects.id, { onDelete: "cascade" }),
  listingId: integer("listing_id").references(() => listings.id, {
    onDelete: "cascade",
  }),
  packageType: text("package_type").default("package_2"),
  status: text("status").default("pending"),
  currentStage: text("current_stage"),
  stagesJSON: jsonb("stages_json"),
  tokenUsage: integer("token_usage").default(0),
  errorLog: text("error_log"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const pipelineJobStages = pgTable("pipeline_job_stages", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id")
    .notNull()
    .references(() => pipelineJobs.id, { onDelete: "cascade" }),
  stageName: text("stage_name").notNull(),
  status: text("status").default("pending"),
  outputJSON: jsonb("output_json"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const usageEvents = pgTable("usage_events", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id")
    .notNull()
    .references(() => prospects.id, { onDelete: "cascade" }),
  jobId: integer("job_id").references(() => pipelineJobs.id, {
    onDelete: "set null",
  }),
  service: text("service").notNull(),
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  totalTokens: integer("total_tokens").default(0),
  costCents: integer("cost_cents").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  queue: text("queue").notNull(),
  name: text("name").notNull(),
  dataJSON: jsonb("data_json").notNull().default({}),
  optsJSON: jsonb("opts_json").default({}),
  progress: integer("progress").default(0),
  delay: integer("delay").default(0),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  attempts: integer("attempts").default(0),
  maxAttempts: integer("max_attempts").default(3),
  processedOn: bigint("processed_on", { mode: "number" }),
  finishedOn: bigint("finished_on", { mode: "number" }),
  returnValueJSON: jsonb("return_value_json"),
  failedReason: text("failed_reason"),
  stacktraceJSON: jsonb("stacktrace_json").default([]),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
