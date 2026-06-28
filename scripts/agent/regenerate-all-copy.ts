import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { and, eq, or, isNotNull } from "drizzle-orm";
import { generateOutreachCopy } from "../../api/domains/prospect/outreach.js";
import * as prospectRepo from "../../api/domains/prospect/repository.js";

async function run() {
  console.log("⚡ Starting regeneration of all outreach email copies...");

  try {
    const prospects = await db
      .select({ id: schema.prospects.id, company: schema.prospects.company })
      .from(schema.prospects)
      .where(
        and(
          or(
            eq(schema.prospects.status, "drafted"),
            eq(schema.prospects.status, "emailed")
          ),
          isNotNull(schema.prospects.outreachEmails)
        )
      );

    console.log(`Found ${prospects.length} prospects to update.`);

    let successCount = 0;
    const batchSize = 100;

    for (let i = 0; i < prospects.length; i++) {
      const p = prospects[i];
      
      try {
        const copy = await generateOutreachCopy(p.id);
        await prospectRepo.updateOutreachEmails(p.id, copy);
        successCount++;

        if (successCount % batchSize === 0 || successCount === prospects.length) {
          console.log(`[${successCount}/${prospects.length}] Completed...`);
        }
      } catch (err: any) {
        console.error(`❌ Failed for ${p.company} (ID: ${p.id}): ${err.message}`);
      }
    }

    console.log(`=========================================`);
    console.log(`✅ Regeneration Complete!`);
    console.log(`- Successfully updated: ${successCount}/${prospects.length}`);
    console.log(`=========================================`);

  } catch (err: any) {
    console.error("Fatal error:", err.message);
  }
}

run();
