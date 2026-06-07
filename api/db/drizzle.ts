import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
import { logger } from "../infra/logger.js";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required but not set. " +
      "Add it to your .env file (e.g., postgres://user:pass@localhost:5432/optimus)"
  );
}

const pool = new Pool({
  connectionString: databaseUrl,
});

pool.on("error", (err) => {
  logger.error("Unexpected PostgreSQL pool error", { error: err.message });
});

export const db = drizzle(pool, { schema });
