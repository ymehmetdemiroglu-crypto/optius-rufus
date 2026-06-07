import { eq, desc } from "drizzle-orm";
import { db as pgDb } from "../drizzle.js";
import * as schema from "../schema.js";
import type { BrandSettingsRecord, InsertBrandSettingsInput } from "../types.js";

export async function getSettings(): Promise<BrandSettingsRecord | undefined> {
  try {
    const result = await pgDb
      .select()
      .from(schema.brandSettings)
      .orderBy(desc(schema.brandSettings.id))
      .limit(1);
    return result[0] as unknown as BrandSettingsRecord | undefined;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch brand settings: ${message}`, { cause: err });
  }
}

export async function upsertSettings(
  input: Partial<BrandSettingsRecord>
): Promise<BrandSettingsRecord> {
  try {
    const existing = await pgDb.select().from(schema.brandSettings).limit(1);

    if (existing.length > 0) {
      const result = await pgDb
        .update(schema.brandSettings)
        .set(input as Partial<InsertBrandSettingsInput>)
        .where(eq(schema.brandSettings.id, existing[0].id))
        .returning();
      return result[0] as unknown as BrandSettingsRecord;
    }

    const result = await pgDb
      .insert(schema.brandSettings)
      .values(input as Partial<InsertBrandSettingsInput>)
      .returning();
    return result[0] as unknown as BrandSettingsRecord;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to upsert brand settings: ${message}`, { cause: err });
  }
}
