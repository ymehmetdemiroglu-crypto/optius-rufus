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
  packageType?: string;
  pricePoint?: number;
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
  aPlusText?: string;
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

export interface BrandSettingsRecord {
  id: number;
  companyName?: string;
  logoUrl?: string;
  logoBase64?: string;
  primaryColor?: string;
  website?: string;
  createdAt: string;
}

export interface RufusQueryRecord {
  id: number;
  prospectId: number;
  queryText: string;
  category: string;
  createdAt: string;
}

export interface RufusQueryRunRecord {
  id: number;
  queryId: number;
  asinRankings: string; // JSON representation of ranking objects
  sovPercent: number;
  createdAt: string;
}

export interface CatalogLinkRecord {
  id: number;
  prospectId: number;
  sourceAsin: string;
  targetAsin: string;
  relationshipType: string;
  strengthScore: number;
  createdAt: string;
}

export interface PipelineJobRecord {
  id: number;
  prospectId: number;
  listingId?: number;
  packageType?: string;
  status: string;
  currentStage?: string;
  stagesJSON?: string;
  tokenUsage: number;
  errorLog?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineJobStageRecord {
  id: number;
  jobId: number;
  stageName: string;
  status: string;
  outputJSON?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface UsageEventRecord {
  id: number;
  prospectId: number;
  jobId?: number;
  service: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  costCents: number;
  createdAt: string;
}

export interface JobQueueRecord {
  id: number;
  queue: string;
  name: string;
  dataJSON: string;
  optsJSON?: string;
  progress: number;
  delay: number;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  processedOn?: number;
  finishedOn?: number;
  returnValueJSON?: string;
  failedReason?: string;
  stacktraceJSON?: string;
  status: string;
  createdAt: string;
}

/**
 * Execute a function within an explicit SQLite transaction.
 * Automatically commits on success, rolls back on error.
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

