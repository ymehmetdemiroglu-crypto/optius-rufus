import { scrapeAmazonListing } from "../../services/scraper.js";
import type { Agent, AgentRole, RawListingData } from "../types.js";

export class ListingFetcherAgent implements Agent {
  role: AgentRole = "listing_fetcher";

  async execute(input: unknown): Promise<RawListingData> {
    const { asin, marketplace } = input as { asin: string; marketplace: string };

    if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
      throw new Error(`Invalid ASIN format: ${asin}`);
    }

    const data = await scrapeAmazonListing(asin, marketplace);

    if (data.asin !== asin) {
      throw new Error(`ASIN mismatch: requested ${asin}, received ${data.asin}`);
    }

    return {
      asin: data.asin,
      title: data.title,
      bullets: data.bullets,
      description: data.description,
      brand: data.brand,
      category: data.category,
      subcategory: data.category,
      images: data.images,
      price: data.price,
      rating: data.rating,
      reviewCount: data.reviewCount,
      attributes: data.rawScrapeData ? JSON.parse(data.rawScrapeData) : {},
    };
  }
}
