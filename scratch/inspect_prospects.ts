import { db } from "../api/db/drizzle.js";
import { prospects, listings, listingAnalyses } from "../api/db/schema.js";
import { eq } from "drizzle-orm";
import Database from "better-sqlite3";
import { join } from "path";
import fs from "fs";

async function main() {
  console.log("--- Checking Postgres via Drizzle ---");
  try {
    const pPostgres = await db.select().from(prospects);
    console.log(`Postgres prospects count: ${pPostgres.length}`);
    for (const p of pPostgres) {
      console.log(`ID: ${p.id}, Name: ${p.firstName} ${p.lastName}, Company: ${p.company}, Email: ${p.email}, Status: ${p.status}`);
    }
  } catch (e: any) {
    console.log(`Postgres error: ${e.message}`);
  }

  console.log("\n--- Checking SQLite data/optimus.db ---");
  const sqlitePath = join(process.cwd(), "data", "optimus.db");
  if (fs.existsSync(sqlitePath)) {
    try {
      const sqliteDb = new Database(sqlitePath);
      const rows = sqliteDb.prepare("SELECT id, firstName, lastName, company, email, status, asin, slug FROM prospects").all() as any[];
      console.log(`SQLite prospects count: ${rows.length}`);
      for (const r of rows) {
        console.log(`ID: ${r.id}, Name: ${r.firstName} ${r.lastName}, Company: ${r.company}, Email: ${r.email}, Status: ${r.status}, ASIN: ${r.asin}`);
      }
    } catch (e: any) {
      console.log(`SQLite error: ${e.message}`);
    }
  } else {
    console.log("SQLite file data/optimus.db does not exist.");
  }
}

main();
