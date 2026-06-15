# Multi-Agent Optimization System
# Amazon Listing Optimizer SaaS

**Version:** 1.0  
**Date:** 2026-05-30  
**Status:** MVP Implementation

---

## 1. Architecture Overview

The multi-agent system implements the 6-stage AI pipeline as a collection of specialized agents coordinated by an orchestrator. Each agent is responsible for one stage, and a reviewer agent validates output after every stage.

```
User Input (ASIN + Marketplace)
    |
    v
[OptimizationOrchestrator]
    |
    +---> [ListingFetcher] ---> [Reviewer]
    +---> [Preprocessor] ---> [Reviewer]
    +---> [EmbeddingGenerator] ---> [Reviewer]
    +---> [SemanticAnalyzer] ---> [Reviewer]
    +---> [ContentOptimizer] ---> [Reviewer]
    +---> [CompetitorAnalyst] ---> [Reviewer]
    |
    v
[OptimizationReport]
```

---

## 2. Agent Registry

| Agent | Role | File | Responsibility |
|-------|------|------|----------------|
| **ListingFetcher** | `listing_fetcher` | `api/agents/agents/listingFetcher.ts` | Fetch raw listing from Apify / Rainforest API |
| **Preprocessor** | `preprocessor` | `api/agents/agents/preprocessor.ts` | Clean text, remove HTML, normalize |
| **EmbeddingGenerator** | `embedding_generator` | `api/agents/agents/embeddingGenerator.ts` | Generate 1536-dim vector via OpenAI |
| **SemanticAnalyzer** | `semantic_analyzer` | `api/agents/agents/semanticAnalyzer.ts` | Compute gaps and Rufus/COSMO scores |
| **ContentOptimizer** | `content_optimizer` | `api/agents/agents/contentOptimizer.ts` | Generate optimized title, bullets, Q&A |
| **CompetitorAnalyst** | `competitor_analyst` | `api/agents/agents/competitorAnalyst.ts` | Fetch and benchmark competitors |
| **Reviewer** | `reviewer` | `api/agents/reviewer.ts` | Validate output quality per stage |

---

## 3. Orchestrator

**File:** `api/agents/orchestrator.ts`

The `OptimizationOrchestrator` extends Node.js `EventEmitter` and manages:
- Sequential stage execution
- Retry logic (max 3 attempts with exponential backoff)
- Review gates after each stage
- Final report assembly
- Event streaming for REPL/dashboard consumption

### Events Emitted

| Event | Payload | When |
|-------|---------|------|
| `pipeline:start` | `{ asin, marketplace }` | Pipeline begins |
| `stage:start` | `{ stage, role, name }` | Agent starts working |
| `stage:complete` | `{ stage, role, name, status, duration }` | Agent finishes |
| `review:complete` | `{ stage, role, approved, score, issues, suggestions }` | Reviewer finishes |
| `review:warning` | `{ stage, role, issues }` | Reviewer flags non-blocking issues |
| `pipeline:complete` | `PipelineState` | All stages done |
| `pipeline:error` | `string` | Fatal error |

---

## 4. Reviewer Rules

The reviewer is context-aware and applies different validation per stage:

| Stage | Checks | Pass Criteria |
|-------|--------|---------------|
| **Fetch** | Title non-empty, bullets ≥ 3, ASIN matches | No blocking issues |
| **Preprocess** | Text length > 100, no HTML tags | No blocking issues |
| **Embedding** | Vector length = 1536, all finite | Exact match |
| **Analysis** | Score 0-100, gaps array non-empty | No blocking issues |
| **Optimize** | Title ≤ 200 chars, bullets = 5, QAs ≥ 3 | No blocking issues |
| **Competitor** | 0-5 competitors, scores valid | No blocking issues |

Warnings (non-blocking) are logged but do not halt the pipeline.

---

## 5. REPL Loop

**File:** `scripts/repl.ts`

Interactive CLI for running pipelines and monitoring agent progress.

### Commands

| Command | Arguments | Description |
|---------|-----------|-------------|
| `optimize` | `<ASIN> <marketplace>` | Run full optimization pipeline |
| `status` | — | Show current pipeline progress |
| `report` | — | Display final optimization report |
| `logs` | — | Show structured JSON execution logs |
| `help` | — | Show command reference |
| `quit` | — | Exit REPL |

### Running the REPL

```bash
npm run repl
```

### Example Session

