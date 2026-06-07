# Graph Report - .  (2026-06-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 701 nodes · 1309 edges · 41 communities (35 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a3c102e0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_AI Agents and Orchestration|AI Agents and Orchestration]]
- [[_COMMUNITY_tRPC and Authentication|tRPC and Authentication]]
- [[_COMMUNITY_AI Agent Evaluators|AI Agent Evaluators]]
- [[_COMMUNITY_Logging and Event Bus|Logging and Event Bus]]
- [[_COMMUNITY_HTTP Server and Job Queue|HTTP Server and Job Queue]]
- [[_COMMUNITY_Frontend Pipeline Hooks|Frontend Pipeline Hooks]]
- [[_COMMUNITY_NPM Dev Dependencies|NPM Dev Dependencies]]
- [[_COMMUNITY_SQLite Database Client|SQLite Database Client]]
- [[_COMMUNITY_Analysis Pipeline Service|Analysis Pipeline Service]]
- [[_COMMUNITY_Database Schema Definitions|Database Schema Definitions]]
- [[_COMMUNITY_TypeScript Server Config|TypeScript Server Config]]
- [[_COMMUNITY_NPM Dependencies|NPM Dependencies]]
- [[_COMMUNITY_TypeScript App Config|TypeScript App Config]]
- [[_COMMUNITY_Landing Page UI Components|Landing Page UI Components]]
- [[_COMMUNITY_TypeScript Node Config|TypeScript Node Config]]
- [[_COMMUNITY_Prospect Operations Service|Prospect Operations Service]]
- [[_COMMUNITY_Listing Operations Service|Listing Operations Service]]
- [[_COMMUNITY_Prospect & Activity Repositories|Prospect & Activity Repositories]]
- [[_COMMUNITY_Booking Operations Service|Booking Operations Service]]
- [[_COMMUNITY_Pipeline Status Repository|Pipeline Status Repository]]
- [[_COMMUNITY_Prospect Data Simulator|Prospect Data Simulator]]
- [[_COMMUNITY_Drizzle Schema & Brand Repo|Drizzle Schema & Brand Repo]]
- [[_COMMUNITY_Prospect Landing Page|Prospect Landing Page]]
- [[_COMMUNITY_Analysis Operations Repository|Analysis Operations Repository]]
- [[_COMMUNITY_Rufus Queries Repository|Rufus Queries Repository]]
- [[_COMMUNITY_Autopsy Stage Component|Autopsy Stage Component]]
- [[_COMMUNITY_Memory Caching Service|Memory Caching Service]]
- [[_COMMUNITY_Hero & Scan Animation Components|Hero & Scan Animation Components]]
- [[_COMMUNITY_Transform Preview Component|Transform Preview Component]]
- [[_COMMUNITY_Brand Style Injector Component|Brand Style Injector Component]]
- [[_COMMUNITY_Bundling Blueprint Component|Bundling Blueprint Component]]
- [[_COMMUNITY_Free Q&A Component|Free Q&A Component]]
- [[_COMMUNITY_PPC Planner Stage Component|PPC Planner Stage Component]]
- [[_COMMUNITY_Roadmap Stage Component|Roadmap Stage Component]]
- [[_COMMUNITY_Scroll Reveal Hook|Scroll Reveal Hook]]
- [[_COMMUNITY_TypeScript Config File|TypeScript Config File]]

## God Nodes (most connected - your core abstractions)
1. `AgentRole` - 19 edges
2. `Logger` - 18 edges
3. `Agent` - 17 edges
4. `compilerOptions` - 17 edges
5. `compilerOptions` - 16 edges
6. `compilerOptions` - 16 edges
7. `RawListingData` - 15 edges
8. `EvaluationResult` - 13 edges
9. `Evaluator` - 13 edges
10. `db` - 12 edges

## Surprising Connections (you probably didn't know these)
- `AnalysisMetrics` --references--> `SemanticGap`  [EXTRACTED]
  api/services/domain/analysisService.ts → api/agents/types.ts
- `AnalysisInput` --references--> `SemanticGap`  [EXTRACTED]
  api/services/copywriter.ts → api/agents/types.ts
