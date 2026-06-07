import { eq, desc } from "drizzle-orm";
import { db as pgDb } from "../drizzle.js";
import * as schema from "../schema.js";
import type {
  ListingAnalysisRecord,
  InsertAnalysisInput,
  StageCopy,
} from "../types.js";

export async function create(
  input: InsertAnalysisInput
): Promise<ListingAnalysisRecord> {
  try {
    const result = await pgDb
      .insert(schema.listingAnalyses)
      .values(input)
      .returning();
    return result[0] as unknown as ListingAnalysisRecord;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to create analysis: ${message}`, { cause: err });
  }
}

export async function getById(
  id: number
): Promise<ListingAnalysisRecord | undefined> {
  try {
    const result = await pgDb
      .select()
      .from(schema.listingAnalyses)
      .where(eq(schema.listingAnalyses.id, id))
      .limit(1);
    return result[0] as unknown as ListingAnalysisRecord | undefined;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch analysis by id ${id}: ${message}`, { cause: err });
  }
}

export async function getLatestByProspectId(
  prospectId: number
): Promise<ListingAnalysisRecord | undefined> {
  try {
    const result = await pgDb
      .select()
      .from(schema.listingAnalyses)
      .where(eq(schema.listingAnalyses.prospectId, prospectId))
      .orderBy(desc(schema.listingAnalyses.createdAt))
      .limit(1);
    return result[0] as unknown as ListingAnalysisRecord | undefined;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to fetch latest analysis for prospect ${prospectId}: ${message}`
    , { cause: err });
  }
}

export async function getLatestByListingId(
  listingId: number
): Promise<ListingAnalysisRecord | undefined> {
  try {
    const result = await pgDb
      .select()
      .from(schema.listingAnalyses)
      .where(eq(schema.listingAnalyses.listingId, listingId))
      .orderBy(desc(schema.listingAnalyses.createdAt))
      .limit(1);
    return result[0] as unknown as ListingAnalysisRecord | undefined;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to fetch latest analysis for listing ${listingId}: ${message}`
    , { cause: err });
  }
}

/** Maps camelCase StageCopy fields to schema column names. */
function buildCopyUpdate(copy: Partial<StageCopy>): Record<string, unknown> {
  const mapping: Record<string, string> = {
    personalizedHook: "copyPersonalizedHook",
    problemNarrative: "copyProblemNarrative",
    solutionPitch: "copySolutionPitch",
    urgencyCTA: "copyUrgencyCTA",
    heroHeadline: "copyHeroHeadline",
    heroSubheadline: "copyHeroSubheadline",
    autopsyHeadline: "copyAutopsyHeadline",
    autopsyBody: "copyAutopsyBody",
    bleedHeadline: "copyBleedHeadline",
    bleedBody: "copyBleedBody",
    simulatorIntro: "copySimulatorIntro",
    simulatorScenarios: "copySimulatorScenarios",
    transformHeadline: "copyTransformHeadline",
    transformBefore: "copyTransformBefore",
    transformAfter: "copyTransformAfter",
    roadmapHeadline: "copyRoadmapHeadline",
    roadmapBody: "copyRoadmapBody",
    socialProofHeadline: "copySocialProofHeadline",
    ctaHeadline: "copyCtaHeadline",
    ctaGuarantee: "copyCtaGuarantee",
    freeQAs: "copyFreeQAs",
    reviewSentiment: "copyReviewSentiment",
    competitorAudit: "copyCompetitorAudit",
    ppcKeywords: "copyPpcKeywords",
    cosmoBundling: "copyCosmoBundling",
    cosmoGraphData: "copyCosmoGraphData",
  };

  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(copy)) {
    const column = mapping[key];
    if (column !== undefined && value !== undefined) {
      update[column] = value;
    }
  }
  return update;
}

export async function updateCopy(
  id: number,
  copy: Partial<StageCopy>
): Promise<void> {
  try {
    const updateData = buildCopyUpdate(copy);
    if (Object.keys(updateData).length === 0) return;

    // Cast dynamically-built object to the insert type expected by Drizzle.
    await pgDb
      .update(schema.listingAnalyses)
      .set(updateData as Partial<InsertAnalysisInput>)
      .where(eq(schema.listingAnalyses.id, id));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to update copy for analysis ${id}: ${message}`, { cause: err });
  }
}
