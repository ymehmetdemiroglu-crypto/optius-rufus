---
title: C4 Level 3 — Components
owner: "@yhia"
status: draft
last_verified: 2026-06-10
diataxis_mode: explanation
audience: engineering
c4_level: component
---

# C4 Level 3 — Components

> **Stub.** Per-domain component views will live here. The 10 tRPC domains are already listed in [30-reference/domain-catalog/README.md](../30-reference/domain-catalog/README.md). When each domain gets a dedicated component view, link it from here.

## Planned sections

- `optimization` — agents (analysis, copywriter, content), embedding service, OpenAI client
- `pipeline` — DAG executor, worker, retry/resume, SSE broadcaster
- `listing` — Amazon scraper (Puppeteer), SP-API client, embedder
- `analysis` — 24-dimension scoring engine
- `prospect` — lead capture, Apollo integration
- `booking` — Paddle billing, Kimi OAuth session
- `branding` — brand asset and panel state
- `apollo` — outbound contact sync
- `catalog` — knowledge-graph upsert/query
- `ppc` — sponsored ads audit and bulksheet generation
- `rufus` — Rufus-rank tracker

## Related

- [Domain catalog](../30-reference/domain-catalog/README.md)
- [10-explanation/container-model.md](../10-explanation/container-model.md)
