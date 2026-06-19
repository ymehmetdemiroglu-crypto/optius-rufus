import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { eq } from "drizzle-orm";

async function run() {
  const jobId = process.argv[2];
  if (!jobId) {
    console.error("\n❌ Error: Please specify a Job ID. Usage: node scripts/agent/retry-job.ts <jobId>\n");
    process.exit(1);
  }

  console.log(`\n🔄 Retrying job ${jobId}...\n`);

  try {
    const job = await db
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.id, jobId))
      .limit(1);

    if (job.length === 0) {
      console.error(`❌ Job ${jobId} not found in database.\n`);
      process.exit(1);
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
      .where(eq(schema.jobs.id, jobId));

    console.log(`✅ Job ${jobId} status reset to 'pending' with 0 attempts.`);
    console.log(`   It will be picked up by the Queue Worker shortly.\n`);

  } catch (err) {
    console.error(`❌ Failed to retry job:`, (err as Error).message);
  }
}

run();
