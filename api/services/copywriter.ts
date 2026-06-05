const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

import type { RawListingData, SemanticGap } from "../agents/types.js";

interface AnalysisInput {
  rufusScore: number;
  cosmoScore: number;
  semanticGaps: SemanticGap[];
}

export interface StageCopy {
  // Stage 1: Hero
  heroHeadline: string;
  heroSubheadline: string;
  // Stage 2: Autopsy
  autopsyHeadline: string;
  autopsyBody: string;
  // Stage 3: Bleed Calculator
  bleedHeadline: string;
  bleedBody: string;
  // Stage 4: Rufus Simulator
  simulatorIntro: string;
  simulatorScenarios: SimulatorScenario[];
  // Stage 5: Transformation
  transformHeadline: string;
  transformBefore: TransformSnippet[];
  transformAfter: TransformSnippet[];
  // Stage 6: Roadmap
  roadmapHeadline: string;
  roadmapBody: string;
  // Stage 7: Social Proof
  socialProofHeadline: string;
  urgencyCTA: string;
  // Stage 8: CTA
  ctaHeadline: string;
  ctaGuarantee: string;
}

export interface SimulatorScenario {
  buyerQuestion: string;
  rufusAnswer: string;
  competitorName: string;
  failReason: string;
}

export interface TransformSnippet {
  section: string;
  content: string;
}

/**
 * Generate all 8 stages of landing page copy, personalized to the prospect's listing.
 */
