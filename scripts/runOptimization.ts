import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Load the .env file BEFORE importing database/services
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = value;
      }
    }
  }
}

// Helper to parse arguments
const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  const prefix = name + "=";
  const match = args.find(a => a.startsWith(prefix));
  if (match) {
    return match.slice(prefix.length);
  }
  return undefined;
};

async function run() {
  const asin = getArg("--asin");
  const packageStr = getArg("--package");
  const brand = getArg("--brand") || "Your Brand";
  const name = getArg("--name") || "Partner";
  const email = getArg("--email") || "partner@brand.com";
  const marketplace = getArg("--marketplace") || "US";
  const priceOverride = getArg("--price") ? parseFloat(getArg("--price")!) : undefined;

  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    console.error("❌ Error: Please provide a valid 10-character Amazon ASIN using --asin");
    process.exit(1);
  }

  const packageNum = parseInt(packageStr || "2", 10);
  if (![1, 2, 3, 4].includes(packageNum)) {
    console.error("❌ Error: Package must be 1, 2, 3, or 4. Received: " + packageStr);
    process.exit(1);
  }

  const packageDefaultPrices: Record<number, number> = {
    1: 1500,
    2: 2000,
    3: 2500,
    4: 1250
  };
  const price = priceOverride ?? packageDefaultPrices[packageNum];

  console.log(`🚀 STARTING TIERED OPTIMIZATION RUN...`);
  console.log(`📦 ASIN: ${asin}`);
  console.log(`💼 Package: ${packageNum} — Price Point: $${price}`);
  console.log(`👤 Client: ${name} (${brand}) — Email: ${email}\n`);

  // Dynamically import modules now that env is bound
  await import("../api/db/schema.js");
  const { db } = await import("../api/db/client.js");
  const { scrapeAmazonListing } = await import("../api/services/scraper.js");
  const { simulateRufusSOV } = await import("../api/services/rufusSimulator.js");
  const { fetchCompetitors } = await import("../api/services/competitor.js");
  const { buildCatalogGraph } = await import("../api/services/catalogGraph.js");
  const { generateEmbedding } = await import("../api/services/embedding.js");
  const { generatePdf } = await import("../api/services/pdf.js");

  // Create slug
  const slug = `${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${asin.toLowerCase()}`;

  // Clean old run data for this slug
  console.log("🧹 Cleaning up old prospect data for slug: " + slug);
  const oldProspect = db.prepare("SELECT id FROM prospects WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (oldProspect) {
    db.prepare("DELETE FROM catalog_links WHERE prospectId = ?").run(oldProspect.id);
    db.prepare("DELETE FROM rufus_query_runs WHERE queryId IN (SELECT id FROM rufus_queries WHERE prospectId = ?)").run(oldProspect.id);
    db.prepare("DELETE FROM rufus_queries WHERE prospectId = ?").run(oldProspect.id);
    db.prepare("DELETE FROM bookings WHERE prospectId = ?").run(oldProspect.id);
    db.prepare("DELETE FROM prospect_activities WHERE prospectId = ?").run(oldProspect.id);
    db.prepare("DELETE FROM listing_analyses WHERE prospectId = ?").run(oldProspect.id);
    db.prepare("DELETE FROM listings WHERE prospectId = ?").run(oldProspect.id);
    db.prepare("DELETE FROM prospects WHERE id = ?").run(oldProspect.id);
  }

  // 1. Create Prospect in DB
  console.log("👤 Creating prospect record...");
  const prospectResult = db.prepare(`
    INSERT INTO prospects (slug, email, firstName, company, status, landingPageViews, packageType, pricePoint, createdAt)
    VALUES (?, ?, ?, ?, 'new', 0, ?, ?, datetime('now'))
  `).run(slug, email, name, brand, `package_${packageNum}`, price);
  const prospectId = prospectResult.lastInsertRowid;

  // 2. Scrape Listing
  console.log("🔍 Scraping Amazon listing data...");
  const scrapedData = await scrapeAmazonListing(asin, marketplace);
  console.log(`✅ Scraped successfully. Title: "${scrapedData.title.slice(0, 60)}..."`);

  // Insert Listing
  const listingResult = db.prepare(`
    INSERT INTO listings (prospectId, asin, marketplace, url, title, bullets, description, brand, category, price, rating, reviewCount, images, aPlusText, rawScrapeData, scrapedAt, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    prospectId,
    scrapedData.asin,
    marketplace,
    `https://www.amazon.com/dp/${scrapedData.asin}`,
    scrapedData.title,
    JSON.stringify(scrapedData.bullets),
    scrapedData.description,
    scrapedData.brand,
    scrapedData.category || "Health & Household",
    scrapedData.price,
    scrapedData.rating,
    scrapedData.reviewCount,
    JSON.stringify(scrapedData.images),
    scrapedData.aPlusText,
    scrapedData.rawScrapeData || "{}"
  );
  const listingId = listingResult.lastInsertRowid;

  // 3. Conditional tool runs based on package type
  let competitors: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any -- competitor array from fetchCompetitors
  let simulation: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any -- raw simulation results
  let catalogLinks: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any -- catalog links array

  if (packageNum === 1 || packageNum === 4) {
    console.log("👥 Fetching category competitors...");
    competitors = await fetchCompetitors(asin, scrapedData.category || "Health & Household");
    console.log(`✅ Found ${competitors.length} competitors.`);
  }

  if (packageNum === 1) {
    console.log("📊 Simulating Rufus Share-of-Voice (SOV)...");
    simulation = await simulateRufusSOV(
      scrapedData.title,
      scrapedData.bullets,
      scrapedData.description,
      scrapedData.aPlusText || "",
      scrapedData.category || "Health & Household",
      competitors
    );
    console.log(`✅ Share-of-Voice Audit complete: ${simulation.sovPercent}% SOV`);
  }

  if (packageNum === 4) {
    console.log("🕸️ Generating COSMO Catalog Links...");
    const textToEmbed = `${scrapedData.title} ${scrapedData.bullets.join(" ")} ${scrapedData.description}`;
    const embedding = await generateEmbedding(textToEmbed.slice(0, 3000));
    
    // Save embedding
    db.prepare("UPDATE listings SET embeddingVector = ? WHERE id = ?").run(
      JSON.stringify(embedding),
      listingId
    );

    const linkInputs = competitors.map((c) => ({
      asin: c.asin,
      title: c.title,
      brand: c.brand,
      bullets: [c.title],
    }));

    catalogLinks = await buildCatalogGraph(asin, embedding, linkInputs);
    console.log(`✅ COSMO Catalog Map built: ${catalogLinks.length} connections.`);
  }

  // 4. Connect to OpenRouter to write customized package copy
  console.log("✍️ Invoking OpenRouter copywriter with package-tailored instructions...");
  const copyOutput = await generatePackageCopy(packageNum, scrapedData, name, brand, price);
  console.log("✅ Custom copywriting copy generated successfully.");

  // Save Rufus queries/runs
  if (simulation && simulation.questions) {
    for (const q of simulation.questions) {
      const queryRes = db.prepare(`
        INSERT INTO rufus_queries (prospectId, queryText, category, createdAt)
        VALUES (?, ?, ?, datetime('now'))
      `).run(prospectId, q.queryText, scrapedData.category || "Health & Household");
      
      const queryId = queryRes.lastInsertRowid;

      db.prepare(`
        INSERT INTO rufus_query_runs (queryId, asinRankings, sovPercent, createdAt)
        VALUES (?, ?, ?, datetime('now'))
      `).run(queryId, JSON.stringify(q.rankings), simulation.sovPercent);
    }
  }

  // Save Catalog Links
  if (catalogLinks.length > 0) {
    for (const link of catalogLinks) {
      db.prepare(`
        INSERT INTO catalog_links (prospectId, sourceAsin, targetAsin, relationshipType, strengthScore, createdAt)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).run(
        prospectId,
        link.sourceAsin,
        link.targetAsin,
        link.relationshipType,
        link.strengthScore
      );
    }
  }

  // 5. Save listing analysis
  console.log("💾 Writing analysis records to SQLite database...");
  db.prepare(`
    INSERT INTO listing_analyses (
      listingId, prospectId, overallScore, rufusScore, cosmoScore, semanticScore, contentScore, visualScore,
      gaps, topIssues, strengths, opportunities, aiAnalysisRaw,
      copyHeroHeadline, copyHeroSubheadline,
      copyAutopsyHeadline, copyAutopsyBody,
      copyBleedHeadline, copyBleedBody,
      copySimulatorIntro, copySimulatorScenarios,
      copyTransformHeadline, copyTransformBefore, copyTransformAfter,
      copyRoadmapHeadline, copyRoadmapBody,
      copySocialProofHeadline,
      copyCtaHeadline, copyCtaGuarantee,
      copyFreeQAs, copyReviewSentiment, copyCompetitorAudit, copyPpcKeywords, copyCosmoBundling, copyCosmoGraphData,
      packageType, pricePoint,
      createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    listingId,
    prospectId,
    copyOutput.overallScore || 78,
    copyOutput.rufusScore || 45,
    copyOutput.cosmoScore || 48,
    copyOutput.semanticScore || 42,
    copyOutput.contentScore || 48,
    copyOutput.visualScore || 35,
    JSON.stringify(copyOutput.semanticGaps || []),
    JSON.stringify(copyOutput.topIssues || []),
    JSON.stringify(copyOutput.strengths || []),
    JSON.stringify(copyOutput.opportunities || []),
    JSON.stringify({ status: "completed", package: packageNum }),
    // Copy
    copyOutput.heroHeadline,
    copyOutput.heroSubheadline,
    copyOutput.autopsyHeadline,
    copyOutput.autopsyBody,
    copyOutput.bleedHeadline,
    copyOutput.bleedBody,
    copyOutput.simulatorIntro,
    JSON.stringify(copyOutput.simulatorScenarios || []),
    copyOutput.transformHeadline,
    JSON.stringify(copyOutput.transformBefore || []),
    JSON.stringify(copyOutput.transformAfter || []),
    copyOutput.roadmapHeadline,
    copyOutput.roadmapBody,
    copyOutput.socialProofHeadline,
    copyOutput.ctaHeadline,
    copyOutput.ctaGuarantee,
    // Advanced Upgrades
    JSON.stringify(copyOutput.freeQAs || []),
    JSON.stringify(copyOutput.reviewSentiment || []),
    JSON.stringify(copyOutput.competitorAudit || []),
    JSON.stringify(copyOutput.ppcKeywords || []),
    JSON.stringify(copyOutput.cosmoBundling || []),
    JSON.stringify(copyOutput.cosmoGraphData || null),
    `package_${packageNum}`,
    price
  );

  db.prepare("UPDATE prospects SET status = 'analyzed' WHERE id = ?").run(prospectId);
  console.log("✅ Prospect analysis updated to 'analyzed'.");

  // 6. Generate white-label PDF audit
  try {
    console.log("\n🖨️ Generating White-Labeled PDF Audit...");
    const pdfBuffer = await generatePdf(slug);
    const outputPath = path.resolve(__dirname, `../scratch/${slug}-audit.pdf`);
    fs.writeFileSync(outputPath, pdfBuffer);
    console.log(`✅ PDF written: ${outputPath}`);
  } catch (pdfErr) {
    const error = pdfErr as any; // eslint-disable-line @typescript-eslint/no-explicit-any -- fallback error formatting
    console.warn(`\n⚠️ [PDF Error] Failed to generate PDF: ${error.message}`);
    console.warn(`👉 To generate the PDF, please run "npm run dev" to launch the client on port 5173 first.`);
  }

  console.log(`\n🎉 TIERED OPTIMIZATION COMPLETED SUCCESSFULLY!`);
  console.log(`👉 Preview URL: http://localhost:5173/p/${slug}`);
  console.log(`👉 PDF Report: scratch/${slug}-audit.pdf\n`);
}

async function generatePackageCopy(
  packageNum: number,
  listing: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- listing is a dynamic scrape object
  name: string,
  brand: string,
  price: number
): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any -- return shape is package-dependent copy structure
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  if (!apiKey) {
    console.warn("⚠️ API keys missing. Serving local fallback content.");
    return getFallbackCopy(packageNum, listing, name, brand);
  }

  const prompt = `You are a world-class conversion copywriter specializing in direct response copy. 
Generate a JSON object containing landing page copywriting elements tailored to **Package ${packageNum}** for:
- Brand Name: ${brand}
- Product Title: ${listing.title}
- Price: $${listing.price || 0}
- Rating: ${listing.rating || 0}/5
- Prospect First Name: ${name}
- Package Pricing: $${price}

The landing page copy must follow an Alex Hormozi value equation layout (patterns, pain pointAutopsies, bleeding financial value, and custom guarantees).

Return a single JSON object containing:
1. "heroHeadline": 패턴을 깨는 헤드라인 using first name and brand. Max 15 words.
2. "heroSubheadline": 2-sentence explanation of Rufus compatibility check.
3. "autopsyHeadline": "Untreated wounds" style score reveal headline.
4. "autopsyBody": Explanation of Rufus compatibility score.
5. "bleedHeadline": Loss of traffic/sales headline.
6. "bleedBody": Financial bleed value details.
7. "simulatorIntro": Rufus simulation setup explanation.
8. "simulatorScenarios": Array of 3 objects: { buyerQuestion, rufusAnswer, competitorName, failReason }
9. "transformHeadline": "The fix is ready" transform section headline.
10. "transformBefore": Array of 3 objects: { section, content } representing current copy elements.
11. "transformAfter": Array of 3 objects: { section, content } showing optimized elements.
12. "roadmapHeadline": Title of implementation roadmap.
13. "roadmapBody": Roadmap process text.
14. "socialProofHeadline": Trust indicator text.
15. "ctaHeadline": Headline for booking CTA.
16. "ctaGuarantee": Dynamic package guarantee.
17. "overallScore": integer 0-100
18. "rufusScore": integer 0-100
19. "cosmoScore": integer 0-100
20. "semanticScore": integer 0-100
21. "contentScore": integer 0-100
22. "visualScore": integer 0-100
23. "semanticGaps": Array of { dimension, currentScore, targetScore, gap, priority, recommendation }
24. "topIssues": Array of top critical gaps.
25. "strengths": Array of strings.
26. "opportunities": Array of strings.

${getPackageInstructions(packageNum)}

Ensure every copy segment sounds like a direct pitch targeting that package. Avoid markdown formatting inside JSON.`;

  try {
    const url = process.env.OPENROUTER_API_KEY
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    if (process.env.OPENROUTER_API_KEY) {
      headers["HTTP-Referer"] = "https://github.com/ymehmetdemiroglu-crypto/optius-rufus";
      headers["X-Title"] = "Optimus Rufus";
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a conversion copywriting assistant. Respond ONLY with raw JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM call failed: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error("⚠️ LLM copy generation failed, using fallback copy.", err);
    return getFallbackCopy(packageNum, listing, name, brand);
  }
}

function getPackageInstructions(packageNum: number): string {
  switch (packageNum) {
    case 1:
      return `For **Package 1 (SOV & Conquesting)**, please also include these keys:
- "freeQAs": Array of 3 objects { question, answer, dimension } providing strategic customer questions to ask.
- "reviewSentiment": Array of 4 objects { aspect, status: "good"|"warning"|"critical", feedback, percentage } analyzing specific review vectors.
- "competitorAudit": Array of 2 objects { query, competitorName, competitorAdvantage, yourGap }.
- "cosmoGraphData": Node data object { nodes: [{id, label, group}], edges: [{from, to, active}] } representing COSMO gaps.`;
    case 2:
      return `For **Package 2 (Full-Funnel)**, focus "transformBefore" and "transformAfter" on these elements:
- Object 1: Core Listing Rewrite (Title & Bullets).
- Object 2: A+ Content Copywriting & Alt-Text Optimization (show alt tags explicitly).
- Object 3: Storefront SEO structure (organized by search intent occasions like "For Sleep").`;
    case 3:
      return `For **Package 3 (AEO & PPC)**, also generate:
- "ppcKeywords": Array of 4 objects { intent, keyword, difficulty: "Low"|"Medium"|"High", searchVolume, bidEstimate }.
- Customize "roadmapHeadline": "Your 30-Day AEO & PPC Alignment Plan".
- Customize "roadmapBody": 1-Month Ad Setup Guide copy explaining Auto/Exact match campaigns to feed Amazon's AI.`;
    case 4:
      return `For **Package 4 (COSMO Bundling)**, also generate:
- "cosmoBundling": Array of 2 objects { title, products, rationale }.
- Customize "roadmapHeadline": "Your Catalog Architecture Roadmap".
- Customize "roadmapBody": process detail for Virtual Bundles and cross-selling comparison grids.`;
    default:
      return "";
  }
}

function getFallbackCopy(
  packageNum: number,
  listing: any, // eslint-disable-line @typescript-eslint/no-explicit-any -- fallback copy requires listing
  name: string,
  brand: string
): any { // eslint-disable-line @typescript-eslint/no-explicit-any -- fallback copy return matches main response
  const category = listing.category || "Health & Household";
  const bullets = listing.bullets || ["Premium Quality formulation"];

  const baseCopy = {
    heroHeadline: `${name}, Your ${brand} Listing is Invisible to 73% of Buyers`,
    heroSubheadline: `We analyzed ${listing.asin} against Rufus, COSMO, and semantic search signals. What we found should concern you.`,
    autopsyHeadline: `${name}, Your Listing Has 3 Untreated Wounds`,
    autopsyBody: `Your Rufus compatibility score is 45/100 — that means Amazon's AI can only answer 45% of buyer questions using your listing.`,
    bleedHeadline: `Every Day You Wait, You're Writing a Check to Your Competitors`,
    bleedBody: `An unoptimized listing in ${category} loses $2,000–$8,000/month. That's money going directly to competitors.`,
    simulatorIntro: `Watch Amazon's AI send your buyers to competitors. This is happening right now:`,
    simulatorScenarios: [
      {
        buyerQuestion: `Is this product safe to use daily?`,
        rufusAnswer: `Based on available information, I cannot determine daily usage safety. Here are products with detailed safety info:`,
        competitorName: 'Category Leader',
        failReason: 'No daily usage or safety information in your listing.'
      },
      {
        buyerQuestion: `When is the best time to use this?`,
        rufusAnswer: `This listing doesn't specify optimal timing. However, other products recommend specific timing:`,
        competitorName: 'Category Leader',
        failReason: 'Missing usage timing and routine integration details.'
      }
    ],
    transformHeadline: `Here's What a Rufus-Optimized Listing Looks Like`,
    transformBefore: [
      { section: 'Title', content: listing.title || 'Current title' },
      { section: 'Bullet 1', content: bullets[0] || 'Current bullet point' }
    ],
    transformAfter: [
      { section: 'Title', content: 'Optimized title with semantic coverage' },
      { section: 'Bullet 1', content: 'Optimized bullet addressing top buyer questions' }
    ],
    roadmapHeadline: `3 Steps. 48 Hours. Fully Optimized Listing.`,
    roadmapBody: `No software to learn. No APIs to connect. We do the work — you get the results.`,
    socialProofHeadline: `Sellers Who Fixed This in the Last 30 Days`,
    ctaHeadline: `Book Your Demonstration, ${name}`,
    ctaGuarantee: `If we can't find at least $5,000/year in hidden revenue, we'll send you $100 for wasting your time.`,
    overallScore: 68,
    rufusScore: 45,
    cosmoScore: 48,
    semanticScore: 42,
    contentScore: 48,
    visualScore: 35,
    semanticGaps: [
      { dimension: "daily_usage_safety", currentScore: 0.3, targetScore: 0.9, gap: 0.6, priority: "critical", recommendation: "Add daily dosage guidelines." },
      { dimension: "ingredient_purity", currentScore: 0.4, targetScore: 0.9, gap: 0.5, priority: "high", recommendation: "List third-party lab testing details." }
    ],
    topIssues: [
      { dimension: "daily_usage_safety", priority: "critical", recommendation: "Add daily dosage guidelines.", gap: 0.6 }
    ],
    strengths: ["Brand Recognition"],
    opportunities: ["daily_usage_safety", "ingredient_purity"],
    freeQAs: [
      { question: `Is this ${category} safe for daily use?`, answer: `Yes! Formulated for daily cellular nutrient support.`, dimension: 'daily_usage_safety' }
    ],
    reviewSentiment: [
      { aspect: 'Solubility', status: 'good', feedback: 'Dissolves easily without clumping.', percentage: 82 }
    ],
    competitorAudit: [
      { query: `Best organic ${category}`, competitorName: 'Greens Champion Plus', competitorAdvantage: 'Detailed bullets.', yourGap: 'Missing prebiotic details.' }
    ],
    ppcKeywords: [
      { intent: 'Digestive Health', keyword: `organic ${category} powder`, difficulty: 'Low', searchVolume: 1200, bidEstimate: 1.2 }
    ],
    cosmoBundling: [
      { title: 'The Morning Synergy Bundle', products: [`${brand} Product A`, `${brand} Product B`], rationale: 'gut-health co-purchase correlation.' }
    ],
    cosmoGraphData: {
      nodes: [
        { id: '1', label: brand, group: 'core' },
        { id: '2', label: 'Daily Vitality', group: 'connected' }
      ],
      edges: [
        { from: '1', to: '2', active: true }
      ]
    }
  };

  // Override specific elements for the fallback to fit the package
  if (packageNum === 1) {
    baseCopy.ctaHeadline = `Book Your Rufus Conquest & SOV Consultation, ${name}`;
    baseCopy.ctaGuarantee = `If we can't find at least 3 high-intent search queries where your competitors are stealing your sales, the consultation call is 100% free.`;
  } else if (packageNum === 2) {
    baseCopy.ctaHeadline = `Secure Your Full-Funnel Listing & A+ Overhaul, ${name}`;
    baseCopy.ctaGuarantee = `We will rewrite your Core Listing, A+ modules, and Storefront SEO. If this doesn't pass our 7-agent AI audit with a score above 85, we'll rewrite it until it does.`;
    baseCopy.transformBefore = [
      { section: 'Listing Title', content: listing.title || 'Current title' },
      { section: 'A+ Content Module', content: 'Unstructured generic paragraph description.' },
      { section: 'Storefront Structure', content: 'Alphabetical list of products.' }
    ];
    baseCopy.transformAfter = [
      { section: 'Listing Title', content: `Optimized title & bullets incorporating top search queries.` },
      { section: 'A+ Content Module', content: `Targeted copywriting sections with optimized alt-text tags for crawler indexing.` },
      { section: 'Storefront Structure', content: `Organized storefront pages grouped by intent occasion categories (e.g. 'For Sleep', 'For Recovery') to match COSMO.` }
    ];
  } else if (packageNum === 3) {
    baseCopy.ctaHeadline = `Secure Your PPC & AEO Intent Alignment Setup, ${name}`;
    baseCopy.ctaGuarantee = `Get your COSMO-optimized listing and semantic PPC keyword map. If we don't lower your ACOS by at least 15% in the first 30 days, we'll work with you for free until we do.`;
    baseCopy.roadmapHeadline = "Your 30-Day AEO & PPC Alignment Plan";
    baseCopy.roadmapBody = "Week 1: Deploy COSMO-rich bullets. Week 2: Build exact campaign groups using intent-rich search keywords. Week 3: Set up automatic campaign rules. Week 4: Monitor search term report to feed Amazon's AI.";
  } else if (packageNum === 4) {
    baseCopy.ctaHeadline = `Claim Your COSMO Catalog & Bundling Blueprint, ${name}`;
    baseCopy.ctaGuarantee = `We'll build your catalog relationship map and virtual bundles. If we don't find at least 2 highly profitable product bundles to link, you pay nothing.`;
    baseCopy.roadmapHeadline = "Your Catalog Architecture Roadmap";
    baseCopy.roadmapBody = "We map your catalog connections, build optimized virtual bundles to link products, and write conversion-focused frequently bought together prompts.";
  }

  return baseCopy;
}

run().catch((err) => {
  console.error("💥 Execution failed:", err);
  process.exit(1);
});
