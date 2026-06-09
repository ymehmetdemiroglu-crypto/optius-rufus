import { z } from "zod";
import { scrapeAmazonListing } from "./scraper.js";
import * as listingService from "./service.js";
import * as prospectService from "../prospect/service.js";
import { router, publicProcedure } from "../../trpc.js";

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

        let rawScrapeData: Record<string, unknown> = {};
        if (item.rawScrapeData) {
          try {
            rawScrapeData = JSON.parse(item.rawScrapeData);
          } catch {
            rawScrapeData = {};
          }
        }

        const listing = await listingService.createListing({
          prospectId: input.prospectId,
          asin: item.asin,
          marketplace: input.marketplace,
          url: `https://www.amazon.com/dp/${item.asin}`,
          title: item.title,
          bullets: item.bullets,
          description: item.description,
          brand: item.brand,
          category: item.category,
          price: item.price,
          rating: item.rating,
          reviewCount: item.reviewCount,
          images: item.images,
          aPlusText: item.aPlusText,
          rawScrapeData,
        });

        await prospectService.updateProspectStatus(input.prospectId, "scraped");

        return { status: "SUCCEEDED", listing };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[ScraperRouter] Trigger failed:", err);
        throw new Error(`Scraping failed: ${message}`, { cause: err });
      }
    }),

  poll: publicProcedure
    .input(z.object({ runId: z.string() }))
    .mutation(async () => {
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
    .mutation(async ({ input }) => {
      const item = input.data;

      const listing = await listingService.createListing({
        prospectId: input.prospectId,
        asin: input.asin,
        marketplace: input.marketplace,
        url: (item.url as string) || `https://www.amazon.com/dp/${input.asin}`,
        title: (item.title as string) || "",
        bullets: Array.isArray(item.bullets) ? item.bullets : [],
        description: (item.description as string) || "",
        brand: (item.brand as string) || "",
        category: (item.category as string) || "",
        price: (item.price as number) || 0,
        rating: (item.rating as number) || 0,
        reviewCount: (item.reviewCount as number) || 0,
        images: Array.isArray(item.images) ? item.images : [],
        aPlusText: (item.aPlusText as string) || "",
        rawScrapeData: item,
      });

      await prospectService.updateProspectStatus(input.prospectId, "scraped");

      return listing;
    }),
});