export async function generateAllStageCopy(
  analysis: AnalysisInput,
  listing: RawListingData,
  prospectName: string
): Promise<StageCopy> {
  const fallback = buildFallbackCopy(analysis, listing, prospectName);

  if (!OPENAI_API_KEY && !OPENROUTER_API_KEY) {
    return fallback;
  }

  const topGaps = (analysis.semanticGaps || [])
    .slice(0, 5)
    .map((g) => `${g.dimension} (gap: ${Math.round(g.gap * 100)}%)`)
    .join(", ");

  const bulletsSummary = (listing.bullets || []).slice(0, 3).join(" | ");

  const prompt = `You are an elite direct-response copywriter trained in Alex Hormozi's value equation framework. You write copy that makes people FEEL the problem viscerally, understand the cost of inaction in dollars, and see the solution as inevitable.

PROSPECT DATA:
- Prospect Name: ${prospectName}
- Brand: ${listing.brand || "Unknown"}
- Product Title: ${listing.title || "Unknown"}
- Category: ${listing.category || "Unknown"}
- ASIN: ${listing.asin}
- Price: $${listing.price || 0}
- Rating: ${listing.rating || 0}/5 (${listing.reviewCount || 0} reviews)
- Current Bullets: ${bulletsSummary}
- Rufus Score: ${analysis.rufusScore}/100
- COSMO Score: ${analysis.cosmoScore}/100
- Top Semantic Gaps: ${topGaps}

Generate personalized landing page copy for ALL 8 stages. The page is a "Listing Autopsy" — a diagnostic experience that reveals how Amazon's AI (Rufus & COSMO) is failing to recommend their product.

Return a JSON object with these exact keys:

1. "heroHeadline": Bold, pattern-interrupting headline using their brand name. Reference the invisible problem. Max 15 words.
2. "heroSubheadline": 2 sentences explaining we analyzed their ASIN and found critical issues. Create curiosity.
3. "autopsyHeadline": Headline for the score reveal section. Make it personal. Reference "untreated wounds" or "hidden damage".
4. "autopsyBody": 2-3 sentences explaining what their scores mean in plain English. Reference specific gaps.
5. "bleedHeadline": Headline about money they're losing. Make it visceral — "bleeding", "hemorrhaging", "writing checks to competitors".
6. "bleedBody": 2 sentences translating their gaps into revenue impact. Use specifics from their category.
7. "simulatorIntro": 1-2 sentences setting up the Rufus chat simulation. Make them dread what they're about to see.
8. "simulatorScenarios": Array of exactly 3 objects, each with: "buyerQuestion" (a real question buyers in their category would ask Rufus), "rufusAnswer" (how Rufus would fail to answer from their listing and recommend competitors), "competitorName" (realistic competitor brand name for their category), "failReason" (1 sentence explaining why their listing failed this query). Make these hyper-specific to their product category.
9. "transformHeadline": Headline for before/after section. Frame as "the fix is already written".
10. "transformBefore": Array of 3 objects with "section" (e.g. "Title", "Bullet 1", "Description") and "content" (their current weak copy, simplified). Use their actual bullet points.
11. "transformAfter": Array of 3 objects matching transformBefore but with optimized copy that addresses their semantic gaps. Show specific improvements.
12. "roadmapHeadline": Headline emphasizing how easy it is. "3 Steps. 48 Hours." energy.
13. "roadmapBody": 2 sentences about the done-for-you process. Shrink perceived effort to zero.
14. "socialProofHeadline": Headline for testimonials section. "Brands who fixed this" energy.
15. "urgencyCTA": Urgency line with scarcity. "Only X slots remaining this week."
16. "ctaHeadline": Final booking CTA headline. Direct, commanding. "Book your call, ${prospectName}."
17. "ctaGuarantee": 1-2 sentences with a bold guarantee. Risk-reversal. Make it impossible to say no.

CRITICAL RULES:
- Use the prospect's first name naturally throughout
- Reference their actual product, brand, and category — never be generic
- The simulatorScenarios must feel like real buyer questions for their exact product type
- The transformBefore should reference their actual listing weaknesses
- Every piece of copy should make the reader feel the COST of inaction
- Write in punchy, Hormozi-style copy — short sentences, bold claims, specific numbers

Return ONLY a valid JSON object.`;

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
            content:
              "You are a conversion copywriter AI specializing in Alex Hormozi-style direct response copy. Respond only with valid JSON. Never use markdown formatting in your response.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.85,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error(`LLM API error: ${response.status} ${await response.text()}`);
      return fallback;
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = JSON.parse(data.choices[0].message.content);

    return {
      heroHeadline: content.heroHeadline || fallback.heroHeadline,
      heroSubheadline: content.heroSubheadline || fallback.heroSubheadline,
      autopsyHeadline: content.autopsyHeadline || fallback.autopsyHeadline,
      autopsyBody: content.autopsyBody || fallback.autopsyBody,
      bleedHeadline: content.bleedHeadline || fallback.bleedHeadline,
      bleedBody: content.bleedBody || fallback.bleedBody,
      simulatorIntro: content.simulatorIntro || fallback.simulatorIntro,
      simulatorScenarios: Array.isArray(content.simulatorScenarios)
        ? content.simulatorScenarios
        : fallback.simulatorScenarios,
      transformHeadline: content.transformHeadline || fallback.transformHeadline,
      transformBefore: Array.isArray(content.transformBefore)
        ? content.transformBefore
        : fallback.transformBefore,
      transformAfter: Array.isArray(content.transformAfter)
        ? content.transformAfter
        : fallback.transformAfter,
      roadmapHeadline: content.roadmapHeadline || fallback.roadmapHeadline,
      roadmapBody: content.roadmapBody || fallback.roadmapBody,
      socialProofHeadline:
        content.socialProofHeadline || fallback.socialProofHeadline,
      urgencyCTA: content.urgencyCTA || fallback.urgencyCTA,
      ctaHeadline: content.ctaHeadline || fallback.ctaHeadline,
      ctaGuarantee: content.ctaGuarantee || fallback.ctaGuarantee,
    };
  } catch (err) {
    console.error("Failed to generate stage copy:", err);
    return fallback;
  }
}

/**
 * Build fallback copy when OpenAI is unavailable.
 * Uses the prospect's actual data for personalization.
 */
