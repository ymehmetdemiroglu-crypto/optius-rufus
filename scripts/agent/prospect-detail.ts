import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { eq, and, sql } from "drizzle-orm";

async function run() {
  const args = process.argv.slice(2);
  let id: number | undefined = undefined;

  for (const arg of args) {
    if (arg.startsWith("--id=")) {
      id = parseInt(arg.split("=")[1], 10);
    }
  }

  if (!id && process.argv[2] && !isNaN(parseInt(process.argv[2]))) {
    id = parseInt(process.argv[2]);
  }

  if (!id) {
    console.error("\n❌ Error: Please specify a Prospect ID.");
    console.error("Usage: node scripts/agent/prospect-detail.ts <id> or --id=<id>\n");
    process.exit(1);
  }

  console.log(`\n🔍 Fetching detail for Prospect ID ${id}...\n`);

  try {
    const prospectRows = await db
      .select()
      .from(schema.prospects)
      .where(eq(schema.prospects.id, id))
      .limit(1);

    if (prospectRows.length === 0) {
      console.error(`❌ Prospect ID ${id} not found.\n`);
      process.exit(1);
    }
    const p = prospectRows[0];
    const name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "N/A";

    console.log(`👤 Prospect General Info:`);
    console.log(`  ID:                 ${p.id}`);
    console.log(`  Name:               ${name}`);
    console.log(`  Job Title:          ${p.jobTitle || "N/A"}`);
    console.log(`  Email:              ${p.email}`);
    console.log(`  Company:            ${p.company || "N/A"}`);
    console.log(`  ASIN:               ${p.asin || "N/A"}`);
    console.log(`  Status:             ${p.status || "new"}`);
    console.log(`  Slug:               ${p.slug}`);
    console.log(`  Expected Revenue:   ${p.expectedRevenue || "N/A"}`);
    console.log(`  Apollo Contact ID:  ${p.apolloContactId || "N/A"}`);
    console.log(`  Apollo Sequence ID: ${p.apolloSequenceId || "N/A"}`);
    console.log(`  Landing Page Views: ${p.landingPageViews}`);
    console.log(`  Outreach Emails:    ${p.outreachEmails ? "Generated" : "None"}`);
    console.log(`  Created:            ${p.createdAt ? new Date(p.createdAt).toLocaleString() : "N/A"}`);
    console.log("-".repeat(50));

    const listings = await db
      .select()
      .from(schema.listings)
      .where(eq(schema.listings.prospectId, id))
      .orderBy(sql`${schema.listings.createdAt} DESC`);

    if (listings.length > 0) {
      console.log(`📦 Listing Data (Total: ${listings.length}, latest first):`);
      for (const l of listings) {
        console.log(`  ASIN [${l.asin}]:`);
        console.log(`    Title:       ${l.title ? (l.title.length > 60 ? l.title.substring(0, 60) + "..." : l.title) : "N/A"}`);
        console.log(`    Brand:       ${l.brand || "N/A"}`);
        console.log(`    Category:    ${l.category || "N/A"}`);
        console.log(`    Price:       $${l.price || "N/A"}`);
        console.log(`    Rating:      ${l.rating} (${l.reviewCount} reviews)`);
        console.log(`    Scraped At:  ${l.scrapedAt ? new Date(l.scrapedAt).toLocaleString() : "N/A"}`);
      }
      console.log("-".repeat(50));

      const latestListing = listings[0];
      const analyses = await db
        .select()
        .from(schema.listingAnalyses)
        .where(eq(schema.listingAnalyses.listingId, latestListing.id))
        .limit(1);

      if (analyses.length > 0) {
        const a = analyses[0];
        console.log(`📊 Analysis Scores (ASIN: ${latestListing.asin}):`);
        console.log(`  Overall Score:  ${a.overallScore}/100`);
        console.log(`  Rufus Score:    ${a.rufusScore}/100`);
        console.log(`  Cosmo Score:    ${a.cosmoScore}/100`);
        console.log(`  Semantic Score: ${a.semanticScore}/100`);
        console.log(`  Content Score:  ${a.contentScore}/100`);
        console.log(`  Visual Score:   ${a.visualScore}/100`);
        console.log(`  Top Issues:     ${JSON.stringify(a.topIssues)}`);
        console.log(`  Opportunities:  ${JSON.stringify(a.opportunities)}`);
      } else {
        console.log(`📊 Analysis Scores: None found for latest listing.`);
      }
      console.log("-".repeat(50));
    } else {
      console.log(`📦 Listing Data: None found for this prospect.`);
      console.log("-".repeat(50));
    }

    const bookings = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.prospectId, id))
      .orderBy(sql`${schema.bookings.createdAt} DESC`);

    if (bookings.length > 0) {
      console.log(`📅 Bookings (Total: ${bookings.length}):`);
      for (const b of bookings) {
        const statusStr = (b.status || "pending").toUpperCase();
        console.log(`  - [${statusStr}] Scheduled for ${b.scheduledDate || "N/A"}`);
        console.log(`    Notes: ${b.notes || "None"}`);
      }
      console.log("-".repeat(50));
    }

    const jobList = await db
      .select({
        id: schema.jobs.id,
        name: schema.jobs.name,
        status: schema.jobs.status,
        failedReason: schema.jobs.failedReason,
        timestamp: schema.jobs.timestamp,
      })
      .from(schema.jobs)
      .where(
        sql`${schema.jobs.dataJSON}->>'prospectId' = ${id.toString()} or (${schema.jobs.dataJSON}->'prospectId')::int = ${id}`
      )
      .orderBy(sql`${schema.jobs.timestamp} DESC`)
      .limit(5);

    if (jobList.length > 0) {
      console.log(`🔄 Pipeline Jobs History (Last 5):`);
      for (const job of jobList) {
        const createdStr = new Date(job.timestamp).toLocaleString();
        console.log(`  - Job ${job.id} [${job.name}] Status: ${job.status} (${createdStr})`);
        if (job.failedReason) {
          console.log(`    Error: ${job.failedReason}`);
        }
      }
      console.log("");
    } else {
      console.log(`🔄 Pipeline Jobs History: No jobs found in history.\n`);
    }

  } catch (err) {
    console.error(`❌ Failed to retrieve prospect detail:`, (err as Error).message);
  }
}

run();
