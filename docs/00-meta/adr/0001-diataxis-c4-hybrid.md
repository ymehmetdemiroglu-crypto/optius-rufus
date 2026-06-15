---
title: "ADR-0001: Diátaxis + C4 hybrid topology"
owner: "@yhia"
status: canonical
last_verified: 2026-06-10
diataxis_mode: explanation
audience: engineering
---

# ADR-0001: Diátaxis + C4 hybrid topology

## Status

Accepted — 2026-06-10.

## Context

The docs site was previously organized as six numbered folders (01-product, 02-research, 03-business, 04-architecture, 05-development, 06-operations). This had three problems:

1. **Reader intent was invisible.** A folder number tells the reader nothing about whether to read top-to-bottom or jump in.
2. **Topics straddled folders.** A "Rufus compatibility" doc was research, product, and development at once. Authors picked one folder arbitrarily.
3. **Prose bloat.** Hand-written reference material (tRPC procedures, DB schema, env vars) drifted from code within weeks of any change.

The team is small (one engineer today, growing). The reader is internal engineering. The depth of technical content is high; the breadth of audience is narrow.

## Decision

Adopt a hybrid topology:

- **Diátaxis** for the body of the site: four modes by reader intent — tutorial, how-to, reference, explanation.
- **C4 model** for the architecture section only: Context → Containers → Components, with code as a thin layer.
- **Runbooks** as a fifth category, operational how-tos, formatted differently from regular recipes.

The folder structure:

```
00-meta/        ← process, ADRs, contract
10-explanation/ ← Diátaxis: understanding
20-how-to/      ← Diátaxis: task-driven
30-reference/   ← Diátaxis: lookup (mostly codegen)
40-architecture/← C4 model
50-runbooks/    ← operational recipes
90-archive/     ← retired docs
```

## Consequences

Positive:

- A new engineer opens `README.md`, picks by intent, and the IA carries them.
- The C4 section can be defended to an enterprise client or auditor without restructuring the rest of the site.
- Codegen for reference material becomes natural — reference is a folder, not scattered across topic folders.
- The mode of each doc is in the frontmatter, so the linter can enforce folder/mode alignment.

Negative:

- The first 2 weeks require re-tagging ~15 existing docs.
- The "research" content (long-form Amazon AI analysis) is a poor fit for Diátaxis — explanation is the closest mode but still feels off. We accept this; the alternative is a fifth mode, which is complexity for one section.
- C4 and Diátaxis overlap at the architecture level. We resolve by saying: prose = explanation, diagrams = C4. No diagram-only doc exists without prose annotation.

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Keep numbered folders | Solves none of the three problems. |
| Pure Diátaxis | Architecture diagrams need a separate model; C4 is the de-facto standard. |
| Pure C4 | C4 stops at the system shape. It does not handle recipes, ADRs, or runbooks. |
| Mintlify / Docusaurus | Vendor lock-in and hosting cost, for a benefit (polish) we do not need for an internal site. |
| Add a fifth Diátaxis mode ("research") | Adds a category for one section's ergonomics. Not worth the rule complexity. |

## Notes

This is the first ADR. The pattern is: status, context, decision, consequences, alternatives, notes. Keep under 200 lines. Link, do not inline, the deep-dive in `10-explanation/`.
