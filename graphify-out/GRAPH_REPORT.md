# Graph Report - .  (2026-06-07)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 594 nodes · 1074 edges · 55 communities (41 shown, 14 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f2c497e0`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Agent-based Data Fetching|Agent-based Data Fetching]]
- [[_COMMUNITY_Database and API Setup|Database and API Setup]]
- [[_COMMUNITY_Logging and Event Bus|Logging and Event Bus]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Scraper and Router Execution|Scraper and Router Execution]]
- [[_COMMUNITY_HTTP Server Setup|HTTP Server Setup]]
- [[_COMMUNITY_Prospect Data Simulation|Prospect Data Simulation]]
- [[_COMMUNITY_Frontend TypeScript Config|Frontend TypeScript Config]]
- [[_COMMUNITY_Backend TypeScript Config|Backend TypeScript Config]]
- [[_COMMUNITY_System Architecture Overview|System Architecture Overview]]
- [[_COMMUNITY_Node TypeScript Config|Node TypeScript Config]]
- [[_COMMUNITY_Admin Dashboard & Pipeline|Admin Dashboard & Pipeline]]
- [[_COMMUNITY_Pipeline Engine Core|Pipeline Engine Core]]
- [[_COMMUNITY_Application Error Handling|Application Error Handling]]
- [[_COMMUNITY_Landing Page Components|Landing Page Components]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_REPL and Logging|REPL and Logging]]
- [[_COMMUNITY_Technical Architecture Guide|Technical Architecture Guide]]
- [[_COMMUNITY_Caching Service|Caching Service]]
- [[_COMMUNITY_System Integration Architecture|System Integration Architecture]]
- [[_COMMUNITY_Autopsy Stage Scoring|Autopsy Stage Scoring]]
- [[_COMMUNITY_Progress Bar Component|Progress Bar Component]]
- [[_COMMUNITY_Hero Scan Animation|Hero Scan Animation]]
- [[_COMMUNITY_tRPC Context|tRPC Context]]
- [[_COMMUNITY_Matplotlib Library|Matplotlib Library]]
- [[_COMMUNITY_PPC Planner Stage|PPC Planner Stage]]
- [[_COMMUNITY_Root TypeScript Config|Root TypeScript Config]]
- [[_COMMUNITY_Matplotlib Version|Matplotlib Version]]
- [[_COMMUNITY_Application Entry Point|Application Entry Point]]
- [[_COMMUNITY_Application Middleware|Application Middleware]]
- [[_COMMUNITY_Scroll Reveal Hook|Scroll Reveal Hook]]
- [[_COMMUNITY_Main Frontend Entry|Main Frontend Entry]]
- [[_COMMUNITY_AI Orchestration System|AI Orchestration System]]
- [[_COMMUNITY_Marketing Strategy Image|Marketing Strategy Image]]
- [[_COMMUNITY_Optimization Comparison Image|Optimization Comparison Image]]
- [[_COMMUNITY_Profitability Image|Profitability Image]]

## God Nodes (most connected - your core abstractions)
1. `db` - 23 edges
2. `RawListingData` - 20 edges
3. `run()` - 19 edges
4. `run()` - 17 edges
5. `compilerOptions` - 17 edges
6. `AgentRole` - 16 edges
7. `Logger` - 16 edges
8. `compilerOptions` - 16 edges
9. `compilerOptions` - 15 edges
10. `Agent` - 14 edges

## Surprising Connections (you probably didn't know these)
- `run()` --calls--> `generateAllStageCopy()`  [INFERRED]
  scripts/testEndToEnd.ts → api/services/copywriter.ts
- `run()` --calls--> `buildCatalogGraph()`  [INFERRED]
  scripts/runOptimization.ts → api/services/catalogGraph.ts
- `run()` --calls--> `buildCatalogGraph()`  [INFERRED]
  scripts/testEndToEnd.ts → api/services/catalogGraph.ts
- `run()` --calls--> `fetchCompetitors()`  [INFERRED]
  scripts/runOptimization.ts → api/services/competitor.ts
- `run()` --calls--> `fetchCompetitors()`  [INFERRED]
  scripts/testEndToEnd.ts → api/services/competitor.ts

## Import Cycles
- None detected.

## Communities (55 total, 14 thin omitted)

### Community 0 - "Agent-based Data Fetching"
Cohesion: 0.09
Nodes (35): ApifyFetcherAgent, safeJsonParse(), CompetitorAnalystAgent, ListingFetcherAgent, OptimizationOrchestrator, STAGE_NAMES, STAGES, PreprocessorAgent (+27 more)

### Community 1 - "Database and API Setup"
Cohesion: 0.06
Nodes (47): apiKeyProcedure, t, BookingRecord, BrandSettingsRecord, CatalogLinkRecord, db, dbDir, __dirname (+39 more)

### Community 2 - "Logging and Event Bus"
Cohesion: 0.06
Nodes (25): eventBus, MemoryEventBus, LogContext, Logger, LogLevel, generateId(), pipelineQueue, safeJsonParse() (+17 more)

