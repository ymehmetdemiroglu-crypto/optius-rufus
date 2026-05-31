import type { CompetitorBenchmark } from "../agents/types.js";

/**
 * Stub: Fetch competitor benchmarks.
 */
export async function fetchCompetitors(
  asin: string,
  category: string
): Promise<CompetitorBenchmark[]> {
  await delay(600 + Math.random() * 400);

  if (!category.includes("Health")) {
    return [];
  }

  return [
    {
      asin: "B07ABC1234",
      title: "Nature's Bounty Magnesium 500mg, 200 Tablets",
      brand: "Nature's Bounty",
      price: 19.99,
      rating: 4.5,
      reviewCount: 12800,
      score: 72,
      embeddingSimilarity: 0.82,
    },
    {
      asin: "B09DEF5678",
      title: "Doctor's Best High Absorption Magnesium, 240 Veggie Caps",
      brand: "Doctor's Best",
      price: 21.5,
      rating: 4.7,
      reviewCount: 9500,
      score: 78,
      embeddingSimilarity: 0.88,
    },
    {
      asin: "B10GHI9012",
      title: "Magnesium Breakthrough — 7 Forms of Magnesium, 60 Caps",
      brand: "BiOptimizers",
      price: 39.99,
      rating: 4.4,
      reviewCount: 3200,
      score: 65,
      embeddingSimilarity: 0.71,
    },
  ];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
