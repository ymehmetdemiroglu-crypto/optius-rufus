import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { and, eq, isNotNull, ne, not, like } from "drizzle-orm";
import { callLlm } from "../../api/services/llmGateway.js";

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
if (!APOLLO_API_KEY) {
  console.error("❌ APOLLO_API_KEY is not defined in .env");
  process.exit(1);
}

// Arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const cleanArgs = args.filter(a => a !== "--dry-run");

const limitArg = cleanArgs[0] || "10";
const LIMIT = limitArg.toLowerCase() === "all" ? 999999 : parseInt(limitArg, 10);

console.log("=================================================");
log("🚀 APOLLO DRAFT SYNC & AI THREADED COPYWRITER (POSTGRESQL)");
log(`Target Limit: ${LIMIT === 999999 ? "ALL" : LIMIT}`);
log(`Dry Run Mode: ${DRY_RUN ? "ENABLED" : "DISABLED"}`);
console.log("=================================================");

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function apolloRequestWithRetry(url: string, method: string, body: any, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Api-Key": APOLLO_API_KEY!,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 401 || response.status === 403) {
        const errText = await response.text();
        throw new Error(`Apollo Auth Error: ${response.status} - ${errText}`);
      }

      if (response.status === 429) {
        log(`⚠️ Rate limit hit (429). Sleeping for 60 seconds... (Attempt ${i + 1}/${retries})`);
        await sleep(60000);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.status} - ${await response.text()}`);
      }

      return await response.json();
    } catch (err: any) {
      if (err.message.includes("Apollo Auth Error") || i === retries - 1) throw err;
      log(`⚠️ Request failed: ${err.message}. Retrying in 5 seconds...`);
      await sleep(5000);
    }
  }
}

async function syncCustomFieldsToApollo(contactId: string, fields: Record<string, any>) {
  const url = `https://api.apollo.io/v1/contacts/${contactId}`;
  
  const FIELD_KEYS = {
    rufusScore: process.env.APOLLO_FIELD_RUFUS_SCORE || "rufus_score",
    topGap: process.env.APOLLO_FIELD_TOP_GAP || "top_gap",
    competitorName: process.env.APOLLO_FIELD_COMPETITOR_NAME || "competitor_name",
    auditUrl: process.env.APOLLO_FIELD_AUDIT_URL || "audit_url",
    category: process.env.APOLLO_FIELD_CATEGORY || "product_category",
    
    customSubject1: process.env.APOLLO_FIELD_CUSTOM_SUBJECT_1 || "custom_subject_1",
    customBody1: process.env.APOLLO_FIELD_CUSTOM_BODY_1 || "custom_body_1",
    customBody2: process.env.APOLLO_FIELD_CUSTOM_BODY_2 || "custom_body_2",
    customBody3: process.env.APOLLO_FIELD_CUSTOM_BODY_3 || "custom_body_3",
    customBody4: process.env.APOLLO_FIELD_CUSTOM_BODY_4 || "custom_body_4",
    customBody5: process.env.APOLLO_FIELD_CUSTOM_BODY_5 || "custom_body_5",
  };

  const body = {
    custom_fields: {
      [FIELD_KEYS.rufusScore]: fields.rufusScore,
      [FIELD_KEYS.topGap]: fields.topGap,
      [FIELD_KEYS.competitorName]: fields.competitorName,
      [FIELD_KEYS.auditUrl]: fields.auditUrl,
      [FIELD_KEYS.category]: fields.category,
      
      [FIELD_KEYS.customSubject1]: fields.customSubject1,
      [FIELD_KEYS.customBody1]: fields.customBody1,
      [FIELD_KEYS.customBody2]: fields.customBody2,
      [FIELD_KEYS.customBody3]: fields.customBody3,
      [FIELD_KEYS.customBody4]: fields.customBody4,
      [FIELD_KEYS.customBody5]: fields.customBody5
    }
  };

  await apolloRequestWithRetry(url, "PUT", body);
}

async function enrollContactInSequence(contactId: string, sequenceId: string) {
  const url = "https://api.apollo.io/v1/emailer_campaigns/enroll_contact";
  const body = {
    contact_id: contactId,
    emailer_campaign_id: sequenceId
  };
  await apolloRequestWithRetry(url, "POST", body);
}

function parseSemanticGaps(scenariosRaw: any): string {
  if (!scenariosRaw) return "safety warnings and usage routine guidelines";
  try {
    const scenarios = typeof scenariosRaw === "string" ? JSON.parse(scenariosRaw) : scenariosRaw;
    if (Array.isArray(scenarios) && scenarios.length > 0) {
      return scenarios.map(s => s.failReason || s.buyerQuestion).slice(0, 2).join(" and ");
    }
  } catch (e) {
    // Ignore
  }
  return "safety warnings and daily dosage timing guidelines";
}

