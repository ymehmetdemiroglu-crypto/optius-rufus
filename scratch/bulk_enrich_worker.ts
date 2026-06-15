import Database from "better-sqlite3";
import { join } from "path";
import fs from "fs";

// Load environment variables
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

// Create log stream
const logPath = join(process.cwd(), "scratch", "bulk_enrichment.log");
const logStream = fs.createWriteStream(logPath, { flags: "a" });

function log(msg: string) {
  const formatted = `[${new Date().toISOString()}] ${msg}`;
  console.log(msg);
  logStream.write(formatted + "\n");
}

// Arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const cleanArgs = args.filter(a => a !== "--dry-run");

const limitArg = cleanArgs[0] || "10";
const LIMIT = limitArg.toLowerCase() === "all" ? 999999 : parseInt(limitArg, 10);

log("=================================================");
log("🚀 APOLLO BULK ENRICHMENT WORKER");
log(`Target Limit: ${LIMIT === 999999 ? "ALL (1,035)" : LIMIT}`);
log(`Dry Run Mode: ${DRY_RUN ? "ENABLED" : "DISABLED"}`);
log(`Logging to:   ${logPath}`);
log("=================================================");

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Clean database connection on exit
process.on("SIGINT", () => {
  log("\n🛑 Process interrupted by user. Closing database cleanly...");
  sqliteDb.close();
  logStream.end();
  process.exit(0);
});

async function apolloRequestWithRetry(url: string, body: any, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": APOLLO_API_KEY!,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        log(`⚠️ Rate limit hit (429). Sleeping for 60 seconds... (Attempt ${i + 1}/${retries})`);
        await sleep(60000);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.status} - ${await response.text()}`);
      }

      return await response.json();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      log(`⚠️ Request failed: ${err.message}. Retrying in 5 seconds...`);
      await sleep(5000);
    }
  }
}

function cleanCompanyName(company: string): string {
  if (!company) return "";
  let name = company;
  name = name.replace(/^Visit the\s+/i, "");
  name = name.replace(/\s+Store$/i, "");
  name = name.replace(/^Brand:\s+/i, "");
  return name.trim();
}

async function enrollInSequence(contactId: string, sequenceId: string) {
  try {
    const response = await fetch("https://api.apollo.io/v1/emailer_campaigns/enroll_contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Api-Token ${APOLLO_API_KEY}`,
      },
      body: JSON.stringify({ contact_id: contactId, emailer_campaign_id: sequenceId }),
    });
    if (!response.ok) {
      log(`  ⚠️ Campaign enrollment failed for ${contactId} in ${sequenceId}: ${response.status}`);
    } else {
      log(`  ✅ Enrolled contact ${contactId} in sequence ${sequenceId}`);
    }
  } catch (err: any) {
    log(`  ⚠️ Campaign enrollment error: ${err.message}`);
  }
}

