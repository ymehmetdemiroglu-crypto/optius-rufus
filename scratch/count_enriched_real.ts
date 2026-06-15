import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "data", "optimus.db");
const sqliteDb = new Database(dbPath);

// 1. Total prospects
const total = sqliteDb.prepare("SELECT count(*) as count FROM prospects").get() as any;

// 2. Real vs Dummy
const realEmails = sqliteDb.prepare("SELECT count(*) as count FROM prospects WHERE email NOT LIKE 'no-email-%'").get() as any;
const dummyEmails = sqliteDb.prepare("SELECT count(*) as count FROM prospects WHERE email LIKE 'no-email-%'").get() as any;

// 3. Enriched (non-null, non-empty, and does not start with 'mock-')
const enrichedQuery = `
  FROM prospects 
  WHERE apolloContactId IS NOT NULL 
    AND apolloContactId != '' 
    AND apolloContactId NOT LIKE 'mock-%'
`;
const totalEnriched = sqliteDb.prepare(`SELECT count(*) as count ${enrichedQuery}`).get() as any;

// 4. Enriched with real emails
const realEnriched = sqliteDb.prepare(`
  SELECT count(*) as count 
  ${enrichedQuery} 
  AND email NOT LIKE 'no-email-%'
`).get() as any;

// 5. Enriched with dummy emails (should be 0 or small if some dummy got converted)
const dummyEnriched = sqliteDb.prepare(`
  SELECT count(*) as count 
  ${enrichedQuery} 
  AND email LIKE 'no-email-%'
`).get() as any;

console.log("=== ENRICHMENT STATS ===");
console.log(`Total Prospects in DB: ${total.count}`);
console.log(`- With Real Emails:    ${realEmails.count}`);
console.log(`- With Dummy Emails:   ${dummyEmails.count}`);
console.log("\nEnriched by Apollo (Active apolloContactId):");
console.log(`- Total Enriched:      ${totalEnriched.count}`);
console.log(`- Real Emails:         ${realEnriched.count}`);
console.log(`- Dummy Emails:        ${dummyEnriched.count}`);

if (realEnriched.count > 0) {
  const samples = sqliteDb.prepare(`
    SELECT id, email, firstName, lastName, company, apolloContactId, apolloSequenceId 
    FROM prospects 
    WHERE apolloContactId IS NOT NULL 
      AND apolloContactId != '' 
      AND apolloContactId NOT LIKE 'mock-%'
      AND email NOT LIKE 'no-email-%'
    LIMIT 10
  `).all() as any[];
  console.log("\nEnriched Real Prospects Sample:");
  console.dir(samples);
}

sqliteDb.close();
