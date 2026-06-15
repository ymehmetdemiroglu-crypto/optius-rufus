---
title: Lint Rules
owner: "@yhia"
status: canonical
last_verified: 2026-06-10
diataxis_mode: reference
audience: engineering
---

# Lint Rules

Every check that runs against the docs site in CI. Each rule has a clear failure mode and a clear fix. No "warnings" — either the build fails, or it does not.

## Rule matrix

| ID | Name | Tool | Failure mode | Fix |
|---|---|---|---|---|
| MD001 | Heading levels increment by one | `markdownlint` | build fails | Re-order headings. |
| MD003 | Heading style is ATX (`#`) | `markdownlint` | build fails | Convert Setext to ATX. |
| MD004 | Unordered list style is `-` | `markdownlint` | build fails | Normalize to `-`. |
| MD007 | UL indent is 2 spaces | `markdownlint` | build fails | Re-indent. |
| MD024 | No duplicate headings (siblings) | `markdownlint` | build fails | Disambiguate. |
| MD025 | One H1 per file | `markdownlint` | build fails | Keep only the first H1. |
| MD041 | First content line is H1 | `markdownlint` | build fails | Add a top-level heading. |
| LNK | All internal links resolve | `markdown-link-check` | build fails | Fix the path or create the target. |
| FM-REQ | Frontmatter has all required fields | `scripts/lint/frontmatter-validator.ts` | build fails | Fill the missing field. |
| FM-TYPE | Frontmatter field types are correct | `scripts/lint/frontmatter-validator.ts` | build fails | Coerce to the spec. |
| FM-H1 | `title` matches the H1 | `scripts/lint/frontmatter-validator.ts` | build fails | Match the H1 to the title. |
| FM-C4 | `c4_level` is only set in `40-architecture/` | `scripts/lint/frontmatter-validator.ts` | build fails | Move the doc or remove the field. |
| FM-GEN | Files with `generated: true` have the codegen marker | `scripts/lint/frontmatter-validator.ts` | build fails | Re-run codegen. |
| STALE | `last_verified` ≤ 180 days | `scripts/lint/staleness-check.ts` | PR warning | Re-verify the doc, or retire. |
| FRESH | Generated files are not older than their source | `scripts/lint/codegen-freshness.ts` | build fails | `pnpm docs:codegen` |
| EDIT-GEN | No human edits to generated files | `scripts/lint/forbidden-edit.ts` | build fails | Re-run codegen, amend commit. |
| API-DRIFT | PR touches `api/**` and `docs/30-reference/**` together | `scripts/lint/api-drift-check.ts` | PR warning | If the change adds a procedure, update the ref doc. |
| SCHEMA-DRIFT | PR touches `api/db/schema.ts` and `30-reference/database/` together | `scripts/lint/schema-drift-check.ts` | PR warning | If the change adds a table/column, update the schema doc. |
| ENV-DRIFT | PR touches `.env.example` and `30-reference/env/variables.md` together | `scripts/lint/env-drift-check.ts` | PR warning | Codegen should have done this; check the marker. |

`build fails` = red X on the PR, merge blocked. `PR warning` = yellow, merge allowed, bot posts a reminder.

## What is not checked (yet)

- Prose quality. We do not run Vale or any opinionated style linter. Add it later if a real consistency problem appears.
- Link targets inside generated Mermaid diagrams. We do not render Mermaid in CI.
- Cross-repo links. The site has no external deps.

## Local commands

```bash
pnpm docs:lint          # markdownlint + link-check
pnpm docs:frontmatter   # frontmatter validator
pnpm docs:stale         # staleness check
pnpm docs:codegen:check # freshness + forbidden-edit
pnpm docs:check         # everything, in order, fail-fast
```

`pnpm docs:check` is the pre-merge gate. Run it locally before opening a PR.

## Where the rules live

| Concern | File |
|---|---|
| Markdown structure | `docs/.markdownlint.json` |
| Link integrity | `docs/.markdown-link-check.json` |
| Frontmatter | `scripts/lint/frontmatter-validator.ts` |
| Staleness | `scripts/lint/staleness-check.ts` |
| Codegen freshness | `scripts/lint/codegen-freshness.ts` |
| Drift checks | `scripts/lint/api-drift-check.ts`, `scripts/lint/schema-drift-check.ts`, `scripts/lint/env-drift-check.ts` |
| CI orchestration | `.github/workflows/docs.yml` |
| Pre-commit | `.husky/pre-commit` (runs `pnpm docs:check`) |

## Why we do not use "warnings only"

A docs site with warnings is a docs site that decays. Every rule here was added after a real incident (a procedure added without a doc, an env var renamed without a note, a heading level skipped, a broken link). The cost of CI is the price of the lesson.

## Adding a new rule

1. Add the check to a script in `scripts/lint/`.
2. Add the rule to the matrix in this file.
3. Add a job to `.github/workflows/docs.yml`.
4. Document the fix in the failure message — the reader of the failure is the author, not you.
5. Open the PR. The first run will fail on existing content; fix the content in the same PR.

## Related

- [frontmatter-spec.md](frontmatter-spec.md) — the contract the frontmatter rules enforce
- [codegen-pipeline.md](codegen-pipeline.md) — the SSOT machinery the freshness rule protects
- [CONTRIBUTING.md](../CONTRIBUTING.md) — what to run before opening a PR
