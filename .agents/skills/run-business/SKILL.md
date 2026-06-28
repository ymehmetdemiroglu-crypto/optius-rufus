---
name: run-business
description: Coordinate the background daemon, prospect ingestion, AI analysis pipeline, Apollo outreach, Telegram approvals, and token budget reports
---

# run-business Skill

This is the master coordination skill for running the entire Optimus Rufus listing optimization business. It orchestrates system health, prospecting, outbox queue validation, customer reply re-auditing, Telegram approval interactions, and cost-control reports.

## System Dependencies & Architecture

The business relies on a multi-layered local stack:
1. **Docker Desktop & Compose**: Runs Postgres (data store) and Qdrant (vector db for Cosmo/Rufus semantic queries).
2. **PM2 Process Manager**: Manages `optimus-rufus-daemon`, which runs the web server, worker queues (BullMQ/Redis or database-backed), and long-polling Telegram bot update listener.
3. **Cloudflare Tunnel (Optional/Public)**: Provides public URLs for generated PDFs and webhook endpoints from Apollo.io.
4. **Apollo.io API**: Syncs leads, reads replies (via webhook), updates contact custom fields, and handles email sequence outreach.
5. **Telegram Bot**: Acts as the human-in-the-loop control center for system updates and manual audit reply approvals.

---

## Operational Execution Loop (Run Checklist)

Whenever the agent is invoked to run the business (e.g. every 6 hours), it must complete the following steps in sequence:

### Step 1: Health & Auto-Healing Check
Verify that the server and all backing services are online:
1. Run the health script:
   ```bash
   npx tsx scripts/agent/health.ts
   ```
2. If status is `🔴 OFFLINE` or databases are down, run the auto-healing script:
   ```bash
   npx tsx scripts/agent/auto-heal.ts
   ```
3. If auto-healing fails, inspect PM2 logs:
   ```bash
   pm2 status
   pm2 logs optimus-rufus-daemon --lines 50
   ```
   Report failure immediately to Telegram/User.

### Step 2: Queue & Job Status Audit
Inspect the background queue to check for stalled or failing processes:
1. Inspect active, pending, and failed queues:
   ```bash
   npx tsx scripts/agent/queue-status.ts
   ```
2. If failed jobs are detected, fetch details of the last 10 failures:
   ```bash
   npx tsx scripts/agent/list-jobs.ts --status=failed --limit=10
   ```
3. If failures are due to transient API issues (e.g., Anthropic/OpenAI rate limits, Apify proxy rotation errors), bulk-retry them:
   ```bash
   npx tsx scripts/agent/retry-all-failed.ts --queue=pipeline
   ```

### Step 3: Prospect Lifecycle & Outreach Sync
Track prospects moving through the pipeline and ensure Apollo.io sequences are populated correctly:
1. **New Prospects**: Check if new prospects are enqueued:
   ```bash
   npx tsx scripts/agent/list-prospects.ts --status=new --limit=10
   ```
   *Note: The daemon auto-scans every 60s and enqueues these into the `scrape-and-audit` pipeline. If stuck, trigger manually:*
   ```bash
   npx tsx scripts/agent/trigger-pipeline.ts --prospect-id=<id> --asin=<asin>
   ```
2. **Drafted (Analyzed) Prospects**: Verify that qualified leads are enrolling:
   ```bash
   npx tsx scripts/agent/list-prospects.ts --status=drafted --limit=10
   ```
   *Note: The daemon auto-enrolls prospects with a Rufus score < 80 in their respective revenue-tier sequence. High-score listings (>= 80) are filtered to `completed`. Verify this is happening smoothly.*

### Step 4: Webhook & Telegram Reply Approvals
Check if any contacts have replied and need follow-up PDF reports sent:
1. Look for prospects in reply status:
   ```bash
   npx tsx scripts/agent/list-prospects.ts --status=reply_audit_ready --limit=10
   npx tsx scripts/agent/list-prospects.ts --status=reply_telegram_sent --limit=10
   ```
2. **Auto-handling review**:
   - `reply_audit_ready` prospects should automatically have a PDF generated and sent to Telegram.
   - If they are stuck in `reply_telegram_sent`, it means the Telegram buttons are active, waiting for the user's manual "Approve & Send" or "Discard" callback query.
   - If a prospect is stuck in `reply_audit_ready` due to a PDF generation error (e.g., Puppeteer crash or network error), analyze logs and regenerate manually.

### Step 5: Financials & Token Budgets
Keep API token and scraping costs in check:
1. Run the monthly cost analytics report:
   ```bash
   npx tsx scripts/agent/cost-report.ts
   ```
2. Inspect if any prospect has exceeded their usage cap or if global API usage is scaling too quickly. Include a brief summary of spent budget vs remaining budget in the execution report.

---

## Troubleshooting Playbooks

### Playbook A: Puppeteer PDF Engine Fails
If PDF generation crashes, it is usually because Chrome is missing dependencies or the local web server is not resolving on `http://127.0.0.1:3000`.
- Verify the Hono server is accessible: `curl http://127.0.0.1:3000/api/pdf-report/<slug>`
- Check Puppeteer configuration in `api/infra/pdf.ts`.

### Playbook B: Apollo Custom Fields Sync Failures
If syncing scores to Apollo custom fields fails:
- Check `.env` for valid custom field keys (`APOLLO_FIELD_RUFUS_SCORE`, etc.).
- Ensure `APOLLO_API_KEY` is set and valid.
- Run `npx tsx scripts/agent/diagnostics.ts` to test third-party connection states.

### Playbook C: Telegram Bot Polling Stopped
If Telegram commands (`/status`, `/audit`) do not respond:
- Check PM2 process list: `pm2 status`
- Look for bot polling errors in logs: `pm2 logs`
- Ensure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` match the configuration.
