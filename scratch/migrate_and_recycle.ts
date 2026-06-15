import Database from "better-sqlite3";
import { join } from "path";
import fs from "fs";
import { classifyProspectRevenue } from "../api/domains/prospect/service.js";

const dbPath = join(process.cwd(), "data", "optimus.db");
const sqliteDb = new Database(dbPath);

console.log("=== STEP 1: MIGRATING SQLITE SCHEMA ===");

// Columns to add to prospects table if missing
const columnsToAdd = [
  { name: "asin", type: "TEXT" },
  { name: "expectedRevenue", type: "TEXT" },
  { name: "repliedAt", type: "DATETIME" },
  { name: "apolloReplyData", type: "TEXT" },
  { name: "jobTitle", type: "TEXT" },
  { name: "linkedinUrl", type: "TEXT" },
  { name: "websiteUrl", type: "TEXT" }
];

const existingCols = sqliteDb.prepare("PRAGMA table_info(prospects)").all() as any[];
const existingColNames = existingCols.map(c => c.name);

for (const col of columnsToAdd) {
  if (!existingColNames.includes(col.name)) {
    console.log(`Adding column '${col.name}' to prospects table...`);
    sqliteDb.prepare(`ALTER TABLE prospects ADD COLUMN ${col.name} ${col.type}`).run();
  } else {
    console.log(`Column '${col.name}' already exists.`);
  }
}

console.log("\n=== STEP 2: RECYCLING & ESTIMATING REVENUE ===");

// Submissions mapping
const submissions = [
  { email: "amlytz2002@gmail.com", monthly_revenue: 25000 },
  { email: "test-prospect@naturescraft.com", monthly_revenue: 35000 }
];
const submissionMap = new Map<string, number>();
for (const sub of submissions) {
  submissionMap.set(sub.email, sub.monthly_revenue);
}

// Read the supabase query output
const outputFilePath = join(
  "C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\abb3f642-a026-4225-9f15-1cf4008fc31d\\.system_generated\\steps\\402\\output.txt"
);

if (!fs.existsSync(outputFilePath)) {
  console.error(`Supabase output file not found at: ${outputFilePath}`);
  process.exit(1);
}

const fileContent = fs.readFileSync(outputFilePath, "utf-8");
let records: any[] = [];
try {
  const outerJson = JSON.parse(fileContent);
  const resultText = outerJson.result;
  const tagRegex = /<untrusted-data-[0-9a-f-]+>([\s\S]*?)<\/untrusted-data-[0-9a-f-]+>/;
  const match = resultText.match(tagRegex);
  const jsonString = match ? match[1].trim() : resultText.trim();
  const arrayStart = jsonString.indexOf("[");
  const arrayEnd = jsonString.lastIndexOf("]");
  records = JSON.parse(jsonString.slice(arrayStart, arrayEnd + 1));
} catch (e) {
  console.error("Failed to parse records:", e);
  process.exit(1);
}

console.log(`Processing and classifying ${records.length} records...`);

// Run migration transaction
sqliteDb.transaction(() => {
  let classACount = 0;
  let classBCount = 0;
  let classCCount = 0;
  let debugPrinted = 0;

  for (const record of records) {
    const email = record.contact_email || `no-email-${record.asin}@example.com`;
    
    // Determine expected revenue using heuristic / calculator submissions
    let expectedRevenueStr = "";
    let yearlyRevenue = 0;
    
    if (submissionMap.has(email)) {
      const monthly = submissionMap.get(email)!;
      yearlyRevenue = monthly * 12;
      expectedRevenueStr = `$${yearlyRevenue.toLocaleString('en-US')} / year`;
    } else {
      // Heuristic: estimate from listing price & review count
      const price = record.listing_price || 25;
      const reviews = record.listing_review_count || 100;
      
      // Let's assume monthly sales volume = reviews * 2
      const monthlySales = Math.max(25, reviews * 2);
      const monthlyRev = monthlySales * price;
      yearlyRevenue = monthlyRev * 12;
      expectedRevenueStr = `$${Math.round(yearlyRevenue).toLocaleString('en-US')} / year`;
    }
    
    // Classify using service logic
    const tier = classifyProspectRevenue(expectedRevenueStr);
    
    if (debugPrinted < 5) {
      console.log(`[DEBUG] Email: ${email}`);
      console.log(`  Price: ${record.listing_price}, Reviews: ${record.listing_review_count}`);
      console.log(`  Calculated Expected Revenue Str: "${expectedRevenueStr}"`);
      console.log(`  Classified Tier: ${tier}`);
      debugPrinted++;
    }
    
    const sequenceMap = {
      Class_A: "seq-enterprise",
      Class_B: "seq-growth",
      Class_C: "seq-starter",
    };
    const sequenceId = sequenceMap[tier];
    
    if (tier === "Class_A") classACount++;
    else if (tier === "Class_B") classBCount++;
    else classCCount++;

    // Generate unique slug if inserting new
    const existingProspect = sqliteDb.prepare("SELECT id FROM prospects WHERE email = ?").get(email) as any;
    
    const brandSlug = (record.brand || "brand")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${brandSlug}-${record.asin ? record.asin.toLowerCase() : Math.random().toString(36).substring(2, 8)}`;

    if (existingProspect) {
      // Update existing prospect with the new columns
      sqliteDb.prepare(`
        UPDATE prospects
        SET expectedRevenue = ?, apolloSequenceId = ?, asin = ?, jobTitle = ?, websiteUrl = ?
        WHERE id = ?
      `).run(
        expectedRevenueStr,
        sequenceId,
        record.asin || null,
        record.contact_title || null,
        record.domain || null,
        existingProspect.id
      );
    } else {
      // Insert new prospect
      const stmt = sqliteDb.prepare(`
        INSERT INTO prospects (
          slug, email, firstName, lastName, company, apolloContactId, apolloSequenceId, status, 
          landingPageViews, packageType, pricePoint, expectedRevenue, asin, jobTitle, websiteUrl
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        slug,
        email,
        record.contact_first_name || null,
        record.contact_last_name || null,
        record.brand || record.seller_business_name || null,
        record.apollo_contact_id || null,
        sequenceId,
        "new",
        0,
        "package_2",
        1500,
        expectedRevenueStr,
        record.asin || null,
        record.contact_title || null,
        record.domain || null
      );
    }
  }

  console.log("\n=== RECYCLING & CLASSIFICATION SUMMARY ===");
  console.log(`Class A (Enterprise - seq-enterprise): ${classACount}`);
  console.log(`Class B (Growth - seq-growth): ${classBCount}`);
  console.log(`Class C (Starter - seq-starter): ${classCCount}`);
  console.log(`Total Classified & Synced: ${records.length}`);
})();

sqliteDb.close();
