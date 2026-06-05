import { generateEmbedding } from "./embedding.js";

export interface CatalogLinkInput {
  asin: string;
  title: string;
  brand: string;
  bullets: string[];
}

export interface CatalogLinkResult {
  sourceAsin: string;
  targetAsin: string;
  relationshipType: "substitute" | "complementary" | "co_occurrence";
  strengthScore: number;
}

/**
 * Calculates the cosine similarity (dot product) of two normalized 1536-dim vectors.
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  return dotProduct;
}

/**
 * Builds the COSMO catalog graph relations between the target ASIN and competitors.
 */
export async function buildCatalogGraph(
  targetAsin: string,
  targetEmbedding: number[],
  competitors: CatalogLinkInput[]
): Promise<CatalogLinkResult[]> {
  console.log(`📊 [CatalogGraph] Building catalog graph for ASIN: ${targetAsin} against ${competitors.length} competitors`);
  
  const results: CatalogLinkResult[] = [];

  for (const comp of competitors) {
    try {
      const compText = `${comp.title} ${comp.brand} ${comp.bullets.join(" ")}`;
      const compEmbedding = await generateEmbedding(compText);
      
      const similarity = calculateCosineSimilarity(targetEmbedding, compEmbedding);
      // Map similarity (which is usually in the range [-1, 1] but for embeddings usually [0.3, 0.9])
      const strengthScore = Math.max(0, Math.min(1, (similarity + 1) / 2)); // map to [0,1] or keep raw if high enough
      
      // Determine relationship category
      let relationshipType: "substitute" | "complementary" | "co_occurrence" = "co_occurrence";
      if (similarity > 0.75) {
        relationshipType = "substitute";
      } else if (similarity > 0.55) {
        relationshipType = "complementary";
      }

      results.push({
        sourceAsin: targetAsin,
        targetAsin: comp.asin,
        relationshipType,
        strengthScore: parseFloat(strengthScore.toFixed(2)),
      });
    } catch (err) {
      console.error(`❌ [CatalogGraph] Error processing competitor ${comp.asin}:`, err);
    }
  }

  return results;
}
