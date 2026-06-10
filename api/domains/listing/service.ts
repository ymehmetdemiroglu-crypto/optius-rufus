import * as listingRepo from "./repository.js";
import type { ListingRecord, InsertListingInput } from "../../db/schema.types.js";

export interface CreateListingInput {
  prospectId: number;
  asin: string;
  marketplace?: string;
  url?: string;
  title?: string;
  bullets?: string[];
  description?: string;
  brand?: string;
  category?: string;
  price?: number;
  rating?: number;
  reviewCount?: number;
  images?: string[];
  aPlusText?: string;
  rawScrapeData?: Record<string, unknown>;
}

export async function createListing(
  input: CreateListingInput
): Promise<ListingRecord> {
  const insertInput: InsertListingInput = {
    prospectId: input.prospectId,
    asin: input.asin,
    marketplace: input.marketplace || "US",
    url: input.url,
    title: input.title,
    bullets: input.bullets,
    description: input.description,
    brand: input.brand,
    category: input.category,
    price: input.price,
    rating: input.rating,
    reviewCount: input.reviewCount,
    images: input.images,
    aPlusText: input.aPlusText,
    rawScrapeData: input.rawScrapeData,
    scrapedAt: new Date(),
  };
  try {
    return await listingRepo.create(insertInput);
  } catch (err) {
    throw new Error("Failed to create listing", { cause: err });
  }
}

export async function getListingById(
  id: number
): Promise<ListingRecord | undefined> {
  try {
    return await listingRepo.getById(id);
  } catch (err) {
    throw new Error(`Failed to fetch listing ${id}`, { cause: err });
  }
}

export async function getLatestListingByProspectId(
  prospectId: number
): Promise<ListingRecord | undefined> {
  try {
    return await listingRepo.getLatestByProspectId(prospectId);
  } catch (err) {
    throw new Error(
      `Failed to fetch latest listing for prospect ${prospectId}`,
      { cause: err }
    );
  }
}

export async function updateEmbedding(
  listingId: number,
  vector: number[]
): Promise<void> {
  try {
    await listingRepo.updateEmbedding(listingId, vector);
  } catch (err) {
    throw new Error(`Failed to update embedding for listing ${listingId}`, {
      cause: err,
    });
  }
}
