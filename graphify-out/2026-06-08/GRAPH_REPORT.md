# Graph Report - optimus rufus webapp  (2026-06-08)

## Corpus Check
- 135 files · ~50,489 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 742 nodes · 1519 edges · 52 communities (46 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `141e4ecc`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Agent Orchestration & Services|Agent Orchestration & Services]]
- [[_COMMUNITY_Pipeline Execution & Evaluation|Pipeline Execution & Evaluation]]
- [[_COMMUNITY_Core Infrastructure Services|Core Infrastructure Services]]
- [[_COMMUNITY_Package Configuration|Package Configuration]]
- [[_COMMUNITY_Database Client & Apollo API|Database Client & Apollo API]]
- [[_COMMUNITY_Copywriting & Analysis Services|Copywriting & Analysis Services]]
- [[_COMMUNITY_Listing Management & PPC Planner|Listing Management & PPC Planner]]
- [[_COMMUNITY_Development Dependencies|Development Dependencies]]
- [[_COMMUNITY_Database Schema & Types|Database Schema & Types]]
- [[_COMMUNITY_UI Bundling Blueprint & Mapper|UI Bundling Blueprint & Mapper]]
- [[_COMMUNITY_Server TSConfig|Server TSConfig]]
- [[_COMMUNITY_API Routing & tRPC Procedures|API Routing & tRPC Procedures]]
- [[_COMMUNITY_App TSConfig|App TSConfig]]
- [[_COMMUNITY_Node TSConfig|Node TSConfig]]
- [[_COMMUNITY_Admin Dashboard & Page Hooks|Admin Dashboard & Page Hooks]]
- [[_COMMUNITY_Job & Webhook Queue|Job & Webhook Queue]]
- [[_COMMUNITY_Landing Page Sections|Landing Page Sections]]
- [[_COMMUNITY_Drizzle Schema & Repositories|Drizzle Schema & Repositories]]
- [[_COMMUNITY_HTTP Bootstrap & PDF Service|HTTP Bootstrap & PDF Service]]
- [[_COMMUNITY_React Entrypoint & Layout|React Entrypoint & Layout]]
- [[_COMMUNITY_Prospect & Webhook Services|Prospect & Webhook Services]]
- [[_COMMUNITY_Embedding & Catalog Graph|Embedding & Catalog Graph]]
- [[_COMMUNITY_Prospect & Activity Data Access|Prospect & Activity Data Access]]
- [[_COMMUNITY_Vercel Deployment Integration|Vercel Deployment Integration]]
- [[_COMMUNITY_Booking Management|Booking Management]]
- [[_COMMUNITY_Pipeline State Repository|Pipeline State Repository]]
- [[_COMMUNITY_Prospect Landing Page|Prospect Landing Page]]
- [[_COMMUNITY_Rufus Search Simulator|Rufus Search Simulator]]
- [[_COMMUNITY_Analysis Data Access|Analysis Data Access]]
- [[_COMMUNITY_Rufus Query Tracking|Rufus Query Tracking]]
- [[_COMMUNITY_Caching Service|Caching Service]]
- [[_COMMUNITY_Authentication Middleware|Authentication Middleware]]
- [[_COMMUNITY_Hero & Scan Animations|Hero & Scan Animations]]
- [[_COMMUNITY_Apify Scraping Integration|Apify Scraping Integration]]
- [[_COMMUNITY_Autopsy Page Section|Autopsy Page Section]]
- [[_COMMUNITY_Book Call Section|Book Call Section]]
- [[_COMMUNITY_Transform Preview Section|Transform Preview Section]]
- [[_COMMUNITY_Brand Style Injector|Brand Style Injector]]
- [[_COMMUNITY_Progress Bar Section|Progress Bar Section]]
- [[_COMMUNITY_Free Q&As Section|Free Q&As Section]]
- [[_COMMUNITY_PPC Planner UI Section|PPC Planner UI Section]]
- [[_COMMUNITY_Proof Wall Section|Proof Wall Section]]
- [[_COMMUNITY_Scroll Reveal Hook|Scroll Reveal Hook]]
- [[_COMMUNITY_Root TSConfig|Root TSConfig]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 53|Community 53]]

