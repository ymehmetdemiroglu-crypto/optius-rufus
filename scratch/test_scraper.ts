import { loadEnv } from "../scripts/agent/envLoader.js";
loadEnv();

import { scrapeAmazonListing } from "../api/domains/listing/scraper.js";

async function run() {
  const asin = "B0DNQ1BV41";
  try {
    const result = await scrapeAmazonListing(asin, "US");
    console.log("Scraped Result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
