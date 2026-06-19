---
name: prospect-lifecycle
description: Walk through the full prospect pipeline from search to outreach
---

# prospect-lifecycle Workflow

Follow this workflow to ingest a prospect, run an analysis, verify their scores, and enroll them in outreach sequences.

## Steps

1. **Ingest / Fetch Target Leads**
   Find or verify the target prospect is in the database:
   ```bash
   npx tsx scripts/agent/list-prospects.ts --status=new --limit=10
   ```
   Note the `ID` and `ASIN` of the prospect you wish to analyze.

2. **Trigger Listing Analysis Pipeline**
   Submit the prospect's ASIN to the scraping and analysis queue:
   ```bash
   npx tsx scripts/agent/trigger-pipeline.ts --prospect-id=<id> --asin=<asin>
   ```
   Note the generated Job ID.

3. **Monitor Queue Progress**
   Check if the job has completed:
   ```bash
   npx tsx scripts/agent/queue-status.ts
   ```
   Or inspect the status of that specific job ID:
   ```bash
   npx tsx scripts/agent/list-jobs.ts --limit=5
   ```

4. **Verify Scores & Audit Report**
   Once the job status is `completed`, query the prospect details:
   ```bash
   npx tsx scripts/agent/prospect-detail.ts --id=<id>
   ```
   Inspect the calculated overall, Rufus, Cosmo, and semantic scores. Verify that outreach copy has been generated in the `Outreach Emails` field.

5. **Approve and Enroll**
   If scores and copy look correct, enroll the contact in the corresponding sequence:
   ```bash
   npx tsx scripts/agent/approve-outreach.ts --id=<id>
   ```
   This updates the prospect status to `emailed` and pushes the contact into Apollo.
