import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "data", "optimus.db");
const sqliteDb = new Database(dbPath);

console.log("=== CHECKING REAL-EMAIL PROSPECTS ===");

// 1. Status breakdown for real-email prospects
const statusBreakdown = sqliteDb.prepare(`
  SELECT status, count(*) as count 
  FROM prospects 
  WHERE email NOT LIKE 'no-email-%'
  GROUP BY status
`).all() as any[];

console.log("\nStatus Breakdown of prospects with REAL emails:");
console.dir(statusBreakdown);

// 2. Count prospects with real emails that have associated listings and analyses
const analysisStats = sqliteDb.prepare(`
  SELECT 
    COUNT(DISTINCT p.id) as total_prospects,
    COUNT(DISTINCT l.id) as total_listings,
    COUNT(DISTINCT a.id) as total_analyses
  FROM prospects p
  LEFT JOIN listings l ON l.prospectId = p.id
  LEFT JOIN listing_analyses a ON a.listingId = l.id
  WHERE p.email NOT LIKE 'no-email-%'
`).get() as any;

console.log("\nListing and Analysis coverage for real-email prospects:");
console.dir(analysisStats);

// 3. Count prospects with real emails, status = 'analyzed' and a valid analysis
const readyToSync = sqliteDb.prepare(`
  SELECT COUNT(DISTINCT p.id) as count
  FROM prospects p
  JOIN listings l ON l.prospectId = p.id
  JOIN listing_analyses a ON a.listingId = l.id
  WHERE p.email NOT LIKE 'no-email-%'
    AND p.status = 'analyzed'
`).get() as any;

console.log(`\nProspects with REAL emails, status = 'analyzed', and active audit: ${readyToSync.count}`);

// 4. Count of prospects enrolled in sequences
const sequenceStats = sqliteDb.prepare(`
  SELECT apolloSequenceId, COUNT(*) as count
  FROM prospects
  WHERE email NOT LIKE 'no-email-%'
  GROUP BY apolloSequenceId
`).all() as any[];

console.log("\nApollo Sequence breakdown:");
console.dir(sequenceStats);

sqliteDb.close();
