import Database from "better-sqlite3";
import { join } from "path";
import fs from "fs";

const db = new Database(join(process.cwd(), "data", "optimus.db"));

const query = `
  SELECT 
    p.id as prospectId,
    p.firstName,
    p.lastName,
    p.company,
    p.email,
    p.slug,
    p.asin,
    p.status,
    p.apolloContactId,
    p.apolloSequenceId,
    l.id as listingId,
    l.brand,
    l.title,
    l.category,
    l.price,
    l.reviewCount,
    l.bullets,
    a.id as analysisId,
    a.rufusScore,
    a.cosmoScore,
    a.overallScore,
    a.copySimulatorScenarios,
    a.topIssues,
    a.aiAnalysisRaw
  FROM prospects p
  JOIN listings l ON l.prospectId = p.id
  JOIN listing_analyses a ON a.listingId = l.id
  ORDER BY p.id ASC
`;

const rows = db.prepare(query).all();
console.log(`Extracted ${rows.length} analyzed prospects.`);
fs.writeFileSync(join(process.cwd(), "scratch", "prospects_to_rewrite.json"), JSON.stringify(rows, null, 2));
console.log("Saved to scratch/prospects_to_rewrite.json");

db.close();