- `PipelineOutputs` --references--> `AnalysisResult`  [EXTRACTED]
  api/services/domain/analysisService.ts → api/agents/types.ts
- `LandingPageComposerProps` --references--> `ProspectData`  [EXTRACTED]
  src/components/landing/LandingPageComposer.tsx → src/types/prospect.ts
- `ApifyFetcherAgent` --implements--> `Agent`  [EXTRACTED]
  api/agents/agents/apifyFetcher.ts → api/agents/types.ts

## Import Cycles
- None detected.

## Communities (41 total, 6 thin omitted)

### Community 0 - "AI Agents and Orchestration"
Cohesion: 0.11
Nodes (30): ApifyFetcherAgent, safeJsonParse(), CompetitorAnalystAgent, ContentOptimizerAgent, EmbeddingGeneratorAgent, ListingFetcherAgent, OptimizationOrchestrator, STAGE_NAMES (+22 more)

### Community 1 - "tRPC and Authentication"
Cohesion: 0.06
Nodes (38): apiKeyProcedure, Context, createContext(), t, JWTPayload, verifyToken(), apiKeyProcedure, authProcedure (+30 more)

### Community 2 - "AI Agent Evaluators"
Cohesion: 0.10
Nodes (25): ApifyFetcherEvaluator, CompetitorAnalystEvaluator, ContentOptimizerEvaluator, EmbeddingGeneratorEvaluator, PreprocessorEvaluator, SemanticAnalyzerEvaluator, EvaluationResult, Evaluator (+17 more)

### Community 3 - "Logging and Event Bus"
Cohesion: 0.08
Nodes (19): eventBus, MemoryEventBus, LogContext, Logger, LogLevel, DomainEvent, EventBus, breakers (+11 more)

### Community 4 - "HTTP Server and Job Queue"
Cohesion: 0.06
Nodes (23): app, httpServer, port, DELETE, GET, OPTIONS, POST, PUT (+15 more)

### Community 5 - "Frontend Pipeline Hooks"
Cohesion: 0.06
Nodes (19): AppRouter, ErrorBoundary, Props, State, PipelineJob, PipelineStageState, PipelineStatus, usePipeline() (+11 more)

### Community 6 - "NPM Dev Dependencies"
Cohesion: 0.05
Nodes (36): devDependencies, autoprefixer, drizzle-kit, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+28 more)

### Community 7 - "SQLite Database Client"
Cohesion: 0.08
Nodes (22): BookingRecord, BrandSettingsRecord, CatalogLinkRecord, db, dbDir, __dirname, JobQueueRecord, ListingAnalysisRecord (+14 more)

### Community 8 - "Analysis Pipeline Service"
Cohesion: 0.14
Nodes (23): AnalysisMetrics, buildAnalysisInsertInput(), buildProspectName(), buildRawListing(), computeMetrics(), executePipeline(), extractPipelineOutputs(), fetchListing() (+15 more)

### Community 9 - "Database Schema Definitions"
Cohesion: 0.13
Nodes (20): bookings, brandSettings, catalogLinks, jobs, listingAnalyses, listings, pipelineJobs, pipelineJobStages (+12 more)

### Community 10 - "TypeScript Server Config"
Cohesion: 0.10
Nodes (19): compilerOptions, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution (+11 more)

### Community 11 - "NPM Dependencies"
Cohesion: 0.11
Nodes (19): dependencies, better-sqlite3, clsx, drizzle-orm, hono, lucide-react, pg, postgres (+11 more)

### Community 12 - "TypeScript App Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 13 - "Landing Page UI Components"
Cohesion: 0.12
Nodes (8): FloatingCTAProps, LandingPageComposerProps, ProgressBarProps, STAGE_LABELS, StageBleedCalculatorProps, StageProofWallProps, testimonials, ProspectData

### Community 14 - "TypeScript Node Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 15 - "Prospect Operations Service"
Cohesion: 0.16
Nodes (8): InsertProspectInput, createProspect(), CreateProspectInput, generateSlug(), ListProspectsOptions, recordActivity(), ProspectDetails, triggerWebhook()

