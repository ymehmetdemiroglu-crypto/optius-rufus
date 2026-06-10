import type { ProspectData } from '../dtos/prospect.dto';

export const MOCK_PROSPECT_DATA: ProspectData = {
  id: 5,
  slug: "mock-prospect",
  name: "Alex Hormozi",
  company: "Acme Greens",
  email: "founder@acmegreens.com",
  listing: {
    asin: "B08GREEN88",
    title: "Acme Premium Organic Supergreens Powder — 30 Servings | Gut Health & Natural Energy",
    brand: "Acme Greens",
    category: "Supergreens Powder",
    price: 34.95,
    rating: 4.1,
    reviewCount: 245,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999",
    bullets: [
      "DAILY NUTRIENT BOOST: Contains organic spirulina, chlorella, wheatgrass, and barley grass for all-day cellular vitality.",
      "DIGESTION & GUT HEALTH: Enhanced with natural prebiotics and digestive enzymes for optimal nutrient absorption without bloating.",
      "100% USDA ORGANIC & VEGAN: Pure, clean, plant-based greens with zero artificial sweeteners, soy, dairy, or gluten."
    ],
    description: "Get your daily greens in one delicious scoop. Powered by clean, organic greens."
  },
  scores: {
    overallScore: 45,
    rufusScore: 48,
    cosmoScore: 42,
    semanticScore: 43,
    contentScore: 46,
    categoryAverage: 54
  },
  topIssues: [
    {
      title: "Daily Safety Warning",
      severity: "critical",
      description: "Lacks explicit statements on daily dosage limits and safety warning callouts.",
      impact: "Gap: 62%"
    },
    {
      title: "Usage Instructions",
      severity: "warning",
      description: "Fails to detail optimal consumption timing and routine integration.",
      impact: "Gap: 55%"
    }
  ],
  narrative: "Your listing scores 48/100 for Rufus compatibility. That means Amazon's AI can only answer 48% of buyer questions using your listing.",
  opportunities: [
    {
      title: "Safety Information",
      description: "Your listing is missing semantic coverage for safety_information.",
      before: "Current content lacks safety_information signals.",
      after: "Optimized content with targeted safety_information messaging."
    },
    {
      title: "Usage Instructions",
      description: "Your listing is missing semantic coverage for usage_instructions.",
      before: "Current content lacks usage_instructions signals.",
      after: "Optimized content with targeted usage_instructions messaging."
    }
  ],
  stageCopy: {
    heroHeadline: "Alex, Your Acme Greens Listing is Invisible to 73% of Buyers",
    heroSubheadline: "We ran B08GREEN88 through our 7-agent AI engine — scanning Rufus compatibility, COSMO intent mapping, and semantic coverage. What we found should concern you.",
    autopsyHeadline: "Alex, Your Listing Has 3 Untreated Wounds",
    autopsyBody: "Your Rufus compatibility score is 48/100 — that means Amazon's AI can only answer 48% of buyer questions using your listing. The category leader in Supergreens Powder scores 87. Your biggest gaps: safety information, usage instructions, ingredient purity.",
    bleedHeadline: "Every Day You Wait, You're Writing a Check to Your Competitors",
    bleedBody: "Based on your category's average conversion gap, an unoptimized listing in Supergreens Powder loses between $2,000 and $8,000 per month in missed sales.",
    simulatorIntro: "This is happening right now. Every time a buyer asks Amazon's AI a question your listing can't answer, Rufus recommends your competitor instead. Watch it happen:",
    simulatorScenarios: [
      {
        buyerQuestion: "Is this supergreens powder safe to take daily?",
        rufusAnswer: "Based on available product information, I cannot determine daily usage safety for this product. Here are products with detailed safety information:",
        competitorName: "Athletic Greens AG1",
        failReason: "Your listing has no specific daily usage or safety information."
      },
      {
        buyerQuestion: "When is the best time of day to consume this?",
        rufusAnswer: "This listing doesn't specify optimal timing. However, Athletic Greens AG1 recommends taking 1 scoop in cold water in the morning.",
        competitorName: "Athletic Greens AG1",
        failReason: "Your listing lacks usage timing and routine integration details."
      },
      {
        buyerQuestion: "Does this contain real wheatgrass, and is it gluten-free?",
        rufusAnswer: "I don't have enough certified purity data. Here are alternatives with certified gluten-free wheatgrass:",
        competitorName: "Organifi Green Juice",
        failReason: "Your listing doesn't address organic certs or wheatgrass gluten safety."
      }
    ],
    transformHeadline: "Here's What a Rufus-Optimized Listing Looks Like",
    transformBefore: [
      {
        section: "Title",
        content: "Acme Premium Organic Supergreens Powder — 30 Servings | Gut Health & Natural Energy"
      },
      {
        section: "Bullet 1",
        content: "DAILY NUTRIENT BOOST: Contains organic spirulina, chlorella, wheatgrass, and barley grass for all-day cellular vitality."
      },
      {
        section: "Bullet 2",
        content: "DIGESTION & GUT HEALTH: Enhanced with natural prebiotics and digestive enzymes for optimal nutrient absorption without bloating."
      }
    ],
    transformAfter: [
      {
        section: "Title",
        content: "Acme Premium Organic Supergreens Powder — Clinically-Formulated for Daily Use | Safe With Medications | Gluten-Free Wheatgrass"
      },
      {
        section: "Bullet 1",
        content: "✅ SAFE FOR DAILY USE: Formulated for daily vitality. Third-party tested. Safe alongside common medications. Standard dosage: 1 scoop daily."
      },
      {
        section: "Bullet 2",
        content: "⏰ OPTIMAL TIMING: Take 1 scoop in cold water in the morning on an empty stomach for maximum absorption and clean morning energy."
      }
    ],
    roadmapHeadline: "3 Steps. 48 Hours. Fully Optimized Listing.",
    roadmapBody: "No software to learn. No APIs to connect. We do the work — you get the results.",
    socialProofHeadline: "Sellers Who Fixed This in the Last 30 Days",
    urgencyCTA: "⚡ We only take 8 new listings per week. 3 slots remaining.",
    ctaHeadline: "Book Your Free 15-Minute Listing Audit, Alex",
    ctaGuarantee: "If we can't find at least $5,000/year in hidden revenue, we'll send you $100 for wasting your time.",
    freeQAs: [
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
    ],
    reviewSentiment: [
      {
        aspect: "Solubility & Clumping",
        status: "good",
        feedback: "88% of customers report it dissolves perfectly in cold water without needing a blender.",
        percentage: 88
      },
      {
        aspect: "Morning Energy Boost",
        status: "good",
        feedback: "92% of reviews state they feel a clean morning energy surge within 30 minutes of drinking.",
        percentage: 92
      },
      {
        aspect: "Taste Profile",
        status: "warning",
        feedback: "16% of users mention a grassy/earthy taste. Rufus flags this warning for buyers searching for sweet options.",
        percentage: 16
      },
      {
        aspect: "Packaging & Bag Seal",
        status: "critical",
        feedback: "8% of buyers mention zip-lock failure causing spilling. Rufus actively warns conversational shoppers about potential packaging issues.",
        percentage: 8
      }
    ],
    competitorAudit: [
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
    ],
    ppcKeywords: [
      {
        intent: "Bloating Relief",
        keyword: "organic supergreens powder for bloating",
        difficulty: "Low",
        searchVolume: 1850,
        bidEstimate: 1.15
      },
      {
        intent: "Gluten-Free Purity",
        keyword: "certified gluten free greens drink powder",
        difficulty: "Low",
        searchVolume: 620,
        bidEstimate: 0.85
      },
      {
        intent: "Daily Vitality",
        keyword: "daily organic greens powder supplement",
        difficulty: "Medium",
        searchVolume: 5100,
        bidEstimate: 2.30
      },
      {
        intent: "Morning Routine",
        keyword: "morning energy super greens mix",
        difficulty: "Medium",
        searchVolume: 1400,
        bidEstimate: 1.45
      }
    ],
    cosmoBundling: [
      {
        title: "The Morning Gut-Health Stack",
        products: ["Acme Premium Organic Supergreens Powder", "Acme Organic Apple Cider Vinegar Capsules"],
        rationale: "COSMO purchase histories reveal a high correlation for morning digestive health boosters. Bundling these two products establishes a co-purchase association in the COSMO graph."
      },
      {
        title: "Complete Plant-Based Vitality Kit",
        products: ["Acme Premium Organic Supergreens Powder", "Acme Vegan Plant Protein Powder"],
        rationale: "Vegan athletes frequently combine daily micronutrient greens with plant protein post-workout. Captures the active lifestyle co-purchase link."
      }
    ],
    cosmoGraphData: {
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
    }
  },
  status: "analyzed",
  views: 0,
  createdAt: "2026-06-03T18:00:00.000Z"
};
