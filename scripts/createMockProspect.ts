import "../api/db/schema.js";
import { db } from "../api/db/client.js";
import { generateAllStageCopy } from "../api/services/copywriter.js";
import type { RawListingData } from "../api/agents/types.js";

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
      currentScore: 0.28,
      targetScore: 0.90,
      gap: 0.62,
      priority: "critical" as const,
      recommendation: "Lacks explicit statements on daily dosage limits and safety warning callouts."
    },
    {
      dimension: "usage_instructions",
      currentScore: 0.35,
      targetScore: 0.90,
      gap: 0.55,
      priority: "high" as const,
      recommendation: "Fails to detail optimal consumption timing and routine integration."
    },
    {
      dimension: "ingredient_purity",
      currentScore: 0.42,
      targetScore: 0.90,
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
      copyFreeQAs, copyReviewSentiment, copyCompetitorAudit, copyPpcKeywords, copyCosmoBundling, copyCosmoGraphData,
      createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
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
    stageCopy.ctaGuarantee,
    // Advanced upgrades
    JSON.stringify([
      {
        question: "Is Acme Supergreens powder safe to take daily?",
        answer: "Yes, it is formulated with organic, clean plants and is entirely safe for daily consumption. Standard dosage is 1 scoop mixed with water or smoothies daily.",
        dimension: "safety_information"
      },
      {
        question: "Does this contain real wheatgrass, and is it gluten-free?",
        answer: "Yes, it contains organic wheatgrass. However, it is harvested before the wheat grain develops, making it completely gluten-free and third-party certified.",
        dimension: "ingredient_purity"
      },
      {
        question: "How do I take this for best results?",
        answer: "For maximum nutrient absorption and natural morning energy, mix 1 scoop into 8-12 oz of cold water on an empty stomach every morning.",
        dimension: "usage_instructions"
      }
    ]),
    JSON.stringify([
      { aspect: "Solubility & Clumping", status: "good", feedback: "88% of customers report it dissolves perfectly in cold water without needing a blender.", percentage: 88 },
      { aspect: "Morning Energy Boost", status: "good", feedback: "92% of reviews state they feel a clean morning energy surge within 30 minutes of drinking.", percentage: 92 },
      { aspect: "Taste Profile", status: "warning", feedback: "16% of users mention a grassy/earthy taste. Rufus flags this warning for buyers searching for sweet options.", percentage: 16 },
      { aspect: "Packaging & Bag Seal", status: "critical", feedback: "8% of buyers mention zip-lock failure causing spilling. Rufus actively warns conversational shoppers about potential packaging issues.", percentage: 8 }
    ]),
    JSON.stringify([
      {
        query: "best organic greens powder for bloating relief",
        competitorName: "Athletic Greens AG1",
        competitorAdvantage: "Explicitly details 7.2 billion CFU lactobacillus and prebiotic inulin in listing bullets and images.",
        yourGap: "Your listing mentions 'gut health' but fails to specify the exact probiotic strains or CFU dosage."
      },
      {
        query: "pure vegan wheatgrass drink without soy",
        competitorName: "Organifi Green Juice",
        competitorAdvantage: "Presents prominent USDA Organic certification badges in all main images and specifies allergen-free credentials.",
        yourGap: "Your organic claims are only in secondary bullet text, which fails to trigger high relevance for Rufus queries."
      }
    ]),
    JSON.stringify([
      { intent: "Bloating Relief", keyword: "organic supergreens powder for bloating", difficulty: "Low", searchVolume: 1850, bidEstimate: 1.15 },
      { intent: "Gluten-Free Purity", keyword: "certified gluten free greens drink powder", difficulty: "Low", searchVolume: 620, bidEstimate: 0.85 },
      { intent: "Daily Vitality", keyword: "daily organic greens powder supplement", difficulty: "Medium", searchVolume: 5100, bidEstimate: 2.30 },
      { intent: "Morning Routine", keyword: "morning energy super greens mix", difficulty: "Medium", searchVolume: 1400, bidEstimate: 1.45 }
    ]),
    JSON.stringify([
      {
        title: "The Morning Gut-Health Stack",
        products: ["Acme Premium Organic Supergreens Powder", "Acme Organic Apple Cider Vinegar Capsules"],
        rationale: "COSMO purchase histories reveal a high correlation for morning digestive health boosters. Bundling these two products establishes a powerful co-purchase association in the COSMO graph."
      },
      {
        title: "Complete Plant-Based Vitality Kit",
        products: ["Acme Premium Organic Supergreens Powder", "Acme Vegan Plant Protein Powder"],
        rationale: "Vegan athletes frequently combine daily micronutrient greens with plant protein post-workout. Captures the active lifestyle co-purchase link."
      }
    ]),
    JSON.stringify({
      nodes: [
        { id: "1", label: "Acme Supergreens", group: "core" },
        { id: "2", label: "USDA Organic", group: "connected" },
        { id: "3", label: "Vegan Diet", group: "connected" },
        { id: "4", label: "Prebiotics", group: "connected" },
        { id: "5", label: "Bloating Relief", group: "gap" },
        { id: "6", label: "Daily Safety Warning", group: "gap" },
        { id: "7", label: "Morning Energy", group: "gap" }
      ],
      edges: [
        { from: "1", to: "2", active: true },
        { from: "1", to: "3", active: true },
        { from: "1", to: "4", active: true },
        { from: "1", to: "5", active: false },
        { from: "1", to: "6", active: false },
        { from: "1", to: "7", active: false }
      ]
    })
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