function extractCompetitor(scenariosRaw: any): string {
  if (!scenariosRaw) return "your top rival";
  try {
    const scenarios = typeof scenariosRaw === "string" ? JSON.parse(scenariosRaw) : scenariosRaw;
    if (Array.isArray(scenarios) && scenarios.length > 0) {
      return scenarios[0].competitorName || "your top rival";
    }
  } catch (e) {
    // Ignore
  }
  return "your top rival";
}

async function generateThreadedOutreachCopy(
  p: any, 
  rufusScore: number, 
  topGap: string, 
  competitorName: string
): Promise<{ 
  subject_1: string;
  body_1: string; 
  body_2: string; 
  body_3: string; 
  body_4: string; 
  body_5: string; 
}> {
  const category = p.category || "product listing";
  const lowerCat = category.toLowerCase();
  const isSupplements = lowerCat.includes("supplement") || lowerCat.includes("vitamin") || lowerCat.includes("dietary") || lowerCat.includes("health") || lowerCat.includes("gummy") || lowerCat.includes("capsule") || lowerCat.includes("protein");
  const isBeauty = lowerCat.includes("beauty") || lowerCat.includes("skin") || lowerCat.includes("cosmetic") || lowerCat.includes("serum") || lowerCat.includes("shampoo") || lowerCat.includes("cream");
  const nicheType = isSupplements ? "supplements" : (isBeauty ? "beauty" : "general");

  const systemPrompt = `You are an elite direct-response copywriter writing cold outreach to e-commerce founders regarding their Amazon Rufus conversational search indexing.
Your tone must sound like an informal Slack message or an email sent from an iPhone while walking to get coffee. Avoid all agency-style formal fluff.

CRITICAL DIRECTIVES:
1. SENDER PERSONA: Write as an independent technical listing scientist or technical consultant. Never sound like a sales representative, agency, or software tool.
2. CASUAL PUNCTUATION & CAPITALIZATION: Use natural casual formatting. Keep sentences short and punchy. Touch 1 starts with a warm, casual greeting ("Hey ${p.firstName || "there"},").
3. FOLLOW-UPS: Follow-up touches (Touch 2 to 5) are threaded replies (replies to Touch 1). Do NOT include greetings, intro statements, or generic signature blocks in follow-up touches. They must read like natural mobile replies (under 40 words).
4. COMPETITOR SANITIZATION: If competitorName is "your top competitor" or similar placeholder, rewrite it naturally (e.g., "your direct competitor").
5. micro-CTAs: CTAs must be low-friction questions asking if you should send a quick doc or checklist (e.g., "Should I send the margin-recovery checklist over?", "Reply 'PDF' and I'll drop the file over?").
6. SIGNATURE: Sign Touch 1 naturally using "Yahya" or "Yahya @ RufusReady".
7. PROSPECT CONTEXT:
   - Category: ${category}
   - Niche: ${nicheType}
   - ASIN: ${p.asin || "your product"}
   - Competitor: ${competitorName}
   - Listing gaps identified: ${topGap}

BANNED TERMS LIST (Strictly Enforced):
- Banned terms: "are lacking", "is deficient", "impacting your visibility", "optimize your listing", "optimize", "custom PDF audit report", "report", "Would you like to reply...", "visibility", "deficient", "audit", "weaknesses".
- Replace with: "you're missing", "isn't there", "stealing your sales", "taking your traffic", "fix this", "claw back citations", "2-page PDF breakdown", "checklist", "Should I send it over?", "Drop it here?".

Touch Guidelines & Niche-Specific Copy Templates (Adapt dynamically for ${p.company || "your brand"}):
- Subject Line: Casual, pattern-interrupt, under 7 words, all lowercase. E.g. "quick scorecard for ${(p.company || "your brand").toLowerCase()}".
- Touch 1 (The Scorecard - Max 85 words):
  Hey ${p.firstName || "there"},
  Was looking at your Amazon listing for ${category} (${p.asin || "your product"}) and noticed ${competitorName} is capturing the primary Rufus citations instead of you. 
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
  Hey ${p.firstName || "there"} - just checking if you saw this?
  No worries if you're swamped, but wanted to make sure it didn't get buried. Reply 'PDF' and I'll drop the file over?
- Touch 3 (The Competitor Shift - Max 40 words):
  Hey ${p.firstName || "there"}, quick update on this.
  Looks like ${competitorName} just picked up another comparison citation for your main search term. It's actively pulling traffic from your detail page.
  Still want that margin-recovery checklist?
- Touch 4 (Margin Squeeze Angle - Max 60 words):
  ${nicheType === "supplements" ? `With Amazon's 3.5% FBA surcharge added in April, margins on dietary supplements are getting squeezed. Organic Rufus citations convert at 4x higher than standard search ads, so fixing this directly cuts your ad spend.` : `Margins on e-commerce are getting tighter this quarter. Winning organic citations in Rufus search chat helps drive zero-cost traffic to your brand, directly offsetting rising PPC costs.`}
  Should I send the checklist showing how to fix it?
- Touch 5 (Scarcity Nudge - Max 40 words):
  I'm cleaning up my drive and will archive that 2-page PDF breakdown for ${p.company || "your brand"} by Friday.
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

  const request = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate the threaded 5-touch sequence JSON." }
    ],
    temperature: 0.75,
    max_tokens: 1100,
    response_format: { type: "json_object" }
  };

  try {
    const response = await callLlm(request, {
      service: "outreach-copywriter",
      prospectId: p.id
    });

    const data = JSON.parse(response.content);
    return {
      subject_1: data.subject_1.trim(),
      body_1: data.body_1.trim(),
      body_2: data.body_2.trim(),
      body_3: data.body_3.trim(),
      body_4: data.body_4.trim(),
      body_5: data.body_5.trim()
    };
  } catch (err: any) {
    log(`⚠️ AI copywriter failed for prospect ${p.email}: ${err.message}. Using defaults.`);
    return {
      subject_1: `quick scorecard for ${(p.company || "your brand").toLowerCase()}`,
      body_1: `Hey ${p.firstName || "there"},\n\nWas looking at your Amazon listing for ${category} (${p.asin || "your product"}) and noticed ${competitorName} is capturing the primary Rufus citations instead of you. \n\nRan a quick diagnostic on your listing. A few gaps:\n• You're missing ${topGap}.\n• Semantic overlap in your bullet points is confusing the LLM crawler.\n• Image alt-text lacks the high-intent keywords Rufus pulls from.\n\nBuilt a quick 2-page PDF breakdown showing how to claw those citations back. \n\nShould I send the margin-recovery checklist over?\n\nBest,\nYahya`,
      body_2: `Hey ${p.firstName || "there"} - just checking if you saw this? \n\nNo worries if you're swamped, but wanted to make sure it didn't get buried. Reply 'PDF' and I'll drop the file over?`,
      body_3: `Hey ${p.firstName || "there"}, quick update on this. \n\nLooks like ${competitorName} just picked up another comparison citation for your main search term. It's actively pulling traffic from your detail page. \n\nStill want that margin-recovery checklist?`,
      body_4: `${nicheType === "supplements" ? `With Amazon's 3.5% FBA surcharge added in April, margins on dietary supplements are getting squeezed. Organic Rufus citations convert at 4x higher than standard search ads, so fixing this directly cuts your ad spend.` : `Margins on e-commerce are getting tighter this quarter. Winning organic citations in Rufus search chat helps drive zero-cost traffic to your brand, directly offsetting rising PPC costs.`}\n\nShould I send the checklist showing how to fix it?`,
      body_5: `I'm cleaning up my drive and will archive that 2-page PDF breakdown for ${p.company || "your brand"} by Friday. \n\nIf you want a copy before it's gone, just reply "PDF" and I'll send it over.`
    };
  }
}

