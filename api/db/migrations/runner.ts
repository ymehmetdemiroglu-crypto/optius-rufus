import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface MigrationRecord {
  id: number;
  filename: string;
  appliedAt: string;
}

export function initMigrations() {
  // Ensure migrations tracking table exists
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT UNIQUE NOT NULL,
      appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get already applied migrations
  const appliedRows = db
    .prepare("SELECT filename FROM schema_migrations")
    .all() as MigrationRecord[];
  const applied = new Set(appliedRows.map((r) => r.filename));

  // Read migration files in order
  const files = fs
    .readdirSync(__dirname)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const filename of files) {
    if (applied.has(filename)) {
      continue;
    }

    const filepath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filepath, "utf-8");

    console.log(`🔄 Running migration: ${filename}`);

    // Run migration inside a transaction
    const run = db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (filename) VALUES (?)").run(
        filename
      );
    });

    try {
      run();
      console.log(`✅ Migration applied: ${filename}`);
    } catch (err) {
      console.error(`❌ Migration failed: ${filename}`, err);
      throw err;
    }
  }
}
