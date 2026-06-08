import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Allow custom DB path via environment variable (essential for VPS deployments to persist data outside the code directory)
const bundledDbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, "../../data/optimus.db");

const isVercel = !!process.env.VERCEL;

/**
 * On Vercel, the bundled DB file is inside the read-only deployment bundle.
 * We copy it to /tmp (the only writable directory in a serverless function)
 * so that mutation endpoints (bookings, views, activities) can write.
 * 
 * ⚠️ CRITICAL: /tmp is ephemeral — data does not persist across cold starts.
 * All writes (prospects, bookings, activities, pipeline jobs) are LOST when
 * the function instance recycles. For production persistence, migrate to:
 *   - PostgreSQL (Neon, Supabase, Railway)
 *   - MySQL (PlanetScale, RDS)
 *   - Or use Vercel Postgres / Vercel Blob for specific data
 * 
 * This SQLite setup is suitable for demos and local development only.
 */
let dbPath: string;

if (isVercel) {
  const tmpDbPath = "/tmp/optimus.db";
  if (!fs.existsSync(tmpDbPath) && fs.existsSync(bundledDbPath)) {
    fs.copyFileSync(bundledDbPath, tmpDbPath);
    console.log(`📋 Copied bundled DB to writable /tmp for Vercel.`);
  }
  dbPath = tmpDbPath;
} else {
  dbPath = bundledDbPath;
}

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`🔌 Connecting to SQLite database at: ${dbPath}`);

export const db: Database.Database = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/**
 * Execute a function within an explicit SQLite transaction.
 * Automatically commits on success, rolls back on error.
 *
 * @deprecated Use `withTransaction` from `./transaction.js` instead.
 */
export function withTransaction<T>(fn: (db: Database.Database) => T): T {
  db.prepare("BEGIN").run();
  try {
    const result = fn(db);
    db.prepare("COMMIT").run();
    return result;
  } catch (err) {
    db.prepare("ROLLBACK").run();
    throw err;
  }
}

/**
 * Async variant of withTransaction.
 *
 * @deprecated Use `withTransactionAsync` from `./transaction.js` instead.
 */
export async function withTransactionAsync<T>(
  fn: (db: Database.Database) => Promise<T>
): Promise<T> {
  db.prepare("BEGIN").run();
  try {
    const result = await fn(db);
    db.prepare("COMMIT").run();
    return result;
  } catch (err) {
    db.prepare("ROLLBACK").run();
    throw err;
  }
}

