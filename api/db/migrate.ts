import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./drizzle.js";
import { logger } from "../infra/logger.js";
import { sql } from "drizzle-orm";

export async function runMigrations(): Promise<void> {
  try {
    logger.info("Starting database migrations...");
    await migrate(db, { migrationsFolder: "./api/db/migrations/drizzle" });
    logger.info("Database migrations completed successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Database migration check encountered an error", { error: message });
    
    try {
      // Check if table structure exists and is reachable
      await db.execute(sql`SELECT 1 FROM prospects LIMIT 1`);
      logger.warn("⚠️ Database migrations check failed, but the prospects table is reachable. Assuming schema is already present. Continuing boot...");
    } catch (testErr) {
      logger.error("Database schema validation test query failed", { error: (testErr as Error).message });
      throw new Error(
        `Failed to run database migrations from ./api/db/migrations/drizzle: ${message}`,
        { cause: err }
      );
    }
  }
}

