import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "data", "optimus.db");
const db = new Database(dbPath);

console.log("Prospect status counts in SQLite:");
const rows = db.prepare("SELECT status, COUNT(*) as count FROM prospects GROUP BY status").all();
console.dir(rows);

console.log("\nListing analyses count by status:");
const analyses = db.prepare("SELECT p.status, COUNT(*) as count FROM prospects p JOIN listings l ON l.prospectId = p.id JOIN listing_analyses a ON a.listingId = l.id GROUP BY p.status").all();
console.dir(analyses);

console.log("\nAnalyzed prospects with valid Apollo Contact ID:");
const validApollo = db.prepare(`
  SELECT COUNT(*) as count 
  FROM prospects p 
  JOIN listings l ON l.prospectId = p.id 
  JOIN listing_analyses a ON a.listingId = l.id 
  WHERE p.status = 'analyzed' 
    AND p.apolloContactId IS NOT NULL 
    AND p.apolloContactId != '' 
    AND p.apolloContactId NOT LIKE 'mock-%'
`).get();
console.dir(validApollo);

console.log("\nSequence ID distribution on analyzed prospects:");
const seqs = db.prepare(`
  SELECT apolloSequenceId, COUNT(*) as count 
  FROM prospects 
  WHERE status = 'analyzed' 
  GROUP BY apolloSequenceId
`).all();
console.dir(seqs);

console.log("\nlisting_analyses columns in SQLite:");
const cols = db.prepare("PRAGMA table_info(listing_analyses)").all();
console.dir(cols.map(c => c.name));

db.close();
