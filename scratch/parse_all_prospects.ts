import Database from "better-sqlite3";
import { join } from "path";

const db = new Database(join(process.cwd(), "data", "optimus.db"));

const prospects = db.prepare("SELECT * FROM prospects").all();
console.log(`TOTAL PROSPECTS IN SQLITE: ${prospects.length}`);
for (const p of prospects as any[]) {
  const listing = db.prepare("SELECT * FROM listings WHERE prospectId = ? ORDER BY id DESC LIMIT 1").get(p.id) as any;
  const analysis = listing ? db.prepare("SELECT * FROM listing_analyses WHERE listingId = ? ORDER BY id DESC LIMIT 1").get(listing.id) as any : null;
  
  console.log(`\n==================================================`);
  console.log(`PROSPECT [ID: ${p.id}] - Status: ${p.status}`);
  console.log(`Name: ${p.firstName || ''} ${p.lastName || ''}`);
  console.log(`Company: ${p.company || ''}`);
  console.log(`Email: ${p.email || ''}`);
  console.log(`ASIN: ${p.asin || listing?.asin || ''}`);
  console.log(`Apollo Contact ID: ${p.apolloContactId || ''}`);
  console.log(`Apollo Sequence ID: ${p.apolloSequenceId || ''}`);
  if (listing) {
    console.log(`Brand: ${listing.brand || ''} | Category: ${listing.category || ''} | Price: $${listing.price} | Reviews: ${listing.reviewCount}`);
    console.log(`Title: ${listing.title ? listing.title.slice(0, 80) + '...' : ''}`);
  }
  if (analysis) {
    console.log(`Rufus Score: ${analysis.rufusScore}/100 | COSMO Score: ${analysis.cosmoScore}/100`);
    console.log(`AI Analysis Raw snippet: ${analysis.aiAnalysisRaw ? analysis.aiAnalysisRaw.slice(0, 200) + '...' : 'None'}`);
    console.log(`Top Issues: ${analysis.topIssues || 'None'}`);
  }
}

db.close();
