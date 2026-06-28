import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { and, eq, isNotNull, not, sql, like, or, ilike, ne } from "drizzle-orm";

import { inArray } from "drizzle-orm";

import { syncCustomFieldsToApollo } from "../../api/domains/apollo/service.js";

import { getProspectById } from "../../api/domains/prospect/service.js";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { generateOutreachCopy } from "../../api/domains/prospect/outreach.js";

async function run() {
  try {
    const totalEmailed = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.prospects)
      .where(eq(schema.prospects.status, "emailed"));

    const withWebsite = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.prospects)
      .where(
        and(
          eq(schema.prospects.status, "emailed"),
          isNotNull(schema.prospects.websiteUrl),
          ne(schema.prospects.websiteUrl, "")
        )
      );

    const withRealEmail = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.prospects)
      .where(
        and(
          eq(schema.prospects.status, "emailed"),
          not(like(schema.prospects.email, "no-email-%"))
        )
      );

    console.log("=== EMAILED PROSPECTS STATUS ===");
    console.log(`Total Emailed: ${totalEmailed[0].count}`);
    console.log(`With Website URL: ${withWebsite[0].count}`);
    console.log(`With Real Emails: ${withRealEmail[0].count}`);
    process.exit(0);
  } catch (err: any) {
    console.error("Failed to run inspection:", err.message);
    process.exit(1);
  }
}

run();


