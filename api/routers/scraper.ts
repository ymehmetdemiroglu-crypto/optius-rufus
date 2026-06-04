import { z } from "zod";
import { db } from "../db/client.js";
import type { ListingRecord } from "../db/client.js";
import { triggerScrape, getRunStatus, getDatasetItems } from "../services/apify.js";
import { router, publicProcedure } from "../trpc.js";

// In-memory store for Apify runs
const runStore = new Map<string, { prospectId: number; datasetId: string }>();

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
      const { runId, datasetId } = await triggerScrape(input.asin, input.marketplace);
      runStore.set(runId, { prospectId: input.prospectId, datasetId });
      return { runId };
    }),

  poll: publicProcedure
    .input(z.object({ runId: z.string() }))
    .mutation(async ({ input }) => {
      const runInfo = runStore.get(input.runId);
      if (!runInfo) {
        throw new Error(`Run not found: ${input.runId}`);
      }

      const status = await getRunStatus(input.runId);

      if (status === "SUCCEEDED") {
        const items = await getDatasetItems(runInfo.datasetId);
        const item = items[0];

        if (!item) {
          throw new Error("No items found in dataset");
        }

        const bullets = Array.isArray(item.bullets) ? JSON.stringify(item.bullets) : item.bullets || "[]";
        const images = Array.isArray(item.images) ? JSON.stringify(item.images) : item.images || "[]";

        const result = db
          .prepare(
            `INSERT INTO listings (prospectId, asin, marketplace, url, title, bullets, description, brand, category, price, rating, reviewCount, images, rawScrapeData, scrapedAt, createdAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
          )
          .run(
            runInfo.prospectId,
            input.runId.startsWith("mock-") ? item.asin || "B0TEST1234" : item.asin,
            item.marketplace || "US",
            item.url || `https://www.amazon.com/dp/${item.asin}`,
            item.title || "",
            bullets,
            item.description || "",
            item.brand || "",
            item.category || "",
            item.price || 0,
            item.rating || 0,
            item.reviewCount || 0,
            images,
            JSON.stringify(item)
          );

        const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(result.lastInsertRowid) as ListingRecord | undefined;

        db.prepare("UPDATE prospects SET status = 'scraped' WHERE id = ?").run(runInfo.prospectId);

        return { status, listing };
      }

      return { status, listing: null };
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
      const bullets = Array.isArray(item.bullets) ? JSON.stringify(item.bullets) : item.bullets || "[]";
      const images = Array.isArray(item.images) ? JSON.stringify(item.images) : item.images || "[]";

      const result = db
        .prepare(
          `INSERT INTO listings (prospectId, asin, marketplace, url, title, bullets, description, brand, category, price, rating, reviewCount, images, rawScrapeData, scrapedAt, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
        )
        .run(
          input.prospectId,
          input.asin,
          input.marketplace,
          item.url || `https://www.amazon.com/dp/${input.asin}`,
          item.title || "",
          bullets,
          item.description || "",
          item.brand || "",
          item.category || "",
          item.price || 0,
          item.rating || 0,
          item.reviewCount || 0,
          images,
          JSON.stringify(item)
        );

      const listing = db.prepare("SELECT * FROM listings WHERE id = ?").get(result.lastInsertRowid) as ListingRecord | undefined;
      db.prepare("UPDATE prospects SET status = 'scraped' WHERE id = ?").run(input.prospectId);

      return listing;
    }),
});

