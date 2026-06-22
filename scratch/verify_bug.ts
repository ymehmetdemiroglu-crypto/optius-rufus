import { loadEnv } from "../scripts/agent/envLoader.js";
loadEnv();

import { db } from "../api/db/drizzle.js";
import * as schema from "../api/db/schema.js";
import { eq } from "drizzle-orm";
import { mapListingRecordToRawListingData } from "../api/lib/mapping.js";

async function run() {
  try {
    const rows = await db
      .select()
      .from(schema.listings)
      .where(eq(schema.listings.asin, "B0TEST1234")) // from the job that just ran
      .limit(1);

    if (rows.length === 0) {
      console.log("No listing found for B0TEST1234");
      return;
    }

    const listing = rows[0];
    console.log("Listing directly from DB:");
    console.log("bullets type:", typeof listing.bullets, Array.isArray(listing.bullets) ? "Array" : "Not Array");
    console.log("bullets value:", listing.bullets);
    console.log("images type:", typeof listing.images, Array.isArray(listing.images) ? "Array" : "Not Array");
    console.log("images value:", listing.images);
    console.log("rawScrapeData type:", typeof listing.rawScrapeData);
    console.log("rawScrapeData value:", listing.rawScrapeData);

    const mapped = mapListingRecordToRawListingData(listing);
    console.log("\nMapped RawListingData:");
    console.log("bullets:", mapped.bullets);
    console.log("images:", mapped.images);
    console.log("attributes:", mapped.attributes);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
