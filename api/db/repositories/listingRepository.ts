import { eq, desc } from "drizzle-orm";
import { db as pgDb } from "../drizzle.js";
import * as schema from "../schema.js";
import type { ListingRecord, InsertListingInput } from "../types.js";

export async function create(input: InsertListingInput): Promise<ListingRecord> {
  try {
    const result = await pgDb.insert(schema.listings).values(input).returning();
    return result[0] as unknown as ListingRecord;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to create listing: ${message}`, { cause: err });
  }
}

export async function getById(id: number): Promise<ListingRecord | undefined> {
  try {
    const result = await pgDb
      .select()
      .from(schema.listings)
      .where(eq(schema.listings.id, id))
      .limit(1);
    return result[0] as unknown as ListingRecord | undefined;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch listing by id ${id}: ${message}`, { cause: err });
  }
}

export async function getLatestByProspectId(
  prospectId: number
): Promise<ListingRecord | undefined> {
  try {
    const result = await pgDb
      .select()
      .from(schema.listings)
      .where(eq(schema.listings.prospectId, prospectId))
      .orderBy(desc(schema.listings.createdAt))
      .limit(1);
    return result[0] as unknown as ListingRecord | undefined;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to fetch latest listing for prospect ${prospectId}: ${message}`
    , { cause: err });
  }
}

export async function updateEmbedding(
  listingId: number,
  vector: number[]
): Promise<void> {
  try {
    await pgDb
      .update(schema.listings)
      .set({ embeddingVector: JSON.stringify(vector) })
      .where(eq(schema.listings.id, listingId));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to update embedding for listing ${listingId}: ${message}`
    , { cause: err });
  }
}
