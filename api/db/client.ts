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
 * NOTE: /tmp is ephemeral — data does not persist across cold starts.
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

export interface ProspectRecord {
  id: number;
  slug: string;
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  apolloContactId?: string;
  apolloSequenceId?: string;
  status: string;
  landingPageViews: number;
  createdAt: string;
}

export interface ListingRecord {
  id: number;
  prospectId: number;
  asin: string;
  marketplace: string;
  url?: string;
  title?: string;
  bullets?: string; // JSON string representation of string[]
  description?: string;
  brand?: string;
  category?: string;
  price?: number;
  rating?: number;
  reviewCount?: number;
  images?: string; // JSON string representation of string[]
  rawScrapeData?: string; // JSON string representation of record
  scrapedAt?: string;
  createdAt: string;
}

export interface BookingRecord {
  id: number;
  prospectId: number;
  name: string;
  email: string;
  company?: string;
  revenue?: string;
  notes?: string;
  scheduledDate?: string;
  status: string;
  createdAt: string;
}

