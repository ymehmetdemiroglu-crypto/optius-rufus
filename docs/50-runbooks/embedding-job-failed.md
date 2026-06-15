---
title: Embedding job failed
owner: "@yhia"
status: draft
last_verified: 2026-06-10
diataxis_mode: how-to
audience: engineering
severity: medium
---

# Embedding job failed

> **Stub.** The `embedding` stage of the pipeline failed repeatedly. Usually an OpenAI 429 or 5xx.

## Symptom

Pipeline jobs fail at the `embedding` stage with a 4xx/5xx from `api.openai.com`.

## Likely cause

| Cause | Indicator |
|---|---|
| OpenAI rate limit | 429 in Sentry breadcrumbs |
| Invalid `OPENAI_API_KEY` | 401 in Sentry |
| Network blip | Single failure, succeeded on retry |

## Fix (planned)

1. Confirm the cause in Sentry: filter on `embedding` stage errors in the last hour.
2. If 429: back off (the executor already has exponential backoff; check it fired), then resume the job with `pipeline.resume({ jobId, fromStage: "embedding" })`.
3. If 401: rotate `OPENAI_API_KEY` in the deployment env, restart the server, resume.
4. If persistent: degrade by skipping the embedding stage and marking the analysis as `partial`.

## Verify

```bash
pnpm exec tsx scripts/debug-embedding.ts --job <id>
```

## Related

- [Pipeline stages reference](../30-reference/pipeline-stages.md)
- [Env vars reference](../30-reference/env/variables.md)
