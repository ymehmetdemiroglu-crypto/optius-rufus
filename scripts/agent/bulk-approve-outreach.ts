import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { and, eq, isNotNull, or, ilike } from "drizzle-orm";
import { approveAndEnroll } from "../../api/domains/prospect/service.js";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const args = process.argv.slice(2);
  const DRY_RUN = args.includes("--dry-run");
  const limitArg = args.find(a => a.startsWith("--limit="))?.split("=")[1] || "10";
  const LIMIT = parseInt(limitArg, 10);
  const sequenceId = process.env.APOLLO_REPLY_SEQUENCE_ID || "6a38e400a82e22001cd289df";

  console.log("=================================================");
  console.log("🚀 BULK OUTREACH APPROVAL & ENROLLMENT");
  console.log(`Target Limit: ${LIMIT}`);
  console.log(`Dry Run Mode: ${DRY_RUN ? "ENABLED" : "DISABLED"}`);
  console.log(`Sequence ID:  ${sequenceId}`);
  console.log("=================================================");

  try {
    const targets = await db
      .select({
        id: schema.prospects.id,
        company: schema.prospects.company,
        firstName: schema.prospects.firstName,
        lastName: schema.prospects.lastName,
        asin: schema.prospects.asin,
        apolloContactId: schema.prospects.apolloContactId,
      })
      .from(schema.prospects)
      .where(
        and(
          eq(schema.prospects.status, "drafted"),
          isNotNull(schema.prospects.asin),
          or(
            ilike(schema.prospects.company, "%supplement%"),
            ilike(schema.prospects.company, "%vitamin%"),
            ilike(schema.prospects.company, "%wellness%"),
            ilike(schema.prospects.company, "%nutrition%"),
            ilike(schema.prospects.company, "%organic%"),
            ilike(schema.prospects.company, "%health%"),
            ilike(schema.prospects.company, "%nutra%"),
            ilike(schema.prospects.company, "%herb%"),
            ilike(schema.prospects.company, "%oil%"),
            ilike(schema.prospects.company, "%gummy%"),
            ilike(schema.prospects.company, "%fusion%")
          )
        )
      )
      .orderBy(schema.prospects.id)
      .limit(LIMIT);

    console.log(`Found ${targets.length} prospects matching criteria.`);

    if (targets.length === 0) {
      console.log("🎉 No matching drafted prospects found.");
      return;
    }

    if (!DRY_RUN) {
      console.log("\n⚠️ WARNING: Starting enrollment in 5 seconds... Press Ctrl+C to cancel.");
      await sleep(5000);
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targets.length; i++) {
      const p = targets[i];
      const progress = `[${i + 1}/${targets.length}]`;
      console.log(`${progress} Processing: "${p.company}" (${p.firstName || ""} ${p.lastName || ""})`);
      console.log(`   ASIN: ${p.asin || "N/A"} | Contact ID: ${p.apolloContactId || "N/A"}`);

      if (DRY_RUN) {
        console.log("   [Dry-Run] Would approve and enroll contact in Apollo.");
        successCount++;
        continue;
      }

      try {
        await approveAndEnroll(p.id, sequenceId);
        console.log("   ✅ Successfully approved and enrolled!");
        successCount++;
        await sleep(1500); // delay to respect rate limit
      } catch (err: any) {
        console.error(`   ❌ Failed to enroll: ${err.message}`);
        failCount++;
      }
    }

    console.log("=================================================");
    console.log("📊 BULK ENROLLMENT COMPLETE");
    console.log(`- Enrolled: ${successCount}`);
    console.log(`- Failed:   ${failCount}`);
    console.log("=================================================");

  } catch (err: any) {
    console.error("❌ Fatal error:", err.message);
  }
}

run();
