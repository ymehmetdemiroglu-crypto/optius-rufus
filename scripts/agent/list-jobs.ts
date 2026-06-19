import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { and, eq, sql } from "drizzle-orm";

async function run() {
  const args = process.argv.slice(2);
  let statusFilter: string | undefined = undefined;
  let queueFilter: string | undefined = undefined;
  let limitFilter = 10;
  let jsonMode = false;

  for (const arg of args) {
    if (arg.startsWith("--status=")) {
      statusFilter = arg.split("=")[1];
    } else if (arg.startsWith("--queue=")) {
      queueFilter = arg.split("=")[1];
    } else if (arg.startsWith("--limit=")) {
      limitFilter = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--json") {
      jsonMode = true;
    }
  }

  try {
    const conditions = [];
    if (statusFilter) {
      conditions.push(eq(schema.jobs.status, statusFilter));
    }
    if (queueFilter) {
      conditions.push(eq(schema.jobs.queue, queueFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db
      .select({
        id: schema.jobs.id,
        queue: schema.jobs.queue,
        name: schema.jobs.name,
        status: schema.jobs.status,
        attempts: schema.jobs.attempts,
        maxAttempts: schema.jobs.maxAttempts,
        failedReason: schema.jobs.failedReason,
        timestamp: schema.jobs.timestamp,
        processedOn: schema.jobs.processedOn,
        finishedOn: schema.jobs.finishedOn,
      })
      .from(schema.jobs)
      .where(whereClause)
      .orderBy(sql`${schema.jobs.timestamp} DESC`)
      .limit(limitFilter);

    if (jsonMode) {
      console.log(JSON.stringify(list, null, 2));
      return;
    }

    console.log(`\n📋 Listing Jobs (Limit: ${limitFilter}, Status: ${statusFilter || "any"}, Queue: ${queueFilter || "any"})\n`);
    
    if (list.length === 0) {
      console.log("No jobs found matching criteria.\n");
      return;
    }

    for (const job of list) {
      const createdStr = new Date(job.timestamp).toLocaleString();
      const statusEmoji = {
        pending: "⏳",
        active: "🔄",
        completed: "🟢",
        failed: "🔴",
      }[job.status || "pending"] || "❓";

      console.log(`${statusEmoji} Job ID:   ${job.id}`);
      console.log(`  Queue:    ${job.queue}`);
      console.log(`  Name:     ${job.name}`);
      console.log(`  Status:   ${job.status}`);
      console.log(`  Attempts: ${job.attempts}/${job.maxAttempts}`);
      console.log(`  Created:  ${createdStr}`);
      if (job.failedReason) {
        console.log(`  Error:    ${job.failedReason}`);
      }
      console.log("-".repeat(40));
    }
    console.log("");
  } catch (err) {
    console.error(`❌ Failed to list jobs:`, (err as Error).message);
  }
}

run();
