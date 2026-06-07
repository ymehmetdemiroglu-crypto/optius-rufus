---
type: "query"
date: "2026-06-07T06:43:33.460193+00:00"
question: "Why does db connect Database and API Setup to Agent-based Data Fetching, Logging and Event Bus, Scraper and Router Execution, HTTP Server Setup, Pipeline Engine Core?"
contributor: "graphify"
source_nodes: ["db", "client.ts", "schema.ts", "runner.ts", "queue.ts", "engine.ts", "boot.ts"]
---

# Q: Why does db connect Database and API Setup to Agent-based Data Fetching, Logging and Event Bus, Scraper and Router Execution, HTTP Server Setup, Pipeline Engine Core?

## Answer

The node db (defined in api/db/client.ts) functions as the central data storage hub of the entire application. It acts as a cross-community bridge because almost every component requires reading or writing to the database: 1. Database and API Setup (Community 1): db is defined in client.ts (L49), is used by schema.ts (L1) and runner.ts (L4) to run migrations, and is imported by multiple tRPC routers to execute database queries. 2. Agent-based Data Fetching (Community 0): Used by agents like apifyFetcher.ts (L1) and pipeline stages like stages.ts (L13) to persist fetched Amazon listings. 3. Logging and Event Bus (Community 2): Imported in queue.ts (L1) (to run SQLiteJobQueue representing persistent queues) and tokenBudget.ts (L1) to query and track daily token expenditures. 4. Pipeline Engine Core (Community 12): Used by the orchestrator engine in engine.ts (L1) to load, store, and advance the state of long-running client audit pipelines. 5. HTTP Server Setup (Community 5): Imported by boot.ts (L12) to verify database health during the application boot process.

## Source Nodes

- db
- client.ts
- schema.ts
- runner.ts
- queue.ts
- engine.ts
- boot.ts