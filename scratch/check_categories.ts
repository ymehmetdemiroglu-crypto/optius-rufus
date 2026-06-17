import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "data", "optimus.db");
const sqliteDb = new Database(dbPath);

console.log("=== CHECKING PRODUCT CATEGORIES ===");

// Get category distribution
const categories = sqliteDb.prepare(`
  SELECT category, count(*) as count 
  FROM listings 
  GROUP BY category
  ORDER BY count DESC
`).all() as any[];

console.log("\nCategory Distribution:");
console.dir(categories);

// Get brand distribution (top 15)
const brands = sqliteDb.prepare(`
  SELECT brand, count(*) as count 
  FROM listings 
  GROUP BY brand
  ORDER BY count DESC
  LIMIT 15
`).all() as any[];

console.log("\nTop Brands:");
console.dir(brands);

sqliteDb.close();
