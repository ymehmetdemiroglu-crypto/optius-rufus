import Database from "better-sqlite3";
import { db } from "./client.js";

/**
 * Execute a function within an explicit SQLite transaction.
 * Automatically commits on success, rolls back on error.
 *
 * @deprecated Migrate to PostgreSQL transactions via Drizzle ORM.
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
 * @deprecated Migrate to PostgreSQL transactions via Drizzle ORM.
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
