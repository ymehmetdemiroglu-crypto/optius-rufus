import Database from "better-sqlite3";
import { join } from "path";
import fs from "fs";

// Manually load .env if present
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

// Configuration Limits (Change these or pass via arguments to process more)
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const cleanArgs = args.filter(a => a !== "--dry-run");

const REAL_EMAIL_LIMIT = parseInt(cleanArgs[0] || "5", 10);
const DUMMY_EMAIL_LIMIT = parseInt(cleanArgs[1] || "5", 10);

console.log("=== APOLLO DATABASE ENRICHMENT UTILITY ===");
console.log(`Limits: Real Emails = ${REAL_EMAIL_LIMIT}, Dummy Emails = ${DUMMY_EMAIL_LIMIT}`);
console.log(`Dry Run Mode: ${DRY_RUN ? "ENABLED (No DB updates or Apollo credits will be used)" : "DISABLED (Real API calls and DB updates)"}`);

const dbPath = join(process.cwd(), "data", "optimus.db");
const sqliteDb = new Database(dbPath);

async function apolloRequest(url: string, body: any) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": APOLLO_API_KEY!,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Apollo API error: ${response.status} - ${await response.text()}`);
  }
  return response.json();
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
  const response = await fetch("https://api.apollo.io/v1/emailer_campaigns/enroll_contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Token ${APOLLO_API_KEY}`,
    },
    body: JSON.stringify({ contact_id: contactId, emailer_campaign_id: sequenceId }),
  });
  if (!response.ok) {
    console.error(`  ⚠️ Campaign enrollment failed for ${contactId} in ${sequenceId}: ${response.status}`);
  } else {
    console.log(`  ✅ Enrolled contact ${contactId} in sequence ${sequenceId}`);
  }
}

