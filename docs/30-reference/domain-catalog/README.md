<!-- codegen:source=api/domains/*/router.ts -->
<!-- DO NOT EDIT — regenerate via `pnpm codegen:domains` -->
---
title: Domain Catalog
owner: "@yhia"
status: canonical
last_verified: 2026-06-10
diataxis_mode: reference
audience: engineering
generated: true
codegen_source: api/domains/*/router.ts
---

# Domain Catalog

One row per tRPC domain in `api/domains/`. Regenerate with `pnpm codegen:domains`.

| Domain | Source file | File lines | Router lines | Queries | Mutations |
|---|---|---:|---:|---:|---:|
| `analysis` | `api/domains/analysis/router.ts` | 30 | 24 | 1 | 3 |
| `apollo` | `api/domains/apollo/router.ts` | 69 | 62 | 1 | 2 |
| `booking` | `api/domains/booking/router.ts` | 28 | 22 | 1 | 1 |
| `branding` | `api/domains/branding/router.ts` | 51 | 45 | 1 | 1 |
| `catalog` | `api/domains/catalog/router.ts` | 86 | 76 | 1 | 0 |
| `listing` | `api/domains/listing/router.ts` | 98 | 90 | 0 | 3 |
| `optimization` | `api/domains/optimization/router.ts` | 93 | 79 | 2 | 2 |
| `ppc` | `api/domains/ppc/router.ts` | 61 | 54 | 1 | 1 |
| `prospect` | `api/domains/prospect/router.ts` | 80 | 74 | 3 | 4 |
| `rufus` | `api/domains/rufus/router.ts` | 110 | 101 | 1 | 1 |

## Per-domain notes

### `analysis`

- Router export: `analysisRouter`
- Source: `api/domains/analysis/router.ts`
- Procedures: 4 (1 queries, 3 mutations)
- Router body spans 24 lines of a 30-line file.

### `apollo`

- Router export: `apolloRouter`
- Source: `api/domains/apollo/router.ts`
- Procedures: 3 (1 queries, 2 mutations)
- Router body spans 62 lines of a 69-line file.

### `booking`

- Router export: `bookingRouter`
- Source: `api/domains/booking/router.ts`
- Procedures: 2 (1 queries, 1 mutations)
- Router body spans 22 lines of a 28-line file.

### `branding`

- Router export: `brandingRouter`
- Source: `api/domains/branding/router.ts`
- Procedures: 2 (1 queries, 1 mutations)
- Router body spans 45 lines of a 51-line file.

### `catalog`

- Router export: `catalogGraphRouter`
- Source: `api/domains/catalog/router.ts`
- Procedures: 1 (1 queries, 0 mutations)
- Router body spans 76 lines of a 86-line file.

### `listing`

- Router export: `scraperRouter`
- Source: `api/domains/listing/router.ts`
- Procedures: 3 (0 queries, 3 mutations)
- Router body spans 90 lines of a 98-line file.

### `optimization`

- Router export: `agentsRouter`
- Source: `api/domains/optimization/router.ts`
- Procedures: 4 (2 queries, 2 mutations)
- Router body spans 79 lines of a 93-line file.

### `ppc`

- Router export: `ppcRouter`
- Source: `api/domains/ppc/router.ts`
- Procedures: 2 (1 queries, 1 mutations)
- Router body spans 54 lines of a 61-line file.

### `prospect`

- Router export: `prospectsRouter`
- Source: `api/domains/prospect/router.ts`
- Procedures: 7 (3 queries, 4 mutations)
- Router body spans 74 lines of a 80-line file.

### `rufus`

- Router export: `rufusTrackerRouter`
- Source: `api/domains/rufus/router.ts`
- Procedures: 2 (1 queries, 1 mutations)
- Router body spans 101 lines of a 110-line file.
