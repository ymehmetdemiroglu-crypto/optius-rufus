import { getProspectBySlug } from "./api/domains/prospect/service.js";

async function main() {
  const result = await getProspectBySlug("anker-audio-audit");
  console.log("PROSPECT:", result.prospect ? result.prospect.id : null);
  console.log("LISTING:", result.listing ? result.listing.id : null);
  console.log("ANALYSIS:", result.analysis ? result.analysis.id : null);
}

main().catch(console.error);
