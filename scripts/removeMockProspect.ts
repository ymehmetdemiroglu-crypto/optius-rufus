import { db } from "../api/db/client.ts";

async function run() {
  console.log("🧹 Removing mock-prospect data from database...");
  
  const prospect = db.prepare("SELECT id FROM prospects WHERE slug = ?").get("mock-prospect") as { id: number } | undefined;
  
  if (prospect) {
    const analysesDel = db.prepare("DELETE FROM listing_analyses WHERE prospectId = ?").run(prospect.id);
    const listingsDel = db.prepare("DELETE FROM listings WHERE prospectId = ?").run(prospect.id);
    const prospectDel = db.prepare("DELETE FROM prospects WHERE id = ?").run(prospect.id);
    
    console.log(`✨ Successfully removed:`);
    console.log(`   - ${analysesDel.changes} listing analysis records`);
    console.log(`   - ${listingsDel.changes} listing records`);
    console.log(`   - ${prospectDel.changes} prospect records`);
  } else {
    console.log("ℹ️ No 'mock-prospect' records found in the database.");
  }
}

run().catch((err) => {
  console.error("💥 Error removing mock prospect:", err);
  process.exit(1);
});
