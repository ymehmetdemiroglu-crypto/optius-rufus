# Graph Report - optimus rufus webapp  (2026-06-17)

## Corpus Check
- 144 files · ~62,427 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 734 nodes · 1306 edges · 47 communities (39 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0979acb0`
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
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 119|Community 119]]
- [[_COMMUNITY_Community 121|Community 121]]

## God Nodes (most connected - your core abstractions)
1. `Logger` - 20 edges
2. `scripts` - 20 edges
3. `JobRepository` - 17 edges
4. `compilerOptions` - 17 edges
5. `compilerOptions` - 16 edges
6. `compilerOptions` - 16 edges
7. `generateEmbedding()` - 13 edges
8. `mapBackendToProspectData()` - 13 edges
9. `db` - 13 edges
10. `analyzeSemanticGaps()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `PipelineOutputs` --references--> `AnalysisResult`  [EXTRACTED]
  api/domains/analysis/service.ts → api/pipeline/pipeline.types.ts
- `AnalysisMetrics` --references--> `SemanticGap`  [EXTRACTED]
  api/domains/analysis/service.ts → api/pipeline/pipeline.types.ts
- `createProspect()` --calls--> `createContact()`  [INFERRED]
  api/domains/prospect/service.ts → api/domains/apollo/service.ts
- `createProspect()` --calls--> `enrollInSequence()`  [INFERRED]
  api/domains/prospect/service.ts → api/domains/apollo/service.ts
- `enrichAndImportProspect()` --calls--> `createProspect()`  [INFERRED]
  api/domains/apollo/service.ts → api/domains/prospect/service.ts

## Import Cycles
- 2-file cycle: `api/domains/apollo/service.ts -> api/domains/prospect/service.ts -> api/domains/apollo/service.ts`

## Communities (47 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (35): AnalysisMetrics, buildAnalysisInsertInput(), buildProspectName(), computeMetrics(), executePipeline(), extractPipelineOutputs(), fetchListing(), fetchProspect() (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (32): analysisRouter, apolloRouter, apolloFetch(), createContact(), enrichAndImportProspect(), enrollInSequence(), getSequences(), MOCK_PEOPLE (+24 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (35): analyzeSemanticGaps(), CATEGORY_TAXONOMIES, computeLocalTextSimilarity(), dynamicTaxonomyCache, evaluateCosmoReadiness(), generateDynamicTaxonomy(), GENERIC_TAXONOMY, IntentDimension (+27 more)

### Community 3 - "Community 3"
Cohesion: 0.21
Nodes (8): AuditLaunchBoxProps, BrandingPanelProps, cn(), Button, ButtonProps, CardProps, Input, InputProps

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (19): dependencies, better-sqlite3, clsx, drizzle-orm, hono, lucide-react, pg, postgres (+11 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (10): MemoryEventBus, DomainEvent, EventBus, IJobQueue, Job, JobOpts, IJobRepository, JobRepository (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.11
Nodes (9): InsertListingInput, ListingRecord, CreateListingInput, ppcRouter, convertPlanToCsv(), generateNegatives(), generatePpcPlan(), PpcKeywordData (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.06
Nodes (39): breakers, CircuitBreakerOptions, CircuitState, getCircuitBreaker(), eventBus, LogContext, Logger, LogLevel (+31 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (17): bookings, brandSettings, catalogLinks, jobs, listingAnalyses, listings, pipelineJobs, pipelineJobStages (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.04
Nodes (47): devDependencies, autoprefixer, drizzle-kit, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+39 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (19): compilerOptions, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (15): BookingFormData, BundlingItem, CompetitorComparison, CosmoNodeData, FreeQAItem, PipelineProspect, PPCKeywordItem, ProspectIssue (+7 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (21): app, httpServer, port, DELETE, GET, OPTIONS, POST, PUT (+13 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (7): TRPCProvider(), ErrorBoundary, Props, State, AdminDashboard, App(), ProspectLanding

### Community 16 - "Community 16"
Cohesion: 0.21
Nodes (9): PipelineJob, PipelineStageState, PipelineStatus, UsePipelineOptions, getTomorrowDate(), revenueOptions, StageBookCall(), StageBookCallProps (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (6): InsertProspectInput, create(), buildCountQuery(), buildItemsQuery(), buildWhereClause(), list()

### Community 18 - "Community 18"
Cohesion: 0.40
Nodes (3): COSMOCanvas(), COSMOCanvasProps, ProspectDetailPanelProps

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (3): CreateBookingInput, BookingRecord, InsertBookingInput

### Community 21 - "Community 21"
Cohesion: 0.17
Nodes (4): InsertPipelineJobInput, InsertPipelineJobStageInput, PipelineStageState, updateStatus()

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (7): FloatingCTA(), FloatingCTAProps, LandingPageComposer(), LandingPageComposerProps, StageAEOPDFAuditProps, StagePPCPlannerProps, STAGES

### Community 23 - "Community 23"
Cohesion: 0.32
Nodes (9): AnimatedScore(), AnimatedScoreProps, StageAutopsy(), StageAutopsyProps, StageTransformPreview(), StageTransformPreviewProps, getScoreColor(), getScoreLevel() (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.27
Nodes (3): cache, CacheEntry, CacheService

### Community 26 - "Community 26"
Cohesion: 0.20
Nodes (4): InsertRufusQueryInput, InsertRufusQueryRunInput, RufusQueryRecord, RufusQueryRunRecord

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (10): ProspectData, ProgressBar(), ProgressBarProps, ReportNotFound(), SkeletonLoader(), MOCK_PROSPECT_DATA, STAGE_IDS, STAGE_LABELS (+2 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (11): ClientDirectoryProps, PipelineStatusPanel(), PipelineStatusPanelProps, useActivityTracker(), usePipeline(), ProspectLanding(), Badge, BadgeProps (+3 more)

### Community 31 - "Community 31"
Cohesion: 0.24
Nodes (3): db, BrandSettingsRecord, InsertBrandSettingsInput

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (3): StageHeroProps, SCAN_LINES, StageScanAnimationProps

### Community 35 - "Community 35"
Cohesion: 0.40
Nodes (11): getDefaultCompetitorAudit(), getDefaultCosmoBundling(), getDefaultCosmoGraphData(), getDefaultFreeQAs(), getDefaultPpcKeywords(), getDefaultReviewSentiment(), getDefaultSimulatorScenarios(), getDefaultTransformAfter() (+3 more)

### Community 36 - "Community 36"
Cohesion: 0.60
Nodes (4): BrandStyleInjector(), BrandStyleInjectorProps, isValidCssColor(), isValidDataUrl()

### Community 42 - "Community 42"
Cohesion: 0.22
Nodes (4): buildCopyUpdate(), updateCopy(), InsertAnalysisInput, ListingAnalysisRecord

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (4): LiveAuditProgressProps, PipelineJob, PipelineStageState, PipelineStatus

### Community 119 - "Community 119"
Cohesion: 0.28
Nodes (5): PeopleSearch(), PeopleSearchProps, SENIORITIES, classifyRevenueTier(), WebhookSimulator()

## Knowledge Gaps
- **238 isolated node(s):** `port`, `httpServer`, `UsageEventRecord`, `JobQueueRecord`, `IntentDimension` (+233 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PipelineStatus` connect `Community 16` to `Community 21`, `Community 7`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `AppRouter` connect `Community 1` to `Community 16`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `Logger` connect `Community 7` to `Community 0`, `Community 31`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **What connects `port`, `httpServer`, `UsageEventRecord` to the rest of the system?**
  _238 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08879492600422834 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08985507246376812 - nodes in this community are weakly interconnected._