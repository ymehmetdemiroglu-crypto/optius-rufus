import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
import { logger } from "../infra/logger.js";

const databaseUrl = process.env.DATABASE_URL;

let dbInstance: any;

if (databaseUrl) {
  const pool = new Pool({
    connectionString: databaseUrl,
  });

  pool.on("error", (err) => {
    logger.error("Unexpected PostgreSQL pool error", { error: err.message });
  });

  dbInstance = drizzle(pool, { schema });
} else {
  logger.warn(
    "⚠️ DATABASE_URL is not set. All database queries will fail. " +
      "Please configure DATABASE_URL in your environment."
  );

  // Create a proxy dbInstance that logs a warning on query execution instead of crashing at import time
  dbInstance = new Proxy({}, {
    get(target, prop) {
      return (...args: any[]) => {
        logger.error(`❌ Database query failed: DATABASE_URL is not set. Cannot perform "${String(prop)}" operation.`);
        throw new Error("Database not connected. DATABASE_URL environment variable is missing.");
      };
    }
  });
}

export const db = dbInstance;
