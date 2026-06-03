import { z } from "zod";
import { db } from "../db/client.js";

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10);
}

export const prospectsRouter = {
  create: {
    type: "mutation" as const,
    input: z.object({
      email: z.string().email(),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      company: z.string().optional(),
      asin: z.string().optional(),
      marketplace: z.string().optional(),
    }),
    resolve: async ({
      input,
    }: {
      input: {
        email: string;
        firstName?: string;
        lastName?: string;
        company?: string;
        asin?: string;
        marketplace?: string;
      };
    }) => {
      const slug = generateSlug();
      const result = db
        .prepare(
          `INSERT INTO prospects (slug, email, firstName, lastName, company, status, landingPageViews, createdAt)
         VALUES (?, ?, ?, ?, ?, 'new', 0, datetime('now'))`
        )
        .run(slug, input.email, input.firstName || null, input.lastName || null, input.company || null);

      const prospect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(result.lastInsertRowid);
      return prospect;
    },
  },

  getBySlug: {
    type: "query" as const,
    input: z.object({ slug: z.string() }),
    resolve: async ({ input }: { input: { slug: string } }) => {
      const prospect = db.prepare("SELECT * FROM prospects WHERE slug = ?").get(input.slug);
      if (!prospect) {
        throw new Error(`Prospect not found: ${input.slug}`);
      }

      const listing = db
        .prepare("SELECT * FROM listings WHERE prospectId = ? ORDER BY createdAt DESC LIMIT 1")
        .get(prospect.id);
      const analysis = listing
        ? db
            .prepare("SELECT * FROM listing_analyses WHERE listingId = ? ORDER BY createdAt DESC LIMIT 1")
            .get(listing.id)
        : null;

      return { prospect, listing: listing || null, analysis: analysis || null };
    },
  },

  list: {
    type: "query" as const,
    input: z.object({
      status: z.string().optional(),
      limit: z.number().int().min(1).max(100).optional().default(50),
      offset: z.number().int().min(0).optional().default(0),
    }),
    resolve: ({
      input,
    }: {
      input: { status?: string; limit: number; offset: number };
    }) => {
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
    },
  },

  getById: {
    type: "query" as const,
    input: z.object({ id: z.number().int() }),
    resolve: ({ input }: { input: { id: number } }) => {
      const prospect = db.prepare("SELECT * FROM prospects WHERE id = ?").get(input.id);
      if (!prospect) {
        throw new Error(`Prospect not found: ${input.id}`);
      }

      const listing = db
        .prepare("SELECT * FROM listings WHERE prospectId = ? ORDER BY createdAt DESC LIMIT 1")
        .get(prospect.id);
      const analysis = listing
        ? db
            .prepare("SELECT * FROM listing_analyses WHERE listingId = ? ORDER BY createdAt DESC LIMIT 1")
            .get(listing.id)
        : null;
      const bookings = db.prepare("SELECT * FROM bookings WHERE prospectId = ? ORDER BY createdAt DESC").all(prospect.id);

      return { prospect, listing: listing || null, analysis: analysis || null, bookings: bookings || [] };
    },
  },

  updateStatus: {
    type: "mutation" as const,
    input: z.object({ id: z.number().int(), status: z.string() }),
    resolve: ({ input }: { input: { id: number; status: string } }) => {
      db.prepare("UPDATE prospects SET status = ? WHERE id = ?").run(input.status, input.id);
      return db.prepare("SELECT * FROM prospects WHERE id = ?").get(input.id);
    },
  },

  incrementViews: {
    type: "mutation" as const,
    input: z.object({ slug: z.string() }),
    resolve: ({ input }: { input: { slug: string } }) => {
      if (!db.readonly) {
        db.prepare("UPDATE prospects SET landingPageViews = landingPageViews + 1 WHERE slug = ?").run(input.slug);
      }
      return db.prepare("SELECT * FROM prospects WHERE slug = ?").get(input.slug);
    },
  },
};
