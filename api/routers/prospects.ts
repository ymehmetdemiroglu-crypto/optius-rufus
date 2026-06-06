import { z } from "zod";
import { db } from "../db/client.js";
import type { ProspectRecord, ListingRecord, ListingAnalysisRecord } from "../db/client.js";
import { triggerWebhook } from "../services/webhook.js";
import { router, publicProcedure } from "../trpc.js";

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10);
}

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
      const slug = generateSlug();
      const result = db
        .prepare(
          `INSERT INTO prospects (slug, email, firstName, lastName, company, status, landingPageViews, packageType, pricePoint, createdAt)
         VALUES (?, ?, ?, ?, ?, 'new', 0, ?, ?, datetime('now'))`
        )
        .run(
          slug,
          input.email,
          input.firstName || null,
          input.lastName || null,
          input.company || null,
          input.packageType || 'package_2',
          input.pricePoint ?? 1500
        );

      return db.prepare("SELECT * FROM prospects WHERE id = ?").get(result.lastInsertRowid) as ProspectRecord | undefined;
    }),

  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const prospect = db.prepare("SELECT * FROM prospects WHERE slug = ?").get(input.slug) as ProspectRecord | undefined;
      if (!prospect) {
        throw new Error(`Prospect not found: ${input.slug}`);
      }

      const listing = db
        .prepare("SELECT * FROM listings WHERE prospectId = ? ORDER BY createdAt DESC LIMIT 1")
        .get(prospect.id) as ListingRecord | undefined;
      const analysis = listing
        ? (db
            .prepare("SELECT * FROM listing_analyses WHERE listingId = ? ORDER BY createdAt DESC LIMIT 1")
            .get(listing.id) as ListingAnalysisRecord | undefined)
        : null;

      return { prospect, listing: listing || null, analysis: analysis || null };
    }),

  list: publicProcedure
    .input(
      z.object({
        status: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional().default(50),
        offset: z.number().int().min(0).optional().default(0),
      })
    )
    .query(({ input }) => {
      let whereClause = "";
      const params: (string | number)[] = [];
      if (input.status) {
        whereClause = "WHERE p.status = ?";
        params.push(input.status);
      }

      const countRow = db
        .prepare(`SELECT COUNT(*) as count FROM prospects p ${whereClause}`)
        .get(...params) as { count: number };
      const rows = db
        .prepare(
          `SELECT p.*, l.asin
           FROM prospects p
           LEFT JOIN listings l ON l.prospectId = p.id
           AND l.id = (SELECT id FROM listings WHERE prospectId = p.id ORDER BY createdAt DESC LIMIT 1)
           ${whereClause}
           ORDER BY p.createdAt DESC
           LIMIT ? OFFSET ?`
        )
        .all(...params, input.limit, input.offset);

      return { items: rows, count: countRow.count };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number().int() }))
    .query(({ input }) => {
      const prospect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(input.id) as ProspectRecord | undefined;
      if (!prospect) {
        throw new Error(`Prospect not found: ${input.id}`);
      }

      const listing = db
        .prepare("SELECT * FROM listings WHERE prospectId = ? ORDER BY createdAt DESC LIMIT 1")
        .get(prospect.id) as ListingRecord | undefined;
      const analysis = listing
        ? (db
            .prepare("SELECT * FROM listing_analyses WHERE listingId = ? ORDER BY createdAt DESC LIMIT 1")
            .get(listing.id) as ListingAnalysisRecord | undefined)
        : null;
      const bookings = db.prepare("SELECT * FROM bookings WHERE prospectId = ? ORDER BY createdAt DESC").all(prospect.id);

      return { prospect, listing: listing || null, analysis: analysis || null, bookings: bookings || [] };
    }),

  updateStatus: publicProcedure
    .input(z.object({ id: z.number().int(), status: z.string() }))
    .mutation(({ input }) => {
      db.prepare("UPDATE prospects SET status = ? WHERE id = ?").run(input.status, input.id);
      return db.prepare("SELECT * FROM prospects WHERE id = ?").get(input.id) as ProspectRecord | undefined;
    }),

  incrementViews: publicProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(({ input }) => {
      db.prepare("UPDATE prospects SET landingPageViews = landingPageViews + 1 WHERE slug = ?").run(input.slug);
      return db.prepare("SELECT * FROM prospects WHERE slug = ?").get(input.slug) as ProspectRecord | undefined;
    }),

  recordActivity: publicProcedure
    .input(
      z.object({
        prospectId: z.number().int(),
        eventType: z.string(),
        eventData: z.record(z.any()).optional(),
        interestScore: z.number().optional().default(0),
      })
    )
    .mutation(async ({ input }) => {
      // 1. Log event to database
      try {
        db.prepare(
          `INSERT INTO prospect_activities (prospectId, eventType, eventData)
           VALUES (?, ?, ?)`
        ).run(input.prospectId, input.eventType, JSON.stringify(input.eventData || null));
      } catch (err) {
        console.error("❌ Failed to write activity to SQLite:", err);
      }

      // 2. Fetch prospect details to populate webhook notifications
      let prospectInfo = { name: "Unknown Prospect", company: undefined as string | undefined, email: undefined as string | undefined };
      try {
        const prospect = db.prepare("SELECT firstName, lastName, company, email FROM prospects WHERE id = ?").get(input.prospectId) as {
          firstName?: string;
          lastName?: string;
          company?: string;
          email?: string;
        } | undefined;

        if (prospect) {
          const name = [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") || prospect.email || "Unknown Prospect";
          prospectInfo = { name, company: prospect.company, email: prospect.email };
        }
      } catch (err) {
        console.error("⚠️ Failed to read prospect details for webhook, using fallback:", err);
      }

      // Trigger webhook notification
      await triggerWebhook(
        prospectInfo,
        input.eventType,
        input.eventData,
        input.interestScore
      );

      return { success: true };
    }),
});

