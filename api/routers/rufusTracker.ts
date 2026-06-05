import { z } from "zod";
import { db } from "../db/client.js";
import { router, publicProcedure } from "../trpc.js";
import { simulateRufusSOV } from "../services/rufusSimulator.js";
import { fetchCompetitors } from "../services/competitor.js";

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
      const listing = db
        .prepare("SELECT * FROM listings WHERE prospectId = ? ORDER BY id DESC LIMIT 1")
        .get(input.prospectId) as any;

      if (!listing) {
        throw new Error(`No listing found for prospect ID: ${input.prospectId}`);
      }

      // Parse bullets & images safely
      let bulletsList: string[] = [];
      try {
        bulletsList = JSON.parse(listing.bullets || "[]");
      } catch {
        bulletsList = [];
      }

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

      // 4. Save results to SQLite
      for (const q of simulation.questions) {
        const queryRes = db
          .prepare(
            `INSERT INTO rufus_queries (prospectId, queryText, category, createdAt)
             VALUES (?, ?, ?, datetime('now'))`
          )
          .run(input.prospectId, q.queryText, input.category);
        
        const queryId = queryRes.lastInsertRowid;

        db.prepare(
          `INSERT INTO rufus_query_runs (queryId, asinRankings, sovPercent, createdAt)
           VALUES (?, ?, ?, datetime('now'))`
        ).run(queryId, JSON.stringify(q.rankings), simulation.sovPercent);
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
        const rows = db
          .prepare(
            `SELECT rq.id, rq.queryText, rq.category, rq.createdAt, rqr.asinRankings, rqr.sovPercent
             FROM rufus_queries rq
             JOIN rufus_query_runs rqr ON rq.id = rqr.queryId
             WHERE rq.prospectId = ?
             ORDER BY rq.createdAt DESC`
          )
          .all(input.prospectId) as any[];

        const formatted = rows.map((r) => ({
          queryId: r.id,
          queryText: r.queryText,
          category: r.category,
          createdAt: r.createdAt,
          sovPercent: r.sovPercent,
          rankings: JSON.parse(r.asinRankings || "[]"),
        }));

        // Calculate average SOV if there are runs
        const uniqueDates = [...new Set(formatted.map(r => r.createdAt.split(' ')[0]))];
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
