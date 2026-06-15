---
title: Glossary
owner: "@yhia"
status: canonical
last_verified: 2026-06-10
diataxis_mode: reference
audience: engineering
---

# Glossary

One line per term, alphabetical. New terms added on first use in any doc; definitions are short and link to the deep-dive.

| Term | Definition | Deep-dive |
|---|---|---|
| ADR | Architecture Decision Record — a short doc capturing one decision and its rationale, written at the moment the decision is made. | [00-meta/adr/](00-meta/adr/) |
| AEO | Answer Engine Optimization — content structured to be cited by AI answer surfaces (Rufus, ChatGPT, Perplexity). | [10-explanation/product-vision.md](10-explanation/product-vision.md) |
| ASIN | Amazon Standard Identification Number — 10-character unique product ID. | — |
| ASGTG | Amazon Seller Group; the dominant seller community. | — |
| C4 | A hierarchical architecture notation: Context → Containers → Components → Code. | [40-architecture/](40-architecture/) |
| Codegen | Generating docs from code so they cannot drift. | [00-meta/codegen-pipeline.md](00-meta/codegen-pipeline.md) |
| COSMO | Amazon's Common Sense Knowledge Graph — encodes relationships between products, attributes, and intents. | [10-explanation/product-vision.md](10-explanation/product-vision.md) |
| DAG | Directed Acyclic Graph — the shape of an analysis pipeline. | [30-reference/pipeline-stages.md](30-reference/pipeline-stages.md) |
| Diátaxis | A documentation topology: tutorial, how-to, reference, explanation. | [00-meta/adr/0001-diataxis-c4-hybrid.md](00-meta/adr/0001-diataxis-c4-hybrid.md) |
| Domain | A self-contained business capability in `api/domains/<name>`. Each domain owns its tRPC subrouter, DB tables, and services. | [30-reference/domain-catalog/](30-reference/domain-catalog/) |
| Embedding | A 1536-dim vector produced by `text-embedding-3-small` representing the semantic meaning of text. | — |
| ETL | Extract, Transform, Load — the `fetch → preprocess → embedding` portion of the pipeline. | [30-reference/pipeline-stages.md](30-reference/pipeline-stages.md) |
| Frontmatter | The YAML block at the top of every doc that CI validates as a contract. | [00-meta/frontmatter-spec.md](00-meta/frontmatter-spec.md) |
| ICP | Ideal Customer Profile — the firmographic + intent signal that qualifies a lead. | — |
| Linting | The set of CI checks that prevent bad docs from being merged. | [00-meta/lint-rules.md](00-meta/lint-rules.md) |
| Marketplace | A regional Amazon storefront (US, UK, DE, …). Default is `US`. | — |
| MRR | Monthly Recurring Revenue — the SaaS north-star metric. | — |
| Pipeline | The DAG-based executor that turns a raw ASIN into a scored report. | [30-reference/pipeline-stages.md](30-reference/pipeline-stages.md) |
| PPC | Pay-Per-Click — Amazon's sponsored ads auction. | — |
| Prospect | A lead in the pre-customer funnel. Persisted in the `prospects` table. | [30-reference/database/schema.md](30-reference/database/schema.md) |
| Qdrant | The vector database used for similarity search across competitor embeddings. | [10-explanation/container-model.md](10-explanation/container-model.md) |
| RFC | Request For Comments — pre-ADR doc for changes that warrant team review. | — |
| ROI | Return on Investment — the lead measure of optimization recommendations. | — |
| Rufus | Amazon's conversational AI shopping assistant; the primary optimization target. | [10-explanation/product-vision.md](10-explanation/product-vision.md) |
| Semantic Gap | The 24-dimension delta between a current listing and an "ideal" listing as understood by COSMO + Rufus. | — |
| SSOT | Single Source of Truth — one place a fact is stored, everything else derives from it. | [00-meta/codegen-pipeline.md](00-meta/codegen-pipeline.md) |
| Stage | A node in the pipeline DAG. Each stage is a unit of work with typed input, output, and retry policy. | [30-reference/pipeline-stages.md](30-reference/pipeline-stages.md) |
| tRPC | End-to-end typesafe RPC — the API protocol between React client and Hono server. | [30-reference/api/procedures.md](30-reference/api/procedures.md) |
| Worker | A long-running process that drains the job queue and executes pipeline stages. | [10-explanation/container-model.md](10-explanation/container-model.md) |