## God Nodes (most connected - your core abstractions)
1. `AgentRole` - 20 edges
2. `AgentRole` - 20 edges
3. `Logger` - 18 edges
4. `RawListingData` - 18 edges
5. `Agent` - 18 edges
6. `Agent` - 17 edges
7. `compilerOptions` - 17 edges
8. `compilerOptions` - 16 edges
9. `compilerOptions` - 16 edges
10. `SqliteJobRepository` - 15 edges

## Surprising Connections (you probably didn't know these)
- `AnalysisInput` --references--> `SemanticGap`  [EXTRACTED]
  api/services/copywriter.ts → api/agents/types.ts
- `AnalysisMetrics` --references--> `SemanticGap`  [EXTRACTED]
  api/services/domain/analysisService.ts → api/agents/types.ts
- `LandingPageComposerProps` --references--> `ProspectData`  [EXTRACTED]
  src/components/landing/LandingPageComposer.tsx → src/types/prospect.ts
- `StageAEOPDFAuditProps` --references--> `ProspectData`  [EXTRACTED]
  src/components/landing/StageAEOPDFAudit.tsx → src/types/prospect.ts
- `ApifyFetcherAgent` --implements--> `Agent`  [EXTRACTED]
  api/agents/agents/apifyFetcher.ts → api/agents/types.ts

## Import Cycles
- None detected.

## Communities (52 total, 6 thin omitted)

### Community 0 - "Agent Orchestration & Services"
Cohesion: 0.12
Nodes (43): ApifyFetcherAgent, safeJsonParse(), CompetitorAnalystAgent, ContentOptimizerAgent, EmbeddingGeneratorAgent, ListingFetcherAgent, OptimizationOrchestrator, STAGE_NAMES (+35 more)

### Community 1 - "Pipeline Execution & Evaluation"
Cohesion: 0.09
Nodes (21): ApifyFetcherEvaluator, CompetitorAnalystEvaluator, ContentOptimizerEvaluator, EmbeddingGeneratorEvaluator, PreprocessorEvaluator, SemanticAnalyzerEvaluator, EvaluationResult, Evaluator (+13 more)

### Community 2 - "Core Infrastructure Services"
Cohesion: 0.07
Nodes (18): eventBus, MemoryEventBus, LogContext, Logger, LogLevel, EventBus, breakers, CircuitBreaker (+10 more)

### Community 3 - "Package Configuration"
Cohesion: 0.11
Nodes (19): dependencies, better-sqlite3, clsx, drizzle-orm, hono, lucide-react, pg, postgres (+11 more)

### Community 4 - "Database Client & Apollo API"
Cohesion: 0.08
Nodes (23): BookingRecord, BrandSettingsRecord, CatalogLinkRecord, db, dbDir, __dirname, JobQueueRecord, ListingAnalysisRecord (+15 more)

### Community 5 - "Copywriting & Analysis Services"
Cohesion: 0.15
Nodes (23): AnalysisMetrics, buildAnalysisInsertInput(), buildProspectName(), buildRawListing(), computeMetrics(), executePipeline(), extractPipelineOutputs(), fetchListing() (+15 more)

### Community 6 - "Listing Management & PPC Planner"
Cohesion: 0.11
Nodes (9): InsertListingInput, ListingRecord, CreateListingInput, ppcRouter, convertPlanToCsv(), generateNegatives(), generatePpcPlan(), PpcKeywordData (+1 more)

### Community 7 - "Development Dependencies"
Cohesion: 0.10
Nodes (21): devDependencies, autoprefixer, drizzle-kit, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+13 more)

