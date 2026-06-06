import "../api/db/schema.js";
import { db } from "../api/db/client.js";

const prospects = db.prepare("SELECT id, slug, email, company, status, packageType, pricePoint FROM prospects").all();
console.log("PROSPECTS IN DATABASE:");
console.log(JSON.stringify(prospects, null, 2));

const analyses = db.prepare("SELECT id, listingId, prospectId, overallScore, rufusScore, cosmoScore, packageType, pricePoint FROM listing_analyses").all();
console.log("\nANALYSES IN DATABASE:");
console.log(JSON.stringify(analyses, null, 2));
