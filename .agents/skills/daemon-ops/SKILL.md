---
name: daemon-ops
description: Operate, monitor, troubleshoot, and heal the Optimus Rufus headless daemon
---

# daemon-ops Skill

Use this skill to operate, monitor, and maintain the headless background daemon for the Optimus Rufus listing optimization engine.

## When to Use
- Checking system status or server health.
- Diagnosing and debugging failed jobs.
- Inspecting queue sizes or job statuses.
- Restarting the daemon, workers, or individual jobs.
- Resetting circuit breakers.

## CLI Tools Reference

All commands are run using `tsx` or compiled Node scripts:

1. **Check Overall Health**
   `npx tsx scripts/agent/health.ts`
   Reports status, memory usage, uptime, worker states, and active queues.

2. **Inspect Job Queues**
   `npx tsx scripts/agent/queue-status.ts`
   Counts jobs by status per queue and shows recent failures.

3. **List Jobs**
   `npx tsx scripts/agent/list-jobs.ts --status=failed --limit=10 [--json]`
   Lists details of jobs with filtering.

4. **Retry Single Job**
   `npx tsx scripts/agent/retry-job.ts <jobId>`
   Resets a failed job to 'pending' state.

5. **Retry All Failed Jobs**
   `npx tsx scripts/agent/retry-all-failed.ts --queue=pipeline`
   Bulk resets failed jobs to 'pending' in the specified queue.

6. **Trigger Pipeline Analysis**
   `npx tsx scripts/agent/trigger-pipeline.ts --prospect-id=42 --asin=B07T7H5C5R [--marketplace=US]`
   Enqueues a scrape-and-audit job.

7. **List Prospects**
   `npx tsx scripts/agent/list-prospects.ts --status=drafted --limit=20`
   Lists prospects filtering by status.

8. **View Prospect Detail**
   `npx tsx scripts/agent/prospect-detail.ts --id=42`
   Shows prospect info, listing data, scores, bookings, and pipeline job history.

9. **Approve and Enroll in sequence**
   `npx tsx scripts/agent/approve-outreach.ts --id=42 [--sequence-id=abc123]`
   Enrolls prospect contact in Apollo sequence.

10. **Token Cost Analytics**
    `npx tsx scripts/agent/cost-report.ts [--prospect-id=42]`
    Displays token consumption and estimated cost grouped by service.

11. **Reset Circuit Breaker**
    `npx tsx scripts/agent/circuit-breakers.ts [--reset=llm-gateway]`
    Inspects or resets in-memory circuit breakers.

12. **Diagnostics Test**
    `npx tsx scripts/agent/diagnostics.ts`
    Performs full self-test of PostgreSQL, Docker, PM2, and disk space.

## Common Operational Playbooks

### Playbook 1: Daemon is OFFLINE
If `health.ts` reports status: 🔴 OFFLINE:
1. Run `pm2 status` to check if `optimus-rufus-daemon` is registered.
2. If it is stopped: `pm2 start optimus-rufus-daemon`
3. If it is not listed, run `npm run daemon:start` to bootstrap it.
4. Run `pm2 logs optimus-rufus-daemon` to inspect boot logs.

### Playbook 2: Pipeline Jobs are Failing
If `queue-status.ts` reports failed jobs:
1. List details and errors: `npx tsx scripts/agent/list-jobs.ts --status=failed`
2. Check if it is a transient API failure (e.g. rate limit, circuit breaker open).
3. If it is transient, run `npx tsx scripts/agent/retry-all-failed.ts --queue=pipeline`
4. If it continues failing, run `npx tsx scripts/agent/diagnostics.ts` to verify third-party API keys are valid.

### Playbook 3: LLM Circuit Breaker is Open
If LLM calls are throwing circuit breaker errors:
1. Check breaker state: `npx tsx scripts/agent/circuit-breakers.ts`
2. If Open, wait 2 minutes for recovery, or check if the LLM provider was down.
3. Once the API is stable, manually reset the breaker: `npx tsx scripts/agent/circuit-breakers.ts --reset=llm-gateway`
