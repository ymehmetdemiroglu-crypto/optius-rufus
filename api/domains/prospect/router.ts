import { z } from "zod";
import { router, publicProcedure } from "../../trpc.js";
import * as prospectService from "./service.js";

export const prospectsRouter = router({
  create: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
        company: z.string().optional(),
        asin: z.string().optional(),
        marketplace: z.string().optional(),
        packageType: z.string().optional(),
        pricePoint: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return prospectService.createProspect(input);
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      return prospectService.getProspectBySlug(input.slug);
    }),

  list: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional().default(50),
        offset: z.number().int().min(0).optional().default(0),
      })
    )
    .query(async ({ input }) => {
      return prospectService.listProspects(input);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      return prospectService.getProspectById(input.id);
    }),

  updateStatus: publicProcedure
    .input(z.object({ id: z.number().int(), status: z.string() }))
    .mutation(async ({ input }) => {
      await prospectService.updateProspectStatus(input.id, input.status);
      return { success: true };
    }),

  incrementViews: publicProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ input }) => {
      await prospectService.incrementViews(input.slug);
      return { success: true };
    }),

  recordActivity: publicProcedure
    .input(
      z.object({
        prospectId: z.number().int(),
        eventType: z.string(),
        eventData: z.record(z.unknown()).optional(),
        interestScore: z.number().optional().default(0),
      })
    )
    .mutation(async ({ input }) => {
      await prospectService.recordActivity(
        input.prospectId,
        input.eventType,
        input.eventData || {},
        input.interestScore
      );
      return { success: true };
    }),
});
