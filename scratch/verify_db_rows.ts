import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "data", "optimus.db");
const sqliteDb = new Database(dbPath);

// Select a few prospects we know were enriched recently
const sampleIds = [20, 31, 70, 78, 100];
const rows = sqliteDb.prepare(`
  SELECT id, email, firstName, lastName, company, jobTitle, apolloContactId, status 
  FROM prospects 
  WHERE id IN (${sampleIds.join(",")})
`).all() as any[];

console.log("=== VERIFYING DATABASE RECORDS ===");
for (const row of rows) {
  console.log(`\nProspect ID #${row.id}:`);
  console.log(`- Email:      ${row.email}`);
  console.log(`- Name:       ${row.firstName} ${row.lastName}`);
  console.log(`- Company:    ${row.company}`);
  console.log(`- Job Title:  ${row.jobTitle}`);
  console.log(`- Apollo ID:  ${row.apolloContactId}`);
  console.log(`- Status:     ${row.status}`);
}

sqliteDb.close();
