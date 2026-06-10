# Graph Report - optimus rufus webapp  (2026-06-10)

## Corpus Check
- 134 files · ~48,343 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 691 nodes · 1174 edges · 46 communities (37 shown, 9 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b39edcbe`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]

## God Nodes (most connected - your core abstractions)
1. `Logger` - 18 edges
2. `compilerOptions` - 17 edges
3. `compilerOptions` - 16 edges
4. `compilerOptions` - 16 edges
5. `JobRepository` - 15 edges
6. `generateEmbedding()` - 13 edges
7. `db` - 13 edges
8. `PipelineEngine` - 12 edges
9. `mapBackendToProspectData()` - 12 edges
10. `runAnalysis()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `PipelineOutputs` --references--> `AnalysisResult`  [EXTRACTED]
  api/domains/analysis/service.ts → api/pipeline/pipeline.types.ts
- `AnalysisMetrics` --references--> `SemanticGap`  [EXTRACTED]
  api/domains/analysis/service.ts → api/pipeline/pipeline.types.ts
- `generateOptimizedContent()` --calls--> `callLlm()`  [EXTRACTED]
  api/domains/optimization/content.ts → api/services/llmGateway.ts
- `AnalysisInput` --references--> `SemanticGap`  [EXTRACTED]
  api/domains/optimization/copywriter.ts → api/pipeline/pipeline.types.ts
- `generateAllStageCopy()` --calls--> `callLlm()`  [EXTRACTED]
  api/domains/optimization/copywriter.ts → api/services/llmGateway.ts

## Import Cycles
- None detected.

## Communities (46 total, 9 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (26): breakers, CircuitBreakerOptions, CircuitState, getCircuitBreaker(), eventBus, MemoryEventBus, EventBus, LogContext (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (46): buildCopyUpdate(), updateCopy(), AnalysisMetrics, buildAnalysisInsertInput(), buildProspectName(), computeMetrics(), executePipeline(), extractPipelineOutputs() (+38 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (35): analyzeSemanticGaps(), buildRecommendation(), getIntentEmbedding(), intentEmbeddingCache, SEMANTIC_DIMENSIONS, buildCatalogGraph(), calculateCosineSimilarity(), CatalogLinkInput (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (35): devDependencies, autoprefixer, drizzle-kit, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+27 more)

### Community 4 - "Community 4"
Cohesion: 0.10
Nodes (8): DomainEvent, IJobQueue, Job, JobOpts, IJobRepository, JobRepository, generateId(), JobQueue

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (19): analysisRouter, apolloRouter, apolloFetch(), createContact(), enrollInSequence(), getSequences(), bookingRouter, brandingRouter (+11 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (18): app, httpServer, port, DELETE, GET, OPTIONS, POST, PUT (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (14): BrandingPanelProps, ClientDirectoryProps, cn(), safeJsonParse(), Badge, BadgeProps, BadgeVariant, variantClasses (+6 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (9): InsertListingInput, ListingRecord, CreateListingInput, ppcRouter, convertPlanToCsv(), generateNegatives(), generatePpcPlan(), PpcKeywordData (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.16
Nodes (17): bookings, brandSettings, catalogLinks, jobs, listingAnalyses, listings, pipelineJobs, pipelineJobStages (+9 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (19): compilerOptions, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.15
Nodes (8): AuditLaunchBoxProps, COSMOCanvasProps, ProspectDetailPanelProps, getTomorrowDate(), revenueOptions, StageBookCall(), StageBookCallProps, trpc

### Community 12 - "Community 12"
Cohesion: 0.13
Nodes (10): ProspectData, useActivityTracker(), ProgressBarProps, MOCK_PROSPECT_DATA, STAGE_IDS, STAGE_LABELS, STAGE_NAMES, StageId (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.11
Nodes (19): dependencies, better-sqlite3, clsx, drizzle-orm, hono, lucide-react, pg, postgres (+11 more)

### Community 14 - "Community 14"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 15 - "Community 15"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 16 - "Community 16"
Cohesion: 0.12
Nodes (15): BookingFormData, BundlingItem, CompetitorComparison, CosmoNodeData, FreeQAItem, PipelineProspect, PPCKeywordItem, ProspectIssue (+7 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (6): TRPCProvider(), ErrorBoundary, Props, State, AdminDashboard, ProspectLanding

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (5): create(), buildCountQuery(), buildItemsQuery(), buildWhereClause(), list()

### Community 19 - "Community 19"
Cohesion: 0.17
Nodes (6): InsertProspectInput, ProspectRecord, createProspect(), CreateProspectInput, generateSlug(), ListProspectsOptions

### Community 20 - "Community 20"
Cohesion: 0.27
Nodes (3): PipelineEngine, PipelineJob, StageName

### Community 21 - "Community 21"
Cohesion: 0.21
Nodes (3): CreateBookingInput, BookingRecord, InsertBookingInput

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (4): LandingPageComposerProps, StageBleedCalculatorProps, StageFreeQAsProps, StagePPCPlannerProps

### Community 23 - "Community 23"
Cohesion: 0.32
Nodes (9): AnimatedScore(), AnimatedScoreProps, StageAutopsy(), StageAutopsyProps, StageTransformPreview(), StageTransformPreviewProps, getScoreColor(), getScoreLevel() (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.44
Nodes (10): getDefaultCompetitorAudit(), getDefaultCosmoBundling(), getDefaultCosmoGraphData(), getDefaultFreeQAs(), getDefaultPpcKeywords(), getDefaultReviewSentiment(), getDefaultSimulatorScenarios(), getDefaultTransformAfter() (+2 more)

### Community 25 - "Community 25"
Cohesion: 0.18
Nodes (3): InsertPipelineJobInput, InsertPipelineJobStageInput, PipelineStageState

### Community 26 - "Community 26"
Cohesion: 0.20
Nodes (4): InsertRufusQueryInput, InsertRufusQueryRunInput, RufusQueryRecord, RufusQueryRunRecord

### Community 27 - "Community 27"
Cohesion: 0.27
Nodes (3): cache, CacheEntry, CacheService

### Community 28 - "Community 28"
Cohesion: 0.28
Nodes (7): PipelineStatusPanel(), PipelineStatusPanelProps, PipelineJob, PipelineStageState, PipelineStatus, usePipeline(), UsePipelineOptions

### Community 29 - "Community 29"
Cohesion: 0.33
Nodes (3): db, BrandSettingsRecord, InsertBrandSettingsInput

### Community 30 - "Community 30"
Cohesion: 0.29
Nodes (3): StageHeroProps, SCAN_LINES, StageScanAnimationProps

### Community 32 - "Community 32"
Cohesion: 0.60
Nodes (4): BrandStyleInjector(), BrandStyleInjectorProps, isValidCssColor(), isValidDataUrl()

## Knowledge Gaps
- **220 isolated node(s):** `port`, `httpServer`, `UsageEventRecord`, `JobQueueRecord`, `SEMANTIC_DIMENSIONS` (+215 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **9 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AppRouter` connect `Community 5` to `Community 11`?**
  _High betweenness centrality (0.277) - this node is a cross-community bridge._
- **Why does `JobRepository` connect `Community 4` to `Community 0`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **What connects `port`, `httpServer`, `UsageEventRecord` to the rest of the system?**
  _220 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.061955965181771634 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05961426066627703 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0797872340425532 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._