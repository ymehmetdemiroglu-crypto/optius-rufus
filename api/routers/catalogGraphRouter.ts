import { z } from "zod";
import { db } from "../db/client.js";
import { router, publicProcedure } from "../trpc.js";
import { buildCatalogGraph } from "../services/catalogGraph.js";
import { generateEmbedding } from "../services/embedding.js";
import { fetchCompetitors } from "../services/competitor.js";

export const catalogGraphRouter = router({
  getGraph: publicProcedure
    .input(z.object({ prospectId: z.number().int() }))
    .query(async ({ input }) => {
      // 1. Check if we already have links cached
      const cached = db
        .prepare("SELECT * FROM catalog_links WHERE prospectId = ?")
        .all(input.prospectId) as any[];

      if (cached && cached.length > 0) {
        console.log(`[CatalogGraphRouter] Returning ${cached.length} cached catalog links`);
        return { links: cached };
      }

      // 2. Otherwise, dynamically generate
      const listing = db
        .prepare("SELECT * FROM listings WHERE prospectId = ? ORDER BY id DESC LIMIT 1")
        .get(input.prospectId) as any;

      if (!listing) {
        return { links: [] };
      }

      console.log(`[CatalogGraphRouter] No cached links found. Generating dynamically...`);

      // Parse bullets safely
      let bulletsList: string[] = [];
      try {
        bulletsList = JSON.parse(listing.bullets || "[]");
      } catch {
        bulletsList = [];
      }

      try {
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
          db.prepare("UPDATE listings SET embeddingVector = ? WHERE id = ?").run(
            JSON.stringify(embedding),
            listing.id
          );
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

        // Save generated links to SQLite
        for (const link of generatedLinks) {
          db.prepare(
            `INSERT INTO catalog_links (prospectId, sourceAsin, targetAsin, relationshipType, strengthScore, createdAt)
             VALUES (?, ?, ?, ?, ?, datetime('now'))`
          ).run(
            input.prospectId,
            link.sourceAsin,
            link.targetAsin,
            link.relationshipType,
            link.strengthScore
          );
        }

        const freshLinks = db
          .prepare("SELECT * FROM catalog_links WHERE prospectId = ?")
          .all(input.prospectId) as any[];

        return { links: freshLinks };
      } catch (err) {
        console.error("❌ [CatalogGraphRouter] Failed to build catalog graph dynamically:", err);
        return { links: [] };
      }
    }),
});
