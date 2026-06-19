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

  // Get sequence id to determine tier guidelines
  const sequenceId = prospect.apolloSequenceId;
  let tierDescription = "Starter supplements/beauty brand (GMV <$100k). They care about basic Rufus visibility, conversational bullet point structuring, and gaining initial traction. Keep it highly practical and accessible.";
  if (sequenceId === "6a3005fee287cb000c007e03") {
    tierDescription = "Enterprise supplements/beauty brand (GMV $1M-$20M). They care about category conquesting, organic market share defense against named rivals, and catalog bundling blueprints. Keep it highly professional and business-focused.";
  } else if (sequenceId === "6a300617700f6b000cee5416") {
    tierDescription = "Growth supplements/beauty brand (GMV $100k-$1M). They care about organic search visibility vs. expensive PPC ad costs, listing structure gaps, and customer Q&As. Focus on ad cost reduction and efficiency.";
  }

  const systemPrompt = `You are an elite B2B cold email copywriter specializing in high-converting outreach to Amazon FBA private-label sellers.
Your task is to write a 5-touch cold email sequence targeting an Amazon supplements or health/beauty seller.

The entire sequence (Touch 1 to 5) will be threaded under a single email thread (Touch 2, 3, 4, and 5 are sent as replies to Touch 1).
This means you must write ONE subject line for the first email, and FIVE custom email bodies.
The goal of the sequence is to get them to reply so we can send them a custom interactive Rufus Compatibility Autopsy report we generated for their brand.

Target Brand Tier Context:
${tierDescription}

Outreach Rules (Strictly Enforced):
- Subject line must be under 7 words. Use all lowercase, casual, pattern-interrupt style.
- Email bodies must be direct, short, conversational, and highly specific. Use simple, non-corporate language.
- Deliverability: Do NOT include any URLs or links (no Calendly, no audit link) in any of the emails.
- CTA: Always end with a question/request asking them to reply to get the audit, playbook, or checklist.
- Placeholder Constraint: Never include bracketed placeholders like [Your Name], [top rival], or brackets of any kind. All copy must be 100% complete and ready to send.
- Signature: Sign all emails naturally using "Yahya" or "Yahya @ RufusReady".
- Competitor formatting: If the competitor name is "your top rival" or unknown, do not use the phrase "your top rival" literally in the email. Instead, write naturally using terms like "your top category competitor" or "your direct rivals".

Thread Continuity Rules:
- Touch 1 starts the thread. Touch 2 to 5 are replies.
- Do NOT include generic greetings like "Hi [Name]" or "Hope you are well" in Touch 2, 3, 4, or 5. Since they are threaded replies, start directly with the point.
- Keep follow-up email bodies extremely brief (under 60 words for follow-ups).

Trigger facts to integrate:
- Prospect First Name: ${firstName}
- Company: ${company}
- Category: ${category}
- ASIN: ${asin}
- Rufus Compatibility Score: ${rufusScore}/100
- Top Competitor: ${competitorName}
- Gaps: ${topGap}

Touch Guidelines:
- Touch 1 (Curiosity Hook - Max 85 words): Introduce their low Rufus Compatibility Score (${rufusScore}/100) and how competitor ${competitorName} is stealing citations due to gaps in ${topGap}. Ask if they want the audit report.
- Touch 2 (Competitor Agitation - Max 60 words): Quick reply follow-up. Highlight how ${competitorName} comparison formatting or Q&A scaffolding is stealing search share of voice. Ask if they want the recovery playbook.
- Touch 3 (Quick Consult Offer - Max 50 words): Quick reply follow-up. Offer a free 10-minute slot this week to show them the gaps and competitor map directly. 
- Touch 4 (Margin Squeeze Angle - Max 70 words): Quick reply follow-up. Reference the 3.5% FBA fuel surcharge Amazon added in April 2026. Explain that improving organic Rufus visibility offsets PPC dependency and recovers margins. Ask if they want the margin-saving checklist.
- Touch 5 (Scarcity Nudge - Max 45 words): Quick reply follow-up. Final breakup nudge. Let them know we'll archive their custom report by the end of the week. Ask if they want the link before we close the ticket.

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
      subject: `question about ${company} (${asin})`,
      body1: `Hi ${firstName},\n\nYour Amazon Rufus compatibility score is ${rufusScore}/100.\nAmazon's shopping AI is steering buyers to ${competitorName} due to listing gaps in: ${topGap}.\n\nReply to this email if you want me to send you the full interactive compatibility autopsy report we generated.`,
      body2: `Just following up on this. We simulated several Rufus questions for ${category} and noticed ${competitorName} is dominating the citations because of their Q&A section.\n\nI have the 3-step listing recovery playbook ready. Let me know if you want me to drop the link.`,
      body3: `Would you be open to a quick 10-minute check this week to review the Rufus gaps and competitor data? I have slots Tuesday at 2pm ET and Thursday at 10am ET.\n\nWhich works better?`,
      body4: `That 3.5% FBA surcharge Amazon added in April is hurting margins for ${category}. One lever most brands miss is reducing PPC ad dependency by gaining organic Rufus visibility.\n\nI created a Rufus margin-recovery checklist showing how. Reply if you want a copy.`,
      body5: `I'm going to archive the interactive Rufus compatibility audit I generated for ${company} by the end of the week.\n\nIf you want the link to check it out before it's deleted, let me know.`
    };
  }
}
