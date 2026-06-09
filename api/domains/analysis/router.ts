import { z } from "zod";
import { router, publicProcedure } from "../../trpc.js";
import * as analysisService from "./service.js";

export const analysisRouter = router({
  run: publicProcedure
    .input(z.object({ listingId: z.number().int() }))
    .mutation(async ({ input }) => {
      return analysisService.runAnalysis(input.listingId);
    }),

  runByProspect: publicProcedure
    .input(z.object({ prospectId: z.number().int() }))
    .mutation(async ({ input }) => {
      return analysisService.runAnalysisByProspect(input.prospectId);
    }),

  getByProspect: publicProcedure
    .input(z.object({ prospectId: z.number().int() }))
    .query(async ({ input }) => {
      return analysisService.getAnalysisByProspect(input.prospectId);
    }),

  regenerateCopy: publicProcedure
    .input(z.object({ analysisId: z.number().int() }))
    .mutation(async ({ input }) => {
      return analysisService.regenerateCopy(input.analysisId);
    }),
});
