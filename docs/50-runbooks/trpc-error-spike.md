---
title: tRPC error spike
owner: "@yhia"
status: draft
last_verified: 2026-06-10
diataxis_mode: how-to
audience: engineering
severity: medium
---

# tRPC error spike

> **Stub.** Sentry alerts on tRPC 4xx/5xx rate above baseline.

## Symptom

Sentry fires a `tRPC error rate` alert; the rate is `>` 2x the trailing 7-day median for any single procedure.

## Likely cause

| Cause | Indicator |
|---|---|
| Bad deploy | Errors started at deploy time |
| Upstream (OpenAI / Paddle / Amazon) degraded | Same 5xx across multiple procedures |
| Auth misconfig | New 401s only |

## Fix (planned)

1. Check `vercel logs` or PM2 logs for the deploy timestamp.
2. If deploy-correlated: rollback (`vercel rollback` or PM2 restart with previous artifact).
3. If upstream: pause inbound traffic by setting the `inbound_pause` flag in `optimization` config; wait for upstream to recover.
4. If auth: check `KIMI_AUTH_CLIENT_SECRET` rotation timing.

## Verify

```bash
curl -s http://localhost:3000/api/trpc/listing.health
```

Returns 200 with no error.

## Related

- [Env vars reference](../30-reference/env/variables.md)