async function main() {
  log("Querying analyzed prospects with valid Apollo IDs from PostgreSQL...");
  const targets = await db
    .select({
      id: schema.prospects.id,
      email: schema.prospects.email,
      company: schema.prospects.company,
      firstName: schema.prospects.firstName,
      lastName: schema.prospects.lastName,
      asin: schema.prospects.asin,
      slug: schema.prospects.slug,
      apolloContactId: schema.prospects.apolloContactId,
      apolloSequenceId: schema.prospects.apolloSequenceId,
      expectedRevenue: schema.prospects.expectedRevenue,
      category: schema.listings.category,
      rufusScore: schema.listingAnalyses.rufusScore,
      cosmoScore: schema.listingAnalyses.cosmoScore,
      copySimulatorScenarios: schema.listingAnalyses.copySimulatorScenarios,
      analysisId: schema.listingAnalyses.id,
    })
    .from(schema.prospects)
    .innerJoin(schema.listings, eq(schema.listings.prospectId, schema.prospects.id))
    .innerJoin(schema.listingAnalyses, eq(schema.listingAnalyses.listingId, schema.listings.id))
    .where(
      and(
        eq(schema.prospects.status, "analyzed"),
        isNotNull(schema.prospects.apolloContactId),
        ne(schema.prospects.apolloContactId, ""),
        not(like(schema.prospects.apolloContactId, "mock-%"))
      )
    )
    .orderBy(schema.prospects.id);

  log(`Found ${targets.length} analyzed prospects ready to sync to Apollo.`);

  if (targets.length === 0) {
    log("🎉 No prospects found waiting to be synced!");
    return;
  }

  const toProcess = targets.slice(0, LIMIT);
  log(`Preparing to sync ${toProcess.length} contacts.`);

  let successCount = 0;
  let failCount = 0;

  for (let idx = 0; idx < toProcess.length; idx++) {
    const p = toProcess[idx];
    const progress = `[${idx + 1}/${toProcess.length}]`;
    
    const rufusScore = p.rufusScore || 45;
    const appUrl = process.env.APP_URL || "https://optimusrufus.com";
    const auditUrl = `${appUrl}/p/${p.slug}`;
    const category = p.category || "product listing";
    
    const topGap = parseSemanticGaps(p.copySimulatorScenarios);
    let competitorName = extractCompetitor(p.copySimulatorScenarios);
    if (!competitorName || competitorName.toLowerCase() === "your top rival" || competitorName.toLowerCase() === "unknown") {
      competitorName = "your direct competitor";
    }
    const sequenceId = p.apolloSequenceId;

    log(`${progress} Processing: ${p.firstName || ""} ${p.lastName || ""} @ ${p.company || "No Company"}`);
    log(`  - ASIN: ${p.asin || "N/A"}`);
    log(`  - Rufus Score: ${rufusScore}/100`);
    log(`  - Top Gap: "${topGap}"`);
    log(`  - Competitor: "${competitorName}"`);
    log(`  - Assigned Sequence ID: ${sequenceId || "None"}`);

    log(`  Generating custom AI threaded 5-touch outreach copy...`);
    const copy = await generateThreadedOutreachCopy(p, rufusScore, topGap, competitorName);
    log(`  Generated Subject 1: "${copy.subject_1}"`);

    if (DRY_RUN) {
      console.log("\n  [Dry-Run] Threaded 5-Touch Outreach Previews:");
      console.log(`  ==================================================`);
      console.log(`  ✉️ TOUCH 1 (New Thread)`);
      console.log(`  Subject: ${copy.subject_1}`);
      console.log(`  Body:\n${copy.body_1}`);
      console.log(`  --------------------------------------------------`);
      console.log(`  ✉️ TOUCH 2 (Threaded Reply)`);
      console.log(`  Body:\n${copy.body_2}`);
      console.log(`  ==================================================\n`);
      successCount++;
      continue;
    }

    try {
      let apolloSynced = false;
      try {
        // 1. Sync fields to Apollo
        await syncCustomFieldsToApollo(p.apolloContactId!, {
          rufusScore,
          topGap,
          competitorName,
          auditUrl,
          category,
          
          customSubject1: copy.subject_1,
          customBody1: copy.body_1,
          customBody2: copy.body_2,
          customBody3: copy.body_3,
          customBody4: copy.body_4,
          customBody5: copy.body_5
        });
        log(`  ✅ Successfully updated threaded custom fields in Apollo.`);
        apolloSynced = true;
      } catch (apolloErr: any) {
        log(`  ⚠️ Apollo API sync failed: ${apolloErr.message}. Proceeding with local draft creation.`);
      }

      // 2. Save generated subject and body in local DB for reference
      await db
        .update(schema.listingAnalyses)
        .set({
          copyAutopsyHeadline: copy.subject_1,
          copyAutopsyBody: copy.body_1,
          copyBleedHeadline: `Re: ${copy.subject_1}`,
          copyBleedBody: copy.body_2,
          copyRoadmapHeadline: `Re: ${copy.subject_1}`,
          copyRoadmapBody: copy.body_3,
          copyPersonalizedHook: `Re: ${copy.subject_1}`,
          copyProblemNarrative: copy.body_4,
          copySolutionPitch: `Re: ${copy.subject_1}`,
          copyUrgencyCTA: copy.body_5,
        })
        .where(eq(schema.listingAnalyses.id, p.analysisId));

      await db
        .update(schema.prospects)
        .set({
          outreachEmails: {
            subject: copy.subject_1,
            body1: copy.body_1,
            body2: copy.body_2,
            body3: copy.body_3,
            body4: copy.body_4,
            body5: copy.body_5,
          },
          status: "drafted",
        })
        .where(eq(schema.prospects.id, p.id));

      log(`  ✅ Logged 5-touch generated copies in local database and set status to 'drafted'${apolloSynced ? ' (Synced to Apollo)' : ' (Local draft only)'}.`);
      successCount++;
      
      // Delay to avoid hitting Apollo rate limits (1.5 seconds)
      await sleep(1500);
    } catch (err: any) {
      log(`  ❌ Failed to save local draft for prospect ID ${p.id}: ${err.message}`);
      failCount++;
    }
  }

  log("\n=================================================");
  log("📊 APOLLO DRAFT SYNC COMPLETE");
  log(`- Successfully Synced: ${successCount}`);
  log(`- Failed:              ${failCount}`);
  log("=================================================");
}

main().catch(err => {
  log(`❌ Fatal worker crash: ${err.message}`);
});