### Community 3 - "Frontend Dependencies"
Cohesion: 0.04
Nodes (46): dependencies, better-sqlite3, clsx, hono, lucide-react, puppeteer, react, react-dom (+38 more)

### Community 4 - "Scraper and Router Execution"
Cohesion: 0.09
Nodes (31): rufusTrackerRouter, scraperRouter, getArg(), run(), __dirname, envPath, run(), safeJsonParse() (+23 more)

### Community 5 - "HTTP Server Setup"
Cohesion: 0.09
Nodes (15): app, httpServer, port, DELETE, GET, OPTIONS, POST, PUT (+7 more)

### Community 6 - "Prospect Data Simulation"
Cohesion: 0.17
Nodes (15): StageFreeQAsProps, BundlingItem, CompetitorComparison, CosmoNodeData, FreeQAItem, PipelineProspect, ProspectData, ProspectIssue (+7 more)

### Community 7 - "Frontend TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 8 - "Backend TypeScript Config"
Cohesion: 0.11
Nodes (18): compilerOptions, baseUrl, declaration, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir (+10 more)

### Community 9 - "System Architecture Overview"
Cohesion: 0.13
Nodes (16): 04 — Architecture, AI/ML Pipeline, AI Pipeline, API Specification, Business, Database ERD, Database Schema, Deployment & DevOps (+8 more)

### Community 10 - "Node TypeScript Config"
Cohesion: 0.11
Nodes (17): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+9 more)

### Community 11 - "Admin Dashboard & Pipeline"
Cohesion: 0.17
Nodes (6): PipelineJob, PipelineStageState, revenueOptions, PipelineStatusPanel(), trpc, BookingFormData

### Community 12 - "Pipeline Engine Core"
Cohesion: 0.25
Nodes (8): PipelineEngine, safeJson(), PipelineJob, STAGE_ORDER, StageContext, StageDefinition, StageExecutor, StageName

### Community 13 - "Application Error Handling"
Cohesion: 0.15
Nodes (4): ErrorBoundary, Props, State, TRPCProvider()

### Community 14 - "Landing Page Components"
Cohesion: 0.14
Nodes (11): FloatingCTAProps, StageBleedCalculatorProps, StageProofWallProps, testimonials, steps, mapBackendToProspectData(), safeJsonParse(), BrandStyleInjector() (+3 more)

### Community 15 - "Project Documentation"
Cohesion: 0.18
Nodes (12): docs/01-product/README.md, docs/01-product/requirements.md, docs/02-research/amazon-ai-optimization.md, docs/02-research/README.md, docs/03-business/financial-analysis.md, docs/03-business/marketing-playbook.md, docs/03-business/README.md, docs/README.md (+4 more)

### Community 16 - "REPL and Logging"
Cohesion: 0.26
Nodes (11): colors, formatDuration(), log(), main(), printBanner(), rl, setupEventListeners(), showLogs() (+3 more)

### Community 17 - "Technical Architecture Guide"
Cohesion: 0.18
Nodes (11): Technical Architecture, Development Setup Guide, Deployment & DevOps Guide, Sentry Integration Examples, backend/boot.ts, backend/index.ts, backend/middleware.ts, backend/trpc.ts (+3 more)

### Community 18 - "Caching Service"
Cohesion: 0.27
Nodes (3): cache, CacheEntry, CacheService

### Community 19 - "System Integration Architecture"
Cohesion: 0.20
Nodes (10): Amazon Selling Partner API (SP-API), ASIN Analysis Flow, Authentication Flow, Deployment Architecture, Technical Architecture Document (TAD), OpenAI API, Paddle Payments, Payment Flow (+2 more)

### Community 20 - "Autopsy Stage Scoring"
Cohesion: 0.83
Nodes (3): AnimatedScore(), getScoreColor(), getScoreLevel()

### Community 24 - "Matplotlib Library"
Cohesion: 1.00
Nodes (3): Matplotlib, Matplotlib, Matplotlib

## Knowledge Gaps
- **221 isolated node(s):** `STAGES`, `STAGE_NAMES`, `TaskStatus`, `QAPair`, `OptimizationReport` (+216 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `db` connect `Database and API Setup` to `Agent-based Data Fetching`, `Logging and Event Bus`, `Scraper and Router Execution`, `HTTP Server Setup`, `Pipeline Engine Core`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `PipelineState` connect `Agent-based Data Fetching` to `REPL and Logging`, `Admin Dashboard & Pipeline`, `Pipeline Engine Core`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **Why does `Logger` connect `Logging and Event Bus` to `Agent-based Data Fetching`, `Database and API Setup`, `Pipeline Engine Core`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `run()` (e.g. with `buildCatalogGraph()` and `fetchCompetitors()`) actually correct?**
  _`run()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `run()` (e.g. with `buildCatalogGraph()` and `fetchCompetitors()`) actually correct?**
  _`run()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `STAGES`, `STAGE_NAMES`, `TaskStatus` to the rest of the system?**
  _221 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Agent-based Data Fetching` be split into smaller, more focused modules?**
  _Cohesion score 0.0925553319919517 - nodes in this community are weakly interconnected._