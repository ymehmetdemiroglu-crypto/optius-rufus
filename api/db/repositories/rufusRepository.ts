import { eq, desc } from "drizzle-orm";
import { db as pgDb } from "../drizzle.js";
import * as schema from "../schema.js";
import type {
  RufusQueryRecord,
  InsertRufusQueryInput,
  RufusQueryRunRecord,
  InsertRufusQueryRunInput,
} from "../types.js";

export async function createQuery(
  input: InsertRufusQueryInput
): Promise<RufusQueryRecord> {
  try {
    const result = await pgDb
      .insert(schema.rufusQueries)
      .values(input)
      .returning();
    return result[0] as unknown as RufusQueryRecord;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to create rufus query: ${message}`, { cause: err });
  }
}

export async function getQueriesByProspectId(
  prospectId: number
): Promise<RufusQueryRecord[]> {
  try {
    const result = await pgDb
      .select()
      .from(schema.rufusQueries)
      .where(eq(schema.rufusQueries.prospectId, prospectId))
      .orderBy(desc(schema.rufusQueries.createdAt));
    return result as unknown as RufusQueryRecord[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to fetch rufus queries for prospect ${prospectId}: ${message}`
    , { cause: err });
  }
}

export async function createQueryRun(
  input: InsertRufusQueryRunInput
): Promise<RufusQueryRunRecord> {
  try {
    const result = await pgDb
      .insert(schema.rufusQueryRuns)
      .values(input)
      .returning();
    return result[0] as unknown as RufusQueryRunRecord;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to create rufus query run: ${message}`, { cause: err });
  }
}

export async function getRunsByQueryId(
  queryId: number
): Promise<RufusQueryRunRecord[]> {
  try {
    const result = await pgDb
      .select()
      .from(schema.rufusQueryRuns)
      .where(eq(schema.rufusQueryRuns.queryId, queryId))
      .orderBy(desc(schema.rufusQueryRuns.createdAt));
    return result as unknown as RufusQueryRunRecord[];
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to fetch rufus query runs for query ${queryId}: ${message}`
    , { cause: err });
  }
}

export async function getSOVHistoryForProspect(
  prospectId: number
): Promise<Array<{
  id: number;
  queryText: string;
  category: string;
  createdAt: Date | null;
  asinRankings: unknown;
  sovPercent: number;
}>> {
  try {
    const result = await pgDb
      .select({
        id: schema.rufusQueries.id,
        queryText: schema.rufusQueries.queryText,
        category: schema.rufusQueries.category,
        createdAt: schema.rufusQueries.createdAt,
        asinRankings: schema.rufusQueryRuns.asinRankings,
        sovPercent: schema.rufusQueryRuns.sovPercent,
      })
      .from(schema.rufusQueries)
      .innerJoin(
        schema.rufusQueryRuns,
        eq(schema.rufusQueries.id, schema.rufusQueryRuns.queryId)
      )
      .where(eq(schema.rufusQueries.prospectId, prospectId))
      .orderBy(desc(schema.rufusQueries.createdAt));
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to fetch SOV history for prospect ${prospectId}: ${message}`
    , { cause: err });
  }
}
