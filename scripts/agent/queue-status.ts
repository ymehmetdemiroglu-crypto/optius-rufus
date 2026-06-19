import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { sql, eq, and } from "drizzle-orm";

async function run() {
  console.log(`\n📋 Querying Job Queue Status directly from database...\n`);

  try {
    const counts = await db
      .select({
        queue: schema.jobs.queue,
        status: schema.jobs.status,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.jobs)
      .groupBy(schema.jobs.queue, schema.jobs.status);

    const format: Record<string, Record<string, number>> = {};
    for (const r of counts) {
      const queueName = r.queue || "unknown";
      const statusName = r.status || "pending";
      if (!format[queueName]) format[queueName] = {};
      format[queueName][statusName] = r.count;
    }

    const allQueues = ["pipeline", "webhook"];
    for (const q of allQueues) {
      console.log(`Queue: [${q.toUpperCase()}]`);
      const qStats = format[q] || {};
      const pending = qStats["pending"] || 0;
      const active = qStats["active"] || 0;
      const completed = qStats["completed"] || 0;
      const failed = qStats["failed"] || 0;

      console.log(`  - Pending:   ${pending}`);
      console.log(`  - Active:    ${active}`);
      console.log(`  - Completed: ${completed}`);
      console.log(`  - Failed:    ${failed}`);

      if (pending > 0) {
        const oldest = await db
          .select({ timestamp: schema.jobs.timestamp })
          .from(schema.jobs)
          .where(and(eq(schema.jobs.queue, q), eq(schema.jobs.status, "pending")))
          .orderBy(schema.jobs.timestamp)
          .limit(1);
        if (oldest.length > 0) {
          const ageMs = Date.now() - oldest[0].timestamp;
          const ageSecStr = (ageMs / 1000).toFixed(0);
          console.log(`  - Oldest pending job age: ${ageSecStr}s`);
        }
      }
      console.log("");
    }

    const recentFailures = await db
      .select({
        id: schema.jobs.id,
        name: schema.jobs.name,
        queue: schema.jobs.queue,
        failedReason: schema.jobs.failedReason,
        finishedOn: schema.jobs.finishedOn,
      })
      .from(schema.jobs)
      .where(eq(schema.jobs.status, "failed"))
      .orderBy(sql`${schema.jobs.finishedOn} DESC`)
      .limit(5);

    if (recentFailures.length > 0) {
      console.log(`🚨 Recent Failures (Last 5):`);
      for (const f of recentFailures) {
        const dateStr = f.finishedOn ? new Date(Number(f.finishedOn)).toLocaleString() : "Unknown";
        console.log(`  - [${dateStr}] [${f.queue}] Job ${f.id} (${f.name})`);
        console.log(`    Error: ${f.failedReason || "Unknown"}`);
      }
      console.log("");
    } else {
      console.log(`🟢 No failed jobs in history.\n`);
    }

  } catch (err) {
    console.error(`❌ Failed to retrieve queue status:`, (err as Error).message);
  }
}

run();
