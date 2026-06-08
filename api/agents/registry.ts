import type { Agent, AgentRole } from "./types.js";
import { ApifyFetcherAgent } from "./agents/apifyFetcher.js";
import { CompetitorAnalystAgent } from "./agents/competitorAnalyst.js";
import { ContentOptimizerAgent } from "./agents/contentOptimizer.js";
import { EmbeddingGeneratorAgent } from "./agents/embeddingGenerator.js";
import { ListingFetcherAgent } from "./agents/listingFetcher.js";
import { PreprocessorAgent } from "./agents/preprocessor.js";
import { SemanticAnalyzerAgent } from "./agents/semanticAnalyzer.js";

export interface AgentRegistry {
  get(role: AgentRole): Agent | undefined;
}

export class DefaultAgentRegistry implements AgentRegistry {
  private agents = new Map<AgentRole, Agent>();

  get(role: AgentRole): Agent | undefined {
    if (this.agents.has(role)) {
      return this.agents.get(role);
    }

    let agent: Agent | undefined;
    switch (role) {
      case "apify_fetcher":
        agent = new ApifyFetcherAgent();
        break;
      case "listing_fetcher":
        agent = new ListingFetcherAgent();
        break;
      case "preprocessor":
        agent = new PreprocessorAgent();
        break;
      case "embedding_generator":
        agent = new EmbeddingGeneratorAgent();
        break;
      case "semantic_analyzer":
        agent = new SemanticAnalyzerAgent();
        break;
      case "content_optimizer":
        agent = new ContentOptimizerAgent();
        break;
      case "competitor_analyst":
        agent = new CompetitorAnalystAgent();
        break;
    }

    if (agent) {
      this.agents.set(role, agent);
    }
    return agent;
  }
}
