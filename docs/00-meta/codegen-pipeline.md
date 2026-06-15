---
title: Codegen Pipeline
owner: "@yhia"
status: canonical
last_verified: 2026-06-10
diataxis_mode: reference
audience: engineering
---

# Codegen Pipeline

The drift-kill switch. The contract that says "this doc is generated from this code, and a human cannot have edited it." Anything that is hand-editable in code but readable in prose lives here.

## Why codegen

A hand-written tRPC procedure list rots the first time someone adds a procedure and forgets the doc. A hand-written DB schema drifts the first time a column is added. A hand-written env var table is wrong on day one.

Codegen eliminates the human in the middle for everything machine-readable. It is the only sustainable answer to drift at this team's size.

## What is generated

| Generated file | Source of truth | Script | Trigger |
|---|---|---|---|
| `30-reference/api/procedures.md` | `api/trpc/router.ts` (AST walk) | `scripts/codegen/trpc-md.ts` | pre-commit, CI |
| `30-reference/api/errors.md` | All `zod` schemas unioned | `scripts/codegen/zod-errors.ts` | CI nightly |
| `30-reference/database/schema.md` | `api/db/schema.ts` | `scripts/codegen/drizzle-md.ts` | pre-commit, CI |
| `30-reference/database/erd.mmd` | `api/db/schema.ts` | `scripts/codegen/drizzle-erd.ts` | pre-commit, CI |
| `30-reference/database/migrations.md` | `api/db/migrations/*.sql` | `scripts/codegen/migration-log.ts` | CI nightly |
| `30-reference/cli/scripts.md` | `package.json` `scripts` | `scripts/codegen/package-scripts.ts` | pre-commit, CI |
| `30-reference/env/variables.md` | `.env.example` | `scripts/codegen/env-table.ts` | pre-commit, CI |
| `30-reference/domain-catalog/README.md` | `api/domains/*/router.ts` exports | `scripts/codegen/domain-catalog.ts` | pre-commit, CI |
| `30-reference/pipeline-stages.md` | `api/pipeline/definitions.ts` | `scripts/codegen/pipeline-md.ts` | pre-commit, CI |
| `30-reference/ui-surfaces.md` | `src/{admin,landing,pages}/*` | `scripts/codegen/ui-fs.ts` | CI nightly |

## Generated-file marker

Every generated file starts with this exact HTML comment block. CI checks for it; the codegen script enforces it.

```markdown
<!-- codegen:source=<relative-path-to-source> -->
<!-- DO NOT EDIT — regenerate via `pnpm codegen:<script-name>` -->
```

A hand edit to a generated file is detected by the freshness check (see below) and the file is regenerated on the next run, losing the edit. **Do not edit generated files.**

## The drift-kill switch

Two checks together prevent drift:

1. **Freshness check** — the `last_verified` of a generated file must be ≥ the mtime of its source. If you changed `api/trpc/router.ts` and did not regenerate `30-reference/api/procedures.md`, CI fails.
2. **Forbidden-edit check** — `git diff` on a generated file in a PR fails the build. The PR author is told to re-run `pnpm docs:codegen` and amend the commit.

Together, these mean: **the only way to land a code change that should update a doc is to land the doc update in the same commit**.

## The codegen scripts

All scripts live in `scripts/codegen/`. They are plain Node ESM, no framework, no codegen DSL. They read the source, transform, and write markdown to stdout. A thin shell wrapper writes to the right file.

The standard shape of a codegen script:

```ts
// scripts/codegen/_shape.ts
import { readFile, writeFile } from "node:fs/promises";

export async function generate(sourcePath: string, targetPath: string, marker: string) {
  const source = await readFile(sourcePath, "utf8");
  const body = transform(source); // pure function
  const frontmatter = renderFrontmatter({ sourcePath, generatedAt: new Date() });
  const output = `${marker}\n${frontmatter}\n${body}\n`;
  await writeFile(targetPath, output);
}
```

Every script accepts a `--check` flag for CI: it exits non-zero if regeneration would change the file, zero otherwise. This is how CI enforces freshness.

## Local workflow

```bash
# regenerate all reference docs
pnpm docs:codegen

# regenerate a single doc
pnpm codegen:trpc          # → 30-reference/api/procedures.md
pnpm codegen:schema        # → 30-reference/database/schema.md
pnpm codegen:erd           # → 30-reference/database/erd.mmd
pnpm codegen:env           # → 30-reference/env/variables.md
pnpm codegen:scripts       # → 30-reference/cli/scripts.md
pnpm codegen:domains       # → 30-reference/domain-catalog/README.md
pnpm codegen:pipeline      # → 30-reference/pipeline-stages.md

# verify everything is fresh (CI-equivalent)
pnpm docs:codegen:check
```

A pre-commit hook runs `pnpm docs:codegen:check` and blocks the commit if regeneration would change anything. The commit then includes both the code change and the regenerated doc.

## What is NOT codegen

| Hand-written | Why |
|---|---|
| ADRs | Decisions have no machine-readable shape; the value is the prose. |
| Runbooks | Symptoms, causes, and remediations are tribal knowledge. |
| Product vision | Subjective; no code to derive from. |
| Architecture prose | Diagrams are Mermaid (code); the prose around them is judgment. |
| Recipes (how-to) | Each recipe encodes a decision about *which* commands matter. |

## Adding a new codegen target

1. Write the script in `scripts/codegen/`. The shape is: read source, transform, emit markdown with marker + frontmatter.
2. Add a `pnpm codegen:<name>` script to `package.json`.
3. Add the target to the matrix in this file.
4. Add the freshness check in `scripts/lint/codegen-freshness.ts`.
5. Open a PR. CI will validate end-to-end.

## Related

- [lint-rules.md](lint-rules.md) — what checks the freshness invariant
- [frontmatter-spec.md](frontmatter-spec.md) — the `generated: true` field
- [documentation-policy.md](documentation-policy.md) — the SSOT principle this implements
