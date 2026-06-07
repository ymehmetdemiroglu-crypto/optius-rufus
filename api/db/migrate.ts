import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./drizzle.js";
import { logger } from "../infra/logger.js";

export async function runMigrations(): Promise<void> {
  try {
    logger.info("Starting database migrations...");
    await migrate(db, { migrationsFolder: "./api/db/migrations/drizzle" });
    logger.info("Database migrations completed successfully.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error("Database migration failed", { error: message });
    throw new Error(
      `Failed to run database migrations from ./api/db/migrations/drizzle: ${message}`,
      { cause: err }
    );
  }
}
