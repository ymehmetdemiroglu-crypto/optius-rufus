import Database from "better-sqlite3";
import { join } from "path";
import fs from "fs";

// Load environment variables manually if present
function loadEnv() {
  try {
    const envPath = join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const firstEqual = trimmed.indexOf("=");
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const val = trimmed.slice(firstEqual + 1).trim().replace(/^['"]|['"]$/g, "");
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to load .env manually:", e);
  }
}

loadEnv();

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
if (!APOLLO_API_KEY) {
  console.error("❌ APOLLO_API_KEY is not defined in .env");
  process.exit(1);
}

const dbPath = join(process.cwd(), "data", "optimus.db");
const sqliteDb = new Database(dbPath);

// Arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const cleanArgs = args.filter(a => a !== "--dry-run");

const limitArg = cleanArgs[0] || "10";
const LIMIT = limitArg.toLowerCase() === "all" ? 999999 : parseInt(limitArg, 10);

console.log("=================================================");
console.log("🚀 HIGH-VALUE PROSPECT DEPLOYMENT TOOL");
console.log(`Target Limit: ${LIMIT === 999999 ? "ALL" : LIMIT}`);
console.log(`Dry Run Mode: ${DRY_RUN ? "ENABLED" : "DISABLED"}`);
console.log("=================================================");

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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let apolloFailedPermanently = false;

async function apolloRequestWithRetry(url: string, method: string, body: any, retries = 3): Promise<any> {
  if (apolloFailedPermanently) {
    throw new Error("Apollo API bypassed due to permanent auth failure");
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "Authorization": `Api-Token ${APOLLO_API_KEY}`,
          "x-api-key": APOLLO_API_KEY!,
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        console.warn(`  ⚠️ Rate limit hit (429). Sleeping for 60 seconds... (Attempt ${i + 1}/${retries})`);
        await sleep(60000);
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        const err = new Error(`Apollo API error: ${response.status} - ${errorText}`);
        if (response.status === 401 || response.status === 403) {
          apolloFailedPermanently = true;
          console.warn(`  ❌ Permanent Apollo authentication error: ${response.status}. Skipping subsequent Apollo calls.`);
          throw err;
        }
        throw err;
      }

      return await response.json();
    } catch (err: any) {
      if (apolloFailedPermanently || i === retries - 1) throw err;
      console.warn(`  ⚠️ Request failed: ${err.message}. Retrying in 5 seconds...`);
      await sleep(5000);
    }
  }
}

