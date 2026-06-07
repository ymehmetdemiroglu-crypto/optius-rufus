import { db as pgDb } from "../drizzle.js";
import * as schema from "../schema.js";

/**
 * Create a prospect activity log entry.
 */
export async function create(
  prospectId: number,
  eventType: string,
  eventData: unknown
): Promise<void> {
  try {
    await pgDb.insert(schema.prospectActivities).values({
      prospectId,
      eventType,
      eventData,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to create activity for prospect ${prospectId}: ${message}`
    , { cause: err });
  }
}
