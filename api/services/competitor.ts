import type { CompetitorBenchmark } from "../agents/types.js";

/**
 * Stub: Fetch competitor benchmarks.
 * TODO: Implement real competitor search via Rainforest API or external data source.
 */
export async function fetchCompetitors(
  _asin: string,
  _category: string
): Promise<CompetitorBenchmark[]> {
  void _asin;
  void _category;
  // Placeholder: returns empty array until real competitor API is wired.
  // In production, this should query an external service or database.
  return [];
}
