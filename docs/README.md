---
title: Optimus Rufus Documentation
owner: "@yhia"
status: canonical
last_verified: 2026-06-10
diataxis_mode: explanation
audience: engineering
---

# Optimus Rufus Documentation

The internal engineering documentation for the Optimus Rufus platform — an Amazon listing optimization service that aligns seller content with Amazon's COSMO knowledge graph and Rufus conversational AI.

## Read by intent

This site is organized by **what you are trying to do**, not by feature area. Pick the row that matches your intent.

| I want to… | Mode | Folder | Read |
|---|---|---|---|
| Understand a concept or decision | Explanation | [`10-explanation/`](10-explanation/) | [Product vision](10-explanation/product-vision.md) · [Domain map](10-explanation/domain-map.md) · [Container model](10-explanation/container-model.md) |
| Get something done (recipe) | How-to | [`20-how-to/`](20-how-to/) | [Onboard](20-how-to/how-to-onboard.md) · [Add a domain](20-how-to/how-to-add-a-domain.md) · [Add a pipeline stage](20-how-to/how-to-add-a-pipeline-stage.md) · [Add a tRPC procedure](20-how-to/how-to-add-a-trpc-procedure.md) |
| Look up an exact value | Reference | [`30-reference/`](30-reference/) | [tRPC procedures](30-reference/api/procedures.md) · [DB schema](30-reference/database/schema.md) · [Env vars](30-reference/env/variables.md) · [CLI scripts](30-reference/cli/scripts.md) · [Domain catalog](30-reference/domain-catalog/README.md) |
| Understand the system shape | C4 | [`40-architecture/`](40-architecture/) | [Context](40-architecture/c4-level-1-context.md) · [Containers](40-architecture/c4-level-2-containers.md) · [Components](40-architecture/c4-level-3-components.md) |
| Recover from an incident | Runbook | [`50-runbooks/`](50-runbooks/) | [Pipeline stuck](50-runbooks/pipeline-stuck.md) · [Embedding job failed](50-runbooks/embedding-job-failed.md) · [DB migration revert](50-runbooks/db-migration-revert.md) |

## Maintain the docs

| Task | Doc |
|---|---|
| Add or move a doc | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Required frontmatter fields | [00-meta/frontmatter-spec.md](00-meta/frontmatter-spec.md) |
| What is codegen, what is hand-written | [00-meta/codegen-pipeline.md](00-meta/codegen-pipeline.md) |
| What CI checks the docs | [00-meta/lint-rules.md](00-meta/lint-rules.md) |
| Read a past decision | [00-meta/adr/](00-meta/adr/) |
| Look up a term | [glossary.md](glossary.md) |

## Conventions

- **One H1 per file** (the title). IDE outline panels work because of this.
- **No skipped heading levels** (H2 → H3 → H4). Enforced by `markdownlint`.
- **Diagrams are Mermaid**, not PNG. PNGs rot; Mermaid diffs.
- **Every fact has a source** — inline `[ref: path/to/file.ts:42]` links to the line that proves it.
- **Reference docs are codegen** — see [00-meta/codegen-pipeline.md](00-meta/codegen-pipeline.md).
- **Last-verified** is in the frontmatter; docs older than 180 days are flagged `stale` by CI.

## Status of this site

Phase 1 (foundation + onboarding path) is the only section currently canonical. Sections marked `draft` or `stale` are in active migration from the [legacy six-folder structure](90-archive/2026-06-legacy-six-folder/).
