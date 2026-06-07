import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
import { simulateRufusSOV } from "../services/rufusSimulator.js";
import { fetchCompetitors } from "../services/competitor.js";
import * as rufusRepo from "../db/repositories/rufusRepository.js";
import * as listingRepo from "../db/repositories/listingRepository.js";

export const rufusTrackerRouter = router({
  runSOVSimulation: publicProcedure
    .input(
      z.object({
        prospectId: z.number().int(),
        category: z.string().optional().default("Health & Household"),
      })
    )
    .mutation(async ({ input }) => {
      // 1. Fetch active listing
      const listing = await listingRepo.getLatestByProspectId(input.prospectId);

      if (!listing) {
        throw new Error(`No listing found for prospect ID: ${input.prospectId}`);
      }

      // Parse bullets safely
      const bulletsList: string[] = Array.isArray(listing.bullets)
        ? (listing.bullets as string[])
        : [];

      // 2. Fetch category competitors
      const competitors = await fetchCompetitors(listing.asin, input.category);

      // 3. Run the LLM simulation
      const simulation = await simulateRufusSOV(
        listing.title || "",
        bulletsList,
        listing.description || "",
        listing.aPlusText || "",
        input.category,
        competitors
      );

      // 4. Save results to Postgres
      for (const q of simulation.questions) {
        const queryRecord = await rufusRepo.createQuery({
          prospectId: input.prospectId,
          queryText: q.queryText,
          category: input.category,
        });
        
        await rufusRepo.createQueryRun({
          queryId: queryRecord.id,
          asinRankings: q.rankings,
          sovPercent: simulation.sovPercent,
        });
      }

      return {
        success: true,
        sovPercent: simulation.sovPercent,
        questions: simulation.questions,
      };
    }),

  getSOVHistory: publicProcedure
    .input(z.object({ prospectId: z.number().int() }))
    .query(async ({ input }) => {
      try {
        const rows = await rufusRepo.getSOVHistoryForProspect(input.prospectId);

        const formatted = rows.map((r) => ({
          queryId: r.id,
          queryText: r.queryText,
          category: r.category,
          createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
          sovPercent: r.sovPercent,
          rankings: Array.isArray(r.asinRankings) ? r.asinRankings : [],
        }));

        // Calculate average SOV if there are runs
        const uniqueDates = [...new Set(formatted.map(r => r.createdAt.split('T')[0]))];
        const timeline = uniqueDates.map(date => {
          const runsOnDate = formatted.filter(r => r.createdAt.startsWith(date));
          const avgSov = runsOnDate.reduce((sum, r) => sum + r.sovPercent, 0) / runsOnDate.length;
          return { date, sovPercent: parseFloat(avgSov.toFixed(2)) };
        }).reverse();

        return {
          history: formatted,
          timeline,
          currentSOV: formatted[0]?.sovPercent || 0,
        };
      } catch (err) {
        console.error("Failed to query SOV history:", err);
        return { history: [], timeline: [], currentSOV: 0 };
      }
    }),
});
