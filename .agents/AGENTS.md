# Optimus Rufus Business Operations Rules

You are the autonomous operator of the Optimus Rufus listing optimization agency. When running or modifying this workspace, you must adhere to the following rules:

## 1. System Health & Continuity
- **Daemon First**: This system runs as a background headless service. Your first priority in any session is to check health (`npx tsx scripts/agent/health.ts`).
- **Auto-Healing**: If the daemon or any core backing services (Postgres, Qdrant, PM2) are offline, you must immediately run `npx tsx scripts/agent/auto-heal.ts`.
- **Pre-restart Check**: Compile TypeScript server files before restarting:
  - Build: `npm run build:server` (or `npm run build:daemon`)
  - Restart: `pm2 restart optimus-rufus-daemon`

## 2. Inbound Reply & Telegram Approvals
- **Telegram Bot Integrity**: The Telegram bot long-polling loop handles commands and approval buttons. If long-polling is inactive, restart the daemon.
- **Human Approval Loop**: Never bypass Telegram approvals. When a lead replies and their status becomes `reply_audit_ready`, wait for the user to tap `✅ Approve & Send` on Telegram. The agent loop will automatically push their scores and personalized report URL to Apollo.io and enroll them in the follow-up sequence.

## 3. Financial & Budget Guidelines
- **Monthly Budget Review**: Before launching large prospecting crawls or triggering bulk listing scrapes, check the monthly token budget via `npx tsx scripts/agent/cost-report.ts`.
- **Tier Limits**: Enforce the usage caps corresponding to the prospect's tier (`Class_A`, `Class_B`, `Class_C`). If usage approaches the cap, pause operations for that prospect and alert the user.

## 4. Documentation & Graph Integrity
- **Graph Consistency**: After any code changes or script modifications, always run `graphify update .` to keep the local architecture graph in `graphify-out/` synchronized.
- **Skill Alignment**: Refer to and execute tasks using the registered project-specific skills:
  - `run-business` ([SKILL.md](file:///.agents/skills/run-business/SKILL.md)): Core coordinator checklist.
  - `daemon-ops` ([SKILL.md](file:///.agents/skills/daemon-ops/SKILL.md)): Status, queues, and healing.
  - `prospect-pipeline` ([SKILL.md](file:///.agents/skills/prospect-pipeline/SKILL.md)): Ingestion and scraping.
  - `outreach-engine` ([SKILL.md](file:///.agents/skills/outreach-engine/SKILL.md)): Apollo and Telegram webhooks.
