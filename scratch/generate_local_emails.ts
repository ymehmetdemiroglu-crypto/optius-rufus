import Database from "better-sqlite3";
import { join } from "path";

const sqlitePath = join(process.cwd(), "data", "optimus.db");
const db = new Database(sqlitePath);

// ─────────────────────────────────────────────────────────────────────────────
// CLEANING UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function cleanCompanyName(company: string | null, brand: string | null): string {
  let name = company || brand || "";
  name = name.replace(/^Visit the /i, "").replace(/ Store$/i, "").replace(/^Brand:\s*/i, "");
  // Strip LLC/Inc BEFORE stripping trailing commas (handles 'Contours Rx, LLC')
  name = name.replace(/,?\s*LLC\.?/gi, "").replace(/,?\s*Inc\.?/gi, "").replace(/,?\s*Corp\.?/gi, "").replace(/,?\s*Ltd\.?/gi, "");
  // Strip any remaining trailing punctuation
  name = name.replace(/[,;.]+$/, "").trim();
  return name || "your brand";
}

function cleanProductTitle(title: string | null, category: string): string {
  if (!title || title === "null") return category;
  let clean = title.split("-")[0].split("|")[0].split(",")[0].trim();
  clean = clean.replace(/[^\w\s\-\.\'\&]/g, "").trim();
  if (clean.length > 40) clean = clean.slice(0, 37) + "...";
  return clean || category;
}

function cleanCategory(category: string | null): string {
  if (!category || category === "null") return "Amazon listing";
  return category.toLowerCase().trim()
    .replace(/^visit the /i, "").replace(/ store$/i, "");
}

function cleanCompetitor(raw: string | null, category: string): string {
  if (!raw) return fallbackCompetitor(category);
  const lower = raw.toLowerCase().trim()
    .replace(/^visit the /i, "").replace(/ store$/i, "").replace(/ premium plus$/i, "").trim();
  if (
    lower.length < 3 ||
    lower.includes("top rival") ||
    lower.includes("unknown") ||
    lower.includes("direct competitor") ||
    lower.includes("competitor") ||
    lower.includes("your top") ||
    lower === category.toLowerCase()
  ) return fallbackCompetitor(category);
  return raw.replace(/^Visit the /i, "").replace(/ Store$/i, "").replace(/ Premium Plus$/i, "").trim();
}

function fallbackCompetitor(category: string): string {
  const lc = category.toLowerCase();
  if (lc.includes("magnesium")) return "Pure Encapsulations";
  if (lc.includes("collagen")) return "Vital Proteins";
  if (lc.includes("berberine")) return "Thorne";
  if (lc.includes("creatine")) return "Optimum Nutrition";
  if (lc.includes("vitamin c") || lc.includes("serum")) return "TruSkin";
  if (lc.includes("retinol")) return "Neutrogena";
  if (lc.includes("skin") || lc.includes("beauty") || lc.includes("niacinamide")) return "CeraVe";
  if (lc.includes("protein") || lc.includes("supplement") || lc.includes("greens")) return "Orgain";
  if (lc.includes("sea moss") || lc.includes("mushroom") || lc.includes("lions mane")) return "Host Defense";
  if (lc.includes("coffee")) return "Wandering Bear";
  if (lc.includes("foam roller") || lc.includes("mat") || lc.includes("desk")) return "Gaiam";
  if (lc.includes("salmon") || lc.includes("dog") || lc.includes("pet")) return "Zesty Paws";
  return "competing brands";
}

// ─────────────────────────────────────────────────────────────────────────────
// FLAW EXTRACTION ENGINE
// Mines topIssues into a precise, engineer-level "Detected Flaw Statement"
// ─────────────────────────────────────────────────────────────────────────────

interface FlawResult {
  flawStatement: string;  // The clinical diagnosis sentence
  subjectTag: string;     // 1-4 word lowercase subject line fragment
  financialVerb: string;  // "leaking" / "costing" / "suppressing"
}

function extractFlaw(
  topIssues: string | null,
  category: string,
  rufusScore: number,
  overallScore: number
): FlawResult {
  // Try to parse real issues first
  if (topIssues && topIssues !== "null" && topIssues !== "[]") {
    try {
      const parsed = JSON.parse(topIssues);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Pull the top 2 concrete issues
        const issues: string[] = parsed
          .map((item: any) => {
            if (typeof item === "string" && item.length > 10) return item;
            if (item?.recommendation && item.recommendation.length > 10) return item.recommendation;
            return null;
          })
          .filter(Boolean)
          .slice(0, 2);

        if (issues.length > 0) {
          return synthesizeFlaw(issues, category);
        }
      }
    } catch (e) {
      // fall through to category defaults
    }
  }

  // Category-intelligent fallback — specific clinical diagnoses by niche
  return categoryFallbackFlaw(category, rufusScore, overallScore);
}

function synthesizeFlaw(issues: string[], category: string): FlawResult {
  const issue = issues[0].toLowerCase();
  const lc = category.toLowerCase();

  // Keyword/readability issues
  if (issue.includes("keyword stuffing") || issue.includes("readability") || issue.includes("repeated")) {
    return {
      flawStatement: "keyword stuffing in the product title and bullet points — Rufus's crawler is actively de-ranking the listing because it reads as spam, not as a product answer",
      subjectTag: "keyword cannibalization",
      financialVerb: "suppressing"
    };
  }

  // Missing Q&A / Rufus cannot answer
  if (issue.includes("q&a") || issue.includes("rufus cannot") || issue.includes("rufus can't") || issue.includes("zero q")) {
    return {
      flawStatement: "zero structured Q&A content — when buyers ask Rufus conversational questions about safety, usage, or efficacy, the AI cannot retrieve an answer and redirects citations to competing listings that have structured answers",
      subjectTag: "rufus blind spot",
      financialVerb: "leaking"
    };
  }

  // Safety / dosage information
  if (issue.includes("safety") || issue.includes("dosage") || issue.includes("warning") || issue.includes("daily")) {
    return {
      flawStatement: "missing clinical safety callouts and daily dosage guidance — Rufus flags the listing as incomplete for safety-sensitive queries, routing those high-intent buyers directly to competitors who have structured safety disclaimers",
      subjectTag: "safety gap",
      financialVerb: "leaking"
    };
  }

  // Stress / relaxation messaging
  if (issue.includes("stress") || issue.includes("relaxation") || issue.includes("sleep")) {
    return {
      flawStatement: "zero stress-relief and sleep benefit indexing — Rufus doesn't understand this listing addresses stress or sleep because there are no structured claim nodes for those buyer intents, so it routes those high-purchase-intent queries to other brands",
      subjectTag: "intent gap",
      financialVerb: "leaking"
    };
  }

  // Skin / complexion / beauty messaging
  if (issue.includes("skin") || issue.includes("complexion") || issue.includes("derma")) {
    return {
      flawStatement: "no skin health benefit architecture in the backend — Rufus cannot route skin-focused buyer queries to this listing because the semantic skin-health intent nodes are completely absent from the product content",
      subjectTag: "content gap",
      financialVerb: "suppressing"
    };
  }

  // Energy / fatigue
  if (issue.includes("energy") || issue.includes("fatigue")) {
    return {
      flawStatement: "missing energy and fatigue-reduction benefit statements — the listing has no indexed nodes answering 'will this help my energy levels?' so Rufus routes energy-intent queries to listings that explicitly answer that question",
      subjectTag: "energy indexing",
      financialVerb: "leaking"
    };
  }

  // Clinical / study evidence
  if (issue.includes("clinical") || issue.includes("study") || issue.includes("evidence")) {
    return {
      flawStatement: "absence of clinical study references and evidence-backed claims — health-supplement buyers using Rufus to compare products get zero clinical proof from this listing while competitor listings that cite studies capture those high-converting clicks",
      subjectTag: "clinical proof gap",
      financialVerb: "costing"
    };
  }

  // Timing / routine / consumption
  if (issue.includes("timing") || issue.includes("routine") || issue.includes("consumption")) {
    return {
      flawStatement: "no consumption timing or usage routine content — Rufus cannot answer 'when should I take this?' which is the single highest-converting buyer question in this category, so it redirects those queries to brands that have structured timing guidance",
      subjectTag: "usage gap",
      financialVerb: "leaking"
    };
  }

  // Brand trust / awareness — these are generic marketing issues, translate to technical ones
  if (issue.includes("brand trust") || issue.includes("awareness") || issue.includes("engagement")) {
    const catFlaw = categoryFallbackFlaw(category, 50, 70);
    return catFlaw;
  }

  // Generic fallback with the raw issue text cleaned up
  const cleaned = issues[0]
    .replace(/^Add /i, "missing ")
    .replace(/^Lacks /i, "no ")
    .replace(/^Fails to /i, "fails to ")
    .replace(/ to improve \w+\.$/, "")
    .toLowerCase()
    .trim();

  return {
    flawStatement: cleaned + " — Rufus cannot retrieve accurate answers from this listing for high-intent buyer queries, defaulting citations to competitor products",
    subjectTag: "listing gap",
    financialVerb: "leaking"
  };
}

function categoryFallbackFlaw(category: string, rufusScore: number, overallScore: number): FlawResult {
  const lc = category.toLowerCase();
  const severity = rufusScore < 30 ? "critical" : rufusScore < 50 ? "significant" : "measurable";

  if (lc.includes("magnesium")) return {
    flawStatement: "backend attribute data flow for magnesium absorption and bioavailability is completely unstructured — Rufus cannot answer 'which magnesium form absorbs best?' and routes those high-intent queries to competitors with proper attribute architecture",
    subjectTag: "absorption gap",
    financialVerb: "leaking"
  };
  if (lc.includes("creatine")) return {
    flawStatement: "no performance comparison nodes indexed — Rufus cannot differentiate this creatine product from generic alternatives when buyers ask 'what's the best creatine for muscle gain?', defaulting citations to brands with structured performance claims",
    subjectTag: "performance indexing",
    financialVerb: "suppressing"
  };
  if (lc.includes("collagen")) return {
    flawStatement: "zero collagen source transparency and bioavailability claims — Rufus routes 'which collagen is best?' queries to competitor listings that explicitly state peptide molecular weight, sourcing, and absorption data",
    subjectTag: "sourcing gap",
    financialVerb: "leaking"
  };
  if (lc.includes("berberine")) return {
    flawStatement: "no clinical dosing protocol indexed — Rufus cannot answer 'what dose of berberine is effective?' from this listing and redirects those high-purchase-intent queries to listings with structured clinical dosing references",
    subjectTag: "dosing gap",
    financialVerb: "leaking"
  };
  if (lc.includes("vitamin c") || lc.includes("serum")) return {
    flawStatement: "no skin outcome nodes — Rufus cannot match this serum to buyer queries like 'does vitamin C reduce dark spots?' because there are zero outcome-mapped content nodes, redirecting those high-converting queries to competitors",
    subjectTag: "outcome indexing",
    financialVerb: "suppressing"
  };
  if (lc.includes("retinol") || lc.includes("cream")) return {
    flawStatement: "missing skin-tolerance and sensitivity disclaimers — Rufus routes 'is this retinol safe for sensitive skin?' queries to competitor listings with structured sensitivity guidance, leaving this listing invisible for that buyer segment",
    subjectTag: "sensitivity gap",
    financialVerb: "leaking"
  };
  if (lc.includes("sea moss") || lc.includes("mushroom") || lc.includes("lions mane")) return {
    flawStatement: "no clinical bioavailability or extraction ratio content — Rufus cannot differentiate this product from cheap alternatives when buyers ask 'what's the most potent sea moss / lion's mane?', defaulting to competitors with lab-verified potency claims",
    subjectTag: "potency indexing",
    financialVerb: "leaking"
  };
  if (lc.includes("protein") || lc.includes("supplement") || lc.includes("greens")) return {
    flawStatement: "backend keyword architecture is operating on primary search terms only — conversational buyer queries on Rufus like 'what's the cleanest protein powder?' are invisible to this listing because secondary intent nodes are completely absent",
    subjectTag: "secondary indexing",
    financialVerb: "leaking"
  };
  if (lc.includes("coffee")) return {
    flawStatement: "zero cold brew methodology and flavor profile indexing — Rufus routes 'what's the smoothest cold brew?' queries to competitors with structured brew ratio, bean origin, and acidity profile content that this listing completely lacks",
    subjectTag: "brew profile gap",
    financialVerb: "leaking"
  };
  if (lc.includes("foam roller") || lc.includes("mat") || lc.includes("desk")) return {
    flawStatement: "no therapeutic use-case indexing — Rufus cannot match this product to buyer queries like 'best foam roller for tight IT bands' because there are zero structured use-case nodes, routing those conversions to competitors with recovery-specific content",
    subjectTag: "use-case gap",
    financialVerb: "suppressing"
  };
  if (lc.includes("dog") || lc.includes("pet") || lc.includes("salmon")) return {
    flawStatement: "missing breed-specific dosing and vet-certification content — Rufus routes 'is this safe for small dogs?' queries to competitor listings with structured weight-based dosing and vet-approval language, making this listing invisible for those queries",
    subjectTag: "dosing architecture",
    financialVerb: "leaking"
  };
  if (lc.includes("skin") || lc.includes("beauty") || lc.includes("niacinamide")) return {
    flawStatement: "no dermatological safety and skin-type compatibility indexing — Rufus routes 'is this safe for sensitive skin?' and 'does this work for oily skin?' queries entirely to competitor listings that have structured skin-type compatibility nodes",
    subjectTag: "skin-type gap",
    financialVerb: "leaking"
  };

  // True generic fallback
  return {
    flawStatement: `backend attribute architecture is running below ${severity} Rufus retrieval thresholds — conversational buyer queries that should be driving revenue to this listing are being intercepted and redirected to competitor products`,
    subjectTag: "indexing gap",
    financialVerb: "leaking"
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCIAL QUANTIFICATION ENGINE
// Produces a concrete, specific daily/monthly dollar estimate for Email 2
// ─────────────────────────────────────────────────────────────────────────────

function quantifyLoss(
  price: number,
  reviewCount: number,
  rufusScore: number,
  overallScore: number,
  category: string
): { dailyLoss: number; monthlyLoss: number; lossStatement: string } {
  // Estimate organic traffic from review count (more reviews = more traffic)
  const baseTraffic = Math.max(500, reviewCount * 18);

  // The efficiency gap is how far below 100% the listing is performing
  const efficiencyGap = Math.max(10, 100 - (rufusScore > 0 ? rufusScore : overallScore));

  // Conservative conversion rate for the category
  const lc = category.toLowerCase();
  const cvr = lc.includes("supplement") || lc.includes("health") ? 0.038
    : lc.includes("beauty") || lc.includes("skin") || lc.includes("serum") ? 0.034
    : lc.includes("coffee") || lc.includes("food") ? 0.041
    : 0.032;

  // Rufus-attributable traffic fraction: high-intent conversational search = ~22% of organic
  const rufusFraction = 0.22;

  // Lost conversions per month from the Rufus gap
  const lostConversions = Math.round(baseTraffic * rufusFraction * (efficiencyGap / 100) * cvr * 30);
  const monthlyLoss = Math.round(lostConversions * price);
  const dailyLoss = Math.max(50, Math.round(monthlyLoss / 30));

  // Format with dollar amounts
  // Force ASCII digit formatting (avoid locale-specific Arabic numerals)
  const fmtMonthly = monthlyLoss >= 10000
    ? `$${Math.round(monthlyLoss / 1000)}k`
    : `$${monthlyLoss.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  const fmtDaily = `$${dailyLoss.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  const lossStatement = `Every 24 hours this stays unpatched, Rufus is redirecting approximately ${fmtDaily} in conversion-ready traffic away from this listing. That's ${fmtMonthly}/month in revenue your competitors are collecting on your behalf.`;

  return { dailyLoss, monthlyLoss, lossStatement };
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL GENERATION ENGINE
// Implements the exact user-defined system prompt framework
// ─────────────────────────────────────────────────────────────────────────────

interface ProspectRecord {
  prospectId: number;
  firstName: string | null;
  company: string | null;
  email: string;
  slug: string;
  brand: string | null;
  title: string | null;
  category: string | null;
  price: number | null;
  reviewCount: number | null;
  analysisId: number;
  rufusScore: number | null;
  overallScore: number | null;
  topIssues: any;
  copySimulatorScenarios: any;
}

function generateEmail1And2(p: ProspectRecord, index: number) {
  // ── Name handling
  const rawFirst = (p.firstName || "").trim();
  const badNames = ["null", "there", "alex seller", "bunker bullies", ""];
  const hasName = rawFirst && !badNames.includes(rawFirst.toLowerCase());
  const nameSalutation = hasName ? `${rawFirst},\n\n` : "";
  const nameDash = hasName ? `${rawFirst} — ` : "";

  // ── Brand / product / category
  const companyName = cleanCompanyName(p.company, p.brand);
  const category = cleanCategory(p.category);
  const shortTitle = cleanProductTitle(p.title, category);
  const auditUrl = `https://optimusrufus.com/audit/${p.slug}`;

  // ── Scores
  const rufusScore = p.rufusScore && p.rufusScore > 0 ? p.rufusScore : 0;
  const overallScore = p.overallScore && p.overallScore > 0 ? p.overallScore : 60;
  const price = p.price && p.price > 0 ? p.price : 29.99;
  const reviewCount = p.reviewCount && p.reviewCount > 0 ? p.reviewCount : 150;

  // ── Competitor
  let competitorRaw = null;
  if (p.copySimulatorScenarios) {
    try {
      const sc = typeof p.copySimulatorScenarios === "string" ? JSON.parse(p.copySimulatorScenarios) : p.copySimulatorScenarios;
      if (Array.isArray(sc) && sc[0]?.competitorName) competitorRaw = sc[0].competitorName;
    } catch (e) {}
  }
  const competitor = cleanCompetitor(competitorRaw, category);
  const competitorPossessive = competitor.endsWith("s") ? `${competitor}'` : `${competitor}'s`;

  // ── Clinical flaw detection
  const flaw = extractFlaw(p.topIssues, category, rufusScore, overallScore);

  // ── Financial quantification
  const { lossStatement } = quantifyLoss(price, reviewCount, rufusScore, overallScore, category);

  // ── Rotate between 3 Angle types for Email 1 variety
  const angleType = index % 3;
  let subject: string;
  let email1: string;

  // Make flaw statement grammatically safe for "There's [X]" construction
  // Clauses (containing " is ", " are ", " cannot ") get reframed; noun phrases get "a/an"
  const flawForTeardown = (() => {
    const f = flaw.flawStatement;
    const isClause = /\b(is |are |cannot |can't |isn't |aren't )/i.test(f);
    if (isClause) return `a structural gap here: ${f}`;
    if (/^(no |zero |missing |absence of)/i.test(f)) return `a critical issue: ${f}`;
    if (/^[aeiou]/i.test(f)) return `an ${f}`;
    return `a ${f}`;
  })();

  if (angleType === 0) {
    // Angle 1: The "Unsolicited Teardown" — engineer flagging a system failure
    subject = flaw.subjectTag;
    email1 = `${nameSalutation}I was auditing ${category} listings last week and pulled up ${companyName}'s backend architecture.

There's ${flawForTeardown}.

I didn't want to send you a generic pitch. So I built an interactive diagnostic model that maps exactly where the indexing is broken and shows what the fixed architecture looks like with revenue recovery projections.

I left it here: ${auditUrl}

Yhia`;

  } else if (angleType === 1) {
    // Angle 2: The "Sherlock" — hyper-specific observation without announcing yourself
    // Build a grammatically correct intro based on flaw statement type
    const flawIsClause = /^(backend|keyword|no |zero |missing |absence |listing |the listing)/i.test(flaw.flawStatement);
    const flawIntro = flawIsClause
      ? `I ran a Rufus crawl simulation and the data surfaced a specific issue: ${flaw.flawStatement}`
      : `The listing has ${flaw.flawStatement}`;
    subject = flaw.subjectTag;
    email1 = `${nameSalutation}Noticed something specific on ${companyName}'s ${shortTitle} listing.

${flawIntro}.

I built a live simulation showing the exact traffic volume ${competitor} is capturing from the queries your listing should be winning — and what the patched architecture looks like.

You can run the diagnostic yourself here: ${auditUrl}

Yhia`;

  } else {
    // Angle 3: The "Brutal Metric" — lead with the raw score, then explain why
    const efficiencyNum = rufusScore > 0 ? rufusScore : Math.max(18, 100 - overallScore);
    subject = `${efficiencyNum}% efficiency`;
    email1 = `${nameDash}${companyName}'s listing is recovering ${efficiencyNum}% of its potential Rufus retrieval capacity.

The gap is caused by ${flaw.flawStatement}.

I built a custom diagnostic environment — not a pitch deck — that shows the exact failure points in red and what the corrected architecture delivers in green, with specific revenue projections.

Interactive model here: ${auditUrl}

Yhia`;
  }

  // ── Email 2: 48-Hour Ruthless Bump — financial consequence + single direct question
  const email2 = `${lossStatement} Did the diagnostic terminal load correctly for you?`;

  return { subject, email1, email2 };
}

// ─────────────────────────────────────────────────────────────────────────────
// TOUCH 3-5: Completing the Full 5-Touch Sequence
// ─────────────────────────────────────────────────────────────────────────────

function generateTouch3(p: ProspectRecord, competitor: string, category: string, auditUrl: string, hasName: boolean, rawFirst: string): string {
  const namePrefix = hasName ? `${rawFirst}, ` : "";
  return `${namePrefix}quick update — ${competitor} just captured another Rufus recommendation node for high-intent ${category} queries.

The live simulation updated with your revised gap metrics: ${auditUrl}`;
}

function generateTouch4(auditUrl: string): string {
  return `Rufus search chat sits directly above PPC ad blocks. Fixing this indexing architecture replaces expensive paid traffic with zero-cost organic Rufus citations.

Diagnostic here: ${auditUrl}`;
}

function generateTouch5(companyName: string, auditUrl: string): string {
  return `Archiving the diagnostic environment for ${companyName} by Friday. If you want to see the architecture before the link expires: ${auditUrl}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN RUNNER
// ─────────────────────────────────────────────────────────────────────────────

async function run() {
  console.log("=================================================================");
  console.log("🎯 ANTI-SALES COLD EMAIL ENGINE v2 — CLINICAL DIAGNOSIS EDITION");
  console.log("=================================================================");

  const records = db.prepare(`
    SELECT 
      p.id as prospectId,
      p.firstName,
      p.company,
      p.email,
      p.slug,
      l.brand,
      l.title,
      l.category,
      l.price,
      l.reviewCount,
      a.id as analysisId,
      a.rufusScore,
      a.overallScore,
      a.topIssues,
      a.copySimulatorScenarios
    FROM prospects p
    JOIN listings l ON l.prospectId = p.id
    JOIN listing_analyses a ON a.listingId = l.id
    ORDER BY p.id ASC
  `).all() as ProspectRecord[];

  console.log(`Found ${records.length} records to process.\n`);

  const updateStmt = db.prepare(`
    UPDATE listing_analyses
    SET copyAutopsyHeadline = ?, copyAutopsyBody = ?,
        copyBleedHeadline   = ?, copyBleedBody   = ?,
        copyRoadmapHeadline = ?, copyRoadmapBody = ?,
        copyPersonalizedHook= ?, copyProblemNarrative = ?,
        copySolutionPitch   = ?, copyUrgencyCTA  = ?
    WHERE id = ?
  `);

  let updated = 0;

  for (let i = 0; i < records.length; i++) {
    const p = records[i];

    // ── Name handling (needed for touch3-5)
    const rawFirst = (p.firstName || "").trim();
    const badNames = ["null", "there", "alex seller", "bunker bullies", ""];
    const hasName = rawFirst && !badNames.includes(rawFirst.toLowerCase());

    const companyName = cleanCompanyName(p.company, p.brand);
    const category = cleanCategory(p.category);
    const auditUrl = `https://optimusrufus.com/audit/${p.slug}`;

    let competitorRaw = null;
    if (p.copySimulatorScenarios) {
      try {
        const sc = typeof p.copySimulatorScenarios === "string" ? JSON.parse(p.copySimulatorScenarios) : p.copySimulatorScenarios;
        if (Array.isArray(sc) && sc[0]?.competitorName) competitorRaw = sc[0].competitorName;
      } catch (e) {}
    }
    const competitor = cleanCompetitor(competitorRaw, category);

    // ── Generate Email 1 + 2 (the core deliverable)
    const { subject, email1, email2 } = generateEmail1And2(p, i);

    // ── Generate Touch 3-5
    const touch3 = generateTouch3(p, competitor, category, auditUrl, !!hasName, rawFirst);
    const touch4 = generateTouch4(auditUrl);
    const touch5 = generateTouch5(companyName, auditUrl);

    updateStmt.run(
      subject,        email1,   // Touch 1: subject + body
      `Re: ${subject}`, email2, // Touch 2: bump (reply thread)
      `Re: ${subject}`, touch3, // Touch 3
      `Re: ${subject}`, touch4, // Touch 4
      `Re: ${subject}`, touch5, // Touch 5
      p.analysisId
    );

    updated++;

    // ── Print first 5 + every 200th for progress monitoring
    if (i < 5 || i % 200 === 0) {
      console.log(`\n──────────────────────────────────────────────────────────`);
      console.log(`[${i + 1}/${records.length}] Prospect: ${p.firstName || "(no name)"} @ ${p.company || p.brand}`);
      console.log(`Category: ${category} | rufusScore: ${p.rufusScore ?? "n/a"} | overallScore: ${p.overallScore ?? "n/a"}`);
      console.log(`\n📧 EMAIL 1`);
      console.log(`Subject: ${subject}`);
      console.log(`Body:\n${email1}`);
      console.log(`\n📧 EMAIL 2 (48hr Bump - Reply thread)`);
      console.log(`Body:\n${email2}`);
    }
  }

  console.log("\n=================================================================");
  console.log(`✅ COMPLETE: Clinical flaw-based Anti-Sales emails generated for ${updated} prospects.`);
  console.log("=================================================================");
}

run().catch(console.error).finally(() => db.close());