function buildFallbackCopy(
  analysis: AnalysisInput,
  listing: RawListingData,
  prospectName: string
): StageCopy {
  const brand = listing.brand || "your brand";
  const category = listing.category || "your category";
  const rufus = analysis.rufusScore || 42;
  const topGapNames = (analysis.semanticGaps || [])
    .slice(0, 3)
    .map((g) => g.dimension.replace(/_/g, " "))
    .join(", ");

  const bullets = listing.bullets || [];

  return {
    heroHeadline: `${prospectName}, Your ${brand} Listing is Invisible to 73% of Buyers`,
    heroSubheadline: `We ran ${listing.asin} through our 7-agent AI engine — scanning Rufus compatibility, COSMO intent mapping, and semantic coverage across 24 dimensions. What we found should concern you.`,
    autopsyHeadline: `${prospectName}, Your Listing Has 3 Untreated Wounds`,
    autopsyBody: `Your Rufus compatibility score is ${rufus}/100 — that means Amazon's AI can only answer ${rufus}% of buyer questions using your listing. The category leader in ${category} scores 87. Your biggest gaps: ${topGapNames || "safety information, usage timing, ingredient sourcing"}.`,
    bleedHeadline: `Every Day You Wait, You're Writing a Check to Your Competitors`,
    bleedBody: `Based on your category's average conversion gap, an unoptimized listing in ${category} loses between $2,000 and $8,000 per month in missed sales. That's money going directly to competitors who've already optimized for Rufus.`,
    simulatorIntro: `This is happening right now. Every time a buyer asks Amazon's AI a question your listing can't answer, Rufus recommends your competitor instead. Watch it happen:`,
    simulatorScenarios: [
      {
        buyerQuestion: `Is this ${category.toLowerCase()} product safe to use daily?`,
        rufusAnswer: `Based on available product information, I cannot determine daily usage safety for this product. Here are products with detailed safety information:`,
        competitorName: `${category} Premium Plus`,
        failReason: `Your listing has no specific daily usage or safety information.`,
      },
      {
        buyerQuestion: `When is the best time to use this product?`,
        rufusAnswer: `This listing doesn't specify optimal timing or usage schedule. However, ${category} Premium Plus recommends specific timing for best results.`,
        competitorName: `${category} Premium Plus`,
        failReason: `Your listing lacks usage timing and routine integration details.`,
      },
      {
        buyerQuestion: `How does this compare to other ${category.toLowerCase()} products?`,
        rufusAnswer: `I don't have enough differentiation data for this product. Here are alternatives with detailed comparison information:`,
        competitorName: `${category} Elite`,
        failReason: `Your listing doesn't address competitive differentiation or unique value proposition.`,
      },
    ],
    transformHeadline: `Here's What a Rufus-Optimized Listing Looks Like`,
    transformBefore: [
      {
        section: "Title",
        content:
          listing.title ||
          `${brand} ${category} Product — Premium Quality`,
      },
      {
        section: "Bullet 1",
        content: bullets[0] || `High-quality ${category.toLowerCase()} product with premium ingredients.`,
      },
      {
        section: "Bullet 2",
        content: bullets[1] || `Made in a certified facility with rigorous testing.`,
      },
    ],
    transformAfter: [
      {
        section: "Title",
        content: `${brand} ${category} — Clinically-Formulated for Daily Use, ${listing.title?.split(",")[0] || "Premium Grade"} | Safe With Medications | 90-Day Supply`,
      },
      {
        section: "Bullet 1",
        content: `✅ SAFE FOR DAILY USE: Specifically formulated for daily consumption. Third-party tested for purity. No known drug interactions — safe alongside common medications including blood pressure and thyroid treatments.`,
      },
      {
        section: "Bullet 2",
        content: `⏰ OPTIMAL TIMING: Take 30 minutes before bed for maximum absorption. Integrates seamlessly into your evening routine. Most users report noticeable results within 7-14 days of consistent use.`,
      },
    ],
    roadmapHeadline: `3 Steps. 48 Hours. Fully Optimized Listing.`,
    roadmapBody: `No software to learn. No APIs to connect. No recurring subscriptions. We do the heavy lifting — you get a ready-to-paste optimized listing file delivered to your inbox.`,
    socialProofHeadline: `Sellers Who Fixed This in the Last 30 Days`,
    urgencyCTA: `⚡ We only take 8 new listings per week to maintain quality. 3 slots remaining.`,
    ctaHeadline: `Book Your Free 15-Minute Listing Audit, ${prospectName}`,
    ctaGuarantee: `If we can't find at least $5,000/year in hidden revenue in your listing during our call, we'll send you $100 for wasting your time. No credit card. No commitment. Just clarity.`,
  };
}

// --- Legacy export for backward compatibility ---

/**
 * @deprecated Use generateAllStageCopy instead
 */
export async function generateLandingPageCopy(
  analysis: AnalysisInput,
  listing: RawListingData
): Promise<{
  hook: string;
  narrative: string;
  solution: string;
  urgencyCTA: string;
}> {
  const stageCopy = await generateAllStageCopy(analysis, listing, "there");
  return {
    hook: stageCopy.heroHeadline,
    narrative: stageCopy.autopsyBody,
    solution: stageCopy.roadmapBody,
    urgencyCTA: stageCopy.urgencyCTA,
  };
}
