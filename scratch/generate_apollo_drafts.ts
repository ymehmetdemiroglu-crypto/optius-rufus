import Database from "better-sqlite3";
import { join } from "path";
import fs from "fs";

// Load environment variables manually if present
function loadEnv() {
  try {
    const envPath = join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const firstEqual = trimmed.indexOf("=");
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const val = trimmed.slice(firstEqual + 1).trim().replace(/^['"]|['"]$/g, "");
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to load .env manually:", e);
  }
}

loadEnv();

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
if (!APOLLO_API_KEY) {
  console.error("❌ APOLLO_API_KEY is not defined in .env");
  process.exit(1);
}

const dbPath = join(process.cwd(), "data", "optimus.db");
const sqliteDb = new Database(dbPath);

// Arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const cleanArgs = args.filter(a => a !== "--dry-run");

const limitArg = cleanArgs[0] || "10";
const LIMIT = limitArg.toLowerCase() === "all" ? 999999 : parseInt(limitArg, 10);

console.log("=================================================");
console.log("🚀 APOLLO DRAFT SYNC & OUTREACH WRITER");
console.log(`Target Limit: ${LIMIT === 999999 ? "ALL" : LIMIT}`);
console.log(`Dry Run Mode: ${DRY_RUN ? "ENABLED" : "DISABLED"}`);
console.log("=================================================");

/**
 * CONFIGURATION: Apollo Custom Field Keys
 * In your Apollo account (Engage > Settings > Custom Fields > Contacts),
 * create these fields and paste their API names (slugs) below.
 * Usually, they are auto-generated as "custom_field_xxxxxxxxxxxxxx".
 * You can also set these in your .env file.
 */
const FIELD_KEYS = {
  rufusScore: process.env.APOLLO_FIELD_RUFUS_SCORE || "rufus_score",
  topGap: process.env.APOLLO_FIELD_TOP_GAP || "top_gap",
  competitorName: process.env.APOLLO_FIELD_COMPETITOR_NAME || "competitor_name",
  auditUrl: process.env.APOLLO_FIELD_AUDIT_URL || "audit_url",
  category: process.env.APOLLO_FIELD_CATEGORY || "product_category"
};

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apolloRequestWithRetry(url: string, method: string, body: any, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Authorization": `Api-Token ${APOLLO_API_KEY}`,
          "x-api-key": APOLLO_API_KEY!,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        console.warn(`  ⚠️ Rate limit hit (429). Sleeping for 60 seconds... (Attempt ${i + 1}/${retries})`);
        await sleep(60000);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.status} - ${await response.text()}`);
      }

      return await response.json();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      console.warn(`  ⚠️ Request failed: ${err.message}. Retrying in 5 seconds...`);
      await sleep(5000);
    }
  }
}

/**
 * Update the custom fields for a contact in Apollo.
 * Allows Apollo sequences to merge these dynamically.
 */
async function syncCustomFieldsToApollo(contactId: string, fields: Record<string, any>) {
  const url = `https://api.apollo.io/v1/contacts/${contactId}`;
  
  // Format body using Apollo's custom fields structure
  const body = {
    custom_fields: {
      [FIELD_KEYS.rufusScore]: fields.rufusScore,
      [FIELD_KEYS.topGap]: fields.topGap,
      [FIELD_KEYS.competitorName]: fields.competitorName,
      [FIELD_KEYS.auditUrl]: fields.auditUrl,
      [FIELD_KEYS.category]: fields.category
    }
  };

  await apolloRequestWithRetry(url, "PUT", body);
}

function parseSemanticGaps(scenariosRaw: string | null): string {
  if (!scenariosRaw) return "safety warnings and usage routine guidelines";
  try {
    const scenarios = JSON.parse(scenariosRaw);
    if (Array.isArray(scenarios) && scenarios.length > 0) {
      // Return the fail reasons or gaps
      return scenarios.map(s => s.failReason || s.buyerQuestion).slice(0, 2).join(" and ");
    }
  } catch (e) {
    // Ignore and fallback
  }
  return "safety warnings and daily dosage timing guidelines";
}

function extractCompetitor(scenariosRaw: string | null): string {
  if (!scenariosRaw) return "your top rival";
  try {
    const scenarios = JSON.parse(scenariosRaw);
    if (Array.isArray(scenarios) && scenarios.length > 0) {
      return scenarios[0].competitorName || "your top rival";
    }
  } catch (e) {
    // Ignore and fallback
  }
  return "your top rival";
}

async function main() {
  // Query analyzed prospects who have listing analysis reports and valid Apollo contact IDs
  const query = `
    SELECT p.*, l.brand, l.category, a.rufusScore, a.cosmoScore, a.copySimulatorScenarios, a.copyHeroHeadline, a.copyHeroSubheadline
    FROM prospects p
    JOIN listings l ON l.prospectId = p.id
    JOIN listing_analyses a ON a.listingId = l.id
    WHERE p.apolloContactId IS NOT NULL 
      AND p.apolloContactId != '' 
      AND p.apolloContactId NOT LIKE 'mock-%'
      AND p.status = 'analyzed'
    ORDER BY p.id ASC
  `;

  const targets = sqliteDb.prepare(query).all() as any[];
  console.log(`\nFound ${targets.length} analyzed prospects ready to sync to Apollo.`);

  if (targets.length === 0) {
    console.log("🎉 No prospects found waiting to be synced!");
    return;
  }

  const toProcess = targets.slice(0, LIMIT);
  console.log(`Preparing to sync ${toProcess.length} contacts.`);

  let successCount = 0;
  let failCount = 0;

  for (let idx = 0; idx < toProcess.length; idx++) {
    const p = toProcess[idx];
    const progress = `[${idx + 1}/${toProcess.length}]`;
    
    // Parse listing diagnostics
    const rufusScore = p.rufusScore || 45;
    const auditUrl = `https://optimusrufus.com/audit/${p.slug}`;
    const category = p.category || "product listing";
    
    const topGap = parseSemanticGaps(p.copySimulatorScenarios);
    const competitorName = extractCompetitor(p.copySimulatorScenarios);

    console.log(`\n${progress} Syncing: ${p.firstName || ""} ${p.lastName || ""} @ ${p.company || "No Company"}`);
    console.log(`  - ASIN: ${p.asin || "N/A"}`);
    console.log(`  - Rufus Score: ${rufusScore}/100`);
    console.log(`  - Top Gap: "${topGap}"`);
    console.log(`  - Competitor: "${competitorName}"`);
    console.log(`  - Landing Page: ${auditUrl}`);

    if (DRY_RUN) {
      console.log("  [Dry-Run] Print email previews using these fields:");
      console.log(`  --------------------------------------------------`);
      console.log(`  Subject: question about ${p.company || "your listing"} (${p.asin})`);
      console.log(`  Body Preview:`);
      console.log(`  Hi ${p.firstName || "there"},`);
      console.log(`  Your Amazon Rufus compatibility score is ${rufusScore}/100.`);
      console.log(`  Amazon's shopping AI is steering buyers to ${competitorName} due to listing gaps in: ${topGap}.`);
      console.log(`  Check the full autopsy report here: ${auditUrl}`);
      console.log(`  --------------------------------------------------`);
      successCount++;
      continue;
    }

    try {
      // Sync fields directly to the contact in Apollo
      await syncCustomFieldsToApollo(p.apolloContactId, {
        rufusScore,
        topGap,
        competitorName,
        auditUrl,
        category
      });

      // Update status in local database so they don't get processed next run
      sqliteDb.prepare(`
        UPDATE prospects
        SET status = 'drafted'
        WHERE id = ?
      `).run(p.id);

      console.log(`  ✅ Successfully updated contact in Apollo and marked status as 'drafted'.`);
      successCount++;
      
      // Delay to avoid hitting Apollo rate limits (1 second)
      await sleep(1000);
    } catch (err: any) {
      console.error(`  ❌ Failed to sync Apollo contact for ID ${p.id}:`, err.message);
      failCount++;
    }
  }

  console.log("\n=================================================");
  console.log("📊 APOLLO DRAFT SYNC COMPLETE");
  console.log(`- Successfully Synced: ${successCount}`);
  console.log(`- Failed:              ${failCount}`);
  console.log("=================================================");
}

main()
  .catch(console.error)
  .finally(() => sqliteDb.close());
