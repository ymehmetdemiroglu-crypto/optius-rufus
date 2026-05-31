import { fetchListingFromAmazon } from "../../services/spapi.js";
import type { Agent, AgentRole, RawListingData } from "../types.js";

export class ListingFetcherAgent implements Agent {
  role: AgentRole = "listing_fetcher";

  async execute(input: unknown): Promise<RawListingData> {
    const { asin, marketplace } = input as { asin: string; marketplace: string };

    if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
      throw new Error(`Invalid ASIN format: ${asin}`);
    }

    const data = await fetchListingFromAmazon(asin, marketplace);

    if (data.asin !== asin) {
      throw new Error(`ASIN mismatch: requested ${asin}, received ${data.asin}`);
    }

    return data;
  }
}
