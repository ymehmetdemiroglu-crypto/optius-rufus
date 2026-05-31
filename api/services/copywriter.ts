const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

import type { RawListingData, SemanticGap } from "../agents/types.js";

interface AnalysisInput {
  rufusScore: number;
  cosmoScore: number;
  semanticGaps: SemanticGap[];
}

export async function generateLandingPageCopy(
  analysis: AnalysisInput,
  listing: RawListingData
): Promise<{
  hook: string;
  narrative: string;
  solution: string;
  urgencyCTA: string;
}> {
  if (!OPENAI_API_KEY) {
    return {
      hook: `Your ${listing.brand || "Amazon"} listing is bleeding invisible sales.`,
      narrative: `Amazon's AI — Rufus and COSMO — are rewriting the rules of search. Your current listing for "${listing.title}" scores ${analysis.rufusScore || 62}/100 for semantic depth. That means qualified buyers are seeing your competitors first.`,
      solution: `Optimus Rufus reverse-engineers how Amazon's AI reads intent. We reconstruct your listing around buyer questions, semantic clusters, and conversion psychology — then deliver optimized copy, Q&A strategy, and competitive benchmarks.`,
      urgencyCTA: `Book a free 15-minute teardown. We'll show you exactly where your listing is losing ground — and the specific changes that will recover it.`,
    };
  }

  const prompt = `You are OPTIMUS RUFUS — an elite Amazon listing optimization AI with a sci-fi authority tone. You speak like a tactical commander who sees the invisible battlefield of Amazon search.

ANALYSIS DATA:
- Listing Title: ${listing.title || "Unknown"}
- Brand: ${listing.brand || "Unknown"}
- Rufus Score: ${analysis.rufusScore || "N/A"}/100
- Cosmo Score: ${analysis.cosmoScore || "N/A"}/100
- Top Semantic Gaps: ${(analysis.semanticGaps || [])
    .slice(0, 3)
    .map((g) => g.dimension)
    .join(", ")}

Write 4 pieces of landing page copy for a personalized prospect report:

1. HOOK: A bold, aggressive headline that grabs their attention and references their actual product data.
2. NARRATIVE: 2-3 sentences that frame their problem using their actual scores and gaps. Make it feel personal and urgent.
3. SOLUTION: 2-3 sentences that position Optimus Rufus as the weapon that fixes this.
4. URGENCY_CTA: A strong call-to-action with scarcity or urgency.

Return ONLY a JSON object with keys: hook, narrative, solution, urgencyCTA.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a conversion copywriter AI. Respond only with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { choices: Array<{ message: { content: string } }> };
  let content: Record<string, string>;
  try {
    content = JSON.parse(data.choices[0].message.content);
  } catch {
    return {
      hook: `Your ${listing.brand || "Amazon"} listing is bleeding invisible sales.`,
      narrative: `Amazon's AI — Rufus and COSMO — are rewriting the rules of search. Your current listing for "${listing.title}" scores ${analysis.rufusScore || 62}/100 for semantic depth. That means qualified buyers are seeing your competitors first.`,
      solution: `Optimus Rufus reverse-engineers how Amazon's AI reads intent. We reconstruct your listing around buyer questions, semantic clusters, and conversion psychology — then deliver optimized copy, Q&A strategy, and competitive benchmarks.`,
      urgencyCTA: `Book a free 15-minute teardown. We'll show you exactly where your listing is losing ground — and the specific changes that will recover it.`,
    };
  }
  return {
    hook: content.hook || content.HOOK || "",
    narrative: content.narrative || content.NARRATIVE || "",
    solution: content.solution || content.SOLUTION || "",
    urgencyCTA: content.urgencyCTA || content.URGENCY_CTA || content.urgency_cta || "",
  };
}
