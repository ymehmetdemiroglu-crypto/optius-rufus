---
title: How to add a pipeline stage
owner: "@yhia"
status: draft
last_verified: 2026-06-10
diataxis_mode: how-to
audience: engineering
estimated_time: 20m
---

# How to add a pipeline stage

> **Stub.** A pipeline stage is a node in the DAG defined in `api/pipeline/definitions.ts`. This recipe covers stage definition, executor wiring, retry policy, and the codegen step.

## Steps (planned)

1. Add the stage to `STAGE_ORDER` in `api/pipeline/definitions.ts` with its `dependencies`.
2. Implement the executor in `api/pipeline/executors.ts` (typed input/output from `pipeline.types.ts`).
3. Add retry policy in `executeWithRetry.ts` if the stage is LLM-bound.
4. Add tests in `api/pipeline/__tests__/`.
5. Run `pnpm codegen:pipeline --check` (when written) to confirm the stage list is fresh.

## Verify

```bash
pnpm test -- pipeline
```

## Related

- [Pipeline stages reference](../30-reference/pipeline-stages.md)
- [Pipeline domain catalog entry](../30-reference/domain-catalog/README.md)
