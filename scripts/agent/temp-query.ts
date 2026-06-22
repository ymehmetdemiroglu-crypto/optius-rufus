import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { and, eq, isNotNull, not } from "drizzle-orm";

async function run() {
  try {
    const list = await db
      .select({
        id: schema.prospects.id,
        firstName: schema.prospects.firstName,
        lastName: schema.prospects.lastName,
        asin: schema.prospects.asin,
        status: schema.prospects.status,
        company: schema.prospects.company,
      })
      .from(schema.prospects)
      .where(
        and(
          isNotNull(schema.prospects.asin),
          not(eq(schema.prospects.asin, "N/A")),
          not(eq(schema.prospects.asin, ""))
        )
      )
      .limit(10);

    console.log("PROSPECTS_WITH_ASIN_RESULT:");
    console.log(JSON.stringify(list, null, 2));
  } catch (err) {
    console.error("Error querying:", err);
  }
}

run();
