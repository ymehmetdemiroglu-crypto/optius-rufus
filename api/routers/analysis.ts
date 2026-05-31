import { z } from "zod";
import { db } from "../db/client.js";
import { OptimizationOrchestrator } from "../agents/orchestrator.js";
import { generateLandingPageCopy } from "../services/copywriter.js";
import type { RawListingData, AnalysisResult, SemanticGap } from "../agents/types.js";

const orchestrator = new OptimizationOrchestrator();

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

async function runAnalysis(listingId: number) {
  const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(listingId);
  if (!listing) {
    throw new Error(`Listing not found: ${listingId}`);
  }

  const prospect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(listing.prospectId);
  if (!prospect) {
    throw new Error(`Prospect not found for listing: ${listingId}`);
  }

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

  const state = await orchestrator.runPipeline(listing.asin, listing.marketplace || "US", {
    listingData: rawListing,
  });

  if (state.error) {
    throw new Error(`Pipeline failed: ${state.error}`);
  }

  const analysisTask = state.tasks.find((t) => t.role === "semantic_analyzer");
  const analysisResult = analysisTask?.output as AnalysisResult | undefined;
  const report = state.finalReport;

  const gaps = analysisResult?.semanticGaps || [];
  const topIssues = gaps
    .filter((g) => g.priority === "critical" || g.priority === "high")
    .slice(0, 5);
  const strengths = gaps.filter((g) => g.gap < 0.3).map((g) => g.dimension);
  const opportunities = gaps.filter((g) => g.gap >= 0.3).map((g) => g.dimension);

  const copy = await generateLandingPageCopy(
    {
      rufusScore: analysisResult?.rufusScore ?? 0,
      cosmoScore: analysisResult?.cosmoScore ?? 0,
      semanticGaps: gaps,
    },
    rawListing
  );

  const result = db
    .prepare(
      `INSERT INTO listing_analyses (
        listingId, prospectId, overallScore, rufusScore, cosmoScore, semanticScore, contentScore, visualScore,
        gaps, topIssues, strengths, opportunities, aiAnalysisRaw,
        copyPersonalizedHook, copyProblemNarrative, copySolutionPitch, copyUrgencyCTA, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    )
    .run(
      listing.id,
      listing.prospectId,
      report?.optimizedRufusScore || analysisResult?.rufusScore || 0,
      analysisResult?.rufusScore || 0,
      analysisResult?.cosmoScore || 0,
      Math.round((analysisResult?.rufusScore || 0) * 0.9),
      Math.round((report?.optimizedRufusScore || analysisResult?.rufusScore || 0) * 0.95),
      Math.round((analysisResult?.cosmoScore || 0) * 0.85),
      JSON.stringify(gaps),
      JSON.stringify(topIssues),
      JSON.stringify(strengths),
      JSON.stringify(opportunities),
      JSON.stringify({ state, report }),
      copy.hook,
      copy.narrative,
      copy.solution,
      copy.urgencyCTA
    );

  db.prepare("UPDATE prospects SET status = 'analyzed' WHERE id = ?").run(listing.prospectId);

  const analysisRow = db.prepare("SELECT * FROM listing_analyses WHERE id = ?").get(result.lastInsertRowid);
  return { analysis: analysisRow, listing, prospect };
}

export const analysisRouter = {
  run: {
    type: "mutation" as const,
    input: z.object({ listingId: z.number().int() }),
    resolve: async ({ input }: { input: { listingId: number } }) => {
      return runAnalysis(input.listingId);
    },
  },

  runByProspect: {
    type: "mutation" as const,
    input: z.object({ prospectId: z.number().int() }),
    resolve: async ({ input }: { input: { prospectId: number } }) => {
      const listing = db
        .prepare("SELECT * FROM listings WHERE prospectId = ? ORDER BY createdAt DESC LIMIT 1")
        .get(input.prospectId);
      if (!listing) {
        throw new Error(`No listing found for prospect: ${input.prospectId}`);
      }
      return runAnalysis(listing.id);
    },
  },

  getByProspect: {
    type: "query" as const,
    input: z.object({ prospectId: z.number().int() }),
    resolve: ({ input }: { input: { prospectId: number } }) => {
      const listing = db
        .prepare("SELECT * FROM listings WHERE prospectId = ? ORDER BY createdAt DESC LIMIT 1")
        .get(input.prospectId);
      const analysis = listing
        ? db
            .prepare("SELECT * FROM listing_analyses WHERE prospectId = ? ORDER BY createdAt DESC LIMIT 1")
            .get(input.prospectId)
        : null;
      return { analysis: analysis || null, listing: listing || null };
    },
  },

  regenerateCopy: {
    type: "mutation" as const,
    input: z.object({ analysisId: z.number().int() }),
    resolve: async ({ input }: { input: { analysisId: number } }) => {
      const analysisRow = db.prepare("SELECT * FROM listing_analyses WHERE id = ?").get(input.analysisId);
      if (!analysisRow) {
        throw new Error(`Analysis not found: ${input.analysisId}`);
      }

      const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(analysisRow.listingId);
      if (!listing) {
        throw new Error(`Listing not found for analysis: ${input.analysisId}`);
      }

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

      const gaps = safeJsonParse<SemanticGap[]>(analysisRow.gaps, []);
      const copy = await generateLandingPageCopy(
        {
          rufusScore: analysisRow.rufusScore,
          cosmoScore: analysisRow.cosmoScore,
          semanticGaps: gaps,
        },
        rawListing
      );

      db.prepare(
        `UPDATE listing_analyses SET copyPersonalizedHook = ?, copyProblemNarrative = ?, copySolutionPitch = ?, copyUrgencyCTA = ? WHERE id = ?`
      ).run(copy.hook, copy.narrative, copy.solution, copy.urgencyCTA, input.analysisId);

      return db.prepare("SELECT * FROM listing_analyses WHERE id = ?").get(input.analysisId);
    },
  },
};
