import { z } from "zod";
import { db } from "../db/client.js";
import type { ListingRecord, ProspectRecord } from "../db/client.js";
import { pipelineEngine } from "../pipeline/engine.js";
import { generateAllStageCopy } from "../services/copywriter.js";
import type { RawListingData, AnalysisResult, SemanticGap } from "../agents/types.js";
import { router, publicProcedure } from "../trpc.js";

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

async function runAnalysis(listingId: number) {
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId) as ListingRecord | undefined;
  if (!listing) {
    throw new Error(`Listing not found: ${listingId}`);
  }

  const prospect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(listing.prospectId) as ProspectRecord | undefined;
  if (!prospect) {
    throw new Error(`Prospect not found for listing: ${listingId}`);
  }

  // Run the new resumable pipeline engine synchronously for backward compatibility
  const job = await pipelineEngine.createAndRunJob(
    listing.prospectId,
    listing.id,
    prospect.packageType || "package_2"
  );

  if (job.status === "failed") {
    throw new Error(`Pipeline failed: ${job.errorLog || "Unknown error"}`);
  }

  // Extract stage outputs
  const semanticStage = job.stages.semantic;
  const optimizeStage = job.stages.optimize;
  const competitorStage = job.stages.competitor;

  const analysisResult = semanticStage?.output as AnalysisResult | undefined;
  const optimized = optimizeStage?.output as
    | ({ stageCopy?: unknown } & Record<string, unknown>)
    | undefined;
  const competitors = competitorStage?.output as Array<Record<string, unknown>> | undefined;

  const rawListing: RawListingData = {
    asin: listing.asin,
    title: listing.title || "",
    bullets: safeJsonParse(listing.bullets, []),
    description: listing.description || "",
    brand: listing.brand || "",
    category: listing.category || "",
    subcategory: listing.category || "",
    images: safeJsonParse(listing.images, []),
    price: listing.price || 0,
    rating: listing.rating || 0,
    reviewCount: listing.reviewCount || 0,
    attributes: safeJsonParse(listing.rawScrapeData, {}),
  };

  const gaps = analysisResult?.semanticGaps || [];
  const topIssues = gaps
    .filter((g) => g.priority === "critical" || g.priority === "high")
    .slice(0, 5);
  const strengths = gaps.filter((g) => g.gap < 0.3).map((g) => g.dimension);
  const opportunities = gaps.filter((g) => g.gap >= 0.3).map((g) => g.dimension);

  const firstName = prospect.firstName || "";
  const lastName = prospect.lastName || "";
  const prospectName = [firstName, lastName].filter(Boolean).join(" ") || "there";

  // Use stage copy from pipeline if available, otherwise generate fresh
  let stageCopy = optimized?.stageCopy as
    | {
        heroHeadline: string;
        heroSubheadline: string;
        autopsyHeadline: string;
        autopsyBody: string;
        bleedHeadline: string;
        bleedBody: string;
        simulatorIntro: string;
        simulatorScenarios: unknown;
        transformHeadline: string;
        transformBefore: unknown;
        transformAfter: unknown;
        roadmapHeadline: string;
        roadmapBody: string;
        socialProofHeadline: string;
        urgencyCTA: string;
        ctaHeadline: string;
        ctaGuarantee: string;
      }
    | undefined;

  if (!stageCopy) {
    stageCopy = await generateAllStageCopy(
      {
        rufusScore: analysisResult?.rufusScore ?? 0,
        cosmoScore: analysisResult?.cosmoScore ?? 0,
        semanticGaps: gaps,
      },
      rawListing,
      prospectName
    );
  }

  const rufusScore = analysisResult?.rufusScore ?? 0;
  // Calculate optimized score based on actual gap remediation potential
  // rather than random inflation. If gaps were addressed, score improves
  // proportionally to critical/high gap coverage.
  const criticalGaps = gaps.filter((g) => g.priority === "critical" || g.priority === "high");
  const gapRemediationPotential = criticalGaps.length > 0
    ? Math.min(25, criticalGaps.length * 5)
    : 10;
  const optimizedRufusScore = Math.min(100, rufusScore + gapRemediationPotential);

  const result = db.transaction(() => {
    const insertResult = db
      .prepare(
        `INSERT INTO listing_analyses (
          listingId, prospectId, overallScore, rufusScore, cosmoScore, semanticScore, contentScore, visualScore,
          gaps, topIssues, strengths, opportunities, aiAnalysisRaw,
          copyPersonalizedHook, copyProblemNarrative, copySolutionPitch, copyUrgencyCTA,
          copyHeroHeadline, copyHeroSubheadline,
          copyAutopsyHeadline, copyAutopsyBody,
          copyBleedHeadline, copyBleedBody,
          copySimulatorIntro, copySimulatorScenarios,
          copyTransformHeadline, copyTransformBefore, copyTransformAfter,
          copyRoadmapHeadline, copyRoadmapBody,
          copySocialProofHeadline,
          copyCtaHeadline, copyCtaGuarantee,
          createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      .run(
        listing.id,
        listing.prospectId,
        optimizedRufusScore,
        rufusScore,
        analysisResult?.cosmoScore || 0,
        Math.round(rufusScore * 0.9),
        Math.round(optimizedRufusScore * 0.95),
        Math.round((analysisResult?.cosmoScore || 0) * 0.85),
        JSON.stringify(gaps),
        JSON.stringify(topIssues),
        JSON.stringify(strengths),
        JSON.stringify(opportunities),
        JSON.stringify({ jobId: job.id, stages: Object.keys(job.stages) }),
        stageCopy.heroHeadline,
        stageCopy.autopsyBody,
        stageCopy.roadmapBody,
        stageCopy.urgencyCTA,
        stageCopy.heroHeadline,
        stageCopy.heroSubheadline,
        stageCopy.autopsyHeadline,
        stageCopy.autopsyBody,
        stageCopy.bleedHeadline,
        stageCopy.bleedBody,
        stageCopy.simulatorIntro,
        JSON.stringify(stageCopy.simulatorScenarios),
        stageCopy.transformHeadline,
        JSON.stringify(stageCopy.transformBefore),
        JSON.stringify(stageCopy.transformAfter),
        stageCopy.roadmapHeadline,
        stageCopy.roadmapBody,
        stageCopy.socialProofHeadline,
        stageCopy.ctaHeadline,
        stageCopy.ctaGuarantee
      );

    db.prepare("UPDATE prospects SET status = 'analyzed' WHERE id = ?").run(listing.prospectId);
    return insertResult;
  })();

  const analysisRow = db.prepare("SELECT * FROM listing_analyses WHERE id = ?").get(result.lastInsertRowid);
  return { analysis: analysisRow, listing, prospect };
}

export const analysisRouter = router({
  run: publicProcedure
    .input(z.object({ listingId: z.number().int() }))
    .mutation(async ({ input }) => {
      return runAnalysis(input.listingId);
    }),

  runByProspect: publicProcedure
    .input(z.object({ prospectId: z.number().int() }))
    .mutation(async ({ input }) => {
      const listing = db
        .prepare("SELECT * FROM listings WHERE prospectId = ? ORDER BY createdAt DESC LIMIT 1")
        .get(input.prospectId) as ListingRecord | undefined;
      if (!listing) {
        throw new Error(`No listing found for prospect: ${input.prospectId}`);
      }
      return runAnalysis(listing.id);
    }),

  getByProspect: publicProcedure
    .input(z.object({ prospectId: z.number().int() }))
    .query(({ input }) => {
      const listing = db
        .prepare("SELECT * FROM listings WHERE prospectId = ? ORDER BY createdAt DESC LIMIT 1")
        .get(input.prospectId) as ListingRecord | undefined;
      const analysis = listing
        ? db
            .prepare("SELECT * FROM listing_analyses WHERE prospectId = ? ORDER BY createdAt DESC LIMIT 1")
            .get(input.prospectId)
        : null;
      return { analysis: analysis || null, listing: listing || null };
    }),

  regenerateCopy: publicProcedure
    .input(z.object({ analysisId: z.number().int() }))
    .mutation(async ({ input }) => {
      const analysisRow = db.prepare("SELECT * FROM listing_analyses WHERE id = ?").get(input.analysisId) as Record<string, unknown> | undefined;
      if (!analysisRow) {
        throw new Error(`Analysis not found: ${input.analysisId}`);
      }

      const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(analysisRow.listingId) as ListingRecord | undefined;
      if (!listing) {
        throw new Error(`Listing not found for analysis: ${input.analysisId}`);
      }

      const prospect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(analysisRow.prospectId) as ProspectRecord | undefined;

      const rawListing: RawListingData = {
        asin: listing.asin,
        title: listing.title || "",
        bullets: safeJsonParse(listing.bullets, []),
        description: listing.description || "",
        brand: listing.brand || "",
        category: listing.category || "",
        subcategory: listing.category || "",
        images: safeJsonParse(listing.images, []),
        price: listing.price || 0,
        rating: listing.rating || 0,
        reviewCount: listing.reviewCount || 0,
        attributes: safeJsonParse(listing.rawScrapeData, {}),
      };

      const firstName = prospect?.firstName || "";
      const lastName = prospect?.lastName || "";
      const prospectName = [firstName, lastName].filter(Boolean).join(" ") || "there";

      const gaps = safeJsonParse<SemanticGap[]>(analysisRow.gaps as string, []);
      const stageCopy = await generateAllStageCopy(
        {
          rufusScore: analysisRow.rufusScore as number,
          cosmoScore: analysisRow.cosmoScore as number,
          semanticGaps: gaps,
        },
        rawListing,
        prospectName
      );

      db.prepare(
        `UPDATE listing_analyses SET
          copyPersonalizedHook = ?, copyProblemNarrative = ?, copySolutionPitch = ?, copyUrgencyCTA = ?,
          copyHeroHeadline = ?, copyHeroSubheadline = ?,
          copyAutopsyHeadline = ?, copyAutopsyBody = ?,
          copyBleedHeadline = ?, copyBleedBody = ?,
          copySimulatorIntro = ?, copySimulatorScenarios = ?,
          copyTransformHeadline = ?, copyTransformBefore = ?, copyTransformAfter = ?,
          copyRoadmapHeadline = ?, copyRoadmapBody = ?,
          copySocialProofHeadline = ?,
          copyCtaHeadline = ?, copyCtaGuarantee = ?
        WHERE id = ?`
      ).run(
        stageCopy.heroHeadline,
        stageCopy.autopsyBody,
        stageCopy.roadmapBody,
        stageCopy.urgencyCTA,
        stageCopy.heroHeadline,
        stageCopy.heroSubheadline,
        stageCopy.autopsyHeadline,
        stageCopy.autopsyBody,
        stageCopy.bleedHeadline,
        stageCopy.bleedBody,
        stageCopy.simulatorIntro,
        JSON.stringify(stageCopy.simulatorScenarios),
        stageCopy.transformHeadline,
        JSON.stringify(stageCopy.transformBefore),
        JSON.stringify(stageCopy.transformAfter),
        stageCopy.roadmapHeadline,
        stageCopy.roadmapBody,
        stageCopy.socialProofHeadline,
        stageCopy.ctaHeadline,
        stageCopy.ctaGuarantee,
        input.analysisId
      );

      return db.prepare("SELECT * FROM listing_analyses WHERE id = ?").get(input.analysisId);
    }),
});
