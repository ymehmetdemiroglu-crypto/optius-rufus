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
console.log("🚀 APOLLO DRAFT SYNC & AI THREADED COPYWRITER");
console.log(`Target Limit: ${LIMIT === 999999 ? "ALL" : LIMIT}`);
console.log(`Dry Run Mode: ${DRY_RUN ? "ENABLED" : "DISABLED"}`);
console.log("=================================================");

/**
 * CONFIGURATION: Apollo Custom Field Keys
 * Configured for a threaded sequence (1 subject, 5 bodies = 6 variables)
 */
const FIELD_KEYS = {
  rufusScore: process.env.APOLLO_FIELD_RUFUS_SCORE || "rufus_score",
  topGap: process.env.APOLLO_FIELD_TOP_GAP || "top_gap",
  competitorName: process.env.APOLLO_FIELD_COMPETITOR_NAME || "competitor_name",
  auditUrl: process.env.APOLLO_FIELD_AUDIT_URL || "audit_url",
  category: process.env.APOLLO_FIELD_CATEGORY || "product_category",
  
  // 6 outreach variables
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

async function apolloRequestWithRetry(url: string, method: string, body: any, retries = 3): Promise<any> {
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
        throw new Error(`Apollo API error: ${response.status} - ${await response.text()}`);
      }

      return await response.json();
    } catch (err: any) {
      if (i === retries - 1) throw err;
      console.warn(`  ⚠️ Request failed: ${err.message}. Retrying in 5 seconds...`);
      await sleep(5000);
    }
  }
}

/**
 * Update the custom fields for a contact in Apollo.
 */
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
    // Ignore and fallback
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
    // Ignore and fallback
  }
  return "your top rival";
}

function getTierDescription(sequenceId: string | null): string {
  if (sequenceId === "6a3005fee287cb000c007e03") {
    return "Enterprise supplements/beauty brand (GMV $1M-$20M). They care about category conquesting, organic market share defense against named rivals, and catalog bundling blueprints. Keep it highly professional and business-focused.";
  }
  if (sequenceId === "6a300617700f6b000cee5416") {
    return "Growth supplements/beauty brand (GMV $100k-$1M). They care about organic search visibility vs. expensive PPC ad costs, listing structure gaps, and customer Q&As. Focus on ad cost reduction and efficiency.";
  }
  return "Starter supplements/beauty brand (GMV <$100k). They care about basic Rufus visibility, conversational bullet point structuring, and gaining initial traction. Keep it highly practical and accessible.";
}

/**
 * AI THREADED COPYWRITER AGENT: Generates 1 subject line and 5 email bodies.
 */
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
- Prospect First Name: ${p.firstName || "there"}
- Company: ${p.company || "your brand"}
- Category: ${p.category || "product listing"}
- ASIN: ${p.asin || "your product"}
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
    // Fallback defaults
    return {
      subject_1: `question about ${p.company || "your listing"} (${p.asin})`,
      body_1: `Hi ${p.firstName || "there"},\n\nYour Amazon Rufus compatibility score is ${rufusScore}/100.\nAmazon's shopping AI is steering buyers to ${competitorName} due to listing gaps in: ${topGap}.\n\nReply to this email if you want me to send you the full interactive compatibility autopsy report we generated.`,
      body_2: `Just following up on this. We simulated several Rufus questions for ${p.category || "your category"} and noticed ${competitorName} is dominating the citations because of their Q&A section.\n\nI have the 3-step listing recovery playbook ready. Let me know if you want me to drop the link.`,
      body_3: `Would you be open to a quick 10-minute check this week to review the Rufus gaps and competitor data? I have slots Tuesday at 2pm ET and Thursday at 10am ET.\n\nWhich works better?`,
      body_4: `That 3.5% FBA surcharge Amazon added in April is hurting margins for ${p.category || "your niche"}. One lever most brands miss is reducing PPC ad dependency by gaining organic Rufus visibility.\n\nI created a Rufus margin-recovery checklist showing how. Reply if you want a copy.`,
      body_5: `I'm going to archive the interactive Rufus compatibility audit I generated for {{Company}} by the end of the week.\n\nIf you want the link to check it out before it's deleted, let me know.`
    };
  }
}

