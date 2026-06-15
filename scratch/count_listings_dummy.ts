import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "data", "optimus.db");
const sqliteDb = new Database(dbPath);

const count = sqliteDb.prepare(`
  SELECT count(distinct p.id) as count 
  FROM prospects p
  JOIN listings l ON l.prospectId = p.id
  WHERE p.email LIKE 'no-email-%' 
    AND (p.apolloContactId IS NULL OR p.apolloContactId = '' OR p.apolloContactId LIKE 'mock-%')
`).get() as any;

console.log(`Prospects with listings and dummy emails: ${count.count}`);

sqliteDb.close();
