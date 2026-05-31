import { db } from "../../db/client.js";
import type { Agent, AgentRole, RawListingData } from "../types.js";

export class ApifyFetcherAgent implements Agent {
  role: AgentRole = "apify_fetcher";

  async execute(input: unknown): Promise<RawListingData> {
    const { listingId, asin, marketplace } = input as {
      listingId?: number;
      asin?: string;
      marketplace?: string;
    };

    let row: Record<string, unknown> | undefined;

    if (listingId) {
      row = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId) as Record<string, unknown> | undefined;
    } else if (asin) {
      row = db
        .prepare(
          "SELECT * FROM listings WHERE asin = ? AND marketplace = ? ORDER BY createdAt DESC LIMIT 1"
        )
        .get(asin, marketplace || "US") as Record<string, unknown> | undefined;
    }

    if (!row) {
      // Fallback to mock data if not found in DB
      return {
        asin: asin || "B000000000",
        title: "Premium Magnesium Glycinate Supplement — 400mg per Serving, 180 Capsules",
        bullets: [
          "High Absorption Magnesium Glycinate: Gentle on the stomach and easily absorbed.",
          "Supports Restful Sleep & Relaxation: Promotes calmness and helps you fall asleep faster.",
          "Muscle Recovery & Cramp Relief: Ideal for athletes to reduce muscle soreness.",
          "Third-Party Tested & Non-GMO: Made in a GMP-certified facility.",
          "180 Capsules — 3-Month Supply: Each serving delivers 400mg of elemental magnesium.",
        ],
        description: "<p>Our Premium Magnesium Glycinate supplement...</p>",
        brand: "NutraWell",
        category: "Health & Household",
        subcategory: "Vitamins & Dietary Supplements",
        images: ["image1.jpg", "image2.jpg"],
        price: 24.99,
        rating: 4.6,
        reviewCount: 3420,
        attributes: {},
      };
    }

    return {
      asin: row.asin,
      title: row.title || "",
      bullets: safeJsonParse(row.bullets, []),
      description: row.description || "",
      brand: row.brand || "",
      category: row.category || "",
      subcategory: row.category || "",
      images: safeJsonParse(row.images, []),
      price: row.price || 0,
      rating: row.rating || 0,
      reviewCount: row.reviewCount || 0,
      attributes: safeJsonParse(row.rawScrapeData, {}),
    };
  }
}

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}
