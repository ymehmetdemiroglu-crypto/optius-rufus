# Graph Report - optimus rufus webapp  (2026-06-18)

## Corpus Check
- 158 files · ~77,760 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 806 nodes · 1531 edges · 45 communities (34 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c9ef602c`
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
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 133|Community 133]]
- [[_COMMUNITY_Community 134|Community 134]]

## God Nodes (most connected - your core abstractions)
1. `Logger` - 23 edges
2. `scripts` - 20 edges
3. `JobRepository` - 17 edges
4. `compilerOptions` - 17 edges
5. `callLlm()` - 16 edges
6. `compilerOptions` - 16 edges
7. `compilerOptions` - 16 edges
8. `db` - 15 edges
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
- `scrapeAndAudit()` --calls--> `scrapeAmazonListing()`  [EXTRACTED]
  api/domains/analysis/service.ts → api/domains/listing/scraper.ts

## Import Cycles
- 2-file cycle: `api/domains/apollo/service.ts -> api/domains/prospect/service.ts -> api/domains/apollo/service.ts`

## Communities (45 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (46): buildCopyUpdate(), updateCopy(), AnalysisMetrics, buildAnalysisInsertInput(), buildProspectName(), computeMetrics(), executePipeline(), extractPipelineOutputs() (+38 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (33): analysisRouter, apolloRouter, bookingRouter, brandingRouter, catalogGraphRouter, scraperRouter, DOMAIN_MAP, scrapeAmazonListing() (+25 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (38): analyzeSemanticGaps(), AttributeInventory, buildIntentCoverage(), buildPredictedIntents(), buildSemanticGaps(), CATEGORY_TAXONOMIES, computeLocalTextSimilarity(), computeSignalCoverage() (+30 more)

### Community 3 - "Community 3"
Cohesion: 0.10
Nodes (20): scripts, build, build:client, build:server, check, codegen:domains, codegen:env, codegen:scripts (+12 more)

### Community 4 - "Community 4"
Cohesion: 0.06
Nodes (37): AuditLaunchBoxProps, BrandingPanelProps, ClientDirectoryProps, Prospect, COSMOCanvas(), COSMOCanvasProps, OutreachCampaignTab(), OutreachCampaignTabProps (+29 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (11): MemoryEventBus, DomainEvent, EventBus, IJobQueue, Job, JobOpts, IJobRepository, JobRepository (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.14
Nodes (7): InsertProspectInput, ProspectRecord, create(), buildCountQuery(), buildItemsQuery(), buildWhereClause(), list()

### Community 7 - "Community 7"
Cohesion: 0.05
Nodes (36): AppVariables, boot(), port, runMigrations(), AppVariables, registerHttpRoutes(), serveStatic(), breakers (+28 more)

### Community 8 - "Community 8"
Cohesion: 0.21
Nodes (15): bookings, brandSettings, catalogLinks, jobs, listingAnalyses, listings, pipelineJobs, pipelineJobStages (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.17
Nodes (4): InsertPipelineJobInput, InsertPipelineJobStageInput, PipelineStageState, updateStatus()

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
Cohesion: 0.07
Nodes (36): BookingFormData, BundlingItem, CompetitorComparison, CosmoNodeData, FreeQAItem, PipelineProspect, PPCKeywordItem, ProspectData (+28 more)

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (7): app, DELETE, GET, OPTIONS, POST, PUT, rewrites

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (7): TRPCProvider(), ErrorBoundary, Props, State, AdminDashboard, App(), ProspectLanding

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (27): apolloFetch(), createContact(), enrichAndImportProspect(), enrollInSequence(), FIELD_KEYS, getSequences(), MOCK_PEOPLE, searchPeople() (+19 more)

### Community 19 - "Community 19"
Cohesion: 0.21
Nodes (5): createBooking(), CreateBookingInput, sendTelegramNotification(), BookingRecord, InsertBookingInput

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
Nodes (4): InsertRufusQueryInput, InsertRufusQueryRunInput, RufusQueryRecord, RufusQueryRunRecord

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (7): ProgressBar(), ProgressBarProps, STAGE_IDS, STAGE_LABELS, STAGE_NAMES, StageId, STAGES

### Community 29 - "Community 29"
Cohesion: 0.09
Nodes (34): generateOptimizedContent(), buildDefaultDescription(), buildFallbackContent(), buildKeywordInventory(), containsKeyword(), enforceBulletCount(), enforceQAs(), generateSemanticRewrittenContent() (+26 more)

### Community 31 - "Community 31"
Cohesion: 0.19
Nodes (6): db, BrandSettingsRecord, InsertBrandSettingsInput, generateOutreachCopy(), OutreachEmails, regenerateOutreachCopy()

### Community 32 - "Community 32"
Cohesion: 0.04
Nodes (47): dependencies, better-sqlite3, clsx, drizzle-orm, hono, @hono/node-server, lucide-react, pg (+39 more)

### Community 34 - "Community 34"
Cohesion: 0.29
Nodes (3): StageHeroProps, SCAN_LINES, StageScanAnimationProps

### Community 36 - "Community 36"
Cohesion: 0.27
Nodes (3): PipelineEngine, PipelineJob, StageName

## Knowledge Gaps
- **255 isolated node(s):** `AppVariables`, `port`, `UsageEventRecord`, `JobQueueRecord`, `AttributeInventory` (+250 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `PipelineStatus` connect `Community 4` to `Community 9`, `Community 29`, `Community 7`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Why does `AppRouter` connect `Community 1` to `Community 4`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `Logger` connect `Community 7` to `Community 0`, `Community 31`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `AppVariables`, `port`, `UsageEventRecord` to the rest of the system?**
  _255 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.06604324956165984 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06588235294117648 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10283687943262411 - nodes in this community are weakly interconnected._