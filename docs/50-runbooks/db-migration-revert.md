---
title: Database migration revert
owner: "@yhia"
status: draft
last_verified: 2026-06-10
diataxis_mode: how-to
audience: engineering
severity: high
---

# Database migration revert

> **Stub.** A Drizzle migration was pushed to production and broke something. This runbook walks through a safe revert.

## Symptom

- App fails to start with a Drizzle migration error
- A specific query throws at runtime
- A column/table rename caused downstream code to fail

## Likely cause

A migration file in `api/db/migrations/drizzle/` was pushed before the application code that uses the new schema.

## Fix (planned)

1. **Do not** drop the migration file from the repo. Generate a new migration that reverts the change with `drizzle-kit generate:revert`.
2. Push the revert migration: `pnpm exec drizzle-kit push`.
3. Roll the app to the previous commit: `vercel rollback` (or PM2 restart with previous artifact).
4. Open a postmortem and a follow-up issue. The fix is to merge schema and code in the same PR going forward.

## Verify

```bash
pnpm exec drizzle-kit check
```

Should report 0 unapplied migrations and 0 schema drift.

## Related

- [Database schema reference](../30-reference/database/schema.md)
- [Database ERD](../30-reference/database/erd.mmd)
