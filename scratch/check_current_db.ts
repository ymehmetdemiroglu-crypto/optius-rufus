import Database from "better-sqlite3";
import { join } from "path";
import fs from "fs";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../api/db/schema.js";

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

console.log("=== DB CHECK UTILITY ===");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Defined" : "Not Defined");
console.log("DB_PATH:", process.env.DB_PATH || "Not Defined");

// 1. Check SQLite
try {
  const dbPath = join(process.cwd(), process.env.DB_PATH || "data/optimus.db");
  if (fs.existsSync(dbPath)) {
    console.log(`\n--- SQLite Database found at: ${dbPath} ---`);
    const sqliteDb = new Database(dbPath);
    const tables = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    console.log("Tables:", tables.map((t) => t.name).join(", "));
    
    if (tables.some((t) => t.name === "prospects")) {
      const prospects = sqliteDb.prepare("SELECT * FROM prospects WHERE expectedRevenue IS NOT NULL ORDER BY id DESC").all() as any[];
      const listings = sqliteDb.prepare("SELECT * FROM listings").all() as any[];
      const analyses = sqliteDb.prepare("SELECT * FROM listing_analyses").all() as any[];
      
      console.log(`\nFound ${prospects.length} prospects with expected revenue in SQLite.`);
      console.log(`Displaying first 5 classified prospects:`);
      const previewProspects = prospects.slice(0, 5);
      for (const p of previewProspects) {
        console.log(`\n--- Prospect #${p.id}: ${p.firstName || ""} ${p.lastName || ""} (${p.company || "No Company"}) ---`);
        console.log(`Email: ${p.email}`);
        console.log(`Status: ${p.status}`);
        console.log(`Expected Revenue: ${p.expectedRevenue}`);
        console.log(`Sequence Assigned: ${p.apolloSequenceId}`);
        console.log(`Slug: ${p.slug}`);
        console.log(`ASIN: ${p.asin}`);
        
        const pListings = listings.filter(l => l.prospectId === p.id);
        console.log(`Listings (${pListings.length}):`, pListings.map(l => `${l.asin} (${l.title ? (l.title.length > 50 ? l.title.substring(0, 50) + '...' : l.title) : "No Title"})`).join(", "));
        
        const pAnalyses = analyses.filter(a => a.prospectId === p.id);
        console.log(`Analyses (${pAnalyses.length}):`, pAnalyses.map(a => `Score: ${a.overallScore}/100`).join(", "));
      }
    } else {
      console.log("No 'prospects' table found in SQLite.");
    }
    sqliteDb.close();
  } else {
    console.log(`\n--- SQLite Database not found at: ${dbPath} ---`);
  }
} catch (err) {
  console.error("Error querying SQLite:", err);
}

// 2. Check PostgreSQL
async function checkPostgres() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.log("\n--- PostgreSQL: Skipping because DATABASE_URL is not set ---");
    return;
  }
  
  console.log(`\n--- PostgreSQL Database connection check ---`);
  const pool = new Pool({ connectionString: databaseUrl });
  try {
    const client = drizzle(pool, { schema });
    const rows = await client.select().from(schema.prospects);
    console.log(`Prospects count: ${rows.length}`);
    console.log("Prospects details:");
    console.dir(rows, { depth: null, colors: true });
  } catch (err) {
    console.error("Error querying PostgreSQL:", err);
  } finally {
    await pool.end();
  }
}

checkPostgres();
