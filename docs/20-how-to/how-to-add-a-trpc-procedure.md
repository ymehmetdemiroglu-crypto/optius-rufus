---
title: How to add a tRPC procedure
owner: "@yhia"
status: draft
last_verified: 2026-06-10
diataxis_mode: how-to
audience: engineering
estimated_time: 10m
---

# How to add a tRPC procedure

> **Stub.** A procedure is a `.query()` or `.mutation()` call inside a domain subrouter. This recipe covers input validation, auth context, and the codegen step that updates the reference.

## Steps (planned)

1. In `api/domains/<name>/router.ts`, add the procedure inside the `router({...})` block.
2. Define a Zod input schema; the procedure's input type is inferred.
3. Use the right procedure base from `api/trpc/procedures.ts` (`publicProcedure`, `authedProcedure`, etc.).
4. If the procedure needs a new DB table, follow [how-to-add-a-domain.md](how-to-add-a-domain.md).
5. Run `pnpm codegen:trpc --check` (when written) to confirm the procedure list is fresh.

## Verify

```bash
pnpm codegen:trpc --check
```

The check exits 0 if the new procedure appears in the table; 1 otherwise.

## Related

- [tRPC procedures reference](../30-reference/api/procedures.md) — codegen target
- [Domain catalog](../30-reference/domain-catalog/README.md) — where the new procedure lives
