import { db } from "../../db/drizzle.js";
import { prospects, listings, listingAnalyses } from "../../db/schema.js";
import { eq, desc } from "drizzle-orm";
import { logger } from "../../infra/logger.js";

export interface OutreachEmails {
  subject: string;
  body1: string;
  body2: string;
  body3: string;
  body4: string;
  body5: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEANING UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function cleanCompanyName(company: string | null, brand?: string | null): string {
  let name = company || brand || "";
  name = name.replace(/^Visit the /i, "").replace(/ Store$/i, "").replace(/^Brand:\s*/i, "");
  // Strip LLC/Inc BEFORE stripping trailing commas (handles 'Contours Rx, LLC')
  name = name.replace(/,?\s*LLC\.?/gi, "").replace(/,?\s*Inc\.?/gi, "").replace(/,?\s*Corp\.?/gi, "").replace(/,?\s*Ltd\.?/gi, "");
  name = name.replace(/[,;.]+$/, "").trim();
  return name || "your brand";
}

function cleanCategory(category: string | null): string {
  if (!category) return "product listing";
  return category.toLowerCase().trim()
    .replace(/^visit the /i, "").replace(/ store$/i, "");
}

function cleanProductTitle(title: string | null, category: string): string {
  if (!title || title === "null") return category;
  let clean = title.split("-")[0].split("|")[0].split(",")[0].trim();
  clean = clean.replace(/[^\w\s\-\.\'\&]/g, "").trim();
  if (clean.length > 40) clean = clean.slice(0, 37) + "...";
  return clean || category;
}

function fallbackCompetitor(category: string): string {
  const lc = category.toLowerCase();
  if (lc.includes("magnesium")) return "Pure Encapsulations";
  if (lc.includes("collagen")) return "Vital Proteins";
  if (lc.includes("berberine")) return "Thorne";
  if (lc.includes("creatine")) return "Optimum Nutrition";
  if (lc.includes("vitamin c") || lc.includes("serum")) return "TruSkin";
  if (lc.includes("retinol") || lc.includes("cream")) return "Neutrogena";
  if (lc.includes("skin") || lc.includes("beauty") || lc.includes("niacinamide")) return "CeraVe";
  if (lc.includes("protein") || lc.includes("supplement") || lc.includes("greens")) return "Orgain";
  if (lc.includes("sea moss") || lc.includes("mushroom") || lc.includes("lions mane")) return "Host Defense";
  if (lc.includes("coffee")) return "Wandering Bear";
  if (lc.includes("foam roller") || lc.includes("mat") || lc.includes("desk")) return "Gaiam";
  if (lc.includes("dog") || lc.includes("pet") || lc.includes("salmon")) return "Zesty Paws";
  return "competing brands";
}

function cleanCompetitor(raw: string | null | undefined, category: string): string {
  if (!raw) return fallbackCompetitor(category);
  const lower = raw.toLowerCase().trim()
    .replace(/^visit the /i, "").replace(/ store$/i, "").replace(/ premium plus$/i, "").trim();
  if (
    lower.length < 3 ||
    lower.includes("top rival") || lower.includes("unknown") ||
    lower.includes("direct competitor") || lower.includes("competitor") ||
    lower.includes("your top") || lower === category.toLowerCase()
  ) return fallbackCompetitor(category);
  return raw.replace(/^Visit the /i, "").replace(/ Store$/i, "").replace(/ Premium Plus$/i, "").trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// FLAW EXTRACTION ENGINE — mines topIssues into clinical engineer-level diagnosis
// ─────────────────────────────────────────────────────────────────────────────

interface FlawResult {
  flawStatement: string;
  subjectTag: string;
}

function extractFlaw(topIssues: any, category: string, rufusScore: number, overallScore: number): FlawResult {
  if (topIssues && topIssues !== "null" && topIssues !== "[]") {
    try {
      const parsed = typeof topIssues === "string" ? JSON.parse(topIssues) : topIssues;
      if (Array.isArray(parsed) && parsed.length > 0) {
        const issues: string[] = parsed
          .map((item: any) => {
            if (typeof item === "string" && item.length > 10) return item;
            if (item?.recommendation && item.recommendation.length > 10) return item.recommendation;
            return null;
          })
          .filter(Boolean)
          .slice(0, 2);
        if (issues.length > 0) return synthesizeFlaw(issues, category);
      }
    } catch (e) { /* fall through */ }
  }
  return categoryFallbackFlaw(category, rufusScore, overallScore);
}

function synthesizeFlaw(issues: string[], category: string): FlawResult {
  const issue = issues[0].toLowerCase();
  if (issue.includes("keyword stuffing") || issue.includes("readability") || issue.includes("repeated")) {
    return { flawStatement: "keyword stuffing in the product title and bullet points — Rufus's crawler is actively de-ranking the listing because it reads as spam, not as a product answer", subjectTag: "keyword cannibalization" };
  }
  if (issue.includes("q&a") || issue.includes("rufus cannot") || issue.includes("zero q")) {
    return { flawStatement: "zero structured Q&A content — when buyers ask Rufus conversational questions about safety, usage, or efficacy, the AI cannot retrieve an answer and redirects citations to competing listings that have structured answers", subjectTag: "rufus blind spot" };
  }
  if (issue.includes("safety") || issue.includes("dosage") || issue.includes("warning") || issue.includes("daily")) {
    return { flawStatement: "missing clinical safety callouts and daily dosage guidance — Rufus flags the listing as incomplete for safety-sensitive queries, routing those high-intent buyers directly to competitors who have structured safety disclaimers", subjectTag: "safety gap" };
  }
  if (issue.includes("stress") || issue.includes("relaxation") || issue.includes("sleep")) {
    return { flawStatement: "zero stress-relief and sleep benefit indexing — Rufus doesn't understand this listing addresses stress or sleep because there are no structured claim nodes for those buyer intents, so it routes those high-purchase-intent queries to other brands", subjectTag: "intent gap" };
  }
  if (issue.includes("skin") || issue.includes("complexion") || issue.includes("derma")) {
    return { flawStatement: "no skin health benefit architecture in the backend — Rufus cannot route skin-focused buyer queries to this listing because the semantic skin-health intent nodes are completely absent from the product content", subjectTag: "content gap" };
  }
  if (issue.includes("energy") || issue.includes("fatigue")) {
    return { flawStatement: "missing energy and fatigue-reduction benefit statements — the listing has no indexed nodes answering 'will this help my energy levels?' so Rufus routes energy-intent queries to listings that explicitly answer that question", subjectTag: "energy indexing" };
  }
  if (issue.includes("clinical") || issue.includes("study") || issue.includes("evidence")) {
    return { flawStatement: "absence of clinical study references and evidence-backed claims — health-supplement buyers using Rufus to compare products get zero clinical proof from this listing while competitor listings that cite studies capture those high-converting clicks", subjectTag: "clinical proof gap" };
  }
  if (issue.includes("timing") || issue.includes("routine") || issue.includes("consumption")) {
    return { flawStatement: "no consumption timing or usage routine content — Rufus cannot answer 'when should I take this?' which is the single highest-converting buyer question in this category, so it redirects those queries to brands that have structured timing guidance", subjectTag: "usage gap" };
  }
  if (issue.includes("brand trust") || issue.includes("awareness") || issue.includes("engagement")) {
    return categoryFallbackFlaw(category, 50, 70);
  }
  const cleaned = issues[0]
    .replace(/^Add /i, "missing ").replace(/^Lacks /i, "no ").replace(/^Fails to /i, "fails to ")
    .replace(/ to improve \w+\.$/, "").toLowerCase().trim();
  return { flawStatement: `${cleaned} — Rufus cannot retrieve accurate answers from this listing for high-intent buyer queries, defaulting citations to competitor products`, subjectTag: "listing gap" };
}

function categoryFallbackFlaw(category: string, rufusScore: number, overallScore: number): FlawResult {
  const lc = category.toLowerCase();
  const severity = rufusScore < 30 ? "critical" : rufusScore < 50 ? "significant" : "measurable";
  if (lc.includes("magnesium")) return { flawStatement: "backend attribute data flow for magnesium absorption and bioavailability is completely unstructured — Rufus cannot answer 'which magnesium form absorbs best?' and routes those high-intent queries to competitors with proper attribute architecture", subjectTag: "absorption gap" };
  if (lc.includes("creatine")) return { flawStatement: "no performance comparison nodes indexed — Rufus cannot differentiate this creatine product from generic alternatives when buyers ask 'what's the best creatine for muscle gain?', defaulting citations to brands with structured performance claims", subjectTag: "performance indexing" };
  if (lc.includes("collagen")) return { flawStatement: "zero collagen source transparency and bioavailability claims — Rufus routes 'which collagen is best?' queries to competitor listings that explicitly state peptide molecular weight, sourcing, and absorption data", subjectTag: "sourcing gap" };
  if (lc.includes("berberine")) return { flawStatement: "no clinical dosing protocol indexed — Rufus cannot answer 'what dose of berberine is effective?' from this listing and redirects those high-purchase-intent queries to listings with structured clinical dosing references", subjectTag: "dosing gap" };
  if (lc.includes("vitamin c") || lc.includes("serum")) return { flawStatement: "no skin outcome nodes — Rufus cannot match this serum to buyer queries like 'does vitamin C reduce dark spots?' because there are zero outcome-mapped content nodes, redirecting those high-converting queries to competitors", subjectTag: "outcome indexing" };
  if (lc.includes("retinol") || lc.includes("cream")) return { flawStatement: "missing skin-tolerance and sensitivity disclaimers — Rufus routes 'is this retinol safe for sensitive skin?' queries to competitor listings with structured sensitivity guidance, leaving this listing invisible for that buyer segment", subjectTag: "sensitivity gap" };
  if (lc.includes("sea moss") || lc.includes("mushroom") || lc.includes("lions mane")) return { flawStatement: "no clinical bioavailability or extraction ratio content — Rufus cannot differentiate this product from cheap alternatives when buyers ask 'what's the most potent sea moss / lion's mane?', defaulting to competitors with lab-verified potency claims", subjectTag: "potency indexing" };
  if (lc.includes("protein") || lc.includes("supplement") || lc.includes("greens")) return { flawStatement: "backend keyword architecture is operating on primary search terms only — conversational buyer queries on Rufus like 'what's the cleanest protein powder?' are invisible to this listing because secondary intent nodes are completely absent", subjectTag: "secondary indexing" };
  if (lc.includes("coffee")) return { flawStatement: "zero cold brew methodology and flavor profile indexing — Rufus routes 'what's the smoothest cold brew?' queries to competitors with structured brew ratio, bean origin, and acidity profile content that this listing completely lacks", subjectTag: "brew profile gap" };
  if (lc.includes("foam roller") || lc.includes("mat") || lc.includes("desk")) return { flawStatement: "no therapeutic use-case indexing — Rufus cannot match this product to buyer queries like 'best foam roller for tight IT bands' because there are zero structured use-case nodes, routing those conversions to competitors with recovery-specific content", subjectTag: "use-case gap" };
  if (lc.includes("dog") || lc.includes("pet") || lc.includes("salmon")) return { flawStatement: "missing breed-specific dosing and vet-certification content — Rufus routes 'is this safe for small dogs?' queries to competitor listings with structured weight-based dosing and vet-approval language, making this listing invisible for those queries", subjectTag: "dosing architecture" };
  if (lc.includes("skin") || lc.includes("beauty") || lc.includes("niacinamide")) return { flawStatement: "no dermatological safety and skin-type compatibility indexing — Rufus routes 'is this safe for sensitive skin?' and 'does this work for oily skin?' queries entirely to competitor listings that have structured skin-type compatibility nodes", subjectTag: "skin-type gap" };
  return { flawStatement: `backend attribute architecture is running below ${severity} Rufus retrieval thresholds — conversational buyer queries that should be driving revenue to this listing are being intercepted and redirected to competitor products`, subjectTag: "indexing gap" };
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL QUANTIFICATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function quantifyLoss(price: number, reviewCount: number, rufusScore: number, overallScore: number, category: string): string {
  const baseTraffic = Math.max(500, reviewCount * 18);
  const efficiencyGap = Math.max(10, 100 - (rufusScore > 0 ? rufusScore : overallScore));
  const lc = category.toLowerCase();
  const cvr = lc.includes("supplement") || lc.includes("health") ? 0.038
    : lc.includes("beauty") || lc.includes("skin") || lc.includes("serum") ? 0.034
    : 0.032;
  const lostConversions = Math.round(baseTraffic * 0.22 * (efficiencyGap / 100) * cvr * 30);
  const monthlyLoss = Math.round(lostConversions * price);
  const dailyLoss = Math.max(50, Math.round(monthlyLoss / 30));
  const fmt = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const fmtMonthly = monthlyLoss >= 10000 ? `$${Math.round(monthlyLoss / 1000)}k` : `$${fmt(monthlyLoss)}`;
  const fmtDaily = `$${fmt(dailyLoss)}`;
  return `Every 24 hours this stays unpatched, Rufus is redirecting approximately ${fmtDaily} in conversion-ready traffic away from this listing. That's ${fmtMonthly}/month in revenue your competitors are collecting on your behalf.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — generateOutreachCopy
// ─────────────────────────────────────────────────────────────────────────────

export async function generateOutreachCopy(prospectId: number): Promise<OutreachEmails> {
  const prospectResult = await db.select().from(prospects).where(eq(prospects.id, prospectId)).limit(1);
  const prospect = prospectResult[0];
  if (!prospect) throw new Error(`Prospect not found: ${prospectId}`);

  const listingResult = await db.select().from(listings).where(eq(listings.prospectId, prospectId)).orderBy(desc(listings.id)).limit(1);
  const listing = listingResult[0];

  const analysisResult = await db.select().from(listingAnalyses).where(eq(listingAnalyses.prospectId, prospectId)).orderBy(desc(listingAnalyses.id)).limit(1);
  const analysis = analysisResult[0];

  // ── Core data
  const companyName = cleanCompanyName(prospect.company);
  const rawFirst = (prospect.firstName || "").trim();
  const badNames = ["null", "there", "alex seller", "bunker bullies", ""];
  const hasName = rawFirst && !badNames.includes(rawFirst.toLowerCase());
  const nameSalutation = hasName ? `${rawFirst},\n\n` : "";
  const nameDash = hasName ? `${rawFirst} — ` : "";

  const category = cleanCategory(listing?.category ?? null);
  const shortTitle = cleanProductTitle(listing?.title ?? null, category);
  const auditUrl = `https://optimusrufus.com/p/${prospect.slug}`;

  const rufusScore = analysis?.rufusScore ?? 0;
  const overallScore = analysis?.overallScore ?? 60;
  const price = listing?.price ?? 29.99;
  const reviewCount = listing?.reviewCount ?? 150;

  // ── Competitor
  let competitorRaw: string | null = null;
  if (analysis?.copySimulatorScenarios) {
    try {
      const sc = typeof analysis.copySimulatorScenarios === "string"
        ? JSON.parse(analysis.copySimulatorScenarios) : analysis.copySimulatorScenarios;
      if (Array.isArray(sc) && sc[0]?.competitorName) competitorRaw = sc[0].competitorName;
    } catch (e) { /* ignored */ }
  }
  const competitor = cleanCompetitor(competitorRaw, category);

  // ── Clinical flaw diagnosis
  const flaw = extractFlaw(analysis?.topIssues, category, rufusScore, overallScore);

  // ── Financial quantification for Email 2
  const lossStatement = quantifyLoss(price, reviewCount, rufusScore, overallScore, category);

  // ── Rotate 3 angles per prospect ID
  const angleType = prospectId % 3;
  let subject: string;
  let body1: string;

  const flawIsClause = /\b(is |are |cannot |can't |isn't |aren't )/i.test(flaw.flawStatement);
  const flawForTeardown = flawIsClause
    ? `a structural gap here: ${flaw.flawStatement}`
    : /^(no |zero |missing |absence of)/i.test(flaw.flawStatement) ? `a critical issue: ${flaw.flawStatement}`
    : /^[aeiou]/i.test(flaw.flawStatement) ? `an ${flaw.flawStatement}`
    : `a ${flaw.flawStatement}`;
  const flawForSherlock = flawIsClause
    ? `I ran a Rufus crawl simulation and the data surfaced a specific issue: ${flaw.flawStatement}`
    : `The listing has ${flaw.flawStatement}`;

  if (angleType === 0) {
    subject = flaw.subjectTag;
    body1 = `${nameSalutation}I was auditing ${category} listings last week and pulled up ${companyName}'s backend architecture.

There's ${flawForTeardown}.

I didn't want to send you a generic pitch. So I built an interactive diagnostic model that maps exactly where the indexing is broken and shows what the fixed architecture looks like with revenue recovery projections.

I left it here: ${auditUrl}

Yhia`;

  } else if (angleType === 1) {
    subject = flaw.subjectTag;
    body1 = `${nameSalutation}Noticed something specific on ${companyName}'s ${shortTitle} listing.

${flawForSherlock}.

I built a live simulation showing the exact traffic volume ${competitor} is capturing from the queries your listing should be winning — and what the patched architecture looks like.

You can run the diagnostic yourself here: ${auditUrl}

Yhia`;

  } else {
    const efficiencyNum = rufusScore > 0 ? rufusScore : Math.max(18, 100 - overallScore);
    subject = `${efficiencyNum}% efficiency`;
    body1 = `${nameDash}${companyName}'s listing is recovering ${efficiencyNum}% of its potential Rufus retrieval capacity.

The gap is caused by ${flaw.flawStatement}.

I built a custom diagnostic environment — not a pitch deck — that shows the exact failure points in red and what the corrected architecture delivers in green, with specific revenue projections.

Interactive model here: ${auditUrl}

Yhia`;
  }

  // ── Email 2: 48-Hour Ruthless Bump
  const body2 = `${lossStatement} Did the diagnostic terminal load correctly for you?`;

  // ── Touch 3
  const namePrefix = hasName ? `${rawFirst}, ` : "";
  const body3 = `${namePrefix}quick update — ${competitor} just captured another Rufus recommendation node for high-intent ${category} queries.

The live simulation updated with your revised gap metrics: ${auditUrl}`;

  // ── Touch 4
  const body4 = `Rufus search chat sits directly above PPC ad blocks. Fixing this indexing architecture replaces expensive paid traffic with zero-cost organic Rufus citations.

Diagnostic here: ${auditUrl}`;

  // ── Touch 5
  const body5 = `Archiving the diagnostic environment for ${companyName} by Friday. If you want to see the architecture before the link expires: ${auditUrl}`;

  return { subject, body1, body2, body3, body4, body5 };
}
