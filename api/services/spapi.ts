import type { RawListingData } from "../agents/types.js";

export async function fetchListingFromAmazon(asin: string, marketplace = "US"): Promise<RawListingData> {
  return {
    asin,
    title: `Mock SP-API Product: ${asin}`,
    bullets: [
      "Mock SP-API Bullet 1",
      "Mock SP-API Bullet 2",
      "Mock SP-API Bullet 3",
      "Mock SP-API Bullet 4",
      "Mock SP-API Bullet 5",
    ],
    description: "Mock description from Selling Partner API.",
    brand: "MockBrand",
    category: "Mock Category",
    subcategory: "Mock Subcategory",
    images: ["mock-image-1.jpg"],
    price: 99.99,
    rating: 4.8,
    reviewCount: 42,
    attributes: {},
  };
}
