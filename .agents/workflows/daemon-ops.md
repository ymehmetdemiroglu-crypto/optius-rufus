---
name: daemon-ops
description: Check daemon health, inspect jobs, diagnose failures, and perform maintenance
---

# daemon-ops Workflow

Follow this workflow to monitor and maintain the background daemon and its workers.

## Steps

1. **Verify Daemon Health**
   Run the health checker:
   ```bash
   npx tsx scripts/agent/health.ts
   ```
   Check if:
   - Status is `🟢 ONLINE`.
   - Database is `🟢 OK`.
   - Workers are both `🟢 RUNNING`.
   - Circuit breakers are all `🟢 CLOSED`.

2. **Check Job Queue Stats**
   Run:
   ```bash
   npx tsx scripts/agent/queue-status.ts
   ```
   Inspect pending, active, and failed counts. Pay close attention if `Failed` counts are greater than 0.

3. **Inspect Recent Failures (If Any)**
   If failed jobs exist, retrieve details of the last 10 failed jobs:
   ```bash
   npx tsx scripts/agent/list-jobs.ts --status=failed --limit=10
   ```
   Analyze the `Error` field to understand why the jobs failed.

4. **Self-Heal or Retry**
   - **Transient issues**: If the failures were due to external API timeouts or temporary rate limits, retry all failed jobs:
     ```bash
     npx tsx scripts/agent/retry-all-failed.ts --queue=pipeline
     ```
   - **Specific job debug**: To retry a specific job after analyzing its error:
     ```bash
     npx tsx scripts/agent/retry-job.ts <jobId>
     ```

5. **Run System-Wide Diagnostics**
   If errors appear systemic (e.g. database connection down, all APIs failing), execute a diagnostic test:
   ```bash
   npx tsx scripts/agent/diagnostics.ts
   ```
   Verify keys, Docker, and disk spaces.

6. **Log Verification**
   Check the live logs of the running PM2 daemon:
   ```bash
   pm2 logs optimus-rufus-daemon --lines 50
   ```
