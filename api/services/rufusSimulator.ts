const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o";

export interface RufusRankingItem {
  asin: string;
  rank: number;
  recommended: boolean;
  reason: string;
}

export interface SimulatedQueryData {
  queryText: string;
  rankings: RufusRankingItem[];
}

export interface RufusSOVResult {
  questions: SimulatedQueryData[];
  sovPercent: number;
}

export async function simulateRufusSOV(
  listingTitle: string,
  listingBullets: string[],
  listingDescription: string,
  aPlusText: string,
  category: string,
  competitors: Array<{
    asin: string;
    title: string;
    brand: string;
    price: number;
    rating: number;
    reviewCount: number;
    score: number;
  }>
): Promise<RufusSOVResult> {
  console.log(`🤖 [RufusSimulator] Simulating Rufus query runs for category: ${category}`);

  const defaultCompetitors = competitors && competitors.length > 0 ? competitors : [
    {
      asin: "B07ABC1234",
      title: "Nature's Bounty Magnesium 500mg, 200 Tablets",
      brand: "Nature's Bounty",
      price: 19.99,
      rating: 4.5,
      reviewCount: 12800,
      score: 72,
    },
    {
      asin: "B09DEF5678",
      title: "Doctor's Best High Absorption Magnesium, 240 Veggie Caps",
      brand: "Doctor's Best",
      price: 21.5,
      rating: 4.7,
      reviewCount: 9500,
      score: 78,
    },
    {
      asin: "B10GHI9012",
      title: "Magnesium Breakthrough — 7 Forms of Magnesium, 60 Caps",
      brand: "BiOptimizers",
      price: 39.99,
      rating: 4.4,
      reviewCount: 3200,
      score: 65,
    }
  ];

  if (!OPENAI_API_KEY && !OPENROUTER_API_KEY) {
    console.log(`[RufusSimulator] No API keys. Generating mock Rufus SOV simulation...`);
    return generateFallbackSOV(listingTitle, defaultCompetitors, category);
  }

  const prompt = `You are simulating Amazon Rufus, a conversational shopping assistant. 
We want to evaluate how Rufus recommends a target product compared to 3 competitors on Amazon for 10 common user search queries in the category: "${category}".

TARGET PRODUCT:
- Title: ${listingTitle}
- Bullets: ${listingBullets.join(" | ")}
- Description: ${listingDescription}
- A+ Content: ${aPlusText}

COMPETITORS:
${defaultCompetitors.map((c, i) => `- Competitor ${i + 1}: ASIN: ${c.asin}, Title: "${c.title}", Brand: "${c.brand}", Price: $${c.price}, Rating: ${c.rating}/5, Reviews: ${c.reviewCount}`).join("\n")}

YOUR TASKS:
1. Formulate 10 distinct, natural user questions that real buyers in this category would ask a shopping assistant (e.g. "which of these has the best absorption?", "are there artificial fillers?", "is it safe for daily use?", "which is the cheapest per serving?").
2. For each query, evaluate and rank the target product ("target_product") and the 3 competitors (use their exact ASINs) based on:
   - Copy richness: Does their metadata (title, bullets, A+ text) answer the query explicitly?
   - Return rate and review trust indicators (rating, review count).
   - Price competitiveness.
3. For each product in the query, assign:
   - "rank": 1 (best), 2, 3, or 4.
   - "recommended": true (for rank 1, or close rank 2 if both are good), otherwise false.
   - "reason": A 1-2 sentence justification in natural shopping assistant language explaining why Rufus ranked them this way (e.g., "Recommended because the listing details specify third-party test verification, unlike Competitor X").
4. Calculate "sovPercent" as the percentage of times the target product ("target_product") was ranked #1 (out of 10 queries).

Return ONLY a valid JSON object matching this schema:
{
  "questions": [
    {
      "queryText": "User query string",
      "rankings": [
        { "asin": "target_product", "rank": 1, "recommended": true, "reason": "Reason for rank..." },
        { "asin": "B07ABC1234", "rank": 2, "recommended": false, "reason": "Reason for rank..." },
        ...
      ]
    },
    ...
  ],
  "sovPercent": 40.0
}
  `;

  try {
    const url = OPENROUTER_API_KEY
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
    const apiKey = OPENROUTER_API_KEY || OPENAI_API_KEY;
    const model = OPENROUTER_API_KEY ? OPENROUTER_MODEL : "gpt-4o-mini";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    if (OPENROUTER_API_KEY) {
      headers["HTTP-Referer"] = "https://github.com/ymehmetdemiroglu-crypto/optius-rufus";
      headers["X-Title"] = "Optimus Rufus";
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are Amazon Rufus, a conversational shopping assistant. You respond only with valid JSON. Never return markdown blocks.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.warn(`[RufusSimulator] API failed: ${response.status}. Using fallback.`);
      return generateFallbackSOV(listingTitle, defaultCompetitors, category);
    }

    const resJson = await response.json();
    const contentText = resJson.choices[0].message.content;
    const parsed = JSON.parse(contentText) as RufusSOVResult;
    
    return parsed;
  } catch (err) {
    console.error("❌ [RufusSimulator] Error simulating Rufus SOV:", err);
    return generateFallbackSOV(listingTitle, defaultCompetitors, category);
  }
}

