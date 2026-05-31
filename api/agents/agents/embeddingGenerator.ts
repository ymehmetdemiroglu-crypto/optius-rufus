import { generateEmbedding } from "../../services/embedding.js";
import type { Agent, AgentRole, CleanedText } from "../types.js";

export class EmbeddingGeneratorAgent implements Agent {
  role: AgentRole = "embedding_generator";

  async execute(input: unknown): Promise<number[]> {
    const { text } = input as CleanedText;

    if (!text || text.length < 10) {
      throw new Error("Text too short for embedding generation");
    }

    const embedding = await generateEmbedding(text);

    if (embedding.length !== 1536) {
      throw new Error(`Expected 1536-dim embedding, got ${embedding.length}`);
    }

    if (embedding.some((v) => !Number.isFinite(v))) {
      throw new Error("Embedding contains non-finite values");
    }

    return embedding;
  }
}
