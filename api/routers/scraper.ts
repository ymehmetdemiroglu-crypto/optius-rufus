import { z } from "zod";
import { db } from "../db/client.js";
import type { ListingRecord } from "../db/client.js";
import { scrapeAmazonListing } from "../services/scraper.js";
import { router, publicProcedure } from "../trpc.js";

export const scraperRouter = router({
  trigger: publicProcedure
    .input(
      z.object({
        prospectId: z.number().int(),
        asin: z.string(),
        marketplace: z.string().optional().default("US"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const item = await scrapeAmazonListing(input.asin, input.marketplace);
        
        const bullets = Array.isArray(item.bullets) ? JSON.stringify(item.bullets) : "[]";
        const images = Array.isArray(item.images) ? JSON.stringify(item.images) : "[]";

        const result = db.transaction(() => {
          const insertResult = db
            .prepare(
              `INSERT INTO listings (prospectId, asin, marketplace, url, title, bullets, description, brand, category, price, rating, reviewCount, images, aPlusText, rawScrapeData, scrapedAt, createdAt)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
            )
            .run(
              input.prospectId,
              item.asin,
              input.marketplace,
              `https://www.amazon.com/dp/${item.asin}`,
              item.title || "",
              bullets,
              item.description || "",
              item.brand || "",
              item.category || "",
              item.price || 0,
              item.rating || 0,
              item.reviewCount || 0,
              images,
              item.aPlusText || "",
              item.rawScrapeData || "{}"
            );

          db.prepare("UPDATE prospects SET status = 'scraped' WHERE id = ?").run(input.prospectId);
          return insertResult;
        })();

        const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(result.lastInsertRowid) as ListingRecord | undefined;

        return { status: "SUCCEEDED", listing };
      } catch (err: any) {
        console.error("❌ [ScraperRouter] Trigger failed:", err);
        throw new Error(`Scraping failed: ${err.message}`);
      }
    }),

  poll: publicProcedure
    .input(z.object({ runId: z.string() }))
    .mutation(async ({ input }) => {
      // Kept for backward compatibility with existing frontend expectations
      // Since trigger now runs synchronously, poll can immediately return SUCCEEDED if listing exists
      return { status: "SUCCEEDED", listing: null };
    }),

  ingestDirect: publicProcedure
    .input(
      z.object({
        prospectId: z.number().int(),
        asin: z.string(),
        marketplace: z.string().optional().default("US"),
        data: z.record(z.unknown()),
      })
    )
    .mutation(({ input }) => {
      const item = input.data;
      const bullets = Array.isArray(item.bullets) ? JSON.stringify(item.bullets) : "[]";
      const images = Array.isArray(item.images) ? JSON.stringify(item.images) : "[]";

      const result = db
        .prepare(
          `INSERT INTO listings (prospectId, asin, marketplace, url, title, bullets, description, brand, category, price, rating, reviewCount, images, aPlusText, rawScrapeData, scrapedAt, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
        )
        .run(
          input.prospectId,
          input.asin,
          input.marketplace,
          item.url || `https://www.amazon.com/dp/${input.asin}`,
          (item.title as string) || "",
          bullets,
          (item.description as string) || "",
          (item.brand as string) || "",
          (item.category as string) || "",
          (item.price as number) || 0,
          (item.rating as number) || 0,
          (item.reviewCount as number) || 0,
          images,
          (item.aPlusText as string) || "",
          JSON.stringify(item)
        );

      const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(result.lastInsertRowid) as ListingRecord | undefined;
      db.prepare("UPDATE prospects SET status = 'scraped' WHERE id = ?").run(input.prospectId);

      return listing;
    }),
});
