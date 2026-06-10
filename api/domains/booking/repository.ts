import { eq, desc } from "drizzle-orm";
import { db as pgDb } from "../../db/drizzle.js";
import * as schema from "../../db/schema.js";
import type { BookingRecord, InsertBookingInput } from "../../db/schema.types.js";

export async function create(input: InsertBookingInput): Promise<BookingRecord> {
  try {
    const result = await pgDb.insert(schema.bookings).values(input).returning();
    return result[0] as unknown as BookingRecord;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to create booking: ${message}`, { cause: err });
  }
}

export async function getByProspectId(
  prospectId: number
): Promise<BookingRecord[]> {
  try {
    const result = await pgDb
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.prospectId, prospectId))
      .orderBy(desc(schema.bookings.createdAt));
    return result as unknown as BookingRecord[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to fetch bookings for prospect ${prospectId}: ${message}`,
      { cause: err }
    );
  }
}

export async function listAll(): Promise<BookingRecord[]> {
  try {
    const result = await pgDb
      .select()
      .from(schema.bookings)
      .orderBy(desc(schema.bookings.createdAt));
    return result as unknown as BookingRecord[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to list bookings: ${message}`, { cause: err });
  }
}
