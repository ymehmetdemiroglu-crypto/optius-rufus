import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Manually parse and load the .env file BEFORE importing any internal services
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

console.log("🔑 OpenRouter API Key Loaded:", process.env.OPENROUTER_API_KEY ? "YES (starts with " + process.env.OPENROUTER_API_KEY.substring(0, 10) + "...)" : "NO");

function safeJsonParse<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

async function run() {
  console.log("🔥 STARTING END-TO-END PIPELINE RUN...");
  const asin = "B07T7H5C5R"; // Magnesium Glycinate Supplement ASIN
  const company = "NutraWell Nutrition";
  const clientEmail = "client-nutrawell@nutrawell.com";
  const slug = "nutrawell-magnesium";
  
  // Make sure we point APP_URL to local server
  process.env.APP_URL = "http://127.0.0.1:5173";

  // 2. Dynamically import modules now that environment variables are fully bound
  await import("../api/db/schema.js");
  const { db } = await import("../api/db/client.js");
  const { scrapeAmazonListing } = await import("../api/services/scraper.js");
  const { OptimizationOrchestrator } = await import("../api/agents/orchestrator.js");
  const { generateAllStageCopy } = await import("../api/services/copywriter.js");
  const { simulateRufusSOV } = await import("../api/services/rufusSimulator.js");
  const { fetchCompetitors } = await import("../api/services/competitor.js");
  const { buildCatalogGraph } = await import("../api/services/catalogGraph.js");
  const { generateEmbedding } = await import("../api/services/embedding.js");
  const { generatePdf } = await import("../api/services/pdf.js");

  // Clean old run data
  console.log("\n🧹 1. Cleaning up previous NutraWell run data...");
  const oldProspect = db.prepare("SELECT id FROM prospects WHERE slug = ?").get(slug) as { id: number } | undefined;
  if (oldProspect) {
    db.prepare("DELETE FROM catalog_links WHERE prospectId = ?").run(oldProspect.id);
    db.prepare("DELETE FROM rufus_query_runs WHERE queryId IN (SELECT id FROM rufus_queries WHERE prospectId = ?)").run(oldProspect.id);
    db.prepare("DELETE FROM rufus_queries WHERE prospectId = ?").run(oldProspect.id);
    db.prepare("DELETE FROM listing_analyses WHERE prospectId = ?").run(oldProspect.id);
    db.prepare("DELETE FROM listings WHERE prospectId = ?").run(oldProspect.id);
    db.prepare("DELETE FROM prospects WHERE id = ?").run(oldProspect.id);
    console.log("✅ Cleaned up old client records.");
  }

  // 1. Create Prospect
  console.log("\n👤 2. Creating brand prospect record...");
  const prospectResult = db.prepare(`
    INSERT INTO prospects (slug, email, firstName, company, status, landingPageViews, createdAt)
    VALUES (?, ?, 'Alex', ?, 'new', 0, datetime('now'))
  `).run(slug, clientEmail, company);
  const prospectId = prospectResult.lastInsertRowid;
  console.log(`✅ Prospect created with ID: ${prospectId}`);

  // 2. Scrape Listing
  console.log("\n🔍 3. Scraping Amazon listing data...");
  const scrapedData = await scrapeAmazonListing(asin, "US");
  console.log(`✅ Scraped successfully. Title: "${scrapedData.title.slice(0, 50)}..."`);
  
  // Save listing
  const listingResult = db.prepare(`
    INSERT INTO listings (prospectId, asin, marketplace, url, title, bullets, description, brand, category, price, rating, reviewCount, images, aPlusText, rawScrapeData, scrapedAt, createdAt)
    VALUES (?, ?, 'US', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    prospectId,
    scrapedData.asin,
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
  console.log(`✅ Listing record saved with ID: ${listingId}`);

  // 3. Run Multi-Agent Optimization Pipeline
  console.log("\n🤖 4. Running Multi-Agent Orchestrator Pipeline...");
  const orchestrator = new OptimizationOrchestrator();
  const rawListing = {
    asin: scrapedData.asin,
    title: scrapedData.title,
    bullets: scrapedData.bullets,
    description: scrapedData.description,
    brand: scrapedData.brand,
    category: scrapedData.category || "Health & Household",
    subcategory: scrapedData.category || "Health & Household",
    images: scrapedData.images,
    price: scrapedData.price,
    rating: scrapedData.rating,
    reviewCount: scrapedData.reviewCount,
    attributes: safeJsonParse(scrapedData.rawScrapeData, {}),
  };

  const state = await orchestrator.runPipeline(scrapedData.asin, "US", {
    listingData: rawListing,
  });

  if (state.error) {
    throw new Error(`Pipeline failed: ${state.error}`);
  }
  console.log("✅ Pipeline run completed.");

  const analysisTask = state.tasks.find((t) => t.role === "semantic_analyzer");
  const analysisResult = analysisTask?.output as { semanticGaps: Array<{ priority: string; gap: number; dimension: string }>; rufusScore: number; cosmoScore: number } | undefined;
  const report = state.finalReport;
  const gaps = analysisResult?.semanticGaps || [];
  const topIssues = gaps.filter((g: { priority: string }) => g.priority === "critical" || g.priority === "high").slice(0, 5);
  const strengths = gaps.filter((g: { gap: number; dimension: string }) => g.gap < 0.3).map((g) => g.dimension);
  const opportunities = gaps.filter((g: { gap: number; dimension: string }) => g.gap >= 0.3).map((g) => g.dimension);

  // 4. Generate LLM Stage copy
  console.log("\n✍️ 5. Generating copywriting copy using OpenRouter LLM...");
  const stageCopy = await generateAllStageCopy(
    {
      rufusScore: analysisResult?.rufusScore ?? 0,
      cosmoScore: analysisResult?.cosmoScore ?? 0,
      semanticGaps: gaps as any,
    },
    rawListing,
    "Alex"
  );
  console.log(`✅ Stage Copy generated. Hero Headline: "${stageCopy.heroHeadline}"`);

  // Save analysis
  db.prepare(`
    INSERT INTO listing_analyses (
      listingId, prospectId, overallScore, rufusScore, cosmoScore, semanticScore, contentScore, visualScore,
      gaps, topIssues, strengths, opportunities, aiAnalysisRaw,
      copyPersonalizedHook, copyProblemNarrative, copySolutionPitch, copyUrgencyCTA,
      copyHeroHeadline, copyHeroSubheadline,
      copyAutopsyHeadline, copyAutopsyBody,
      copyBleedHeadline, copyBleedBody,
      copySimulatorIntro, copySimulatorScenarios,
      copyTransformHeadline, copyTransformBefore, copyTransformAfter,
      copyRoadmapHeadline, copyRoadmapBody,
      copySocialProofHeadline,
      copyCtaHeadline, copyCtaGuarantee,
      createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    listingId,
    prospectId,
    report?.optimizedRufusScore || analysisResult?.rufusScore || 0,
    analysisResult?.rufusScore || 0,
    analysisResult?.cosmoScore || 0,
    Math.round((analysisResult?.rufusScore || 0) * 0.9),
    Math.round((report?.optimizedRufusScore || analysisResult?.rufusScore || 0) * 0.95),
    Math.round((analysisResult?.cosmoScore || 0) * 0.85),
    JSON.stringify(gaps),
    JSON.stringify(topIssues),
    JSON.stringify(strengths),
    JSON.stringify(opportunities),
    JSON.stringify({ state, report }),
    // Legacy copy fields
    stageCopy.heroHeadline,
    stageCopy.autopsyBody,
    stageCopy.roadmapBody,
    stageCopy.urgencyCTA,
    // Stage 1: Hero
    stageCopy.heroHeadline,
    stageCopy.heroSubheadline,
    // Stage 2: Autopsy
    stageCopy.autopsyHeadline,
    stageCopy.autopsyBody,
    // Stage 3: Bleed
    stageCopy.bleedHeadline,
    stageCopy.bleedBody,
    // Stage 4: Rufus Simulator
    stageCopy.simulatorIntro,
    JSON.stringify(stageCopy.simulatorScenarios),
    // Stage 5: Transform
    stageCopy.transformHeadline,
    JSON.stringify(stageCopy.transformBefore),
    JSON.stringify(stageCopy.transformAfter),
    // Stage 6: Roadmap
    stageCopy.roadmapHeadline,
    stageCopy.roadmapBody,
    // Stage 7: Social Proof
    stageCopy.socialProofHeadline,
    // Stage 8: CTA
    stageCopy.ctaHeadline,
    stageCopy.ctaGuarantee
  );

  db.prepare("UPDATE prospects SET status = 'analyzed' WHERE id = ?").run(prospectId);
  console.log("✅ Analysis and Copywriting copy saved to database.");

  // 5. Run Rufus SOV query simulation
  console.log("\n📊 6. Running Rufus Share-of-Voice (SOV) Category Simulation...");
  const category = rawListing.category || "Health & Household";
  const competitors = await fetchCompetitors(asin, category);
  const simulation = await simulateRufusSOV(
    rawListing.title,
    rawListing.bullets,
    rawListing.description,
    scrapedData.aPlusText || "",
    category,
    competitors
  );

  // Save simulations
  for (const q of simulation.questions) {
    const queryRes = db.prepare(`
      INSERT INTO rufus_queries (prospectId, queryText, category, createdAt)
      VALUES (?, ?, ?, datetime('now'))
    `).run(prospectId, q.queryText, category);
    
    const queryId = queryRes.lastInsertRowid;

    db.prepare(`
      INSERT INTO rufus_query_runs (queryId, asinRankings, sovPercent, createdAt)
      VALUES (?, ?, ?, datetime('now'))
    `).run(queryId, JSON.stringify(q.rankings), simulation.sovPercent);
  }
  console.log(`✅ Rufus SOV Simulation complete. SOV Percent: ${simulation.sovPercent}%`);

  // 6. Compute COSMO Similarity Graph
  console.log("\n🕸️ 7. Generating COSMO Catalog Similarity Connections...");
  const textToEmbed = `${rawListing.title} ${rawListing.bullets.join(" ")} ${rawListing.description} ${scrapedData.aPlusText}`;
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

  const generatedLinks = await buildCatalogGraph(asin, embedding, linkInputs);
  for (const link of generatedLinks) {
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
  console.log(`✅ COSMO Catalog links generated: ${generatedLinks.length} connections.`);

  // 7. Generate Puppeteer PDF White-Labeled Audit
  console.log("\n🖨️ 8. Generating Premium White-Labeled PDF Audit...");
  const pdfBuffer = await generatePdf(slug);
  const outputPath = path.resolve(__dirname, "../scratch/nutrawell-audit.pdf");
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`✅ PDF successfully written to disk: ${outputPath}`);
  console.log(`📄 PDF Document Size: ${pdfBuffer.length} bytes`);

  console.log("\n🚀 END-TO-END PIPELINE COMPLETED SUCCESSFULLY!");
}

run().catch((err) => {
  console.error("💥 End-to-end pipeline run failed:", err);
  process.exit(1);
});
