import fs from "fs";
import { join } from "path";

const data = JSON.parse(fs.readFileSync(join(process.cwd(), "scratch", "prospects_to_rewrite.json"), "utf-8"));

const validProspects = data.filter((p: any) => {
  const fn = (p.firstName || "").trim().toLowerCase();
  const ln = (p.lastName || "").trim().toLowerCase();
  const comp = (p.company || "").trim().toLowerCase();
  const email = (p.email || "").trim().toLowerCase();

  if (!fn || fn === "null" || fn === "there" || fn === "alex seller" || fn === "bunker bullies") return false;
  if (email.includes("example.com") || email.includes("test.com")) return false;
  return true;
});

console.log(`FOUND ${validProspects.length} HIGH-QUALITY DECISION MAKER PROSPECTS!`);
fs.writeFileSync(join(process.cwd(), "scratch", "valid_prospects.json"), JSON.stringify(validProspects, null, 2));

validProspects.forEach((p: any, idx: number) => {
  console.log(`[${idx+1}] ID: ${p.prospectId} | ${p.firstName} ${p.lastName} | ${p.company} | ASIN: ${p.asin || 'N/A'} | Rufus: ${p.rufusScore}/100 | Status: ${p.status}`);
});
