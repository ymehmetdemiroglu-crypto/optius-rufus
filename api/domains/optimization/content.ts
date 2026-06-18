import type { OptimizedContent, SemanticGap, RawListingData } from "../../pipeline/pipeline.types.js";
import { generateSemanticRewrittenContent } from "./semanticRewriter.js";

/**
 * Generate optimized title, bullets, description, and Q&A using the state-of-the-art
 * keyword-preserving semantic rewriter. The rewriter closes semantic gaps while
 * protecting the original keyword inventory and keeping copy readable for humans.
 */
export async function generateOptimizedContent(
  gaps: SemanticGap[],
  listing: RawListingData
): Promise<OptimizedContent> {
  return generateSemanticRewrittenContent(gaps, listing);
}