### Community 16 - "Listing Operations Service"
Cohesion: 0.18
Nodes (3): InsertListingInput, ListingRecord, CreateListingInput

### Community 17 - "Prospect & Activity Repositories"
Cohesion: 0.22
Nodes (5): create(), buildCountQuery(), buildItemsQuery(), buildWhereClause(), list()

### Community 18 - "Booking Operations Service"
Cohesion: 0.21
Nodes (3): BookingRecord, InsertBookingInput, CreateBookingInput

### Community 19 - "Pipeline Status Repository"
Cohesion: 0.17
Nodes (4): InsertPipelineJobInput, InsertPipelineJobStageInput, PipelineJobRecord, PipelineJobStageRecord

### Community 20 - "Prospect Data Simulator"
Cohesion: 0.30
Nodes (7): StageRufusSimulatorProps, CompetitorComparison, PipelineProspect, ProspectIssue, ProspectOpportunity, SimulatorScenario, StageCopyData

### Community 21 - "Drizzle Schema & Brand Repo"
Cohesion: 0.25
Nodes (4): db, pool, BrandSettingsRecord, InsertBrandSettingsInput

### Community 22 - "Prospect Landing Page"
Cohesion: 0.24
Nodes (5): useActivityTracker(), MOCK_PROSPECT_DATA, mapBackendToProspectData(), safeJsonParse(), ProspectLanding()

### Community 23 - "Analysis Operations Repository"
Cohesion: 0.22
Nodes (5): InsertAnalysisInput, ListingAnalysisRecord, StageCopy, buildCopyUpdate(), updateCopy()

### Community 24 - "Rufus Queries Repository"
Cohesion: 0.20
Nodes (4): InsertRufusQueryInput, InsertRufusQueryRunInput, RufusQueryRecord, RufusQueryRunRecord

### Community 25 - "Autopsy Stage Component"
Cohesion: 0.36
Nodes (9): AnimatedScore(), AnimatedScoreProps, getScoreColor(), getScoreLevel(), StageAutopsy(), StageAutopsyProps, CosmoNodeData, ProspectScoreBreakdown (+1 more)

### Community 26 - "Memory Caching Service"
Cohesion: 0.27
Nodes (3): cache, CacheEntry, CacheService

### Community 27 - "Hero & Scan Animation Components"
Cohesion: 0.29
Nodes (4): StageHeroProps, SCAN_LINES, StageScanAnimationProps, ProspectListing

### Community 28 - "Transform Preview Component"
Cohesion: 0.53
Nodes (5): getScoreColor(), getScoreLevel(), StageTransformPreview(), StageTransformPreviewProps, TransformSnippet

### Community 29 - "Brand Style Injector Component"
Cohesion: 0.60
Nodes (4): BrandStyleInjector(), BrandStyleInjectorProps, isValidCssColor(), isValidDataUrl()

## Knowledge Gaps
- **198 isolated node(s):** `STAGES`, `STAGE_NAMES`, `TaskStatus`, `QAPair`, `OptimizationReport` (+193 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Logger` connect `Logging and Event Bus` to `tRPC and Authentication`, `AI Agent Evaluators`, `HTTP Server and Job Queue`, `Drizzle Schema & Brand Repo`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Why does `db` connect `SQLite Database Client` to `AI Agents and Orchestration`, `Logging and Event Bus`, `HTTP Server and Job Queue`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `AppRouter` connect `Frontend Pipeline Hooks` to `tRPC and Authentication`, `HTTP Server and Job Queue`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `STAGES`, `STAGE_NAMES`, `TaskStatus` to the rest of the system?**
  _198 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AI Agents and Orchestration` be split into smaller, more focused modules?**
  _Cohesion score 0.1115811739820201 - nodes in this community are weakly interconnected._
- **Should `tRPC and Authentication` be split into smaller, more focused modules?**
  _Cohesion score 0.05669199298655757 - nodes in this community are weakly interconnected._
- **Should `AI Agent Evaluators` be split into smaller, more focused modules?**
  _Cohesion score 0.09724238026124818 - nodes in this community are weakly interconnected._