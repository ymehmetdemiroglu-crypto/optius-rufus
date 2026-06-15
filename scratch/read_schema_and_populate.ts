import Database from "better-sqlite3";
import { join } from "path";
import fs from "fs";

const dbPath = join(process.cwd(), "data", "optimus.db");
const sqliteDb = new Database(dbPath);

console.log("=== SQLITE TABLE STRUCTURES ===");
const tables = ["prospects", "listings", "listing_analyses"];
for (const table of tables) {
  try {
    const cols = sqliteDb.prepare(`PRAGMA table_info(${table})`).all() as any[];
    console.log(`\nTable: ${table}`);
    console.log(cols.map(c => `  ${c.name} (${c.type})`).join("\n"));
  } catch (e) {
    console.error(`Error reading columns for ${table}:`, e);
  }
}

// Read supabase query output
const outputFilePath = join(
  "C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\abb3f642-a026-4225-9f15-1cf4008fc31d\\.system_generated\\steps\\402\\output.txt"
);

if (!fs.existsSync(outputFilePath)) {
  console.error(`Supabase output file not found at: ${outputFilePath}`);
  process.exit(1);
}

const fileContent = fs.readFileSync(outputFilePath, "utf-8");
console.log(`\nRead ${fileContent.length} bytes from supabase query output.`);

// Extract the JSON array of records from the output.txt content.
// It is wrapped inside the "result" property of a JSON, and further inside <untrusted-data-...> tags.
let records: any[] = [];
try {
  const outerJson = JSON.parse(fileContent);
  const resultText = outerJson.result;
  
  // Extract text within <untrusted-data-[0-9a-f-]+> ... </untrusted-data-[0-9a-f-]+>
  const tagRegex = /<untrusted-data-[0-9a-f-]+>([\s\S]*?)<\/untrusted-data-[0-9a-f-]+>/;
  const match = resultText.match(tagRegex);
  const jsonString = match ? match[1].trim() : resultText.trim();
  
  // Find where the array starts and ends
  const arrayStart = jsonString.indexOf("[");
  const arrayEnd = jsonString.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1) {
    const arrayStr = jsonString.slice(arrayStart, arrayEnd + 1);
    records = JSON.parse(arrayStr);
  } else {
    // Try parsing the whole thing
    records = JSON.parse(jsonString);
  }
} catch (e) {
  console.error("Failed to parse records from file:", e);
  process.exit(1);
}

console.log(`\nSuccessfully parsed ${records.length} records from Supabase.`);

// Populate database
sqliteDb.transaction(() => {
  let prospectsAdded = 0;
  let listingsAdded = 0;
  let analysesAdded = 0;

  for (const record of records) {
    // 1. Check if prospect already exists by email
    const email = record.contact_email || `no-email-${record.asin}@example.com`;
    let prospectId: number;

    const existingProspect = sqliteDb.prepare("SELECT id FROM prospects WHERE email = ?").get(email) as any;
    
    // Generate a unique slug
    const brandSlug = (record.brand || "brand")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${brandSlug}-${record.asin ? record.asin.toLowerCase() : Math.random().toString(36).substring(2, 8)}`;

    if (existingProspect) {
      prospectId = existingProspect.id;
    } else {
      // Insert new prospect
      const stmt = sqliteDb.prepare(`
        INSERT INTO prospects (slug, email, firstName, lastName, company, apolloContactId, apolloSequenceId, status, landingPageViews, packageType, pricePoint)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const res = stmt.run(
        slug,
        email,
        record.contact_first_name || null,
        record.contact_last_name || null,
        record.brand || record.seller_business_name || null,
        record.apollo_contact_id || null,
        null,
        "new",
        0,
        "package_2",
        1500
      );
      prospectId = res.lastInsertRowid as number;
      prospectsAdded++;
    }

    // 2. Check if listing already exists for this prospect/asin
    if (record.asin) {
      const existingListing = sqliteDb.prepare("SELECT id FROM listings WHERE prospectId = ? AND asin = ?").get(prospectId, record.asin) as any;
      let listingId: number;

      if (existingListing) {
        listingId = existingListing.id;
      } else {
        // Insert new listing
        const title = record.post_title || null;
        const url = record.post_url || `https://www.amazon.com/dp/${record.asin}`;
        const bullets = JSON.stringify([record.post_body || ""]);
        
        const stmt = sqliteDb.prepare(`
          INSERT INTO listings (prospectId, asin, marketplace, url, title, bullets, description, brand, category, price, rating, reviewCount, images, aPlusText, rawScrapeData, scrapedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `);
        const res = stmt.run(
          prospectId,
          record.asin,
          "US",
          url,
          title,
          bullets,
          null, // description
          record.brand || null,
          record.category || null,
          record.listing_price || null,
          record.listing_rating || null,
          record.listing_review_count || null,
          JSON.stringify([]), // images
          record.has_a_plus ? "Yes" : "No",
          null // rawScrapeData
        );
        listingId = res.lastInsertRowid as number;
        listingsAdded++;
      }

      // 3. Check and insert listing analysis if quality score is available
      if (record.quality_score !== undefined && record.quality_score !== null) {
        const existingAnalysis = sqliteDb.prepare("SELECT id FROM listing_analyses WHERE listingId = ?").get(listingId) as any;
        if (!existingAnalysis) {
          const stmt = sqliteDb.prepare(`
            INSERT INTO listing_analyses (
              listingId, prospectId, overallScore, rufusScore, cosmoScore, semanticScore, contentScore, visualScore, 
              gaps, topIssues, strengths, opportunities, aiAnalysisRaw, packageType, pricePoint
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          stmt.run(
            listingId,
            prospectId,
            record.quality_score,
            record.rufus_score || 0,
            0, // cosmoScore
            record.intent_alignment_score || 0, // semanticScore
            record.conversational_readability_score || 0, // contentScore
            record.qa_coverage_score || 0, // visualScore
            JSON.stringify(record.quality_signals ? record.quality_signals.split(",") : []), // gaps
            record.rufus_top_weaknesses || "[]", // topIssues
            JSON.stringify([]), // strengths
            JSON.stringify([]), // opportunities
            record.rufus_summary || null, // aiAnalysisRaw
            "package_2",
            1500
          );
          analysesAdded++;
        }
      }
    }
  }

  console.log(`\n=== IMPORT SUMMARY ===`);
  console.log(`Prospects Added/Synced: ${prospectsAdded}`);
  console.log(`Listings Added/Synced: ${listingsAdded}`);
  console.log(`Listing Analyses Added: ${analysesAdded}`);
})();

sqliteDb.close();