async function main() {
  // Query prospects who have a listing and have a dummy email address
  const query = `
    SELECT DISTINCT p.* 
    FROM prospects p
    JOIN listings l ON l.prospectId = p.id
    WHERE p.email LIKE 'no-email-%'
      AND (p.apolloContactId IS NULL OR p.apolloContactId = '' OR p.apolloContactId LIKE 'mock-%')
    ORDER BY p.id ASC
  `;

  const targets = sqliteDb.prepare(query).all() as any[];
  log(`Found ${targets.length} total dummy prospects with active listings in database.`);

  if (targets.length === 0) {
    log("🎉 All prospects with active listings are already enriched!");
    return;
  }

  const toProcess = targets.slice(0, LIMIT);
  log(`Preparing to process ${toProcess.length} prospects.`);
  
  if (!DRY_RUN) {
    log(`⚠️ WARNING: Running this will perform up to ${toProcess.length} searches and enrichments.`);
    log("Starting in 5 seconds... Press Ctrl+C to cancel.");
    await sleep(5000);
  }

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;
  const startTime = Date.now();

  for (let idx = 0; idx < toProcess.length; idx++) {
    const p = toProcess[idx];
    const progress = `[${idx + 1}/${toProcess.length}]`;
    const cleanedCompany = cleanCompanyName(p.company || "");

    if (!cleanedCompany) {
      log(`${progress} Skipping ID ${p.id}: Company name is empty/invalid`);
      skipCount++;
      continue;
    }

    log(`${progress} Processing: "${p.company}" (ASIN: ${p.asin || "N/A"}) -> Cleaned: "${cleanedCompany}"`);

    if (DRY_RUN) {
      log(`  [Dry-Run] Would search and enrich contact for "${cleanedCompany}"`);
      successCount++;
      continue;
    }

    try {
      // Respect rate limits by adding a short delay (1.5 seconds) between prospects
      await sleep(1500);

      // Step A: Search for contacts in Apollo (fetch up to 10 to scan for email presence)
      const searchRes = await apolloRequestWithRetry("https://api.apollo.io/api/v1/mixed_people/api_search", {
        q_keywords: cleanedCompany,
        person_seniorities: ["owner", "founder", "c_suite", "director", "vp"],
        per_page: 10,
      });

      const people = searchRes.people || [];
      if (people.length === 0) {
        log(`  ⚠️ No contacts found for company "${cleanedCompany}"`);
        failCount++;
        continue;
      }

      // Prioritize contacts with verified emails
      let matched = people.find((person: any) => person.has_email === true);
      
      if (!matched) {
        log(`  ⚠️ Found ${people.length} contact(s) for "${cleanedCompany}" but none have a verified email in Apollo (skipping)`);
        failCount++;
        continue;
      }

      log(`  Matched: ${matched.first_name} ${matched.last_name_obfuscated} (${matched.title}) [has_email: true]`);

      // Step B: Enrich contact via Apollo Match API
      log(`  Enriching contact ID ${matched.id}...`);
      const matchRes = await apolloRequestWithRetry("https://api.apollo.io/api/v1/people/match", {
        id: matched.id,
      });

      const person = matchRes.person;
      if (!person || !person.email) {
        log(`  ⚠️ Failed to retrieve email during match enrichment for ID ${matched.id}`);
        failCount++;
        continue;
      }

      const realEmail = person.email;
      const apolloContactId = person.id;
      const firstName = person.first_name || p.firstName || "";
      const lastName = person.last_name || p.lastName || "";
      const company = person.organization?.name || p.company || "";
      const jobTitle = person.title || "";
      const websiteUrl = person.organization?.website || p.websiteUrl || "";

      // Step C: Update prospect details in SQLite
      sqliteDb.prepare(`
        UPDATE prospects
        SET email = ?, apolloContactId = ?, firstName = ?, lastName = ?, company = ?, jobTitle = ?, websiteUrl = ?, status = 'analyzed'
        WHERE id = ?
      `).run(realEmail, apolloContactId, firstName, lastName, company, jobTitle, websiteUrl, p.id);

      log(`  ✅ Successfully enriched and updated: ${realEmail} (${firstName} ${lastName})`);

      // Step D: Enroll in sequence if sequence assigned
      if (p.apolloSequenceId) {
        await enrollInSequence(apolloContactId, p.apolloSequenceId);
      }

      successCount++;

      // Print estimated time remaining every 5 matches
      if (successCount % 5 === 0) {
        const elapsed = Date.now() - startTime;
        const avgTime = elapsed / (idx + 1);
        const remaining = toProcess.length - (idx + 1);
        const estRemainingMs = avgTime * remaining;
        const estRemainingMins = Math.round(estRemainingMs / 60000);
        log(`⏱️ Estimated remaining time for this batch: ${estRemainingMins} minute(s)`);
      }
    } catch (err: any) {
      log(`  ❌ Failed to process prospect ${p.id} ("${cleanedCompany}"): ${err.message}`);
      failCount++;
    }
  }

  log("\n=================================================");
  log("📊 BULK ENRICHMENT WORKER COMPLETE");
  log(`- Successfully Enriched: ${successCount}`);
  log(`- Failed / No Contacts:  ${failCount}`);
  log(`- Skipped (empty name):  ${skipCount}`);
  log("=================================================");

  sqliteDb.close();
  logStream.end();
}

main().catch(err => {
  log(`❌ Fatal worker crash: ${err.message}`);
  sqliteDb.close();
  logStream.end();
});
