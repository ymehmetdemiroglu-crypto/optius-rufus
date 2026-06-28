import Database from "better-sqlite3";
import { join } from "path";

const db = new Database(join(process.cwd(), "data", "optimus.db"));

const query = `
  SELECT 
    p.id, p.firstName, p.lastName, p.company, p.email, p.asin,
    l.brand, l.category, a.rufusScore,
    a.copyAutopsyHeadline as subject,
    a.copyAutopsyBody as body1,
    a.copyBleedBody as body2,
    a.copyRoadmapBody as body3,
    a.copyProblemNarrative as body4,
    a.copyUrgencyCTA as body5
  FROM prospects p
  JOIN listings l ON l.prospectId = p.id
  JOIN listing_analyses a ON a.listingId = l.id
  WHERE p.company IS NOT NULL AND p.company != ''
  ORDER BY p.id ASC
`;

const records = db.prepare(query).all() as any[];

const sampleIds = [2, 8, 262, 1012, 1128]; // NutraWell, goPure Skincare, Torriden, Clear Beauty, Thorne
const samples = records.filter(r => sampleIds.includes(r.id) || (r.company && r.company.includes("Thorne")));

console.log(JSON.stringify(samples.slice(0, 4), null, 2));

db.close();
