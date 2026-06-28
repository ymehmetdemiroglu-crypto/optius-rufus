import Database from "better-sqlite3";
import { join } from "path";

const db = new Database(join(process.cwd(), "data", "optimus.db"));

console.log("=== TABLES ===");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log(tables);

console.log("\n=== PROSPECTS COLS ===");
console.log(db.prepare("PRAGMA table_info(prospects)").all().map((c: any) => c.name));

console.log("\n=== LISTINGS COLS ===");
console.log(db.prepare("PRAGMA table_info(listings)").all().map((c: any) => c.name));

console.log("\n=== LISTING_ANALYSES COLS ===");
console.log(db.prepare("PRAGMA table_info(listing_analyses)").all().map((c: any) => c.name));

console.log("\n=== PROSPECTS DATA ===");
const prospectsData = db.prepare("SELECT * FROM prospects").all();
console.log(JSON.stringify(prospectsData, null, 2));

console.log("\n=== LISTINGS DATA ===");
const listingsData = db.prepare("SELECT * FROM listings").all();
console.log(JSON.stringify(listingsData, null, 2));

console.log("\n=== LISTING_ANALYSES DATA ===");
const analysesData = db.prepare("SELECT * FROM listing_analyses").all();
console.log(JSON.stringify(analysesData, null, 2));

db.close();