```
🤖 Amazon Listing Optimizer — Multi-Agent REPL

> optimize B08XYZ1234 US

[14:32:01] 🚀 Pipeline started for B08XYZ1234 (US)
[14:32:01] 📦 ListingFetcher: Running...
[14:32:03] ✅ ListingFetcher: completed — 1.2s
[14:32:03] 🔍 Reviewer: ListingFetcher... ✅ PASS (score: 95)
[14:32:03] 🧹 Preprocessor: Running...
[14:32:03] ✅ Preprocessor: completed — 0.1s
[14:32:03] 🔍 Reviewer: Preprocessor... ✅ PASS (score: 98)
[14:32:03] 🔢 EmbeddingGenerator: Running...
[14:32:04] ✅ EmbeddingGenerator: completed — 0.8s
[14:32:04] 🔍 Reviewer: EmbeddingGenerator... ✅ PASS (score: 100)
[14:32:04] 📊 SemanticAnalyzer: Running...
[14:32:05] ✅ SemanticAnalyzer: completed — 0.6s
[14:32:05] 🔍 Reviewer: SemanticAnalyzer... ⚠️ WARN (score: 72)
   Suggestion: Listing has significant room for improvement; prioritize critical gaps
[14:32:05] ⏩ Continuing to next stage...
[14:32:05] ✍️ ContentOptimizer: Running...
[14:32:07] ✅ ContentOptimizer: completed — 1.4s
[14:32:07] 🔍 Reviewer: ContentOptimizer... ✅ PASS (score: 88)
[14:32:07] 🏆 Pipeline complete! Rufus Score: 67 → 89 (+22)

> report

═══ Optimization Report ═══
ASIN:        B08XYZ1234
Marketplace: US
Original Score: 67
Optimized Score: 89

Optimized Title:
NutraWell Magnesium Glycinate 400mg — sleep support, stress relief | 180 Capsules, Third-Party Tested

Optimized Bullets:
  1. Clinically Studied Absorption...
  ...

> quit
Goodbye! 👋
```

---

## 6. tRPC Router

**File:** `api/routers/agents.ts`

Exposes pipeline control via tRPC for frontend integration:

| Procedure | Type | Input | Output |
|-----------|------|-------|--------|
| `agents.optimize` | Mutation | `{ asin, marketplace }` | `{ pipelineId, state }` |
| `agents.getState` | Query | `{ pipelineId }` | `PipelineState` |
| `agents.retryStage` | Mutation | `{ pipelineId, stage }` | `PipelineState` |

---

## 7. Service Stubs

The agents import from `api/services/`. Currently these are stubs that simulate realistic outputs. When the real services are implemented, only the `execute()` methods in each agent need updating.

| Service | File | Real Implementation |
|---------|------|---------------------|
| Scraper | `api/services/scraper.ts` | Apify / Rainforest API calls |
| Embedding | `api/services/embedding.ts` | OpenAI text-embedding-3-small |
| Analysis | `api/services/analysis.ts` | Cosine similarity + gap scoring |
| Optimization | `api/services/optimization.ts` | GPT-4 content generation |
| Competitor | `api/services/competitor.ts` | Apify / Rainforest API search + comparison |

---

## 8. Error Handling

### Retry Strategy

- **Max attempts:** 3 per stage
- **Backoff:** 1s, 2s, 4s (exponential)
- **Retryable errors:** Network timeouts, rate limits, transient API failures
- **Non-retryable errors:** Invalid ASIN, auth failures, validation errors

### Pipeline Failure

If a critical stage fails after all retries:
1. Pipeline halts immediately
2. `pipeline:error` event emitted with details
3. Partial state preserved in `PipelineState`
4. User can inspect logs and retry from the failed stage

---

## 9. Performance

| Metric | Value |
|--------|-------|
| Total pipeline latency | 3-5 seconds (stubbed) |
| Per-analysis cost | ~$0.0002 (OpenAI embedding) |
| Max concurrent pipelines | 10 (configurable) |
| Scraper API rate limit | 1 req / 2s (enforced by fetch agent) |

---

## 10. Future Enhancements

| Feature | Priority | Description |
|---------|----------|-------------|
| Parallel competitor analysis | Medium | Run competitor fetch in parallel with embedding |
| Redis pipeline store | High | Replace in-memory store for production |
| WebSocket streaming | Medium | Real-time frontend updates via Socket.IO |
| A/B testing agent | Low | Generate 2 variants and score both |
| Human-in-the-loop | Low | Pause pipeline for manual review of critical stages |
