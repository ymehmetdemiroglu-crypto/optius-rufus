import "../api/db/schema.ts";
import { db } from "../api/db/client.ts";
import { generateAllStageCopy } from "../api/services/copywriter.ts";
import type { RawListingData } from "../api/agents/types.ts";

async function run() {
  console.log("🧹 Cleaning up old mock-prospect data if it exists...");
  
  // Find old prospect ID to clean up associated listings and analyses
  const oldProspect = db.prepare("SELECT id FROM prospects WHERE slug = ?").get("mock-prospect") as { id: number } | undefined;
  if (oldProspect) {
    db.prepare("DELETE FROM listing_analyses WHERE prospectId = ?").run(oldProspect.id);
    db.prepare("DELETE FROM listings WHERE prospectId = ?").run(oldProspect.id);
    db.prepare("DELETE FROM prospects WHERE id = ?").run(oldProspect.id);
    console.log("✨ Cleaned up old mock-prospect records.");
  }

  console.log("🌱 Inserting fresh mock prospect...");
  const prospectResult = db.prepare(`
    INSERT INTO prospects (slug, email, firstName, lastName, company, status, landingPageViews, createdAt)
    VALUES (?, ?, ?, ?, ?, 'analyzed', 0, datetime('now'))
  `).run(
    "mock-prospect",
    "founder@acmegreens.com",
    "Alex",
    "Hormozi",
    "Acme Greens"
  );

  const prospectId = prospectResult.lastInsertRowid;
  console.log(`✅ Inserted prospect with ID: ${prospectId}`);

  console.log("📦 Inserting mock listing...");
  const bullets = [
    "DAILY NUTRIENT BOOST: Contains organic spirulina, chlorella, wheatgrass, and barley grass for all-day cellular vitality.",
    "DIGESTION & GUT HEALTH: Enhanced with natural prebiotics and digestive enzymes for optimal nutrient absorption without bloating.",
    "100% USDA ORGANIC & VEGAN: Pure, clean, plant-based greens with zero artificial sweeteners, soy, dairy, or gluten."
  ];
  
  const images = ["https://images.unsplash.com/photo-1540420773420-3366772f4999"];

  const listingResult = db.prepare(`
    INSERT INTO listings (prospectId, asin, marketplace, url, title, bullets, description, brand, category, price, rating, reviewCount, images, rawScrapeData, scrapedAt, createdAt)
    VALUES (?, ?, 'US', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).run(
    prospectId,
    "B08GREEN88",
    "https://www.amazon.com/dp/B08GREEN88",
    "Acme Premium Organic Supergreens Powder — 30 Servings | Gut Health & Natural Energy",
    JSON.stringify(bullets),
    "Get your daily greens in one delicious scoop. Powered by clean, organic greens.",
    "Acme Greens",
    "Supergreens Powder",
    34.95,
    4.1,
    245,
    JSON.stringify(images),
    "{}"
  );

  const listingId = listingResult.lastInsertRowid;
  console.log(`✅ Inserted listing with ID: ${listingId}`);

  console.log("✍️ Generating personalized conversion copy using direct-response templates...");
  
  const rawListing: RawListingData = {
    asin: "B08GREEN88",
    title: "Acme Premium Organic Supergreens Powder — 30 Servings | Gut Health & Natural Energy",
    bullets: bullets,
    description: "Get your daily greens in one delicious scoop. Powered by clean, organic greens.",
    brand: "Acme Greens",
    category: "Supergreens Powder",
    subcategory: "Supergreens Powder",
    images: images,
    price: 34.95,
    rating: 4.1,
    reviewCount: 245,
    attributes: {}
  };

  const semanticGaps = [
    {
      dimension: "safety_information",
      gap: 0.62,
      priority: "critical" as const,
      recommendation: "Lacks explicit statements on daily dosage limits and safety warning callouts."
    },
    {
      dimension: "usage_instructions",
      gap: 0.55,
      priority: "high" as const,
      recommendation: "Fails to detail optimal consumption timing and routine integration."
    },
    {
      dimension: "ingredient_purity",
      gap: 0.48,
      priority: "high" as const,
      recommendation: "Sourcing details and organic certifications are buried and hard for Rufus to parse."
    }
  ];

  const analysisInput = {
    rufusScore: 48,
    cosmoScore: 42,
    semanticGaps
  };

  const stageCopy = await generateAllStageCopy(analysisInput, rawListing, "Alex");

  console.log("📊 Inserting listing analysis and copywriting copy into DB...");
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
    68, // Optimized overall score
    48, // Original Rufus score
    42, // COSMO score
    43, // Semantic score
    46, // Content score
    36, // Visual score
    JSON.stringify(semanticGaps),
    JSON.stringify(semanticGaps.slice(0, 2)), // Top issues
    JSON.stringify(["USDA Organic", "Gluten-Free"]), // Strengths
    JSON.stringify(["safety_information", "usage_instructions"]), // Opportunities
    JSON.stringify({ status: "mocked" }),
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

  console.log("\n🚀 Success! Mock prospect is completely configured and saved in SQLite database.");
  console.log("\n👉 Your custom invitation link is:");
  console.log("------------------------------------------------------------------");
  console.log("https://optimus-prime-agency.vercel.app/p/mock-prospect");
  console.log("------------------------------------------------------------------");
  console.log("Enjoy exploring the Listing Autopsy! ⚡\n");
}

run().catch((err) => {
  console.error("💥 Error creating mock prospect:", err);
  process.exit(1);
});
