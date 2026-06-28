# Graph Report - optimus rufus webapp  (2026-06-24)

## Corpus Check
- 165 files · ~83,817 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 851 nodes · 1714 edges · 47 communities (41 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bbc22449`
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
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 269|Community 269]]

## God Nodes (most connected - your core abstractions)
1. `Logger` - 29 edges
2. `scripts` - 29 edges
3. `compilerOptions` - 18 edges
4. `JobRepository` - 17 edges
5. `db` - 17 edges
6. `callLlm()` - 16 edges
7. `compilerOptions` - 16 edges
8. `compilerOptions` - 16 edges
9. `generateEmbedding()` - 14 edges
10. `mapBackendToProspectData()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `computeLocalTextSimilarity()` --calls--> `tokenize()`  [INFERRED]
  api/domains/analysis/intentEngine.ts → api/domains/optimization/semanticRewriter.ts
- `getDefaultSequenceIdForProspect()` --calls--> `getSettings()`  [INFERRED]
  api/domains/prospect/service.ts → api/domains/branding/repository.ts
- `PipelineOutputs` --references--> `AnalysisResult`  [EXTRACTED]
  api/domains/analysis/service.ts → api/pipeline/pipeline.types.ts
- `persistAnalysis()` --calls--> `generateOutreachCopy()`  [INFERRED]
  api/domains/analysis/service.ts → api/domains/prospect/outreach.ts
- `approveAndEnroll()` --calls--> `createContact()`  [INFERRED]
  api/domains/prospect/service.ts → api/domains/apollo/service.ts

## Import Cycles
- 2-file cycle: `api/domains/apollo/service.ts -> api/domains/prospect/service.ts -> api/domains/apollo/service.ts`

## Communities (47 total, 6 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.20
Nodes (5): InsertRufusQueryInput, InsertRufusQueryRunInput, RufusQueryRecord, RufusQueryRunRecord, RufusSOVResult

### Community 1 - "Community 1"
Cohesion: 0.21
Nodes (4): db, BrandSettingsRecord, InsertBrandSettingsInput, create()

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (19): analysisRouter, apolloRouter, bookingRouter, brandingRouter, scraperRouter, ppcRouter, convertPlanToCsv(), generateNegatives() (+11 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (29): scripts, build, build:client, build:daemon, build:server, check, codegen:domains, codegen:env (+21 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (38): AuditLaunchBoxProps, BrandingPanelProps, ClientDirectoryProps, Prospect, COSMOCanvas(), COSMOCanvasProps, OutreachCampaignTab(), OutreachCampaignTabProps (+30 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (10): DomainEvent, IJobQueue, Job, JobOpts, IJobRepository, JobRepository, generateId(), JobQueue (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.16
Nodes (6): InsertProspectInput, ProspectRecord, buildCountQuery(), buildItemsQuery(), buildWhereClause(), list()

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (34): apolloFetch(), createContact(), enrichAndImportProspect(), enrollInSequence(), FIELD_KEYS, getActiveEmailAccountId(), getSequences(), MOCK_PEOPLE (+26 more)

### Community 8 - "Community 8"
Cohesion: 0.16
Nodes (17): bookings, brandSettings, catalogLinks, jobs, listingAnalyses, listings, pipelineJobs, pipelineJobStages (+9 more)

### Community 9 - "Community 9"
Cohesion: 0.07
Nodes (25): InsertPipelineJobInput, InsertPipelineJobStageInput, pipelineQueue, agentsRouter, STAGE_ORDER, PipelineEngine, STAGE_OUTPUT_KEY_MAP, stageExecutors (+17 more)

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
Cohesion: 0.17
Nodes (10): app, DELETE, GET, OPTIONS, POST, PUT, buildCommand, cleanUrls (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (7): TRPCProvider(), ErrorBoundary, Props, State, AdminDashboard, App(), ProspectLanding

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (4): InsertListingInput, ListingAnalysisRecord, ListingRecord, CreateListingInput

### Community 17 - "Community 17"
Cohesion: 0.08
Nodes (46): analyzeSemanticGaps(), AttributeInventory, buildIntentCoverage(), buildPredictedIntents(), buildSemanticGaps(), CATEGORY_TAXONOMIES, computeLocalTextSimilarity(), computeSignalCoverage() (+38 more)

### Community 18 - "Community 18"
Cohesion: 0.38
Nodes (3): AppVariables, generatePdf(), pipelineSseHandler()

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (5): createBooking(), CreateBookingInput, sendTelegramNotification(), BookingRecord, InsertBookingInput

### Community 20 - "Community 20"
Cohesion: 0.21
Nodes (15): AppVariables, boot(), port, app, AppVariables, boot(), port, runMigrations() (+7 more)

### Community 22 - "Community 22"
Cohesion: 0.19
Nodes (5): getAllCircuitBreakers(), watchdogIntervals, ProspectDetails, triggerWebhook(), WebhookWorker

### Community 23 - "Community 23"
Cohesion: 0.24
Nodes (13): CosmoNodeData, ProspectScoreBreakdown, ReviewSentimentProfile, TransformSnippet, AnimatedScore(), AnimatedScoreProps, StageAutopsy(), StageAutopsyProps (+5 more)

### Community 24 - "Community 24"
Cohesion: 0.29
Nodes (3): buildCopyUpdate(), updateCopy(), InsertAnalysisInput

### Community 25 - "Community 25"
Cohesion: 0.27
Nodes (3): cache, CacheEntry, CacheService

### Community 29 - "Community 29"
Cohesion: 0.07
Nodes (50): AnalysisMetrics, buildProspectName(), computeMetrics(), executePipeline(), extractPipelineOutputs(), fetchListing(), fetchProspect(), PipelineOutputs (+42 more)

### Community 32 - "Community 32"
Cohesion: 0.04
Nodes (47): dependencies, better-sqlite3, clsx, drizzle-orm, hono, @hono/node-server, lucide-react, pg (+39 more)

### Community 33 - "Community 33"
Cohesion: 0.12
Nodes (14): breakers, CircuitBreakerOptions, CircuitState, getCircuitBreaker(), eventBus, MemoryEventBus, EventBus, LogContext (+6 more)

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (4): ProspectListing, StageHeroProps, SCAN_LINES, StageScanAnimationProps

### Community 39 - "Community 39"
Cohesion: 0.11
Nodes (16): useActivityTracker(), LandingPageComposer(), LiveAuditProgressProps, PipelineJob, PipelineStageState, PipelineStatus, ProgressBar(), ProgressBarProps (+8 more)

### Community 42 - "Community 42"
Cohesion: 0.36
Nodes (7): buildAnalysisInsertInput(), persistAnalysis(), cleanCategory(), cleanCompanyName(), generateOutreachCopy(), OutreachEmails, regenerateOutreachCopy()

### Community 45 - "Community 45"
Cohesion: 0.18
Nodes (18): buildDefaultDescription(), buildFallbackContent(), buildKeywordInventory(), containsKeyword(), enforceBulletCount(), enforceQAs(), generateSemanticRewrittenContent(), injectMissingKeywords() (+10 more)

### Community 117 - "Community 117"
Cohesion: 0.15
Nodes (11): BundlingItem, CompetitorComparison, PipelineProspect, PPCKeywordItem, ProspectIssue, ProspectOpportunity, SimulatorScenario, StageCopyData (+3 more)

### Community 269 - "Community 269"
Cohesion: 0.10
Nodes (15): ProspectData, BrandStyleInjector(), BrandStyleInjectorProps, isValidCssColor(), isValidDataUrl(), FloatingCTA(), FloatingCTAProps, LandingPageComposerProps (+7 more)

## Knowledge Gaps
- **250 isolated node(s):** `AppVariables`, `port`, `AppVariables`, `app`, `port` (+245 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Logger` connect `Community 30` to `Community 1`, `Community 33`, `Community 7`, `Community 9`, `Community 42`, `Community 18`, `Community 20`, `Community 22`, `Community 29`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `PipelineStatus` connect `Community 4` to `Community 9`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **What connects `AppVariables`, `port`, `AppVariables` to the rest of the system?**
  _250 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10080645161290322 - nodes in this community are weakly interconnected._
- **Should `Community 3` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `Community 4` be split into smaller, more focused modules?**
  _Cohesion score 0.060285563194077206 - nodes in this community are weakly interconnected._
- **Should `Community 5` be split into smaller, more focused modules?**
  _Cohesion score 0.10984848484848485 - nodes in this community are weakly interconnected._