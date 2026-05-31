import { analyzeSemanticGaps } from "../../services/analysis.js";
import type { Agent, AgentRole, AnalysisResult, CleanedText } from "../types.js";

export class SemanticAnalyzerAgent implements Agent {
  role: AgentRole = "semantic_analyzer";

  async execute(input: unknown): Promise<AnalysisResult> {
    const { embedding, text } = input as { embedding: number[]; text: CleanedText };

    const result = await analyzeSemanticGaps(embedding, text);

    if (typeof result.rufusScore !== "number" || result.rufusScore < 0 || result.rufusScore > 100) {
      throw new Error(`Invalid Rufus score: ${result.rufusScore}`);
    }

    if (!Array.isArray(result.semanticGaps) || result.semanticGaps.length === 0) {
      throw new Error("Semantic gaps array is empty");
    }

    return result;
  }
}
