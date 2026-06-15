<!-- codegen:source=package.json -->
<!-- DO NOT EDIT — regenerate via `pnpm codegen:scripts` -->
---
title: CLI Scripts
owner: "@yhia"
status: canonical
last_verified: 2026-06-10
diataxis_mode: reference
audience: engineering
generated: true
codegen_source: package.json
---

# CLI Scripts

Every script exposed by the root `package.json`. Regenerate with `pnpm codegen:scripts`.

| Name | Command | Description |
|---|---|---|
| `build` | `vite build && tsc -p tsconfig.server.json` | Build the project for production. |
| `build:client` | `vite build` | Build the frontend bundle with Vite. |
| `build:server` | `tsc -p tsconfig.server.json` | Compile the server TypeScript. |
| `check` | `tsc --noEmit` | Run the TypeScript type-check (no emit). |
| `codegen:domains` | `tsx scripts/codegen/domain-catalog.ts --write` | Regenerate the domain-catalog index. |
| `codegen:env` | `tsx scripts/codegen/env-table.ts --write` | Regenerate the env-vars table. |
| `codegen:scripts` | `tsx scripts/codegen/package-scripts.ts --write` | Regenerate the package-scripts table. |
| `dev` | `vite` | Start the dev server in watch mode. |
| `dev:client` | `vite` | Run the Vite dev server for the frontend. |
| `dev:server` | `tsx api/boot.ts` | Run the API server via tsx. |
| `docs:check` | `pnpm docs:lint && pnpm docs:frontmatter && pnpm docs:codegen:check && pnpm docs:stale` | Run all docs checks (fail-fast). |
| `docs:codegen` | `tsx scripts/codegen/package-scripts.ts --write && tsx scripts/codegen/env-table.ts --write && tsx scripts/codegen/domain-catalog.ts --write` | Regenerate all codegen-produced docs. |
| `docs:codegen:check` | `tsx scripts/codegen/package-scripts.ts --check && tsx scripts/codegen/env-table.ts --check && tsx scripts/codegen/domain-catalog.ts --check` | Verify codegen output is fresh (CI gate). |
| `docs:drift` | `tsx scripts/lint/api-drift-check.ts` | Check for API/schema/env drift in this PR. |
| `docs:frontmatter` | `tsx scripts/lint/frontmatter-validator.ts` | Validate frontmatter on every doc. |
| `docs:lint` | `markdownlint 'docs/**/*.md' && markdown-link-check docs/**/*.md` | Lint all docs (markdownlint + link-check). |
| `docs:stale` | `tsx scripts/lint/staleness-check.ts` | Report docs that are stale (last_verified > 180d). |
| `lint` | `eslint .` | Run the linter (ESLint). |
| `test` | `vitest run` | Run the test suite once (Vitest). |
