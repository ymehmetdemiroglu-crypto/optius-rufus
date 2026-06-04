import { z } from "zod";
import { db } from "../db/client.js";
import type { BookingRecord } from "../db/client.js";
import { router, publicProcedure } from "../trpc.js";

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
    .mutation(({ input }) => {
      const result = db
        .prepare(
          `INSERT INTO bookings (prospectId, name, email, company, revenue, notes, scheduledDate, status, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))`
        )
        .run(
          input.prospectId,
          input.name,
          input.email,
          input.company || null,
          input.revenue || null,
          input.notes || null,
          input.scheduledDate || null
        );

      return db.prepare("SELECT * FROM bookings WHERE id = ?").get(result.lastInsertRowid) as BookingRecord;
    }),

  list: publicProcedure
    .input(z.object({}))
    .query(() => {
      return db.prepare("SELECT * FROM bookings ORDER BY createdAt DESC").all() as BookingRecord[];
    }),
});

