---
title: Documentation Policy
owner: "@yhia"
status: canonical
last_verified: 2026-06-10
diataxis_mode: explanation
audience: engineering
---

# Documentation Policy

The ground truth for how this docs site is structured, who owns it, and how it stays accurate. If you are about to argue about docs in a meeting, read this first.

## Purpose

The docs serve the engineering team. Their job is to make every engineer's work faster and more correct. They are not a marketing site, not an investor deck, not a customer manual. Any feature that does not improve an engineer's outcome is cut.

## Principles

1. **One place per fact.** The tRPC procedure list is generated from code, not re-typed. The DB schema is generated from Drizzle, not screenshotted. The env var list is generated from `.env.example`, not copy-pasted. Hand-written prose only adds what code cannot say.
2. **Reader intent drives IA.** The folder tree maps to the four Diátaxis modes (tutorial / how-to / reference / explanation) plus C4 architecture plus runbooks. If you cannot say which mode your doc is, you are not ready to write it.
3. **IDE-readable.** The site must render perfectly in a stock VS Code preview with no extensions, and identically on GitHub. No wikilinks, no HTML, no custom components. One H1 per file, no skipped heading levels.
4. **Diagrams are code.** Mermaid in MD, never PNG. PNGs rot and do not diff.
5. **CI is the contract.** Frontmatter, staleness, link integrity, codegen freshness, and API-drift are all checked in CI. A doc that violates a rule cannot be merged.
6. **Retire, never delete.** Obsolete docs move to `90-archive/`. Deletion is reserved for security issues.

## The four modes, in one paragraph each

**Explanation** ([`10-explanation/`](../10-explanation/product-vision.md)) — "Teach me." Context, decisions, tradeoffs, and the *why*. Reader leaves understanding, not having done anything. Failure mode: tutorial.

**How-to** ([`20-how-to/`](../20-how-to/how-to-onboard.md)) — "I need to do X." A recipe, sequence of steps, verify section, troubleshooting. Reader leaves with the thing done. Failure mode: tutorial.

**Reference** ([`30-reference/`](../30-reference/cli/scripts.md)) — "What is the exact value of Y?" Tables, signatures, schemas, error codes. Reader leaves with the answer. Codegen where possible. Failure mode: prose.

**Architecture** ([`40-architecture/`](../40-architecture/README.md)) — "How does the system fit together?" C4 levels, data flows, sequence diagrams. Diagrams carry the load; text annotates them.

Plus a fifth category, **Runbooks** ([`50-runbooks/`](../50-runbooks/README.md)) — "It's 3am, fix it." Decision trees, not narratives. Always have a `Verify` section at the end.

## What is hand-written, what is codegen

| Hand-written | Codegen |
|---|---|
| Product vision, ADRs, runbooks, recipes, explanations | tRPC procedures, DB schema, env vars, CLI scripts, domain catalog, pipeline stage list |
| Anything narrative or decision-shaped | Anything machine-readable in code |

See [codegen-pipeline.md](codegen-pipeline.md) for the pipeline and the drift-kill switch.

## Roles

| Role | Who | Responsibility |
|---|---|---|
| Owner | `@yhia` (this repo) | All `owner:` frontmatter fields, until team grows |
| Reviewer | Whoever merges the PR | Verifies frontmatter, runs `pnpm docs:lint` |
| Codegen maintainer | Whoever breaks it | Regenerates after schema/router changes |

When the team grows, the `owner` field is the rotation point. One person cannot own forever.

## How to add a new section

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md).
2. Pick the right folder. If unsure, default to `20-how-to/`.
3. Copy the template from the corresponding template in this `00-meta/` folder.
4. Fill frontmatter first. Lint will fail otherwise.
5. Add a row to the index in [../README.md](../README.md).
6. Open the PR. CI will run all checks.

## When this policy changes

Open an ADR in [`adr/`](adr/) with `supersedes:` in the frontmatter. The old ADR stays for historical context; CI builds a supersession graph.

## Related

- [CONTRIBUTING.md](../CONTRIBUTING.md) — day-to-day mechanics
- [frontmatter-spec.md](frontmatter-spec.md) — the contract
- [codegen-pipeline.md](codegen-pipeline.md) — what is generated
- [lint-rules.md](lint-rules.md) — what CI enforces
- [adr/0001-diataxis-c4-hybrid.md](adr/0001-diataxis-c4-hybrid.md) — the topology decision
