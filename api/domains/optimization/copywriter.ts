import { callLlm } from "../../services/llmGateway.js";
import type { AnalysisResult, CompetitorBenchmark, RawListingData, SemanticGap } from "../../pipeline/pipeline.types.js";
import { generateGroundedRufusSimulation } from "../rufus/intentSimulator.js";

type AnalysisInput = AnalysisResult;

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
  // Competitor loss audit panel
  competitorAudit: CompetitorAuditItem[];
}

export interface CompetitorAuditItem {
  query: string;
  competitorName: string;
  competitorAdvantage: string;
  yourGap: string;
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
  prospectName: string,
  expectedRevenue?: string,
  competitors?: CompetitorBenchmark[]
): Promise<StageCopy> {
  const fallback = buildFallbackCopy(analysis, listing, prospectName, competitors);

  const topGaps = (analysis.semanticGaps || [])
    .slice(0, 5)
    .map((g) => `${g.dimension} (gap: ${Math.round(g.gap * 100)}%)`)
    .join(", ");

  const predictedIntentSummary = (analysis.predictedIntents || [])
    .slice(0, 5)
    .map((i) => `${i.dimension} (${i.coverage}% coverage, ${i.priority})`)
    .join(", ");

  const bulletsSummary = (listing.bullets || []).slice(0, 3).join(" | ");

  // Classify expected revenue and adapt copywriting strategy
  let revenueStrategyPrompt = "";
  if (expectedRevenue) {
    const cleanNum = parseFloat(expectedRevenue.replace(/[^0-9.]/g, ""));
    let tier = "Class_C";
    if (isNaN(cleanNum)) {
      const lower = expectedRevenue.toLowerCase();
      if (lower.includes("1m") || lower.includes("million") || lower.includes("enterprise") || lower.includes("1,000,000")) {
        tier = "Class_A";
      } else if (lower.includes("100k") || lower.includes("growth") || lower.includes("100,000")) {
        tier = "Class_B";
      }
    } else {
      if (cleanNum >= 1000000) tier = "Class_A";
      else if (cleanNum >= 100000 || cleanNum >= 8000) tier = "Class_B";
    }

    if (tier === "Class_A") {
      revenueStrategyPrompt = `\nCOPYWRITING STRATEGY (ENTERPRISE BRAND):
- Focus on large-scale revenue leakages, systemic organic erosion, and brand equity loss.
- Emphasize lost market share to competitors who capture conversational search traffic.
- Highlight that high-volume competitor conquesting is stealing their organic sales.
- Tone: Highly authoritative, corporate-focused, highlighting systemic leaks.\n`;
    } else if (tier === "Class_B") {
      revenueStrategyPrompt = `\nCOPYWRITING STRATEGY (GROWTH BRAND):
- Focus on scaling organic search and unlocking $5,000–$15,000/month in hidden conversational search sales.
- Emphasize beating key market competitors for specific product intent attributes.
- Emphasize conversion optimization to lower acquisition costs and scale.
- Tone: Action-oriented, ROI-driven, highlighting growth opportunities and market expansion.\n`;
    } else {
      revenueStrategyPrompt = `\nCOPYWRITING STRATEGY (STARTER BRAND):
- Focus on building solid foundations for organic search.
- Highlight easy organic wins to get listed on Rufus search recommendations.
- Emphasize establishing initial review traction and listing authority.
- Tone: Encouraging, tactical, focusing on getting started and initial growth.\n`;
    }
  }

  const prompt = `You are a clinical systems diagnostician who writes direct-response copy. Your tone is authoritative, polarizing, and utilitarian. No fluff. No generic marketing speak. You frame listing optimization as a technical system upgrade, not a service. You use terminal-style prefixes like [ERR], [WARN], [SYS], [OK] in microcopy. Short, punchy, direct sentences only.

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
- Predicted Buyer Intents: ${predictedIntentSummary || "Not available"}
${revenueStrategyPrompt}

Your task is to write personalized landing page copy for ALL 8 stages of the "Listing Autopsy" diagnostic report. Explain that we optimize listings for Amazon's conversational search AI (Rufus & COSMO) by sealing semantic gaps, seeding high-weight Q&A roadmaps, and setting up Page 2 organic rank conquesting PPC campaigns.

Return a JSON object with these exact keys:

1. "heroHeadline": A pattern-interrupting headline using "[SYS]" prefix and their brand name and ASIN, focused on system diagnostic and revenue leaks on Amazon Rufus. Max 15 words.
2. "heroSubheadline": 2 short, punchy sentences explaining we scanned their listing's COSMO intent nodes and found critical semantic gaps that cause Rufus to steer buyers away.
3. "autopsyHeadline": Headline revealing their compatibility score using an error code prefix like "[ERR-041]". Frame as critical system incompatibilities.
4. "autopsyBody": 2-3 clinical sentences explaining their Rufus Score. Mention that listings with 15+ Q&As are recommended 3.2x more often by Rufus, and that their lack of key attributes is keeping them out of the retrieval loop.
5. "bleedHeadline": Clinical headline about unrecovered revenue leaking to competitors every day.
6. "bleedBody": 2 sentences explaining that an unoptimized listing in their category loses $2,000–$8,000 per month in conversational sales, which are high-margin organic sales leaking straight to rivals. End with: "This is not a forecast. This is arithmetic."
7. "simulatorIntro": 1-2 punchy sentences introducing the live retrieval simulator, showing how Rufus routes buyers away when attributes are missing.
8. "simulatorScenarios": Array of exactly 3 objects: "buyerQuestion" (common search query), "rufusAnswer" (Rufus failing to answer and recommending a competitor due to listing gaps), "competitorName", "failReason" (why it failed).
9. "transformHeadline": Before/After headline: "[DIFF] System Optimization Patch" or similar.
10. "transformBefore": Array of 3 objects with "section" (e.g., "Title", "Bullet 1", "Description") and "content" (their current weak copy).
11. "transformAfter": Array of 3 objects with optimized copy addressing their gaps with clinical "[OK]" or "[PATCHED]" style headers.
12. "roadmapHeadline": "[SYS] Deployment Protocol" or similar 3-step done-for-you process.
13. "roadmapBody": 2 sentences explaining our 7-agent AI engine rewrites their listing for Rufus retrieval and COSMO indexing. No software to install.
14. "socialProofHeadline": "[LOG] Deployment Outcomes" or similar.
15. "urgencyCTA": Terminal-style scarcity warning: "[WARN] Deployment queue: 3/5 slots remaining this cycle."
16. "ctaHeadline": Direct system initialization CTA: "Initialize Your Listing Overhaul, ${prospectName}"
17. "ctaGuarantee": Exact guarantee: "Your listing hits 85+ Rufus Score or you pay nothing. Full refund, no questions."
18. "competitorAudit": Array of 3 objects with "query", "competitorName", "competitorAdvantage", "yourGap". Ground each item in the simulator scenarios.

CRITICAL RULES:
- Use the prospect's first name naturally.
- Be hyper-specific to their product category and brand.
- Clinical, authoritative, and direct. No marketing jargon.

Return ONLY a valid JSON object.`;

  const groundedSimulation = generateGroundedRufusSimulation(analysis, listing, competitors || []);

  try {
    const llmResponse = await callLlm(
      {
        messages: [
          {
            role: "system",
            content:
              "You are a clinical systems diagnostician who writes direct-response copy. Your tone is authoritative, polarizing, and utilitarian. No fluff. No generic marketing speak. Respond only with valid JSON. Never use markdown formatting in your response.",
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
      competitorAudit: Array.isArray(content.competitorAudit) && content.competitorAudit.length >= 3
        ? content.competitorAudit
        : groundedSimulation.competitorAudit,
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
  prospectName: string,
  competitors?: CompetitorBenchmark[]
): StageCopy {
  const brand = listing.brand || "your brand";
  const category = listing.category || "your category";
  const rufus = analysis.rufusScore || 42;
  const topGapNames = (analysis.semanticGaps || [])
    .slice(0, 3)
    .map((g) => g.dimension.replace(/_/g, " "))
    .join(", ");

  const bullets = listing.bullets || [];

  const grounded = generateGroundedRufusSimulation(analysis, listing, competitors || []);

  return {
    heroHeadline: `[SYS] ${prospectName}, ${brand} Listing Bleeding Sales to Competitors on Amazon Rufus`,
    heroSubheadline: `We ran ${listing.asin} through our 7-agent AI audit. Your listing has critical semantic gaps causing Rufus to actively route buyers to competitors while you pay for their search traffic.`,
    autopsyHeadline: `[ERR-041] ${prospectName}, Your Listing Scores a Critical ${rufus}/100 for AI Compatibility`,
    autopsyBody: `Your Rufus compatibility score is ${rufus}/100 — meaning Amazon's AI fails to answer ${100 - rufus}% of buyer questions using your listing. Listings with 15+ Q&As are recommended 3.2x more often by Rufus. Your biggest gaps are in: ${topGapNames || "safety information, usage timing, ingredient sourcing"}.`,
    bleedHeadline: `[CALC] Revenue Hemorrhage Model: Daily Leak Detected`,
    bleedBody: `Based on your category's average conversion gap, an unoptimized listing in ${category} loses between $2,000 and $8,000 per month in high-margin conversational sales. This is not a forecast. This is arithmetic.`,
    simulatorIntro: `Every time a buyer asks Amazon's AI a question about your product, Rufus is forced to hedge and recommend a competitor who has already seeded their semantic gap nodes. Watch it happen live:`,
    simulatorScenarios: [
      {
        buyerQuestion: `Is this ${category.toLowerCase()} product safe to use daily?`,
        rufusAnswer: `I cannot find daily usage limits or safety statements in ${brand}'s listing copy. However, competitor listings explicitly detail safety certifications. I recommend:`,
        competitorName: `Competitor ${category}`,
        failReason: `Your listing contains zero safety warnings or dosage threshold explanations.`,
      },
      {
        buyerQuestion: `When is the best time to take this for maximum absorption?`,
        rufusAnswer: `${brand}'s listing copy does not specify usage timing. Competitor listings recommend taking it 30 minutes before breakfast on an empty stomach. I recommend:`,
        competitorName: `Competitor ${category}`,
        failReason: `Your listing lacks routine integration and timing guidelines, which Rufus looks for in its COSMO graph.`,
      },
      {
        buyerQuestion: `How does this compare to other options?`,
        rufusAnswer: `${brand} has no comparison tables or verified allergen-free certifications. Competitor products are third-party tested and USDA organic. I recommend:`,
        competitorName: `Competitor ${category}`,
        failReason: `Your listing fails to address unique certifications, forcing Rufus to recommend the competitor.`,
      },
    ],
    transformHeadline: `[DIFF] System Optimization Patch: From Invisible to Rufus-Indexed`,
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
        content: `${brand} ${category} — Clinically-Formulated for Daily Use | Safe With Medications | 90-Day Supply`,
      },
      {
        section: "Bullet 1",
        content: `[OK] SAFE FOR DAILY USE: Specifically formulated for daily consumption. Third-party tested for purity. Zero known drug interactions — safe alongside common daily regimens.`,
      },
      {
        section: "Bullet 2",
        content: `[OK] OPTIMAL TIMING: Take 30 minutes before breakfast for maximum absorption. Integrates seamlessly into your morning routine.`,
      },
    ],
    roadmapHeadline: `[SYS] Deployment Protocol: 3 Steps to Full Indexing`,
    roadmapBody: `We analyze your semantic gaps, write the COSMO updates, seed your 15-point Q&A roadmap, and format a Page 2 conquesting PPC sheet. No software to install. Just paste and win.`,
    socialProofHeadline: `[LOG] Deployment Outcomes: Verified Client Results`,
    urgencyCTA: `[WARN] Deployment queue: 3/5 slots remaining this cycle to guarantee human QA review.`,
    ctaHeadline: `Initialize Your Listing Overhaul, ${prospectName}`,
    ctaGuarantee: `Your listing hits 85+ Rufus Score or you pay nothing. Full refund, no questions.`,
    competitorAudit: grounded.competitorAudit,
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
