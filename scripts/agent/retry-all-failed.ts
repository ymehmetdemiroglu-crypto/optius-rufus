import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { and, eq } from "drizzle-orm";

async function run() {
  const args = process.argv.slice(2);
  let queueFilter: string | undefined = undefined;
  for (const arg of args) {
    if (arg.startsWith("--queue=")) {
      queueFilter = arg.split("=")[1];
    }
  }

  console.log(`\n🔄 Bulk retrying failed jobs${queueFilter ? ` in queue [${queueFilter}]` : "" }...\n`);

  try {
    const conditions = [eq(schema.jobs.status, "failed")];
    if (queueFilter) {
      conditions.push(eq(schema.jobs.queue, queueFilter));
    }

    const list = await db
      .select({ id: schema.jobs.id })
      .from(schema.jobs)
      .where(and(...conditions));

    if (list.length === 0) {
      console.log("🟢 No failed jobs found matching criteria. Nothing to retry.\n");
      return;
    }

    await db
      .update(schema.jobs)
      .set({
        status: "pending",
        attempts: 0,
        failedReason: null,
        stacktraceJSON: [],
        processedOn: null,
        finishedOn: null,
      })
      .where(and(...conditions));

    console.log(`✅ Successfully reset ${list.length} failed jobs back to 'pending'.\n`);

  } catch (err) {
    console.error(`❌ Failed to bulk retry jobs:`, (err as Error).message);
  }
}

run();