### Community 8 - "Database Schema & Types"
Cohesion: 0.17
Nodes (18): bookings, brandSettings, catalogLinks, jobs, listingAnalyses, listings, pipelineJobs, pipelineJobStages (+10 more)

### Community 9 - "UI Bundling Blueprint & Mapper"
Cohesion: 0.19
Nodes (13): StageAutopsyProps, StageBundlingBlueprintProps, StageRufusSimulatorProps, BundlingItem, CompetitorComparison, CosmoNodeData, PipelineProspect, ProspectIssue (+5 more)

### Community 10 - "Server TSConfig"
Cohesion: 0.10
Nodes (19): compilerOptions, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution (+11 more)

### Community 11 - "API Routing & tRPC Procedures"
Cohesion: 0.23
Nodes (7): apiKeyProcedure, Context, analysisRouter, bookingRouter, brandingRouter, prospectsRouter, scraperRouter

### Community 12 - "App TSConfig"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 13 - "Node TSConfig"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 14 - "Admin Dashboard & Page Hooks"
Cohesion: 0.17
Nodes (7): PipelineJob, PipelineStageState, PipelineStatus, usePipeline(), UsePipelineOptions, PipelineStatusPanel(), trpc

### Community 15 - "Job & Webhook Queue"
Cohesion: 0.11
Nodes (10): JobRepository, SqliteJobRepository, generateId(), safeJsonParse(), SQLiteJobQueue, webhookQueue, DomainEvent, Job (+2 more)

### Community 16 - "Landing Page Sections"
Cohesion: 0.14
Nodes (7): FloatingCTAProps, LandingPageComposerProps, StageAEOPDFAuditProps, StageBleedCalculatorProps, StageRoadmapProps, steps, ProspectData

### Community 17 - "Drizzle Schema & Repositories"
Cohesion: 0.18
Nodes (5): db, BrandSettingsRecord, CatalogLinkRecord, InsertBrandSettingsInput, InsertCatalogLinkInput

### Community 18 - "HTTP Bootstrap & PDF Service"
Cohesion: 0.25
Nodes (5): httpServer, port, createContext(), generatePdf(), pipelineSseHandler()

### Community 19 - "React Entrypoint & Layout"
Cohesion: 0.18
Nodes (11): scripts, build, build:client, build:server, check, dev, dev:client, dev:server (+3 more)

### Community 20 - "Prospect & Webhook Services"
Cohesion: 0.18
Nodes (7): createProspect(), CreateProspectInput, generateSlug(), ListProspectsOptions, recordActivity(), ProspectDetails, triggerWebhook()

### Community 21 - "Embedding & Catalog Graph"
Cohesion: 0.29
Nodes (8): buildCatalogGraph(), calculateCosineSimilarity(), CatalogLinkInput, CatalogLinkResult, delay(), generateEmbedding(), hashString(), seededRandom()

### Community 22 - "Prospect & Activity Data Access"
Cohesion: 0.20
Nodes (6): InsertProspectInput, create(), buildCountQuery(), buildItemsQuery(), buildWhereClause(), list()

### Community 23 - "Vercel Deployment Integration"
Cohesion: 0.17
Nodes (10): app, DELETE, GET, OPTIONS, POST, PUT, includeFiles, functions (+2 more)

### Community 24 - "Booking Management"
Cohesion: 0.21
Nodes (3): BookingRecord, InsertBookingInput, CreateBookingInput

### Community 25 - "Pipeline State Repository"
Cohesion: 0.17
Nodes (4): InsertPipelineJobInput, InsertPipelineJobStageInput, PipelineJobRecord, PipelineJobStageRecord

### Community 26 - "Prospect Landing Page"
Cohesion: 0.24
Nodes (5): useActivityTracker(), MOCK_PROSPECT_DATA, mapBackendToProspectData(), safeJsonParse(), ProspectLanding()

