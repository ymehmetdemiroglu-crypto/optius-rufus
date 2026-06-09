import { z } from "zod";
import { router, publicProcedure } from "../../trpc.js";
import { generatePpcPlan, convertPlanToCsv } from "./service.js";
import * as listingRepo from "../listing/repository.js";

export const ppcRouter = router({
  generatePlan: publicProcedure
    .input(
      z.object({
        prospectId: z.number().int(),
        dailyBudget: z.number().optional(),
        biddingStrategy: z.string().optional(),
        rankBooster: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const plan = await generatePpcPlan(input.prospectId, {
          dailyBudget: input.dailyBudget,
          biddingStrategy: input.biddingStrategy,
          rankBooster: input.rankBooster,
        });
        return plan;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to generate PPC plan: ${message}`);
      }
    }),

  downloadBulkSheet: publicProcedure
    .input(
      z.object({
        prospectId: z.number().int(),
        dailyBudget: z.number().optional(),
        biddingStrategy: z.string().optional(),
        rankBooster: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const plan = await generatePpcPlan(input.prospectId, {
          dailyBudget: input.dailyBudget,
          biddingStrategy: input.biddingStrategy,
          rankBooster: input.rankBooster,
        });

        const listing = await listingRepo.getLatestByProspectId(input.prospectId);
        const asin = listing?.asin || "ASIN";
        const csv = convertPlanToCsv(plan, asin);

        return {
          filename: `${plan.campaignName}_bulk_sheet.csv`,
          csv,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Failed to download bulk sheet: ${message}`);
      }
    }),
});
