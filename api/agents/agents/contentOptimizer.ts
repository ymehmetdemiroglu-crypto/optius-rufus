import { generateOptimizedContent } from "../../services/optimization.js";
import type { Agent, AgentRole, OptimizedContent, RawListingData, SemanticGap } from "../types.js";

export class ContentOptimizerAgent implements Agent {
  role: AgentRole = "content_optimizer";

  async execute(input: unknown): Promise<OptimizedContent> {
    const { gaps, listing } = input as { gaps: SemanticGap[]; listing: RawListingData };

    const content = await generateOptimizedContent(gaps, listing);

    if (!content.title || content.title.length > 200) {
      throw new Error(`Title invalid or too long (${content.title?.length} chars)`);
    }

    if (!Array.isArray(content.bullets) || content.bullets.length !== 5) {
      throw new Error(`Expected 5 bullets, got ${content.bullets?.length}`);
    }

    if (!Array.isArray(content.qas) || content.qas.length < 3) {
      throw new Error(`Expected at least 3 QAs, got ${content.qas?.length}`);
    }

    return content;
  }
}
