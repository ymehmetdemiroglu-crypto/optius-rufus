---
title: How to add a domain
owner: "@yhia"
status: draft
last_verified: 2026-06-10
diataxis_mode: how-to
audience: engineering
estimated_time: 15m
---

# How to add a domain

> **Stub.** A domain is a self-contained tRPC subrouter under `api/domains/<name>/`. This recipe walks through the eight files you touch and the one codegen step that confirms the catalog picks it up.

## Steps (planned)

1. Create `api/domains/<name>/router.ts` exporting `<name>Router = router({...})`.
2. Add a Zod input schema per procedure.
3. Wire the new router into `api/trpc/router.ts` (the root).
4. Add a DB table (if needed) in `api/db/schema.ts` and run `pnpm exec drizzle-kit push`.
5. Add the domain to the catalog with `pnpm codegen:domains` — the row appears automatically.
6. Add a `30-reference/api/procedures.md` entry (or regenerate when `codegen:trpc` is written).
7. Add a `50-runbooks/` entry if the domain has operational quirks.

## Verify

```bash
pnpm codegen:domains --check
```

The check exits 0 if the new domain appears in the catalog; 1 otherwise.

## Related

- [Domain catalog](../30-reference/domain-catalog/README.md) — what the codegen produces
- [Container model](../10-explanation/container-model.md) — where the domain fits
