import type { CompetitorBenchmark, RawListingData } from "../pipeline/types.js";
import { scrapeAmazonListing } from "../domains/listing/scraper.js";
import { generateEmbedding } from "./embedding.js";
import { analyzeSemanticGaps } from "../domains/analysis/engine.js";

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY;

/**
 * Fetch competitor benchmarks for a given ASIN and category.
 * Uses Rainforest API search to find top competitors, then runs
 * semantic analysis on each to produce real scores.
 */
export async function fetchCompetitors(
  asin: string,
  category: string
): Promise<CompetitorBenchmark[]> {
  if (!RAINFOREST_API_KEY) {
    console.warn("[Competitor] No RAINFOREST_API_KEY found. Returning empty competitors.");
    return [];
  }

  try {
    // Build search query from category keywords
    const searchTerm = buildSearchTerm(category);
    const domain = "amazon.com";

    const url = `https://api.rainforestapi.com/request?type=search&amazon_domain=${domain}&search_term=${encodeURIComponent(searchTerm)}&page=1`;

    const response = await fetch(url, {
      headers: { "Authorization": `Bearer ${RAINFOREST_API_KEY}` },
    });

    if (!response.ok) {
      console.warn(`[Competitor] Rainforest search failed: ${response.status}`);
      return [];
    }

    const json = (await response.json()) as {
      search_results?: Array<{
        asin?: string;
        title?: string;
        price?: { value?: number };
        rating?: number;
        ratings_total?: number;
      }>;
    };

    const results = (json.search_results || [])
      .filter((r) => r.asin && r.asin !== asin)
      .slice(0, 5);

    if (results.length === 0) {
      console.warn("[Competitor] No search results found.");
      return [];
    }

    // Scrape and analyze each competitor
    const benchmarks: CompetitorBenchmark[] = [];

    for (const result of results) {
      try {
        const competitorAsin = result.asin!;
        const scraped = await scrapeAmazonListing(competitorAsin, "US");

        const rawListing: RawListingData = {
          asin: scraped.asin,
          title: scraped.title,
          bullets: scraped.bullets,
          description: scraped.description,
          brand: scraped.brand,
          category: scraped.category || category,
          subcategory: scraped.category || category,
          images: scraped.images,
          price: scraped.price,
          rating: scraped.rating,
          reviewCount: scraped.reviewCount,
          attributes: scraped.rawScrapeData ? JSON.parse(scraped.rawScrapeData) : {},
        };

        // Generate embedding and analyze
        const textToEmbed = `${rawListing.title} ${rawListing.bullets.join(" ")} ${rawListing.description}`.slice(0, 3000);
        const embedding = await generateEmbedding(textToEmbed);

        const cleaned = {
          text: textToEmbed.toLowerCase().replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
          source: rawListing,
        };

        const analysis = await analyzeSemanticGaps(embedding, cleaned);

        benchmarks.push({
          asin: competitorAsin,
          title: scraped.title || result.title || "Unknown",
          brand: scraped.brand || "Unknown",
          price: scraped.price || result.price?.value || 0,
          rating: scraped.rating || result.rating || 0,
          reviewCount: scraped.reviewCount || result.ratings_total || 0,
          score: analysis.rufusScore,
          embeddingSimilarity: 0, // Could compute vs target embedding if available
        });
      } catch (compErr) {
        const message = compErr instanceof Error ? compErr.message : String(compErr);
        console.warn(`[Competitor] Failed to analyze competitor ${result.asin}: ${message}`);
      }
    }

    return benchmarks;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Competitor] Error fetching competitors: ${message}`);
    return [];
  }
}

function buildSearchTerm(category: string): string {
  // Extract meaningful keywords from category
  const lower = category.toLowerCase();

  if (lower.includes("magnesium")) return "magnesium supplement";
  if (lower.includes("vitamin")) return "vitamin supplement";
  if (lower.includes("collagen")) return "collagen supplement";
  if (lower.includes("probiotic")) return "probiotic supplement";
  if (lower.includes("omega")) return "omega 3 supplement";
  if (lower.includes("protein")) return "protein powder";
  if (lower.includes("serum")) return "face serum";
  if (lower.includes("moisturizer")) return "face moisturizer";
  if (lower.includes("cleanser")) return "facial cleanser";
  if (lower.includes("sunscreen")) return "sunscreen";

  // Generic fallback: take first 3 words of category
  const words = category.split(/\s+/).filter((w) => w.length > 2);
  return words.slice(0, 3).join(" ") || "health supplement";
}
