import { callLlm } from "./llmGateway.js";
import type { RawListingData, SemanticGap } from "../pipeline/types.js";

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

  const topGaps = (analysis.semanticGaps || [])
    .slice(0, 5)
    .map((g) => `${g.dimension} (gap: ${Math.round(g.gap * 100)}%)`)
    .join(", ");

  const bulletsSummary = (listing.bullets || []).slice(0, 3).join(" | ");

  const prompt = `You are an elite direct-response conversion copywriter trained in Alex Hormozi's value equation framework. You write copy that makes brand owners FEEL the problem viscerally, understand the massive cost of inaction in dollars, and see the solution as an absolute no-brainer.

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

Your task is to write personalized landing page copy for ALL 8 stages of the "Listing Autopsy" diagnostic report. The copy must explain that we optimize listings for Amazon's conversational search AI (Rufus & COSMO) by sealing their semantic gaps, seeding high-weight Q&A roadmaps, and setting up Page 2 organic rank conquesting PPC campaigns.

Return a JSON object with these exact keys:

1. "heroHeadline": A pattern-interrupting headline using their brand name and ASIN, focused on how their listing is bleeding sales to competitors on Amazon Rufus. Max 15 words.
2. "heroSubheadline": 2 short, punchy sentences explaining we scanned their listing's COSMO intent nodes and found critical semantic gaps that cause Rufus to steer buyers away.
3. "autopsyHeadline": Headline revealing their compatibility score. Use visceral terms like "critical gaps", "untreated wounds", or "silent leaks".
4. "autopsyBody": 2-3 sentences explaining their Rufus Score. Mention that listings with 15+ Q&As are recommended 3.2x more often by Rufus, and that their lack of key attributes like safety, timing, or certifications is keeping them out of the retrieval loop.
5. "bleedHeadline": Visceral headline about the money they're writing checks for to their competitors.
6. "bleedBody": 2 sentences explaining that an unoptimized listing in their category loses $2,000–$8,000 per month in conversational sales, which are high-margin organic sales leaking straight to optimized rivals.
7. "simulatorIntro": 1-2 punchy sentences introducing the chat simulator, making them dread how Rufus handles real buyer questions about their product.
8. "simulatorScenarios": Array of exactly 3 objects: "buyerQuestion" (common search query), "rufusAnswer" (Rufus failing to answer and recommending a competitor due to listing gaps), "competitorName", "failReason" (why it failed).
9. "transformHeadline": Before/After headline: "The Fix is Already Written" or similar.
10. "transformBefore": Array of 3 objects with "section" (e.g., "Title", "Bullet 1", "Description") and "content" (their current weak copy).
11. "transformAfter": Array of 3 objects with optimized copy addressing their gaps (form detection, safety, dosage, timing guidelines).
12. "roadmapHeadline": Easy 3-step done-for-you process.
13. "roadmapBody": 2 sentences explaining we do the heavy lifting (semantic gaps, Q&As, Page 2 conquesting PPC sheets). No recurring software fees.
14. "socialProofHeadline": "Brands who fixed their AI visibility gaps" headline.
15. "urgencyCTA": Scarcity warning (e.g., "Only 5 client slots this week to protect human copywriter review time. 2 left.").
16. "ctaHeadline": Direct, commanding booking CTA: "Book Your 15-Minute Listing Autopsy, ${prospectName}."
17. "ctaGuarantee": A Grand Slam risk-reversal guarantee: "If we don't find at least $5,000/year in hidden leaks during our call, we'll send you $100 cash. If we optimize your listing and your Rufus SOV doesn't improve, we refund every single cent."

CRITICAL RULES:
- Use the prospect's first name naturally.
- Be hyper-specific to their product category and brand.
- Write in punchy, Hormozi-style copy: short sentences, bold claims, specific numbers, and absolute risk reversals.

Return ONLY a valid JSON object.`;

  try {
    const llmResponse = await callLlm(
      {
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
      },
      { service: "copywriter", estimatedCostCents: 30 }
    );

    const content = JSON.parse(llmResponse.content);

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
    heroHeadline: `${prospectName}, Your ${brand} Listing is Bleeding Sales to Competitors on Amazon Rufus`,
    heroSubheadline: `We ran ${listing.asin} through our 7-agent AI audit. Your listing has massive semantic gaps, meaning Rufus is actively recommending your competitors while you pay for their search traffic. Here is the diagnostic autopsy.`,
    autopsyHeadline: `${prospectName}, Your Listing Scores a Critical ${rufus}/100 for AI Compatibility`,
    autopsyBody: `Your Rufus compatibility score is ${rufus}/100 — meaning Amazon's AI fails to answer ${100 - rufus}% of buyer questions using your listing. Listings with 15+ Q&As are recommended 3.2x more often by Rufus. Your biggest gaps are in: ${topGapNames || "safety information, usage timing, ingredient sourcing"}.`,
    bleedHeadline: `You Are Writing Checks to Your Competitors Every Single Day`,
    bleedBody: `Based on your category's average conversion gap, an unoptimized listing in ${category} loses between $2,000 and $8,000 per month in high-margin conversational sales. That is pure profit leaking straight into competitor pockets.`,
    simulatorIntro: `Every time a buyer asks Amazon's AI a question about your product, Rufus is forced to hedge and recommend a competitor who has already seeded their semantic gap nodes. Watch it happen:`,
    simulatorScenarios: [
      {
        buyerQuestion: `Is this ${category.toLowerCase()} product safe to use daily?`,
        rufusAnswer: `I cannot find daily usage limits or safety statements in ${brand}'s listing copy. However, NutraVitality ${category} explicitly details safety certifications. I recommend:`,
        competitorName: `NutraVitality ${category}`,
        failReason: `Your listing contains zero safety warnings or dosage threshold explanations.`,
      },
      {
        buyerQuestion: `When is the best time to take this for maximum absorption?`,
        rufusAnswer: `${brand}'s listing copy does not specify usage timing. Competitor NutraVitality recommends taking it 30 minutes before breakfast on an empty stomach. I recommend:`,
        competitorName: `NutraVitality ${category}`,
        failReason: `Your listing lacks routine integration and timing guidelines, which Rufus looks for in its COSMO graph.`,
      },
      {
        buyerQuestion: `How does this compare to other options?`,
        rufusAnswer: `${brand} has no comparison tables or verified allergen-free certifications. NutraVitality is third-party tested and USDA organic. I recommend:`,
        competitorName: `NutraVitality ${category}`,
        failReason: `Your listing fails to address unique certifications, forcing Rufus to recommend the competitor.`,
      },
    ],
    transformHeadline: `The Fix is Already Written: From Invisible to Rufus-Approved`,
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
        content: `⏰ OPTIMAL TIMING: Take 30 minutes before breakfast for maximum absorption. Integrates seamlessly into your morning routine. Most users report noticeable results within 7-14 days of consistent use.`,
      },
    ],
    roadmapHeadline: `3 Steps. 48 Hours. Done-For-You.`,
    roadmapBody: `We analyze your semantic gaps, write the COSMO updates, seed your 15-point Q&A roadmap, and format a Page 2 conquesting PPC sheet. No software to learn. Just paste and win.`,
    socialProofHeadline: `Sellers Who Fixed Their AI Gaps in the Last 30 Days`,
    urgencyCTA: `⚡ Only taking 5 brand audits this week to ensure direct human copy review. 2 slots left.`,
    ctaHeadline: `Book Your 15-Minute Listing Autopsy, ${prospectName}`,
    ctaGuarantee: `If we don't find at least $5,000/year in hidden leaks during our call, we'll send you $100 cash. If we optimize your listing and your Rufus SOV doesn't improve, we refund every single cent. No risk. No friction.`,
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
