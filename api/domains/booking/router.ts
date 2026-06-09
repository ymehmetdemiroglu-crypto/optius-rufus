import { z } from "zod";
import { router, publicProcedure } from "../../trpc.js";
import * as bookingService from "./service.js";

export const bookingRouter = router({
  create: publicProcedure
    .input(
      z.object({
        prospectId: z.number().int(),
        name: z.string(),
        email: z.string().email(),
        company: z.string().optional(),
        revenue: z.string().optional(),
        notes: z.string().optional(),
        scheduledDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      return bookingService.createBooking(input);
    }),

  list: publicProcedure
    .input(z.object({}))
    .query(async () => {
      return bookingService.listAllBookings();
    }),
});