async function syncCustomFieldsToApollo(contactId: string, fields: Record<string, any>) {
  const url = `https://api.apollo.io/v1/contacts/${contactId}`;
  
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

function parseSemanticGaps(scenariosRaw: string | null): string {
  if (!scenariosRaw) return "safety warnings and usage routine guidelines";
  try {
    const scenarios = JSON.parse(scenariosRaw);
    if (Array.isArray(scenarios) && scenarios.length > 0) {
      return scenarios.map(s => s.failReason || s.buyerQuestion).slice(0, 2).join(" and ");
    }
  } catch (e) {
    // Ignore
  }
  return "safety warnings and daily dosage timing guidelines";
}

function extractCompetitor(scenariosRaw: string | null): string {
  if (!scenariosRaw) return "your top rival";
  try {
    const scenarios = JSON.parse(scenariosRaw);
    if (Array.isArray(scenarios) && scenarios.length > 0) {
      return scenarios[0].competitorName || "your top rival";
    }
  } catch (e) {
    // Ignore
  }
  return "your top rival";
}

function getTierDescription(sequenceId: string | null): string {
  if (sequenceId === "6a3005fee287cb000c007e03") {
    return "Enterprise supplements/beauty brand (GMV $1M-$20M). They care about category conquesting, organic market share defense against named rivals, and catalog bundling blueprints. Keep it highly professional and business-focused.";
  }
  return "Growth supplements/beauty brand (GMV $100k-$1M). They care about organic search visibility vs. expensive PPC ad costs, listing structure gaps, and customer Q&As. Focus on ad cost reduction and efficiency.";
}

async function generateThreadedOutreachCopy(
  p: any, 
  rufusScore: number, 
  topGap: string, 
  competitorName: string,
  sequenceId: string | null
): Promise<{ 
  subject_1: string;
  body_1: string; 
  body_2: string; 
  body_3: string; 
  body_4: string; 
  body_5: string; 
}> {
  const { callLlm } = await import("../api/services/llmGateway.js");
  const tierDescription = getTierDescription(sequenceId);

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
    console.warn(`  ⚠️ AI copywriter failed for prospect ${p.email}: ${err.message}. Using defaults.`);
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
  // Query analyzed prospects who have valid Apollo Contact IDs and belong to Class_A or Class_B campaigns
  const query = `
    SELECT p.*, l.brand, l.category, a.rufusScore, a.cosmoScore, a.copySimulatorScenarios, a.copyHeroHeadline, a.copyHeroSubheadline, a.id as analysisId
    FROM prospects p
    JOIN listings l ON l.prospectId = p.id
    JOIN listing_analyses a ON a.listingId = l.id
    WHERE p.apolloContactId IS NOT NULL 
      AND p.apolloContactId != '' 
      AND p.apolloContactId NOT LIKE 'mock-%'
      AND p.status = 'analyzed'
      AND p.apolloSequenceId IN ('6a3005fee287cb000c007e03', '6a300617700f6b000cee5416')
    ORDER BY p.id ASC
  `;

  const targets = sqliteDb.prepare(query).all() as any[];
  console.log(`\nFound ${targets.length} high-value (Class_A/B) analyzed prospects ready to deploy.`);

  if (targets.length === 0) {
    console.log("🎉 No high-value prospects found waiting to be deployed!");
    return;
  }

  const toProcess = targets.slice(0, LIMIT);
  console.log(`Deploying ${toProcess.length} contacts...`);

  let successCount = 0;
  let failCount = 0;

  for (let idx = 0; idx < toProcess.length; idx++) {
    const p = toProcess[idx];
    const progress = `[${idx + 1}/${toProcess.length}]`;
    
    const rufusScore = p.rufusScore || 45;
    const auditUrl = `https://optimusrufus.com/api/pdf/${p.slug}`;
    const category = p.category || "product listing";
    
    const topGap = parseSemanticGaps(p.copySimulatorScenarios);
    let competitorName = extractCompetitor(p.copySimulatorScenarios);
    if (!competitorName || competitorName.toLowerCase() === "your top rival" || competitorName.toLowerCase() === "unknown") {
      competitorName = "your direct competitor";
    }
    const sequenceId = p.apolloSequenceId;

    console.log(`\n${progress} Deploying: ${p.firstName || ""} ${p.lastName || ""} @ ${p.company || "No Company"}`);
    console.log(`  - ASIN: ${p.asin || "N/A"}`);
    console.log(`  - Rufus Score: ${rufusScore}/100`);
    console.log(`  - Top Gap: "${topGap}"`);
    console.log(`  - Competitor: "${competitorName}"`);
    console.log(`  - Sequence ID: ${sequenceId}`);

    // Generate copy
    console.log(`  Generating copy drafts...`);
    const copy = await generateThreadedOutreachCopy(p, rufusScore, topGap, competitorName, sequenceId);
    console.log(`  Generated Subject: "${copy.subject_1}"`);

    if (DRY_RUN) {
      console.log("\n  [Dry-Run] Threaded Outreach Preview:");
      console.log(`  ==================================================`);
      console.log(`  Subject: ${copy.subject_1}`);
      console.log(`  Body 1:\n${copy.body_1}`);
      console.log(`  --------------------------------------------------`);
      console.log(`  Body 2:\n${copy.body_2}`);
      console.log(`  ==================================================\n`);
      successCount++;
      continue;
    }

    let apolloSuccess = false;
    if (apolloFailedPermanently) {
      console.log(`  Skipping Apollo sync (permanent auth failure detected).`);
    } else {
      try {
        // 1. Sync fields to Apollo
        console.log(`  Syncing custom fields to Apollo contact ${p.apolloContactId}...`);
        await syncCustomFieldsToApollo(p.apolloContactId, {
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
        console.log(`  ✅ Synced successfully.`);

        // 2. Enroll in Sequence in Apollo
        console.log(`  Enrolling in Apollo Sequence ${sequenceId}...`);
        await enrollContactInSequence(p.apolloContactId, sequenceId);
        console.log(`  ✅ Enrolled successfully.`);
        apolloSuccess = true;
      } catch (err: any) {
        console.warn(`  ⚠️ Apollo API calls failed: ${err.message}. Proceeding with local draft creation.`);
      }
    }

    try {
      // 3. Save copy locally
      sqliteDb.prepare(`
        UPDATE listing_analyses
        SET copyAutopsyHeadline = ?, copyAutopsyBody = ?,
            copyBleedHeadline = ?, copyBleedBody = ?,
            copyRoadmapHeadline = ?, copyRoadmapBody = ?,
            copyPersonalizedHook = ?, copyProblemNarrative = ?,
            copySolutionPitch = ?, copyUrgencyCTA = ?
        WHERE id = ?
      `).run(
        copy.subject_1, copy.body_1, 
        `Re: ${copy.subject_1}`, copy.body_2, 
        `Re: ${copy.subject_1}`, copy.body_3, 
        `Re: ${copy.subject_1}`, copy.body_4, 
        `Re: ${copy.subject_1}`, copy.body_5, 
        p.analysisId
      );

      // 4. Update status in local DB
      sqliteDb.prepare(`
        UPDATE prospects
        SET status = 'drafted'
        WHERE id = ?
      `).run(p.id);
      
      console.log(`  ✅ Completed. status updated to 'drafted'${apolloSuccess ? ' (Live Enrolled)' : ' (Local draft only)'}.`);
      successCount++;
      
      // Delay to avoid hitting Apollo rate limits (1.5 seconds)
      await sleep(1500);
    } catch (err: any) {
      console.error(`  ❌ Failed to save local draft for prospect ${p.id}:`, err.message);
      failCount++;
    }
  }

  console.log("\n=================================================");
  console.log("📊 CAMPAIGN DEPLOYMENT COMPLETE");
  console.log(`- Successfully Deployed: ${successCount}`);
  console.log(`- Failed:               ${failCount}`);
  console.log("=================================================");
}

main()
  .catch(console.error)
  .finally(() => sqliteDb.close());
