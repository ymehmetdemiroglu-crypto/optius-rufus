import Database from "better-sqlite3";
import { join } from "path";

const db = new Database(join(process.cwd(), "data", "optimus.db"));

const total = db.prepare("SELECT COUNT(*) as c FROM prospects p JOIN listings l ON l.prospectId=p.id JOIN listing_analyses a ON a.listingId=l.id").get() as any;
const withIssues = db.prepare("SELECT COUNT(*) as c FROM prospects p JOIN listings l ON l.prospectId=p.id JOIN listing_analyses a ON a.listingId=l.id WHERE a.topIssues IS NOT NULL AND a.topIssues != '[]' AND a.topIssues != 'null'").get() as any;
const withScenarios = db.prepare("SELECT COUNT(*) as c FROM prospects p JOIN listings l ON l.prospectId=p.id JOIN listing_analyses a ON a.listingId=l.id WHERE a.copySimulatorScenarios IS NOT NULL").get() as any;
const withRufusScore = db.prepare("SELECT COUNT(*) as c FROM prospects p JOIN listings l ON l.prospectId=p.id JOIN listing_analyses a ON a.listingId=l.id WHERE a.rufusScore > 0").get() as any;
const withOverallScore = db.prepare("SELECT COUNT(*) as c FROM prospects p JOIN listings l ON l.prospectId=p.id JOIN listing_analyses a ON a.listingId=l.id WHERE a.overallScore > 0").get() as any;

console.log(`Total prospects with listings + analyses: ${total.c}`);
console.log(`With topIssues data:         ${withIssues.c}`);
console.log(`With copySimulatorScenarios: ${withScenarios.c}`);
console.log(`With rufusScore > 0:         ${withRufusScore.c}`);
console.log(`With overallScore > 0:       ${withOverallScore.c}`);

// Sample categories
const cats = db.prepare("SELECT DISTINCT l.category, COUNT(*) as n FROM listings l GROUP BY l.category ORDER BY n DESC LIMIT 15").all() as any[];
console.log("\nTop categories:");
cats.forEach(c => console.log(`  ${c.category}: ${c.n}`));

db.close();
