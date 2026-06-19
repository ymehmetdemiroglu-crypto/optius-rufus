import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { eq } from "drizzle-orm";
import { pipelineQueue } from "../../api/infra/queue.js";

async function run() {
  const args = process.argv.slice(2);
  let prospectId: number | undefined = undefined;
  let asin: string | undefined = undefined;
  let marketplace = "US";

  for (const arg of args) {
    if (arg.startsWith("--prospect-id=")) {
      prospectId = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--asin=")) {
      asin = arg.split("=")[1];
    } else if (arg.startsWith("--marketplace=")) {
      marketplace = arg.split("=")[1];
    }
  }

  if (!prospectId || !asin) {
    console.error("\n❌ Error: Missing required options.");
    console.error("Usage: node scripts/agent/trigger-pipeline.ts --prospect-id=<id> --asin=<asin> [--marketplace=<marketplace>]\n");
    process.exit(1);
  }

  console.log(`\n🚀 Triggering listing optimization pipeline...`);
  console.log(`   Prospect ID: ${prospectId}`);
  console.log(`   ASIN:        ${asin}`);
  console.log(`   Marketplace: ${marketplace}\n`);

  try {
    const prospect = await db
      .select()
      .from(schema.prospects)
      .where(eq(schema.prospects.id, prospectId))
      .limit(1);

    if (prospect.length === 0) {
      console.error(`❌ Error: Prospect with ID ${prospectId} not found in database.\n`);
      process.exit(1);
    }

    await db
      .update(schema.prospects)
      .set({ status: "analyzing" })
      .where(eq(schema.prospects.id, prospectId));

    const job = await pipelineQueue.add("scrape-and-audit", {
      prospectId,
      asin,
      marketplace,
    });

    console.log(`✅ Job enqueued successfully!`);
    console.log(`   Job ID: ${job.id}`);
    console.log(`   Status: pending`);
    console.log(`   Queue:  pipeline`);
    console.log(`   Note:   You can monitor its status using health.js or queue-status.js\n`);

  } catch (err) {
    console.error(`❌ Failed to trigger pipeline:`, (err as Error).message);
  }
}

run();
