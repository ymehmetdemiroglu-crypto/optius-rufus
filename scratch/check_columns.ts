import Database from "better-sqlite3";
import { join } from "path";

const db = new Database(join(process.cwd(), "data", "optimus.db"));

console.log("=== PROSPECTS COLUMNS ===");
console.log(db.prepare("PRAGMA table_info(prospects)").all().map((c: any) => c.name));

console.log("\n=== LISTING_ANALYSES COLUMNS ===");
console.log(db.prepare("PRAGMA table_info(listing_analyses)").all().map((c: any) => c.name));

db.close();
