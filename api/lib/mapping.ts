import { safeJsonParse } from "./json.js";
import type { RawListingData } from "../pipeline/pipeline.types.js";

export interface ListingRecordLike {
  asin: string;
  title?: string | null;
  bullets?: string | null;
  description?: string | null;
  brand?: string | null;
  category?: string | null;
  price?: number | null;
  rating?: number | null;
  reviewCount?: number | null;
  images?: string | null;
  rawScrapeData?: string | null;
}

export function mapListingRecordToRawListingData(row: ListingRecordLike): RawListingData {
  return {
    asin: row.asin,
    title: row.title || "",
    bullets: safeJsonParse(row.bullets, []),
    description: row.description || "",
    brand: row.brand || "",
    category: row.category || "",
    subcategory: row.category || "",
    images: safeJsonParse(row.images, []),
    price: row.price ?? 0,
    rating: row.rating ?? 0,
    reviewCount: row.reviewCount ?? 0,
    attributes: safeJsonParse(row.rawScrapeData, {}),
  };
}

export function mapScrapedDataToRawListingData(data: {
  asin: string;
  title: string;
  bullets: string[];
  description: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  images: string[];
  rawScrapeData?: string;
}): RawListingData {
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
