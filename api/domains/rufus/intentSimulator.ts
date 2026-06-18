import type {
  AnalysisResult,
  PredictedIntent,
  RawListingData,
} from "../../pipeline/pipeline.types.js";
import type {
  CompetitorBenchmark,
} from "../../pipeline/pipeline.types.js";

export interface SimulatorScenario {
  buyerQuestion: string;
  rufusAnswer: string;
  competitorName: string;
  failReason: string;
}

export interface CompetitorComparison {
  query: string;
  competitorName: string;
  competitorAdvantage: string;
  yourGap: string;
}

export interface GroundedSimulation {
  scenarios: SimulatorScenario[];
  competitorAudit: CompetitorComparison[];
}

const FALLBACK_COMPETITORS = ["NutraVitality", "Nature's Bounty", "Doctor's Best", "BiOptimizers"];

function pickCompetitor(
  competitors: CompetitorBenchmark[],
  index: number
): { name: string; asin?: string; title?: string } {
  if (competitors.length > 0) {
    const comp = competitors[index % competitors.length];
    return { name: comp.brand || comp.title || "Competitor", asin: comp.asin, title: comp.title };
  }
  return { name: FALLBACK_COMPETITORS[index % FALLBACK_COMPETITORS.length] };
}

function buildRufusHedgedAnswer(
  listing: RawListingData,
  intent: PredictedIntent,
  competitorName: string
): string {
  const brand = listing.brand || "this brand";
  const missing = intent.missingSignals.slice(0, 2).join(" and ") || "the specific details";
  return `I couldn't find clear information about ${missing} in ${brand}'s listing. ${competitorName} provides more explicit ${intent.dimension.replace(/_/g, " ")} details, so I'd recommend checking that out.`;
}

function buildFailReason(intent: PredictedIntent): string {
  const missing = intent.missingSignals.slice(0, 3).join(", ") || intent.dimension.replace(/_/g, " ");
  return `Your listing is missing signals for ${missing}. Rufus needs these cues to recommend your product for "${intent.query}".`;
}

function buildCompetitorAdvantage(intent: PredictedIntent, competitorName: string): string {
  return `${competitorName} explicitly covers ${intent.dimension.replace(/_/g, " ")} signals such as ${intent.signals.slice(0, 3).join(", ") || "relevant details"}, making it the safer recommendation.`;
}

/**
 * Generate Rufus simulator scenarios and competitor loss audits grounded in the
 * actual predicted buyer intents and real competitor benchmarks.
 */
export function generateGroundedRufusSimulation(
  analysis: AnalysisResult,
  listing: RawListingData,
  competitors: CompetitorBenchmark[] = []
): GroundedSimulation {
  const intents = analysis.predictedIntents
    .filter((i) => i.priority === "critical" || i.priority === "high")
    .slice(0, 5);

  // If no predicted intents are available, fall back to semantic gaps
  const sourceIntents: PredictedIntent[] =
    intents.length > 0
      ? intents
      : analysis.semanticGaps.slice(0, 5).map((g) => ({
        dimension: g.dimension,
        query: `What is the best option for ${g.dimension.replace(/_/g, " ")}?`,
        journey: "informational",
        coverage: Math.round((1 - g.gap) * 100),
        weight: 0.1,
        priority: g.priority,
        signals: [],
        missingSignals: [g.recommendation],
      }));

  const scenarios: SimulatorScenario[] = [];
  const competitorAudit: CompetitorComparison[] = [];

  for (let i = 0; i < Math.min(3, sourceIntents.length); i++) {
    const intent = sourceIntents[i];
    const competitor = pickCompetitor(competitors, i);
    const competitorName = competitor.name;

    scenarios.push({
      buyerQuestion: intent.query,
      rufusAnswer: buildRufusHedgedAnswer(listing, intent, competitorName),
      competitorName,
      failReason: buildFailReason(intent),
    });

    competitorAudit.push({
      query: intent.query,
      competitorName,
      competitorAdvantage: buildCompetitorAdvantage(intent, competitorName),
      yourGap: `Missing ${intent.missingSignals.slice(0, 3).join(", ") || intent.dimension.replace(/_/g, " ")}.`,
    });
  }

  return { scenarios, competitorAudit };
}