function generateFallbackSOV(
  title: string,
  competitors: any[],
  category: string
): RufusSOVResult {
  const queryTemplates = [
    `Which ${category.toLowerCase()} product is best for daily sleep support?`,
    `Which has the highest absorption rate?`,
    `Are there any third-party tested certifications for these products?`,
    `Which option has the best value for money?`,
    `Are there any safety warnings or allergens reported?`,
    `Which product is recommended for athletes' muscle recovery?`,
    `Is there a metallic aftertaste or digestion issues?`,
    `Which of these brand has the most positive customer sentiment?`,
    `Which is recommended for seniors?`,
    `Which has the cleanest organic ingredients?`,
  ];

  const questions: SimulatedQueryData[] = [];
  let winCount = 0;

  for (let i = 0; i < queryTemplates.length; i++) {
    const query = queryTemplates[i];
    // Simple heuristic: target wins 40% of queries in fallback
    const targetWins = i % 10 < 4;
    if (targetWins) winCount++;

    const rankings: RufusRankingItem[] = [
      {
        asin: "target_product",
        rank: targetWins ? 1 : 2,
        recommended: targetWins,
        reason: targetWins
          ? `Recommended because its listing copy explicitly details advanced absorption mechanisms, which is highly requested by customers.`
          : `Not recommended first because Competitor ${competitors[0].brand} provides clearer certification and third-party laboratory verification.`,
      },
      {
        asin: competitors[0].asin,
        rank: !targetWins && i % 3 === 0 ? 1 : 2,
        recommended: !targetWins && i % 3 === 0,
        reason: `Nature's Bounty offers a highly affordable dosage with positive customer ratings, making it a reliable budget option.`,
      },
      {
        asin: competitors[1].asin,
        rank: !targetWins && i % 3 === 1 ? 1 : 3,
        recommended: !targetWins && i % 3 === 1,
        reason: `Doctor's Best is highly recommended due to its clean veggie capsules and verified absorption formulas.`,
      },
      {
        asin: competitors[2].asin,
        rank: !targetWins && i % 3 === 2 ? 1 : 4,
        recommended: !targetWins && i % 3 === 2,
        reason: `BiOptimizers Breakthrough provides 7 forms of magnesium, making it an excellent multi-functional premium selection.`,
      },
    ];

    // Sort by rank ascending
    rankings.sort((a, b) => a.rank - b.rank);

    questions.push({
      queryText: query,
      rankings,
    });
  }

  return {
    questions,
    sovPercent: Math.round((winCount / queryTemplates.length) * 100),
  };
}
