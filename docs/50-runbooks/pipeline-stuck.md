---
title: Pipeline stuck
owner: "@yhia"
status: draft
last_verified: 2026-06-10
diataxis_mode: how-to
audience: engineering
severity: medium
---

# Pipeline stuck

> **Stub.** A job that has been `running` for > 10 minutes is almost always stuck. This runbook walks through triage.

## Symptom

A prospect's analysis is in `running` state for longer than the expected wall-time (1–3 min for short ASINs, up to 10 min for catalog scans).

## Likely cause

| Cause | Indicator |
|---|---|
| Worker process died | No `started` event in last N minutes; `ps aux \| grep worker` returns nothing |
| Stage retry loop | Same stage retried > 3 times in `pipeline_events` |
| OpenAI rate limit | 429s in `optimization` domain logs |

## Fix (planned)

1. Check worker: `ps aux | grep tsx.*workers/bootstrap` on the host.
2. Check `pipeline_events` for the latest transition.
3. If worker is down, restart with `pnpm dev:server` (dev) or the PM2 process (prod).
4. If stage is looping, force-fail the job and re-trigger with `--resume-from <stage>`.

## Verify

```bash
curl -s http://localhost:3000/api/trpc/pipeline.status -d '{"input":{"json":{"jobId":"<id>"}}}'
```

`status` should transition from `running` to `succeeded` (or `failed` with a clear reason) within 2 minutes.

## Related

- [Pipeline stages reference](../30-reference/pipeline-stages.md)
