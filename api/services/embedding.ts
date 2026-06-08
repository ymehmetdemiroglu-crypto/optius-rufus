import { callEmbedding } from "./llmGateway.js";

/**
 * Generate embedding vector via the centralized LLM gateway.
 * Prefers OpenRouter, falls back to OpenAI, then deterministic fallback.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    return await callEmbedding(text.slice(0, 8000), { service: "embedding" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Embedding] API call failed: ${message}. Using deterministic fallback.`);
    return generateFallbackEmbedding(text);
  }
}

function generateFallbackEmbedding(text: string): number[] {
  const seed = hashString(text);
  const rng = seededRandom(seed);
  const vector: number[] = [];
  for (let i = 0; i < 1536; i++) {
    vector.push(rng() * 2 - 1);
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map((v) => v / norm);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