### Community 27 - "Rufus Search Simulator"
Cohesion: 0.20
Nodes (9): AppRouter, catalogGraphRouter, rufusTrackerRouter, fetchCompetitors(), generateFallbackSOV(), RufusRankingItem, RufusSOVResult, SimulatedQueryData (+1 more)

### Community 28 - "Analysis Data Access"
Cohesion: 0.22
Nodes (5): InsertAnalysisInput, ListingAnalysisRecord, StageCopy, buildCopyUpdate(), updateCopy()

### Community 29 - "Rufus Query Tracking"
Cohesion: 0.20
Nodes (4): InsertRufusQueryInput, InsertRufusQueryRunInput, RufusQueryRecord, RufusQueryRunRecord

### Community 30 - "Caching Service"
Cohesion: 0.27
Nodes (3): cache, CacheEntry, CacheService

### Community 31 - "Authentication Middleware"
Cohesion: 0.25
Nodes (6): t, JWTPayload, verifyToken(), apiKeyProcedure, authProcedure, isAuthed

### Community 32 - "Hero & Scan Animations"
Cohesion: 0.29
Nodes (4): StageHeroProps, SCAN_LINES, StageScanAnimationProps, ProspectListing

### Community 33 - "Apify Scraping Integration"
Cohesion: 0.46
Nodes (6): getDatasetItems(), getRunStatus(), triggerScrape(), DOMAIN_MAP, scrapeAmazonListing(), ScrapedListingData

### Community 34 - "Autopsy Page Section"
Cohesion: 0.14
Nodes (6): ErrorBoundary, Props, State, TRPCProvider(), AdminDashboard, ProspectLanding

### Community 35 - "Book Call Section"
Cohesion: 0.60
Nodes (5): AnimatedScore(), AnimatedScoreProps, getScoreColor(), getScoreLevel(), StageAutopsy()

### Community 36 - "Transform Preview Section"
Cohesion: 0.53
Nodes (5): getScoreColor(), getScoreLevel(), StageTransformPreview(), StageTransformPreviewProps, TransformSnippet

### Community 37 - "Brand Style Injector"
Cohesion: 0.60
Nodes (4): BrandStyleInjector(), BrandStyleInjectorProps, isValidCssColor(), isValidDataUrl()

### Community 49 - "Community 49"
Cohesion: 0.40
Nodes (5): getTomorrowDate(), revenueOptions, StageBookCall(), StageBookCallProps, BookingFormData

### Community 50 - "Community 50"
Cohesion: 0.25
Nodes (3): pipelineQueue, QueueWorker, agentsRouter

### Community 53 - "Community 53"
Cohesion: 0.40
Nodes (4): name, private, type, version

## Knowledge Gaps
- **200 isolated node(s):** `STAGES`, `STAGE_NAMES`, `JWTPayload`, `isAuthed`, `authProcedure` (+195 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Logger` connect `Core Infrastructure Services` to `Agent Orchestration & Services`, `Drizzle Schema & Repositories`, `Community 50`, `Pipeline Execution & Evaluation`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `AppRouter` connect `Rufus Search Simulator` to `HTTP Bootstrap & PDF Service`, `API Routing & tRPC Procedures`, `Admin Dashboard & Page Hooks`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Why does `db` connect `Database Client & Apollo API` to `Agent Orchestration & Services`, `HTTP Bootstrap & PDF Service`, `Core Infrastructure Services`, `Job & Webhook Queue`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **What connects `STAGES`, `STAGE_NAMES`, `JWTPayload` to the rest of the system?**
  _200 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Agent Orchestration & Services` be split into smaller, more focused modules?**
  _Cohesion score 0.11754911754911755 - nodes in this community are weakly interconnected._
- **Should `Pipeline Execution & Evaluation` be split into smaller, more focused modules?**
  _Cohesion score 0.08928571428571429 - nodes in this community are weakly interconnected._
- **Should `Core Infrastructure Services` be split into smaller, more focused modules?**
  _Cohesion score 0.07474747474747474 - nodes in this community are weakly interconnected._