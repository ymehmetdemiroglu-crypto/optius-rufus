import { eq } from "drizzle-orm";
import { db as pgDb } from "../drizzle.js";
import * as schema from "../schema.js";
import type { CatalogLinkRecord, InsertCatalogLinkInput } from "../types.js";

export async function createLink(
  input: InsertCatalogLinkInput
): Promise<CatalogLinkRecord> {
  try {
    const result = await pgDb
      .insert(schema.catalogLinks)
      .values(input)
      .returning();
    return result[0] as unknown as CatalogLinkRecord;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to create catalog link: ${message}`, { cause: err });
  }
}

export async function getLinksByProspectId(
  prospectId: number
): Promise<CatalogLinkRecord[]> {
  try {
    const result = await pgDb
      .select()
      .from(schema.catalogLinks)
      .where(eq(schema.catalogLinks.prospectId, prospectId));
    return result as unknown as CatalogLinkRecord[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to fetch catalog links for prospect ${prospectId}: ${message}`
    , { cause: err });
  }
}
