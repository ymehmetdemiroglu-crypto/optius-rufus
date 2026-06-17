import Database from "better-sqlite3";
import { join } from "path";

const dbPath = join(process.cwd(), "data", "optimus.db");
const sqliteDb = new Database(dbPath);

console.log("=========================================");
console.log("🔧 APOLLO SEQUENCE ID MIGRATION UTILITY");
console.log("=========================================");

const sequenceMap = {
  "seq-enterprise": "6a3005fee287cb000c007e03", // Enterprise Brands (Class A)
  "seq-growth": "6a300617700f6b000cee5416",     // Growth Brands (Class B)
  "seq-starter": "6a30063082147b001cd1f361",    // Starter Brands (Class C)
};

try {
  // 1. Check current counts
  console.log("Current sequence assignment counts before update:");
  const currentCounts = sqliteDb.prepare(`
    SELECT apolloSequenceId, COUNT(*) as count 
    FROM prospects 
    GROUP BY apolloSequenceId
  `).all() as any[];
  
  for (const row of currentCounts) {
    console.log(`- ${row.apolloSequenceId || "NULL"}: ${row.count}`);
  }
  
  // 2. Perform updates
  let totalUpdated = 0;
  for (const [oldId, newId] of Object.entries(sequenceMap)) {
    const updateResult = sqliteDb.prepare(`
      UPDATE prospects
      SET apolloSequenceId = ?
      WHERE apolloSequenceId = ?
    `).run(newId, oldId);
    
    console.log(`\nUpdated '${oldId}' -> '${newId}':`);
    console.log(`- Affected rows: ${updateResult.changes}`);
    totalUpdated += updateResult.changes;
  }
  
  // 3. Check final counts
  console.log("\n-----------------------------------------");
  console.log("Final sequence assignment counts after update:");
  const finalCounts = sqliteDb.prepare(`
    SELECT apolloSequenceId, COUNT(*) as count 
    FROM prospects 
    GROUP BY apolloSequenceId
  `).all() as any[];
  
  for (const row of finalCounts) {
    console.log(`- ${row.apolloSequenceId || "NULL"}: ${row.count}`);
  }
  
  console.log(`\nTotal prospects updated: ${totalUpdated}`);
  console.log("=========================================");
} catch (err: any) {
  console.error("❌ Migration failed:", err.message);
} finally {
  sqliteDb.close();
}
