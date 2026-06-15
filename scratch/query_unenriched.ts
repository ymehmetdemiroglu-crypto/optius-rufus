import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "data", "optimus.db");
const sqliteDb = new Database(dbPath);

const total = sqliteDb.prepare("SELECT count(*) as count FROM prospects").get() as any;
const unenriched = sqliteDb.prepare("SELECT count(*) as count FROM prospects WHERE apolloContactId IS NULL OR apolloContactId = '' OR apolloContactId LIKE 'mock-%'").get() as any;
const realEmailUnenriched = sqliteDb.prepare("SELECT count(*) as count FROM prospects WHERE (apolloContactId IS NULL OR apolloContactId = '' OR apolloContactId LIKE 'mock-%') AND email NOT LIKE 'no-email-%'").get() as any;

console.log(`Total prospects: ${total.count}`);
console.log(`Unenriched prospects: ${unenriched.count}`);
console.log(`Unenriched prospects with REAL emails: ${realEmailUnenriched.count}`);

if (realEmailUnenriched.count > 0) {
  const sample = sqliteDb.prepare("SELECT * FROM prospects WHERE (apolloContactId IS NULL OR apolloContactId = '' OR apolloContactId LIKE 'mock-%') AND email NOT LIKE 'no-email-%' LIMIT 10").all() as any[];
  console.log("Sample of unenriched prospects with real emails:");
  console.dir(sample);
} else {
  const sampleNoEmail = sqliteDb.prepare("SELECT * FROM prospects WHERE apolloContactId IS NULL OR apolloContactId = '' OR apolloContactId LIKE 'mock-%' LIMIT 5").all() as any[];
  console.log("Sample of unenriched prospects (dummy emails):");
  console.dir(sampleNoEmail);
}

sqliteDb.close();
