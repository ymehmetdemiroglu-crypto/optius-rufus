import { eq, desc, count } from "drizzle-orm";
import { db as pgDb } from "../drizzle.js";
import * as schema from "../schema.js";
import type { ProspectRecord, InsertProspectInput } from "../types.js";
import { create as createActivity } from "./activityRepository.js";

export async function create(input: InsertProspectInput): Promise<ProspectRecord> {
  try {
    const result = await pgDb.insert(schema.prospects).values(input).returning();
    return result[0] as unknown as ProspectRecord;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to create prospect: ${message}`, { cause: err });
  }
}

export async function getBySlug(slug: string): Promise<ProspectRecord | undefined> {
  try {
    const result = await pgDb
      .select()
      .from(schema.prospects)
      .where(eq(schema.prospects.slug, slug))
      .limit(1);
    return result[0] as unknown as ProspectRecord | undefined;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch prospect by slug "${slug}": ${message}`, { cause: err });
  }
}

export async function getById(id: number): Promise<ProspectRecord | undefined> {
  try {
    const result = await pgDb
      .select()
      .from(schema.prospects)
      .where(eq(schema.prospects.id, id))
      .limit(1);
    return result[0] as unknown as ProspectRecord | undefined;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch prospect by id ${id}: ${message}`, { cause: err });
  }
}

function buildWhereClause(status?: string) {
  return status ? eq(schema.prospects.status, status) : undefined;
}

function buildItemsQuery(status?: string, limit = 50, offset = 0) {
  const where = buildWhereClause(status);
  const query = pgDb
    .select()
    .from(schema.prospects)
    .orderBy(desc(schema.prospects.createdAt))
    .limit(limit)
    .offset(offset);
  return where ? query.where(where) : query;
}

function buildCountQuery(status?: string) {
  const where = buildWhereClause(status);
  const base = pgDb.select({ count: count() }).from(schema.prospects);
  return where ? base.where(where) : base;
}

export async function list(options: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: ProspectRecord[]; count: number }> {
  const { status, limit = 50, offset = 0 } = options;

  try {
    const [itemsResult, countResult] = await Promise.all([
      buildItemsQuery(status, limit, offset),
      buildCountQuery(status),
    ]);

    return {
      items: itemsResult as unknown as ProspectRecord[],
      count: countResult[0]?.count ?? 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to list prospects: ${message}`, { cause: err });
  }
}

export async function updateStatus(id: number, status: string): Promise<void> {
  try {
    await pgDb
      .update(schema.prospects)
      .set({ status })
      .where(eq(schema.prospects.id, id));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to update prospect ${id} status to "${status}": ${message}`,
      { cause: err }
    );
  }
}

export async function incrementViews(slug: string): Promise<void> {
  try {
    const result = await pgDb
      .select({ landingPageViews: schema.prospects.landingPageViews })
      .from(schema.prospects)
      .where(eq(schema.prospects.slug, slug))
      .limit(1);
    const current = result[0]?.landingPageViews ?? 0;
    await pgDb
      .update(schema.prospects)
      .set({ landingPageViews: current + 1 })
      .where(eq(schema.prospects.slug, slug));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to increment views for slug "${slug}": ${message}`, { cause: err });
  }
}

export async function recordActivity(
  prospectId: number,
  eventType: string,
  eventData: unknown
): Promise<void> {
  try {
    await createActivity(prospectId, eventType, eventData);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to record activity for prospect ${prospectId}: ${message}`,
      { cause: err }
    );
  }
}