async function main() {
  // Query analyzed prospects who have listing analysis reports and valid Apollo contact IDs
  const query = `
    SELECT p.*, l.brand, l.category, a.rufusScore, a.cosmoScore, a.copySimulatorScenarios, a.copyHeroHeadline, a.copyHeroSubheadline, a.id as analysisId
    FROM prospects p
    JOIN listings l ON l.prospectId = p.id
    JOIN listing_analyses a ON a.listingId = l.id
    WHERE p.apolloContactId IS NOT NULL 
      AND p.apolloContactId != '' 
      AND p.apolloContactId NOT LIKE 'mock-%'
      AND p.status = 'analyzed'
    ORDER BY p.id ASC
  `;

  const targets = sqliteDb.prepare(query).all() as any[];
  console.log(`\nFound ${targets.length} analyzed prospects ready to sync to Apollo.`);

  if (targets.length === 0) {
    console.log("🎉 No prospects found waiting to be synced!");
    return;
  }

  const toProcess = targets.slice(0, LIMIT);
  console.log(`Preparing to sync ${toProcess.length} contacts.`);

  let successCount = 0;
  let failCount = 0;

  for (let idx = 0; idx < toProcess.length; idx++) {
    const p = toProcess[idx];
    const progress = `[${idx + 1}/${toProcess.length}]`;
    
    // Parse listing diagnostics
    const rufusScore = p.rufusScore || 45;
    const auditUrl = `https://optimusrufus.com/audit/${p.slug}`;
    const category = p.category || "product listing";
    
    const topGap = parseSemanticGaps(p.copySimulatorScenarios);
    const competitorName = extractCompetitor(p.copySimulatorScenarios);
    const sequenceId = p.apolloSequenceId;

    console.log(`\n${progress} Processing: ${p.firstName || ""} ${p.lastName || ""} @ ${p.company || "No Company"}`);
    console.log(`  - ASIN: ${p.asin || "N/A"}`);
    console.log(`  - Rufus Score: ${rufusScore}/100`);
    console.log(`  - Top Gap: "${topGap}"`);
    console.log(`  - Competitor: "${competitorName}"`);
    console.log(`  - Assigned Sequence ID: ${sequenceId || "None"}`);

    // Generate custom threaded 5-touch copywriting
    console.log(`  Generating custom AI threaded 5-touch outreach copy...`);
    const copy = await generateThreadedOutreachCopy(p, rufusScore, topGap, competitorName, sequenceId);
    console.log(`  Generated Subject 1: "${copy.subject_1}"`);

    if (DRY_RUN) {
      console.log("\n  [Dry-Run] Threaded 5-Touch Outreach Previews:");
      console.log(`  ==================================================`);
      console.log(`  ✉️ TOUCH 1 (New Thread)`);
      console.log(`  Subject: ${copy.subject_1}`);
      console.log(`  Body:\n${copy.body_1}`);
      console.log(`  --------------------------------------------------`);
      console.log(`  ✉️ TOUCH 2 (Threaded Reply)`);
      console.log(`  Body:\n${copy.body_2}`);
      console.log(`  --------------------------------------------------`);
      console.log(`  ✉️ TOUCH 3 (Threaded Reply)`);
      console.log(`  Body:\n${copy.body_3}`);
      console.log(`  --------------------------------------------------`);
      console.log(`  ✉️ TOUCH 4 (Threaded Reply)`);
      console.log(`  Body:\n${copy.body_4}`);
      console.log(`  --------------------------------------------------`);
      console.log(`  ✉️ TOUCH 5 (Threaded Reply)`);
      console.log(`  Body:\n${copy.body_5}`);
      console.log(`  ==================================================\n`);
      successCount++;
      continue;
    }

    try {
      // 1. Sync fields directly to the contact in Apollo (including custom subject & 5 bodies!)
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
      console.log(`  ✅ Successfully updated threaded custom fields in Apollo.`);

      // 2. Save generated subject and body in local DB for reference
      // Touch 1 maps to copy_autopsy, Touch 2 maps to copy_bleed, Touch 3 maps to copy_roadmap,
      // Touch 4 maps to copy_problem_narrative, Touch 5 maps to copy_urgency_cta
      sqliteDb.prepare(`
        UPDATE listing_analyses
        SET copy_autopsy_headline = ?, copy_autopsy_body = ?,
            copy_bleed_headline = ?, copy_bleed_body = ?,
            copy_roadmap_headline = ?, copy_roadmap_body = ?,
            copy_personalized_hook = ?, copy_problem_narrative = ?,
            copy_solution_pitch = ?, copy_urgency_cta = ?
        WHERE id = ?
      `).run(
        copy.subject_1, copy.body_1, 
        `Re: ${copy.subject_1}`, copy.body_2, 
        `Re: ${copy.subject_1}`, copy.body_3, 
        `Re: ${copy.subject_1}`, copy.body_4, 
        `Re: ${copy.subject_1}`, copy.body_5, 
        p.analysisId
      );
      console.log(`  ✅ Logged 5-touch generated copies in local database.`);

      // 3. Enroll contact in sequence if assigned
      if (sequenceId) {
        await enrollContactInSequence(p.apolloContactId, sequenceId);
        console.log(`  ✅ Successfully enrolled contact in sequence ${sequenceId}.`);
      } else {
        console.log(`  ⚠️ No sequence assigned in DB. Skipping campaign enrollment.`);
      }

      // 4. Update status in local database so they don't get processed next run
      sqliteDb.prepare(`
        UPDATE prospects
        SET status = 'drafted'
        WHERE id = ?
      `).run(p.id);

      console.log(`  ✅ Marked status as 'drafted' in database.`);
      successCount++;
      
      // Delay to avoid hitting Apollo rate limits (1.5 seconds)
      await sleep(1500);
    } catch (err: any) {
      console.error(`  ❌ Failed to sync Apollo contact for ID ${p.id}:`, err.message);
      failCount++;
    }
  }

  console.log("\n=================================================");
  console.log("📊 APOLLO DRAFT SYNC COMPLETE");
  console.log(`- Successfully Synced: ${successCount}`);
  console.log(`- Failed:              ${failCount}`);
  console.log("=================================================");
}

main()
  .catch(console.error)
  .finally(() => sqliteDb.close());
