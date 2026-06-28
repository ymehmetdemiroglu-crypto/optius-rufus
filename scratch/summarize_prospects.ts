import fs from "fs";
import { join } from "path";

const data = JSON.parse(fs.readFileSync(join(process.cwd(), "scratch", "prospects_to_rewrite.json"), "utf-8"));

console.log(`Total records in JSON: ${data.length}`);

const statusCounts: Record<string, number> = {};
let validNamesCount = 0;
let validCompanyCount = 0;

for (const p of data) {
  statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  if (p.firstName && p.firstName !== 'null' && p.firstName !== 'there') validNamesCount++;
  if (p.company && !p.company.startsWith('Visit the') && !p.company.startsWith('Brand:')) validCompanyCount++;
}

console.log("Status Breakdown:", statusCounts);
console.log(`Prospects with personal first names: ${validNamesCount}`);
console.log(`Prospects with clean company names: ${validCompanyCount}`);

// Let's print details of top 10 analyzed / target prospects
const targets = data.filter((p: any) => p.status === 'analyzed' || (p.firstName && p.firstName !== 'null'));
console.log(`\nTarget prospects for bespoke email copywriting (${targets.length}):`);
targets.slice(0, 15).forEach((t: any, i: number) => {
  console.log(`\n[${i+1}] ID: ${t.prospectId} | Name: ${t.firstName} ${t.lastName} | Company: ${t.company} | Brand: ${t.brand}`);
  console.log(`    ASIN: ${t.asin} | Category: ${t.category} | Rufus Score: ${t.rufusScore}`);
});
