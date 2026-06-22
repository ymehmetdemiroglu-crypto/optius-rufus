import { loadEnv } from "../scripts/agent/envLoader.js";
loadEnv();

import { db } from "../api/db/drizzle.js";
import * as schema from "../api/db/schema.js";
import { and, eq, isNotNull, ne } from "drizzle-orm";

async function run() {
  try {
    const list = await db
      .select()
      .from(schema.prospects)
      .where(
        and(
          eq(schema.prospects.status, "new"),
          isNotNull(schema.prospects.asin),
          ne(schema.prospects.asin, "")
        )
      )
      .limit(10);

    console.log(`Found ${list.length} new prospects with ASINs:`);
    for (const p of list) {
      console.log(`ID: ${p.id}, Name: ${p.firstName} ${p.lastName}, ASIN: ${p.asin}, Status: ${p.status}`);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
