import { db } from "../../db/drizzle.js";
import { prospects, listings, listingAnalyses } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { callLlm } from "../../services/llmGateway.js";
import { logger } from "../../infra/logger.js";

export interface OutreachEmails {
  subject: string;
  body1: string;
  body2: string;
  body3: string;
  body4: string;
  body5: string;
}

export async function generateOutreachCopy(prospectId: number): Promise<OutreachEmails> {
  // Query prospect details
  const prospectResult = await db.select().from(prospects).where(eq(prospects.id, prospectId)).limit(1);
  const prospect = prospectResult[0];
  if (!prospect) {
    throw new Error(`Prospect not found for outreach generation: ${prospectId}`);
  }

  // Query latest listing
  const listingResult = await db
    .select()
    .from(listings)
    .where(eq(listings.prospectId, prospectId))
    .orderBy(desc(listings.id))
    .limit(1);
  const listing = listingResult[0];

  // Query latest listing analysis
  const analysisResult = await db
    .select()
    .from(listingAnalyses)
    .where(eq(listingAnalyses.prospectId, prospectId))
    .orderBy(desc(listingAnalyses.id))
    .limit(1);
  const analysis = analysisResult[0];

  const rufusScore = analysis?.rufusScore ?? 45;
  const company = prospect.company || "your brand";
  const firstName = prospect.firstName || "there";
  const category = listing?.category || "product listing";
  const asin = prospect.asin || listing?.asin || "your product";

  // Parse gaps and competitor from copySimulatorScenarios
  let topGap = "safety warnings and usage routine guidelines";
  let competitorName = "your direct rivals";

  if (analysis?.copySimulatorScenarios) {
    try {
      const scenarios = typeof analysis.copySimulatorScenarios === "string"
        ? JSON.parse(analysis.copySimulatorScenarios)
        : analysis.copySimulatorScenarios;
      if (Array.isArray(scenarios) && scenarios.length > 0) {
        const gapItems = scenarios.map((s: any) => s.failReason || s.buyerQuestion).slice(0, 2).filter(Boolean);
        if (gapItems.length > 0) {
          topGap = gapItems.join(" and ");
        }
        competitorName = scenarios[0].competitorName || competitorName;
      }
    } catch (e) {
      logger.warn(`Failed to parse simulator scenarios for outreach generation: ${e}`);
    }
  }

  if (!competitorName || competitorName.toLowerCase() === "your top rival" || competitorName.toLowerCase() === "unknown") {
    competitorName = "your direct competitor";
  }

  const lowerCat = category.toLowerCase();
  const isSupplements = lowerCat.includes("supplement") || lowerCat.includes("vitamin") || lowerCat.includes("dietary") || lowerCat.includes("health") || lowerCat.includes("gummy") || lowerCat.includes("capsule") || lowerCat.includes("protein");
  const isBeauty = lowerCat.includes("beauty") || lowerCat.includes("skin") || lowerCat.includes("cosmetic") || lowerCat.includes("serum") || lowerCat.includes("shampoo") || lowerCat.includes("cream");
  const nicheType = isSupplements ? "supplements" : (isBeauty ? "beauty" : "general");

  // Get sequence id to determine tier guidelines
  const sequenceId = prospect.apolloSequenceId;
  let tierDescription = "Starter supplements/beauty brand (GMV <$100k). They care about basic Rufus visibility, conversational bullet point structuring, and gaining initial traction. Keep it highly practical and accessible.";
  if (sequenceId === "6a3005fee287cb000c007e03") {
    tierDescription = "Enterprise supplements/beauty brand (GMV $1M-$20M). They care about category conquesting, organic market share defense against named rivals, and catalog bundling blueprints. Keep it highly professional and business-focused.";
  } else if (sequenceId === "6a300617700f6b000cee5416") {
    tierDescription = "Growth supplements/beauty brand (GMV $100k-$1M). They care about organic search visibility vs. expensive PPC ad costs, listing structure gaps, and customer Q&As. Focus on ad cost reduction and efficiency.";
  }

  const systemPrompt = `You are an elite direct-response copywriter writing cold outreach to e-commerce founders regarding their Amazon Rufus conversational search indexing.
Your tone must sound like an informal Slack message or an email sent from an iPhone while walking to get coffee. Avoid all agency-style formal fluff.

CRITICAL DIRECTIVES:
1. SENDER PERSONA: Write as an independent technical listing scientist or technical consultant. Never sound like a sales representative, agency, or software tool.
2. CASUAL PUNCTUATION & CAPITALIZATION: Use natural casual formatting. Keep sentences short and punchy. Touch 1 starts with a warm, casual greeting ("Hey ${firstName},").
3. FOLLOW-UPS: Follow-up touches (Touch 2 to 5) are threaded replies (replies to Touch 1). Do NOT include greetings, intro statements, or generic signature blocks in follow-up touches. They must read like natural mobile replies (under 40 words).
4. COMPETITOR SANITIZATION: If competitorName is "your top competitor" or similar placeholder, rewrite it naturally (e.g., "your direct competitor").
5. micro-CTAs: CTAs must be low-friction questions asking if you should send a quick doc or checklist (e.g., "Should I send the margin-recovery checklist over?", "Reply 'PDF' and I'll drop the file over?").
6. SIGNATURE: Sign Touch 1 naturally using "Yahya" or "Yahya @ RufusReady".
7. PROSPECT CONTEXT:
   - Category: ${category}
   - Niche: ${nicheType}
   - ASIN: ${asin}
   - Competitor: ${competitorName}
   - Listing gaps identified: ${topGap}

BANNED TERMS LIST (Strictly Enforced):
- Banned terms: "are lacking", "is deficient", "impacting your visibility", "optimize your listing", "optimize", "custom PDF audit report", "report", "Would you like to reply...", "visibility", "deficient", "audit", "weaknesses".
- Replace with: "you're missing", "isn't there", "stealing your sales", "taking your traffic", "fix this", "claw back citations", "2-page PDF breakdown", "checklist", "Should I send it over?", "Drop it here?".

Touch Guidelines & Niche-Specific Copy Templates (Adapt dynamically for ${company}):
- Subject Line: Casual, pattern-interrupt, under 7 words, all lowercase. E.g. "quick scorecard for ${company.toLowerCase()}".
- Touch 1 (The Scorecard - Max 85 words):
  Hey ${firstName},
  Was looking at your Amazon listing for ${category} (${asin}) and noticed ${competitorName} is capturing the primary Rufus citations instead of you. 
  Ran a quick diagnostic on your listing. A few gaps:
  ${nicheType === "supplements" ? `• You're missing ${topGap} in your attribute tables.
  • Semantic overlap in your bullet points is confusing the LLM crawler.
  • Your customer Q&As don't address the high-intent keywords Rufus index looks for.` : nicheType === "beauty" ? `• You're missing ${topGap} in your listing text.
  • Rufus crawler isn't indexing your image alt-text for conversational queries.
  • Review sentiment mapping is highlighting competitors for key buyer search terms.` : `• You're missing ${topGap}.
  • Semantic overlap in your bullet points is confusing the LLM crawler.
  • Image alt-text lacks the high-intent keywords Rufus pulls from.`}
  Built a quick 2-page PDF breakdown showing how to claw those citations back.
  Should I send the margin-recovery checklist over?
  Best,
  Yahya
- Touch 2 (The Mobile Bump - Max 30 words):
  Hey ${firstName} - just checking if you saw this?
  No worries if you're swamped, but wanted to make sure it didn't get buried. Reply 'PDF' and I'll drop the file over?
- Touch 3 (The Competitor Shift - Max 40 words):
  Hey ${firstName}, quick update on this.
  Looks like ${competitorName} just picked up another comparison citation for your main search term. It's actively pulling traffic from your detail page.
  Still want that margin-recovery checklist?
- Touch 4 (Margin Squeeze Angle - Max 60 words):
  ${nicheType === "supplements" ? `With Amazon's 3.5% FBA surcharge added in April, margins on dietary supplements are getting squeezed. Organic Rufus citations convert at 4x higher than standard search ads, so fixing this directly cuts your ad spend.` : `Margins on e-commerce are getting tighter this quarter. Winning organic citations in Rufus search chat helps drive zero-cost traffic to your brand, directly offsetting rising PPC costs.`}
  Should I send the checklist showing how to fix it?
- Touch 5 (Scarcity Nudge - Max 40 words):
  I'm cleaning up my drive and will archive that 2-page PDF breakdown for ${company} by Friday.
  If you want a copy before it's gone, just reply "PDF" and I'll send it over.

Output your response as JSON in the following format:
{
  "subject_1": "subject line for touch 1 here",
  "body_1": "body 1 here",
  "body_2": "body 2 here",
  "body_3": "body 3 here",
  "body_4": "body 4 here",
  "body_5": "body 5 here"
}`;

  try {
    const response = await callLlm({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the threaded 5-touch sequence JSON." }
      ],
      temperature: 0.75,
      max_tokens: 1100,
      response_format: { type: "json_object" }
    }, {
      service: "outreach-copywriter",
      prospectId: prospectId
    });

    const data = JSON.parse(response.content);
    return {
      subject: data.subject_1.trim(),
      body1: data.body_1.trim(),
      body2: data.body_2.trim(),
      body3: data.body_3.trim(),
      body4: data.body_4.trim(),
      body5: data.body_5.trim()
    };
  } catch (err: any) {
    logger.warn(`AI copywriter failed for prospect ${prospect.email}: ${err.message}. Using defaults.`);
    // Fallback defaults
    return {
      subject: `quick scorecard for ${company.toLowerCase()}`,
      body1: `Hey ${firstName},\n\nWas looking at your Amazon listing for ${category} (${asin}) and noticed ${competitorName} is capturing the primary Rufus citations instead of you. \n\nRan a quick diagnostic on your listing. A few gaps:\n• You're missing ${topGap}.\n• Semantic overlap in your bullet points is confusing the LLM crawler.\n• Image alt-text lacks the high-intent keywords Rufus pulls from.\n\nBuilt a quick 2-page PDF breakdown showing how to claw those citations back. \n\nShould I send the margin-recovery checklist over?\n\nBest,\nYahya`,
      body2: `Hey ${firstName} - just checking if you saw this? \n\nNo worries if you're swamped, but wanted to make sure it didn't get buried. Reply 'PDF' and I'll drop the file over?`,
      body3: `Hey ${firstName}, quick update on this. \n\nLooks like ${competitorName} just picked up another comparison citation for your main search term. It's actively pulling traffic from your detail page. \n\nStill want that margin-recovery checklist?`,
      body4: `${nicheType === "supplements" ? `With Amazon's 3.5% FBA surcharge added in April, margins on dietary supplements are getting squeezed. Organic Rufus citations convert at 4x higher than standard search ads, so fixing this directly cuts your ad spend.` : `Margins on e-commerce are getting tighter this quarter. Winning organic citations in Rufus search chat helps drive zero-cost traffic to your brand, directly offsetting rising PPC costs.`}\n\nShould I send the checklist showing how to fix it?`,
      body5: `I'm cleaning up my drive and will archive that 2-page PDF breakdown for ${company} by Friday. \n\nIf you want a copy before it's gone, just reply "PDF" and I'll send it over.`
    };
  }
}