async function main() {
  // 1. Fetch prospects requiring enrichment
  const queryUnenriched = `
    SELECT * FROM prospects 
    WHERE apolloContactId IS NULL 
       OR apolloContactId = '' 
       OR apolloContactId LIKE 'mock-%'
  `;
  const allUnenriched = sqliteDb.prepare(queryUnenriched).all() as any[];

  const realEmails = allUnenriched.filter(p => p.email && !p.email.startsWith("no-email-"));
  const dummyEmails = allUnenriched.filter(p => !p.email || p.email.startsWith("no-email-"));

  console.log(`\nFound ${allUnenriched.length} total unenriched prospects:`);
  console.log(`- ${realEmails.length} with real emails`);
  console.log(`- ${dummyEmails.length} with dummy emails (requiring company search first)`);

  let enrichedRealCount = 0;
  let enrichedDummyCount = 0;

  // 2. Process Real Emails
  if (realEmails.length > 0 && REAL_EMAIL_LIMIT > 0) {
    console.log(`\n--- Processing Real Email Prospects (Limit: ${REAL_EMAIL_LIMIT}) ---`);
    const targets = realEmails.slice(0, REAL_EMAIL_LIMIT);

    for (const p of targets) {
      console.log(`\nEnriching: [ID ${p.id}] ${p.email} (${p.company || "No Company"})`);
      if (DRY_RUN) {
        console.log(`  [Dry-Run] Would enrich ${p.email} via Apollo /people/match`);
        enrichedRealCount++;
        continue;
      }

      try {
        const res = await apolloRequest("https://api.apollo.io/api/v1/people/match", { email: p.email });
        const person = res.person;
        if (!person) {
          console.log(`  ⚠️ No match found for email: ${p.email}`);
          continue;
        }

        const apolloContactId = person.id;
        const firstName = person.first_name || p.firstName || "";
        const lastName = person.last_name || p.lastName || "";
        const company = person.organization?.name || p.company || "";
        const jobTitle = person.title || p.jobTitle || "";
        const websiteUrl = person.organization?.website || p.websiteUrl || "";

        // Update database
        sqliteDb.prepare(`
          UPDATE prospects
          SET apolloContactId = ?, firstName = ?, lastName = ?, company = ?, jobTitle = ?, websiteUrl = ?, status = 'analyzed'
          WHERE id = ?
        `).run(apolloContactId, firstName, lastName, company, jobTitle, websiteUrl, p.id);

        console.log(`  ✅ Enriched & updated: ${firstName} ${lastName} @ ${company}`);

        // Try sequence enrollment if sequence is assigned
        if (p.apolloSequenceId) {
          await enrollInSequence(apolloContactId, p.apolloSequenceId);
        }

        enrichedRealCount++;
      } catch (err: any) {
        console.error(`  ❌ Failed to enrich ${p.email}:`, err.message);
      }
    }
  }

  // 3. Process Dummy Emails (Requires searching company for contact first)
  if (dummyEmails.length > 0 && DUMMY_EMAIL_LIMIT > 0) {
    console.log(`\n--- Processing Dummy Email Prospects (Limit: ${DUMMY_EMAIL_LIMIT}) ---`);
    const targets = dummyEmails.slice(0, DUMMY_EMAIL_LIMIT);

    for (const p of targets) {
      const cleanedCompany = cleanCompanyName(p.company || "");
      if (!cleanedCompany) {
        console.log(`\n[ID ${p.id}] Cannot search: Company name is empty or unparseable: "${p.company}"`);
        continue;
      }

      console.log(`\nSearching Company: [ID ${p.id}] "${p.company}" -> Cleaned: "${cleanedCompany}"`);
      if (DRY_RUN) {
        console.log(`  [Dry-Run] Would search Apollo for contacts at company "${cleanedCompany}"`);
        enrichedDummyCount++;
        continue;
      }

      try {
        // Step A: Search for people at this company using mixed_people/api_search
        const searchRes = await apolloRequest("https://api.apollo.io/api/v1/mixed_people/api_search", {
          q_keywords: cleanedCompany,
          person_seniorities: ["owner", "founder", "c_suite", "director", "vp"],
          per_page: 1,
        });

        const people = searchRes.people || [];
        if (people.length === 0) {
          console.log(`  ⚠️ No matching contacts found for company: "${cleanedCompany}"`);
          continue;
        }

        const matchedPerson = people[0];
        console.log(`  Found contact: ${matchedPerson.first_name} ${matchedPerson.last_name_obfuscated} (${matchedPerson.title})`);

        // Step B: Enrich contact to get real email & details
        console.log(`  Enriching contact ID: ${matchedPerson.id}...`);
        const matchRes = await apolloRequest("https://api.apollo.io/api/v1/people/match", { id: matchedPerson.id });
        const person = matchRes.person;

        if (!person || !person.email) {
          console.log(`  ⚠️ Failed to retrieve email during match enrichment for ID ${matchedPerson.id}`);
          continue;
        }

        const realEmail = person.email;
        const apolloContactId = person.id;
        const firstName = person.first_name || p.firstName || "";
        const lastName = person.last_name || p.lastName || "";
        const company = person.organization?.name || p.company || "";
        const jobTitle = person.title || "";
        const websiteUrl = person.organization?.website || p.websiteUrl || "";

        // Update database (including email replacement!)
        sqliteDb.prepare(`
          UPDATE prospects
          SET email = ?, apolloContactId = ?, firstName = ?, lastName = ?, company = ?, jobTitle = ?, websiteUrl = ?, status = 'analyzed'
          WHERE id = ?
        `).run(realEmail, apolloContactId, firstName, lastName, company, jobTitle, websiteUrl, p.id);

        console.log(`  ✅ Successfully replaced dummy email with real contact: ${realEmail}`);
        console.log(`  ✅ Updated database: ${firstName} ${lastName} @ ${company}`);

        // Try sequence enrollment if sequence is assigned
        if (p.apolloSequenceId) {
          await enrollInSequence(apolloContactId, p.apolloSequenceId);
        }

        enrichedDummyCount++;
      } catch (err: any) {
        console.error(`  ❌ Failed to search/enrich for company "${cleanedCompany}":`, err.message);
      }
    }
  }

  console.log("\n=== ENRICHMENT UTILITY SUMMARY ===");
  console.log(`Enriched Real Email Prospects: ${enrichedRealCount}`);
  console.log(`Enriched Dummy Email Prospects: ${enrichedDummyCount}`);
  console.log(`Total successfully processed: ${enrichedRealCount + enrichedDummyCount}`);
}

main()
  .catch(console.error)
  .finally(() => sqliteDb.close());
