import { z } from "zod";
import { router, publicProcedure } from "../../trpc/context.js";
import { buildCatalogGraph } from "./service.js";
import { generateEmbedding } from "../../services/embedding.js";
import { fetchCompetitors } from "../../services/competitor.js";
import * as catalogRepo from '../catalog/repository.js';
import * as listingRepo from "../listing/repository.js";

export const catalogGraphRouter = router({
  getGraph: publicProcedure
    .input(z.object({ prospectId: z.number().int() }))
    .query(async ({ input }) => {
      try {
        // 1. Check if we already have links cached
        const cached = await catalogRepo.getLinksByProspectId(input.prospectId);

        if (cached && cached.length > 0) {
          console.log(`[CatalogGraphRouter] Returning ${cached.length} cached catalog links`);
          return { links: cached };
        }

        // 2. Otherwise, dynamically generate
        const listing = await listingRepo.getLatestByProspectId(input.prospectId);

        if (!listing) {
          return { links: [] };
        }

        console.log(`[CatalogGraphRouter] No cached links found. Generating dynamically...`);

        // Parse bullets safely
        const bulletsList: string[] = Array.isArray(listing.bullets)
          ? (listing.bullets as string[])
          : [];

        // Generate listing embedding if missing in row
        let embedding: number[] = [];
        if (listing.embeddingVector) {
          try {
            embedding = JSON.parse(listing.embeddingVector);
          } catch {
            embedding = [];
          }
        }
        
        if (!embedding || embedding.length !== 1536) {
          const textToEmbed = `${listing.title || ""} ${bulletsList.join(" ")} ${listing.description || ""} ${listing.aPlusText || ""}`;
          embedding = await generateEmbedding(textToEmbed.slice(0, 3000));
          // Save embedding back to listing for caching
          await listingRepo.updateEmbedding(listing.id, embedding);
        }

        // Fetch category competitors
        const category = listing.category || "Health & Household";
        const competitors = await fetchCompetitors(listing.asin, category);

        const linkInputs = competitors.map((c) => ({
          asin: c.asin,
          title: c.title,
          brand: c.brand,
          bullets: [c.title], // fallback bullet
        }));

        // Compute similarity connections
        const generatedLinks = await buildCatalogGraph(listing.asin, embedding, linkInputs);

        // Save generated links to Postgres
        for (const link of generatedLinks) {
          await catalogRepo.createLink({
            prospectId: input.prospectId,
            sourceAsin: link.sourceAsin,
            targetAsin: link.targetAsin,
            relationshipType: link.relationshipType,
            strengthScore: link.strengthScore,
          });
        }

        const freshLinks = await catalogRepo.getLinksByProspectId(input.prospectId);
        return { links: freshLinks };
      } catch (err) {
        console.error("❌ [CatalogGraphRouter] Failed to build catalog graph dynamically:", err);
        return { links: [] };
      }
    }),
});
