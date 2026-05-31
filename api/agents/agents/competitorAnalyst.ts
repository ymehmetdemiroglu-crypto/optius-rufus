import { fetchCompetitors } from "../../services/competitor.js";
import type { Agent, AgentRole, CompetitorBenchmark, RawListingData } from "../types.js";

export class CompetitorAnalystAgent implements Agent {
  role: AgentRole = "competitor_analyst";

  async execute(input: unknown): Promise<CompetitorBenchmark[]> {
    const { asin, category } = input as { asin: string; category: string };

    const competitors = await fetchCompetitors(asin, category);

    if (competitors.length > 5) {
      throw new Error(`Too many competitors fetched: ${competitors.length}`);
    }

    for (const comp of competitors) {
      if (typeof comp.score !== "number" || comp.score < 0 || comp.score > 100) {
        throw new Error(`Invalid competitor score for ${comp.asin}: ${comp.score}`);
      }
    }

    return competitors;
  }
}
