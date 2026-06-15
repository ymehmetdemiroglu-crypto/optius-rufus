---
title: Runbooks
owner: "@yhia"
status: draft
last_verified: 2026-06-10
diataxis_mode: how-to
audience: engineering
---

# Runbooks

Operational recipes for incident response. Format: **symptom → likely cause → fix → verify**. Always end with a `Verify` section that gives a single command proving the fix worked.

| Runbook | Symptom | Status |
|---|---|---|
| [pipeline-stuck.md](pipeline-stuck.md) | A pipeline job has been `running` for > N minutes | stub |
| [embedding-job-failed.md](embedding-job-failed.md) | OpenAI embed call returns 429 / 5xx for a sustained period | stub |
| [db-migration-revert.md](db-migration-revert.md) | A Drizzle migration needs to be reverted in production | stub |
| [trpc-error-spike.md](trpc-error-spike.md) | Sentry alerts on tRPC 4xx/5xx rate | stub |
| [paddle-webhook-mismatch.md](paddle-webhook-mismatch.md) | Subscription state out of sync with Paddle | stub |

## How to add a runbook

1. Pick the symptom, not the system. Name files `symptom.md`, not `system.md`.
2. Use the same frontmatter contract as every other doc.
3. Lead with the `Symptom` table, then `Cause`, then `Fix`, then `Verify`.
4. The `Verify` block is a single command that proves the fix.
