import Database from "better-sqlite3";
import path from "path";

function run() {
  console.log("Checking data/optimus.db contents...");
  try {
    const dbPath = path.resolve("data/optimus.db");
    const db = new Database(dbPath);

    // List all tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    console.log("Tables in SQLite database:", tables.map(t => t.name).join(", "));

    for (const table of tables) {
      try {
        const count = db.prepare(`SELECT count(*) as count FROM ${table.name}`).get() as any;
        console.log(`  - Table '${table.name}': ${count.count} rows`);
      } catch (err) {
        console.log(`  - Table '${table.name}': Could not count (${(err as Error).message})`);
      }
    }

    // Print table schemas
    const tablesToInspect = ["prospects", "listings", "listing_analyses", "bookings", "prospect_activities"];
    for (const tableName of tablesToInspect) {
      console.log(`\nSchema for '${tableName}':`);
      const info = db.prepare(`PRAGMA table_info(${tableName})`).all() as any[];
      for (const col of info) {
        console.log(`  - ${col.name} (${col.type})`);
      }
    }

  } catch (err) {
    console.error("Failed to inspect SQLite:", err);
  }
}

run();
