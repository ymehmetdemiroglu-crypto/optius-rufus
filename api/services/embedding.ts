/**
 * Stub: Generate embedding vector using OpenAI API.
 * In production, this calls text-embedding-3-small.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  await delay(300 + Math.random() * 200);

  // Return a deterministic pseudo-random 1536-dim vector based on text hash
  const seed = hashString(text);
  const rng = seededRandom(seed);
  const vector: number[] = [];
  for (let i = 0; i < 1536; i++) {
    vector.push(rng() * 2 - 1);
  }
  // Normalize to unit length
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return vector.map((v) => v / norm);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
