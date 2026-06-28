import Database from "better-sqlite3";
const db = new Database("data/optimus.db");
const rows = db.prepare(`
  SELECT p.firstName, p.company, l.category,
         a.copyAutopsyHeadline, a.copyAutopsyBody, a.copyBleedBody
  FROM prospects p
  JOIN listings l ON l.prospectId=p.id
  JOIN listing_analyses a ON a.listingId=l.id
  WHERE a.copyAutopsyBody IS NOT NULL
  LIMIT 8
`).all() as any[];
rows.forEach((r, i) => {
  console.log(`\n=== PROSPECT ${i + 1}: ${r.firstName || "(no name)"} @ ${r.company} [${r.category}]`);
  console.log(`SUBJECT: ${r.copyAutopsyHeadline}`);
  console.log(`\nEMAIL 1:\n${r.copyAutopsyBody}`);
  console.log(`\nEMAIL 2 (BUMP):\n${r.copyBleedBody}`);
  console.log("─".repeat(70));
});
db.close();
