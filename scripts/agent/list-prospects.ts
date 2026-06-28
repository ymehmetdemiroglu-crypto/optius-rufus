import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { and, eq, sql, desc } from "drizzle-orm";

async function run() {
  const args = process.argv.slice(2);
  let statusFilter: string | undefined = undefined;
  let limitFilter = 20;
  let jsonMode = false;

  for (const arg of args) {
    if (arg.startsWith("--status=")) {
      statusFilter = arg.split("=")[1];
    } else if (arg.startsWith("--limit=")) {
      limitFilter = parseInt(arg.split("=")[1], 10);
    } else if (arg === "--json") {
      jsonMode = true;
    }
  }

  try {
    const conditions = [];
    if (statusFilter) {
      conditions.push(eq(schema.prospects.status, statusFilter));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const list = await db
      .select({
        id: schema.prospects.id,
        firstName: schema.prospects.firstName,
        lastName: schema.prospects.lastName,
        email: schema.prospects.email,
        company: schema.prospects.company,
        asin: schema.prospects.asin,
        status: schema.prospects.status,
        slug: schema.prospects.slug,
        expectedRevenue: schema.prospects.expectedRevenue,
        createdAt: schema.prospects.createdAt,
      })
      .from(schema.prospects)
      .where(whereClause)
      .orderBy(desc(schema.prospects.createdAt))
      .limit(limitFilter);

    if (jsonMode) {
      console.log(JSON.stringify(list, null, 2));
      return;
    }

    console.log(`\n👥 Listing Prospects (Limit: ${limitFilter}, Status: ${statusFilter || "any"})\n`);

    if (list.length === 0) {
      console.log("No prospects found.\n");
      return;
    }

    for (const p of list) {
      const name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "N/A";
      console.log(`ID:      ${p.id}`);
      console.log(`Name:    ${name}`);
      console.log(`Email:   ${p.email || "N/A"}`);
      console.log(`Company: ${p.company || "N/A"}`);
      console.log(`ASIN:    ${p.asin || "N/A"}`);
      console.log(`Status:  ${p.status || "new"}`);
      console.log(`Slug:    ${p.slug || "N/A"}`);
      console.log(`Revenue: ${p.expectedRevenue || "N/A"}`);
      console.log("-".repeat(40));
    }
    console.log("");
  } catch (err) {
    console.error(`❌ Failed to list prospects:`, err);
  }
}

run();
