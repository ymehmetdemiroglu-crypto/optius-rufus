import Database from "better-sqlite3";
import { join } from "path";
import fs from "fs";

async function main() {
  console.log("=== DUMPING PROSPECT DETAILS FROM SQLITE ===");
  const sqlitePath = join(process.cwd(), "data", "optimus.db");
  if (!fs.existsSync(sqlitePath)) {
    console.log("SQLite database file not found.");
    process.exit(0);
  }

  const db = new Database(sqlitePath);
  
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
      a.semanticGaps,
      a.copy_autopsy_headline,
      a.copy_autopsy_body
    FROM prospects p
    LEFT JOIN listings l ON l.prospectId = p.id
    LEFT JOIN listing_analyses a ON a.listingId = l.id
    ORDER BY p.id ASC
  `;

  const rows = db.prepare(query).all() as any[];
  console.log(`Total prospects found in SQLite: ${rows.length}\n`);

  for (const r of rows) {
    console.log(`--------------------------------------------------`);
    console.log(`Prospect ID: ${r.prospectId}`);
    console.log(`Name: ${r.firstName} ${r.lastName}`);
    console.log(`Company: ${r.company}`);
    console.log(`Email: ${r.email}`);
    console.log(`Status: ${r.status}`);
    console.log(`ASIN: ${r.asin}`);
    console.log(`Slug: ${r.slug}`);
    console.log(`Apollo Contact ID: ${r.apolloContactId}`);
    console.log(`Brand: ${r.brand}`);
    console.log(`Category: ${r.category}`);
    console.log(`Price: $${r.price}, Reviews: ${r.reviewCount}`);
    console.log(`Rufus Score: ${r.rufusScore}/100, COSMO Score: ${r.cosmoScore}/100`);
    console.log(`Copy Simulator Scenarios: ${r.copySimulatorScenarios ? r.copySimulatorScenarios.slice(0, 300) : 'None'}`);
    console.log(`Semantic Gaps: ${r.semanticGaps ? r.semanticGaps.slice(0, 300) : 'None'}`);
  }

  db.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
