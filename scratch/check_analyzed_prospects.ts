import Database from "better-sqlite3";
import { join } from "path";

const db = new Database(join(process.cwd(), "data", "optimus.db"));

const statuses = db.prepare("SELECT status, count(*) as c FROM prospects GROUP BY status").all();
console.log("PROSPECT STATUS COUNTS:", statuses);

const analyzed = db.prepare(`
  SELECT p.id, p.firstName, p.lastName, p.company, p.email, p.status, p.asin, l.brand, l.category, a.rufusScore, a.topIssues
  FROM prospects p
  JOIN listings l ON l.prospectId = p.id
  JOIN listing_analyses a ON a.listingId = l.id
`).all();

console.log(`\nANALYZED PROSPECTS WITH LISTINGS & ANALYSES (${analyzed.length}):`);
for (const a of analyzed as any[]) {
  console.log(`\n[ID ${a.id}] Status: ${a.status} | Name: ${a.firstName} ${a.lastName} | Company: ${a.company} | ASIN: ${a.asin || 'N/A'}`);
  console.log(`  Brand: ${a.brand} | Category: ${a.category} | Rufus Score: ${a.rufusScore}/100`);
  console.log(`  Top Issues snippet: ${a.topIssues ? a.topIssues.slice(0, 250) + '...' : 'None'}`);
}

db.close();
