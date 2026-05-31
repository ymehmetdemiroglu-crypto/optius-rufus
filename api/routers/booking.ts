import { z } from "zod";
import { db } from "../db/client.js";

export const bookingRouter = {
  create: {
    type: "mutation" as const,
    input: z.object({
      prospectId: z.number().int(),
      name: z.string(),
      email: z.string().email(),
      company: z.string().optional(),
      revenue: z.string().optional(),
      notes: z.string().optional(),
      scheduledDate: z.string().optional(),
    }),
    resolve: ({
      input,
    }: {
      input: {
        prospectId: number;
        name: string;
        email: string;
        company?: string;
        revenue?: string;
        notes?: string;
        scheduledDate?: string;
      };
    }) => {
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

      return db.prepare("SELECT * FROM bookings WHERE id = ?").get(result.lastInsertRowid);
    },
  },

  list: {
    type: "query" as const,
    input: z.object({}),
    resolve: () => {
      return db.prepare("SELECT * FROM bookings ORDER BY createdAt DESC").all();
    },
  },
};
