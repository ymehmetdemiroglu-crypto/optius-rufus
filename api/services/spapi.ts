import type { RawListingData } from "../agents/types.js";

/**
 * Stub: Fetch listing data from Amazon SP-API.
 * In production, this calls the actual Selling Partner API.
 */
export async function fetchListingFromAmazon(
  asin: string,
  _marketplace: string
): Promise<RawListingData> {
  // Simulate network latency
  await delay(800 + Math.random() * 400);

  return {
    asin,
    title: `Premium Magnesium Glycinate Supplement — 400mg per Serving, 180 Capsules, Supports Sleep, Stress Relief & Muscle Recovery`,
    bullets: [
      "High Absorption Magnesium Glycinate: Gentle on the stomach and easily absorbed for maximum effectiveness without laxative effects.",
      "Supports Restful Sleep & Relaxation: Promotes calmness and helps you fall asleep faster and wake up refreshed.",
      "Muscle Recovery & Cramp Relief: Ideal for athletes and active individuals to reduce muscle soreness and prevent cramps.",
      "Third-Party Tested & Non-GMO: Made in a GMP-certified facility with rigorous quality testing for purity and potency.",
      "180 Capsules — 3-Month Supply: Each serving delivers 400mg of elemental magnesium from 2000mg magnesium glycinate complex.",
    ],
    description:
      "<p>Our Premium Magnesium Glycinate supplement...</p>",
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

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
