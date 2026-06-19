# Graph Report - optimus rufus webapp  (2026-06-19)

## Corpus Check
- 162 files · ~79,530 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 832 nodes · 1650 edges · 54 communities (46 shown, 8 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5248735e`
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
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 134|Community 134]]

## God Nodes (most connected - your core abstractions)
1. `scripts` - 29 edges
2. `Logger` - 26 edges
3. `compilerOptions` - 18 edges
4. `JobRepository` - 17 edges
5. `callLlm()` - 16 edges
6. `compilerOptions` - 16 edges
7. `compilerOptions` - 16 edges
8. `db` - 16 edges
9. `generateEmbedding()` - 14 edges
10. `mapBackendToProspectData()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `computeLocalTextSimilarity()` --calls--> `tokenize()`  [INFERRED]
  api/domains/analysis/intentEngine.ts → api/domains/optimization/semanticRewriter.ts
- `persistAnalysis()` --calls--> `generateOutreachCopy()`  [INFERRED]
  api/domains/analysis/service.ts → api/domains/prospect/outreach.ts
- `generateDynamicTaxonomy()` --calls--> `callLlm()`  [EXTRACTED]
  api/domains/analysis/intentEngine.ts → api/services/llmGateway.ts
- `PipelineOutputs` --references--> `AnalysisResult`  [EXTRACTED]
  api/domains/analysis/service.ts → api/pipeline/pipeline.types.ts
- `resolveStageCopy()` --calls--> `generateAllStageCopy()`  [EXTRACTED]
  api/domains/analysis/service.ts → api/domains/optimization/copywriter.ts

## Import Cycles
- 2-file cycle: `api/domains/apollo/service.ts -> api/domains/prospect/service.ts -> api/domains/apollo/service.ts`

## Communities (54 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (26): buildCopyUpdate(), updateCopy(), buildAnalysisInsertInput(), buildProspectName(), computeMetrics(), executePipeline(), extractPipelineOutputs(), fetchListing() (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.10
Nodes (20): analysisRouter, bookingRouter, brandingRouter, scraperRouter, DOMAIN_MAP, scrapeAmazonListing(), ScrapedListingData, agentsRouter (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (40): analyzeSemanticGaps(), AttributeInventory, buildIntentCoverage(), buildPredictedIntents(), buildSemanticGaps(), CATEGORY_TAXONOMIES, computeLocalTextSimilarity(), computeSignalCoverage() (+32 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (29): scripts, build, build:client, build:daemon, build:server, check, codegen:domains, codegen:env (+21 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (38): AuditLaunchBoxProps, BrandingPanelProps, ClientDirectoryProps, Prospect, COSMOCanvas(), COSMOCanvasProps, OutreachCampaignTab(), OutreachCampaignTabProps (+30 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (7): Job, JobOpts, IJobRepository, JobRepository, generateId(), JobQueue, MockDb

### Community 6 - "Community 6"
Cohesion: 0.19
Nodes (4): buildCountQuery(), buildItemsQuery(), buildWhereClause(), list()

### Community 7 - "Community 7"
Cohesion: 0.16
Nodes (8): getCircuitBreaker(), TIER_BUDGETS_CENTS, TokenBudgetExceededError, TokenBudgetService, callEmbedding(), LlmCallOptions, LlmRequest, LlmResponse

### Community 8 - "Community 8"
Cohesion: 0.21
Nodes (15): bookings, brandSettings, catalogLinks, jobs, listingAnalyses, listings, pipelineJobs, pipelineJobStages (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.15
Nodes (5): InsertPipelineJobInput, InsertPipelineJobStageInput, PipelineStageState, StageOutput, updateStatus()

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (19): compilerOptions, baseUrl, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution (+11 more)

### Community 11 - "Community 11"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+11 more)

### Community 12 - "Community 12"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 13 - "Community 13"
Cohesion: 0.40
Nodes (11): getDefaultCompetitorAudit(), getDefaultCosmoBundling(), getDefaultCosmoGraphData(), getDefaultFreeQAs(), getDefaultPpcKeywords(), getDefaultReviewSentiment(), getDefaultSimulatorScenarios(), getDefaultTransformAfter() (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (7): app, DELETE, GET, OPTIONS, POST, PUT, rewrites

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (7): TRPCProvider(), ErrorBoundary, Props, State, AdminDashboard, App(), ProspectLanding

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (20): dependencies, better-sqlite3, clsx, drizzle-orm, hono, @hono/node-server, lucide-react, pg (+12 more)

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (24): apolloRouter, apolloFetch(), createContact(), enrichAndImportProspect(), enrollInSequence(), FIELD_KEYS, getSequences(), MOCK_PEOPLE (+16 more)

### Community 18 - "Community 18"
Cohesion: 0.18
Nodes (9): eventBus, MemoryEventBus, DomainEvent, EventBus, IJobQueue, pipelineQueue, STAGE_ORDER, StageContext (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (5): createBooking(), CreateBookingInput, sendTelegramNotification(), BookingRecord, InsertBookingInput

### Community 20 - "Community 20"
Cohesion: 0.24
Nodes (13): AppVariables, boot(), port, app, AppVariables, boot(), port, runMigrations() (+5 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (8): BrandStyleInjector(), BrandStyleInjectorProps, isValidCssColor(), isValidDataUrl(), StageProofWallProps, testimonials, StageRoadmapProps, steps

### Community 23 - "Community 23"
Cohesion: 0.19
Nodes (17): CosmoNodeData, PipelineProspect, ProspectIssue, ProspectOpportunity, ProspectScoreBreakdown, ReviewSentimentProfile, StageCopyData, TransformSnippet (+9 more)

### Community 25 - "Community 25"
Cohesion: 0.27
Nodes (3): cache, CacheEntry, CacheService

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (3): InsertRufusQueryInput, InsertRufusQueryRunInput, RufusQueryRunRecord

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (18): ProspectData, useActivityTracker(), FloatingCTA(), FloatingCTAProps, LandingPageComposer(), LandingPageComposerProps, ProgressBar(), ProgressBarProps (+10 more)

### Community 29 - "Community 29"
Cohesion: 0.05
Nodes (68): AnalysisMetrics, PipelineOutputs, regenerateCopy(), RufusQueryRecord, safeJsonParse(), ListingRecordLike, mapListingRecordToRawListingData(), mapScrapedDataToRawListingData() (+60 more)

### Community 30 - "Community 30"
Cohesion: 0.24
Nodes (8): breakers, CircuitBreakerOptions, CircuitState, getAllCircuitBreakers(), LogContext, LogLevel, sendTelegramMessage(), watchdogIntervals

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (4): db, CatalogLinkRecord, InsertCatalogLinkInput, create()

### Community 32 - "Community 32"
Cohesion: 0.09
Nodes (23): devDependencies, autoprefixer, drizzle-kit, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals (+15 more)

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (4): webhookQueue, ProspectDetails, triggerWebhook(), WebhookWorker

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (4): ProspectListing, StageHeroProps, SCAN_LINES, StageScanAnimationProps

### Community 35 - "Community 35"
Cohesion: 0.38
Nodes (3): AppVariables, generatePdf(), pipelineSseHandler()

### Community 36 - "Community 36"
Cohesion: 0.27
Nodes (3): PipelineEngine, PipelineJob, StageName

### Community 38 - "Community 38"
Cohesion: 0.40
Nodes (4): getSettings(), BrandSettingsRecord, InsertBrandSettingsInput, getDefaultSequenceIdForProspect()

### Community 39 - "Community 39"
Cohesion: 0.33
Nodes (4): LiveAuditProgressProps, PipelineJob, PipelineStageState, PipelineStatus

### Community 41 - "Community 41"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 42 - "Community 42"
Cohesion: 0.67
Nodes (3): generateOutreachCopy(), OutreachEmails, regenerateOutreachCopy()

### Community 117 - "Community 117"
Cohesion: 0.47
Nodes (3): CompetitorComparison, SimulatorScenario, StageRufusSimulatorProps

## Knowledge Gaps
- **246 isolated node(s):** `AppVariables`, `port`, `AppVariables`, `app`, `port` (+241 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Logger` connect `Community 37` to `Community 0`, `Community 1`, `Community 33`, `Community 35`, `Community 7`, `Community 42`, `Community 18`, `Community 20`, `Community 29`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `PipelineStatus` connect `Community 4` to `Community 9`, `Community 18`, `Community 29`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `JobRepository` connect `Community 5` to `Community 18`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `AppVariables`, `port`, `AppVariables` to the rest of the system?**
  _246 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06693877551020408 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.10338680926916222 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.0963265306122449 - nodes in this community are weakly interconnected._