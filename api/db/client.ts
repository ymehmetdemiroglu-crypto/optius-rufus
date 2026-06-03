import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Allow custom DB path via environment variable (essential for VPS deployments to persist data outside the code directory)
const dbPath = process.env.DB_PATH 
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, "../../data/optimus.db");

const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`🔌 Connecting to SQLite database at: ${dbPath}`);
const isVercel = !!process.env.VERCEL;

export const db = new Database(dbPath, { readonly: isVercel });

if (!isVercel) {
  db.pragma("journal_mode = WAL");
}
