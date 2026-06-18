# Graph Report - optimus rufus webapp  (2026-06-18)

## Corpus Check
- 153 files · ~71,122 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 790 nodes · 1493 edges · 58 communities (45 shown, 13 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0e4db353`
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
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 119|Community 119]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 133|Community 133]]
- [[_COMMUNITY_Community 134|Community 134]]

## God Nodes (most connected - your core abstractions)
1. `Logger` - 22 edges
2. `scripts` - 20 edges
3. `JobRepository` - 17 edges
4. `compilerOptions` - 17 edges
5. `compilerOptions` - 16 edges
6. `compilerOptions` - 16 edges
7. `generateEmbedding()` - 14 edges
8. `callLlm()` - 14 edges
9. `db` - 14 edges
10. `mapBackendToProspectData()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `computeLocalTextSimilarity()` --calls--> `tokenize()`  [INFERRED]
  api/domains/analysis/intentEngine.ts → api/domains/optimization/semanticRewriter.ts
- `simulateSingleRufusQuery()` --calls--> `callLlm()`  [EXTRACTED]
  api/domains/rufus/service.ts → api/services/llmGateway.ts
- `PipelineOutputs` --references--> `AnalysisResult`  [EXTRACTED]
  api/domains/analysis/service.ts → api/pipeline/pipeline.types.ts
- `resolveStageCopy()` --calls--> `generateAllStageCopy()`  [EXTRACTED]
  api/domains/analysis/service.ts → api/domains/optimization/copywriter.ts
- `regenerateCopy()` --calls--> `generateAllStageCopy()`  [EXTRACTED]
  api/domains/analysis/service.ts → api/domains/optimization/copywriter.ts

## Import Cycles
- 2-file cycle: `api/domains/apollo/service.ts -> api/domains/prospect/service.ts -> api/domains/apollo/service.ts`

## Communities (58 total, 13 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.10
Nodes (25): buildAnalysisInsertInput(), buildProspectName(), computeMetrics(), executePipeline(), extractPipelineOutputs(), fetchListing(), fetchProspect(), persistAnalysis() (+17 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (27): analysisRouter, bookingRouter, brandingRouter, catalogGraphRouter, buildCatalogGraph(), calculateCosineSimilarity(), CatalogLinkInput, CatalogLinkResult (+19 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (79): analyzeSemanticGaps(), AttributeInventory, buildIntentCoverage(), buildPredictedIntents(), buildSemanticGaps(), CATEGORY_TAXONOMIES, computeLocalTextSimilarity(), computeSignalCoverage() (+71 more)

### Community 3 - "Community 3"
Cohesion: 0.23
Nodes (7): AuditLaunchBoxProps, PeopleSearch(), PeopleSearchProps, SENIORITIES, trpc, Input, InputProps

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (9): BrandingPanelProps, ClientDirectoryProps, Prospect, cn(), BadgeProps, BadgeVariant, variantClasses, Card (+1 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (12): MemoryEventBus, DomainEvent, EventBus, IJobQueue, Job, JobOpts, IJobRepository, JobRepository (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (4): InsertListingInput, ListingAnalysisRecord, ListingRecord, CreateListingInput

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (3): Logger, TIER_BUDGETS_CENTS, TokenBudgetExceededError

### Community 8 - "Community 8"
Cohesion: 0.21
Nodes (15): bookings, brandSettings, catalogLinks, jobs, listingAnalyses, listings, pipelineJobs, pipelineJobStages (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, drizzle-kit, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+15 more)

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
Cohesion: 0.22
Nodes (7): app, DELETE, GET, OPTIONS, POST, PUT, rewrites

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (7): TRPCProvider(), ErrorBoundary, Props, State, AdminDashboard, App(), ProspectLanding

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): ProspectData, useActivityTracker(), ReportNotFound(), SkeletonLoader(), MOCK_PROSPECT_DATA, ProspectLanding()

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (24): apolloRouter, apolloFetch(), createContact(), enrichAndImportProspect(), enrollInSequence(), getSequences(), MOCK_PEOPLE, searchPeople() (+16 more)

### Community 18 - "Community 18"
Cohesion: 0.28
Nodes (5): COSMOCanvas(), COSMOCanvasProps, ProspectDetailPanelProps, Button, ButtonProps

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (5): createBooking(), CreateBookingInput, sendTelegramNotification(), BookingRecord, InsertBookingInput

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (5): breakers, CircuitBreakerOptions, CircuitState, LogContext, LogLevel

### Community 22 - "Community 22"
Cohesion: 0.25
Nodes (8): BrandStyleInjector(), BrandStyleInjectorProps, isValidCssColor(), isValidDataUrl(), FloatingCTA(), FloatingCTAProps, LandingPageComposer(), LandingPageComposerProps

### Community 23 - "Community 23"
Cohesion: 0.32
Nodes (9): AnimatedScore(), AnimatedScoreProps, StageAutopsy(), StageAutopsyProps, StageTransformPreview(), StageTransformPreviewProps, getScoreColor(), getScoreLevel() (+1 more)

### Community 25 - "Community 25"
Cohesion: 0.27
Nodes (3): cache, CacheEntry, CacheService

### Community 26 - "Community 26"
Cohesion: 0.20
Nodes (5): InsertRufusQueryInput, InsertRufusQueryRunInput, RufusQueryRecord, RufusQueryRunRecord, AppRouter

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (7): ProgressBar(), ProgressBarProps, STAGE_IDS, STAGE_LABELS, STAGE_NAMES, StageId, STAGES

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (18): buildDefaultDescription(), buildFallbackContent(), buildKeywordInventory(), containsKeyword(), enforceBulletCount(), enforceQAs(), generateSemanticRewrittenContent(), injectMissingKeywords() (+10 more)

### Community 30 - "Community 30"
Cohesion: 0.24
Nodes (8): PipelineStatusPanel(), PipelineStatusPanelProps, PipelineJob, PipelineStageState, PipelineStatus, usePipeline(), UsePipelineOptions, Badge

### Community 31 - "Community 31"
Cohesion: 0.21
Nodes (4): db, BrandSettingsRecord, InsertBrandSettingsInput, create()

### Community 32 - "Community 32"
Cohesion: 0.04
Nodes (44): dependencies, better-sqlite3, clsx, drizzle-orm, hono, @hono/node-server, lucide-react, pg (+36 more)

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (3): StageHeroProps, SCAN_LINES, StageScanAnimationProps

### Community 35 - "Community 35"
Cohesion: 0.40
Nodes (11): getDefaultCompetitorAudit(), getDefaultCosmoBundling(), getDefaultCosmoGraphData(), getDefaultFreeQAs(), getDefaultPpcKeywords(), getDefaultReviewSentiment(), getDefaultSimulatorScenarios(), getDefaultTransformAfter() (+3 more)

### Community 36 - "Community 36"
Cohesion: 0.10
Nodes (10): InsertPipelineJobInput, InsertPipelineJobStageInput, STAGE_ORDER, PipelineEngine, stageExecutors, PipelineJob, PipelineStageState, StageDefinition (+2 more)

### Community 37 - "Community 37"
Cohesion: 0.24
Nodes (4): webhookQueue, ProspectDetails, triggerWebhook(), WebhookWorker

### Community 41 - "Community 41"
Cohesion: 0.24
Nodes (9): AppVariables, boot(), port, runMigrations(), createContext(), AppVariables, registerTrpcHandler(), startWorkers() (+1 more)

### Community 42 - "Community 42"
Cohesion: 0.29
Nodes (3): buildCopyUpdate(), updateCopy(), InsertAnalysisInput

### Community 43 - "Community 43"
Cohesion: 0.50
Nodes (4): getTomorrowDate(), revenueOptions, StageBookCall(), StageBookCallProps

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (4): LiveAuditProgressProps, PipelineJob, PipelineStageState, PipelineStatus

### Community 55 - "Community 55"
Cohesion: 0.31
Nodes (5): AppVariables, registerHttpRoutes(), serveStatic(), generatePdf(), pipelineSseHandler()

## Knowledge Gaps
- **246 isolated node(s):** `AppVariables`, `port`, `UsageEventRecord`, `JobQueueRecord`, `AttributeInventory` (+241 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PipelineStatus` connect `Community 30` to `Community 2`, `Community 36`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `AppRouter` connect `Community 26` to `Community 41`, `Community 3`, `Community 1`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `Logger` connect `Community 7` to `Community 0`, `Community 1`, `Community 2`, `Community 36`, `Community 5`, `Community 37`, `Community 41`, `Community 20`, `Community 55`, `Community 31`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `AppVariables`, `port`, `UsageEventRecord` to the rest of the system?**
  _246 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1036036036036036 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.07293868921775898 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._