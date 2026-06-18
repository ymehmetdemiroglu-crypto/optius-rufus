import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import * as schema from "./schema.js";
import { logger } from "../infra/logger.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

const databaseUrl = process.env.DATABASE_URL;

function buildPoolConfig(): PoolConfig {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is required. Set it to a PostgreSQL connection string."
    );
  }

  const maxConnections = parseInt(process.env.DATABASE_POOL_MAX || "20", 10);
  const sslMode = process.env.DATABASE_SSL_MODE;

  const ssl: PoolConfig["ssl"] =
    sslMode === "require" || sslMode === "true" || process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : sslMode === "prefer"
        ? { rejectUnauthorized: false }
        : undefined;

  return {
    connectionString: databaseUrl,
    max: Number.isNaN(maxConnections) ? 20 : maxConnections,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl,
  };
}

let dbInstance: NodePgDatabase<typeof schema>;

if (databaseUrl) {
  const pool = new Pool(buildPoolConfig());

  pool.on("error", (err) => {
    logger.error("Unexpected PostgreSQL pool error", { error: err.message });
  });

  pool.on("connect", () => {
    logger.debug("New PostgreSQL connection established");
  });

  dbInstance = drizzle(pool, { schema });
} else {
  logger.warn(
    "⚠️ DATABASE_URL is not set. All database queries will fail. " +
      "Please configure DATABASE_URL in your environment."
  );

  // Create a proxy dbInstance that logs a warning on query execution instead of crashing at import time
  dbInstance = new Proxy({} as NodePgDatabase<typeof schema>, {
    get(_target, prop) {
      return (...args: unknown[]) => {
        logger.error(
          `❌ Database query failed: DATABASE_URL is not set. Cannot perform "${String(prop)}" operation.`,
          { args }
        );
        throw new Error("Database not connected. DATABASE_URL environment variable is missing.");
      };
    },
  });
}

export const db = dbInstance;
