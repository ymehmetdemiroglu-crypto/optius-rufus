import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import { sql } from "drizzle-orm";

async function run() {
  const port = process.env.PORT || "3000";
  const url = `http://127.0.0.1:${port}/health`;

  console.log(`\n🔍 Checking Optimus Rufus Daemon Health...\n`);

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json() as any;

    console.log(`Status:      🟢 ONLINE`);
    console.log(`Version:     ${data.version}`);
    console.log(`Uptime:      ${(data.uptime / 3600).toFixed(2)} hours`);
    console.log(`Database:    🟢 ${data.database.toUpperCase()}`);
    console.log(`Memory:      RSS: ${data.memory.rss}, Heap: ${data.memory.heapUsed}/${data.memory.heapTotal}`);
    
    console.log(`\n👷 Workers:`);
    console.log(`  Queue Worker:   ${data.workers.queueWorker === "running" ? "🟢 RUNNING" : "🔴 STOPPED"}`);
    console.log(`  Webhook Worker: ${data.workers.webhookWorker === "running" ? "🟢 RUNNING" : "🔴 STOPPED"}`);

    console.log(`\n⚡ Circuit Breakers:`);
    const breakers = Object.entries(data.circuitBreakers || {});
    if (breakers.length === 0) {
      console.log(`  No breakers initialized yet`);
    } else {
      for (const [name, state] of breakers) {
        const statusEmoji = state === "closed" ? "🟢 CLOSED (OK)" : state === "open" ? "🔴 OPEN (TRIPPED)" : "🟡 HALF-OPEN";
        console.log(`  ${name}: ${statusEmoji}`);
      }
    }

    console.log(`\n📊 Queue Depths:`);
    const queues = Object.entries(data.queues || {});
    if (queues.length === 0) {
      console.log(`  All queues empty`);
    } else {
      for (const [qName, qStats] of queues) {
        console.log(`  Queue [${qName}]:`);
        for (const [status, count] of Object.entries(qStats as any)) {
          console.log(`    - ${status}: ${count}`);
        }
      }
    }
    console.log("");
  } catch (err) {
    console.log(`Status:      🔴 OFFLINE (${(err as Error).message})`);
    console.log(`API URL:     ${url}`);
    
    try {
      await db.execute(sql`SELECT 1`);
      console.log(`Database:    🟢 REACHABLE (Direct connection OK)`);
    } catch (dbErr) {
      console.log(`Database:    🔴 UNREACHABLE (${(dbErr as Error).message})`);
    }

    if (process.argv.includes("--heal")) {
      console.log("\n🔄 Unhealthy status detected with --heal flag. Initiating auto-heal...");
      try {
        const { execSync } = await import("child_process");
        execSync("npx tsx scripts/agent/auto-heal.ts", { stdio: "inherit" });
      } catch (healErr) {
        console.error("❌ Auto-heal execution failed:", healErr);
      }
    } else {
      console.log(`\n❌ Could not connect to the running daemon. Check if it is started via PM2 or Docker.`);
      console.log(`   Command to start (Docker): docker compose up -d`);
      console.log(`   Command to start (PM2): npm run daemon:start\n`);
    }
  }
}

run();
