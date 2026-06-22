import { loadEnv } from "../scripts/agent/envLoader.js";
loadEnv();

import { db } from "../api/db/drizzle.js";
import * as schema from "../api/db/schema.js";

async function run() {
  try {
    const input = {
      prospectId: 18,
      asin: "B0DNQ1BV41",
      marketplace: "US",
      url: "https://www.amazon.com/dp/B0DNQ1BV41",
      title: "Premium Magnesium Glycinate Supplement — 400mg per Serving, 180 Capsules",
      bullets: [
        "High Absorption Magnesium Glycinate: Gentle on the stomach and easily absorbed.",
        "Supports Restful Sleep & Relaxation: Promotes calmness and helps you fall asleep faster.",
        "Muscle Recovery & Cramp Relief: Ideal for athletes to reduce muscle soreness.",
        "Third-Party Tested & Non-GMO: Made in a GMP-certified facility.",
        "180 Capsules — 3-Month Supply: Each serving delivers 400mg of elemental magnesium."
      ],
      description: "<p>Our Premium Magnesium Glycinate supplement is specifically designed for maximum bioavailability and gastrointestinal comfort.</p>",
      brand: "NutraWell",
      category: "Health & Household",
      price: 24.99,
      rating: 4.6,
      reviewCount: 3420,
      images: ["image1.jpg", "image2.jpg"],
      aPlusText: "NutraWell Magnesium Glycinate is formulated with pure magnesium chelate. Promotes deep sleep, reduces night leg cramps, and aids in faster muscle recovery after exercise.",
      rawScrapeData: { mock: true },
      scrapedAt: new Date()
    };

    console.log("Attempting direct Drizzle insert...");
    const result = await db.insert(schema.listings).values(input).returning();
    console.log("Success! Inserted row ID:", result[0].id);
  } catch (err) {
    console.error("Direct insert failed:");
    if (err instanceof Error) {
      console.error("Message:", err.message);
      console.error("Stack:", err.stack);
      console.error("Cause:", err.cause);
    } else {
      console.error(err);
    }
  }
}

run();
