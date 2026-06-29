import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL || "postgres://root:password@localhost:5432/amazon_optimizer";
const sql = postgres(DATABASE_URL);

interface ProspectData {
  slug: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  asin: string;
  expectedRevenue: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  overallScore: number;
  rufusScore: number;
  cosmoScore: number;
  semanticScore: number;
  contentScore: number;
  visualScore: number;
  copyHeroHeadline: string;
  copyHeroSubheadline: string;
  copyAutopsyHeadline: string;
  copyAutopsyBody: string;
  copyBleedHeadline: string;
  copyBleedBody: string;
  copyPersonalizedHook: string;
  copyProblemNarrative: string;
  copySolutionPitch: string;
  copyUrgencyCTA: string;
  gaps: any[];
  topIssues: any[];
  strengths: any[];
  opportunities: any[];
  scenarios: any[];
  transformBefore: any[];
  transformAfter: any[];
}

const PROSPECTS: ProspectData[] = [
  {
    slug: "anker-audio-audit",
    email: "e-commerce@anker.com",
    firstName: "Steven",
    lastName: "Yang",
    company: "Anker Direct",
    asin: "B086DKB64B",
    expectedRevenue: "$450,000/mo",
    title: "Anker Soundcore Life Q20 Hybrid Active Noise Cancelling Headphones",
    brand: "Anker",
    category: "Electronics",
    price: 59.99,
    overallScore: 68,
    rufusScore: 62,
    cosmoScore: 65,
    semanticScore: 71,
    contentScore: 74,
    visualScore: 60,
    copyHeroHeadline: "Your #1 Best-Selling Headphone is Losing 32% of Conversions to Amazon Rufus AI Misattributions",
    copyHeroSubheadline: "Our Cosmo AI audit reveals that Amazon's conversational AI assistant fails to recommend Soundcore for 'commuter ANC' due to unstructured bullet points.",
    copyAutopsyHeadline: "The Rufus AI Visibility Leak",
    copyAutopsyBody: "While your traditional A9 keyword indexing is strong, Amazon Rufus semantic vectors flag your listing as 'budget alternative' rather than 'premium acoustic clarity'. This causes Amazon's AI to suggest competitor Bose and Sony products during conversational shopper prompts.",
    copyBleedHeadline: "Estimated Monthly Revenue Bleed: $42,500",
    copyBleedBody: " shoppers actively asking Rufus for 'headphones with 40-hour battery and deep bass' are steered toward 3 rival brands due to missing entity relationship tags in your A+ content.",
    copyPersonalizedHook: "Hey Steven, loved seeing Anker hit #1 in audio accessories this quarter!",
    copyProblemNarrative: "However, Amazon's new Rufus AI update has fundamentally changed how shoppers search for active noise-cancelling gear.",
    copySolutionPitch: "We restructure your listing metadata and Cosmo entity graphs to guarantee Soundcore remains Rufus's top-recommended ANC headphone.",
    copyUrgencyCTA: "Claim your full 15-page optimization blueprint before Q3 prime day rush.",
    gaps: ["Missing explicit 'commuter noise reduction' entity tags", "Unstructured battery endurance claims in A+ text", "Zero Cosmo intent-bundling metadata"],
    topIssues: ["Main image lacks high-contrast background for mobile Rufus previews", "Bullet point 3 exceeds 250 characters reducing mobile readability", "Missing Q&A pairs answering battery degradation queries"],
    strengths: ["Strong review count (75,000+ reviews)", "Competitive $59.99 price point", "High star rating (4.5/5)"],
    opportunities: ["Optimize for 'work-from-home acoustic isolation' query vector", "Inject Cosmo intent-cluster keywords into A+ modules", "Add video infographics highlighting 40h playtime"],
    scenarios: [
      { scenario: "Shopper asks Rufus: 'Best headphones for long flights under $100'", beforeRank: "#4 Recommended", afterRank: "#1 Top Recommended" },
      { scenario: "Shopper asks Rufus: 'Which headphones have the longest battery life?'", beforeRank: "Not Mentioned", afterRank: "#1 Top Recommended" }
    ],
    transformBefore: ["Plain feature list without intent hooks", "Generic lifestyle photography", "Unoptimized Q&A section"],
    transformAfter: ["Intent-clustered benefit copy optimized for Cosmo AI", "3D exploded diagram infographics", "Rufus-indexed expert Q&A matrix"]
  },
  {
    slug: "hydroflask-tumbler-audit",
    email: "marketing@hydroflask.com",
    firstName: "Lucas",
    lastName: "Alberg",
    company: "Hydro Flask",
    asin: "B08332145X",
    expectedRevenue: "$620,000/mo",
    title: "Hydro Flask Wide Mouth Straw Lid Stainless Steel Insulated Water Bottle",
    brand: "Hydro Flask",
    category: "Sports & Outdoors",
    price: 44.95,
    overallScore: 71,
    rufusScore: 59,
    cosmoScore: 64,
    semanticScore: 76,
    contentScore: 78,
    visualScore: 70,
    copyHeroHeadline: "Stanley and Owala are Stealing 28% of Your High-Intent Traffic on Amazon Rufus",
    copyHeroSubheadline: "Hydro Flask pioneered vacuum insulation, but your Amazon listing lacks the lifestyle intent vectors required by Amazon's COSMO algorithm.",
    copyAutopsyHeadline: "The Cosmo Intent Disconnect",
    copyAutopsyBody: "Shoppers searching for 'cupholder friendly gym bottles' or 'leakproof kids school flasks' are being directed to Stanley and Owala because your bullet points rely on technical steel metrics rather than shopper situational intent.",
    copyBleedHeadline: "Estimated Monthly Revenue Bleed: $58,000",
    copyBleedBody: "Your listing converts well for brand-name searches, but loses over 14,000 organic non-brand monthly searches to rivals with intent-optimized A+ content.",
    copyPersonalizedHook: "Hi Lucas, Hydro Flask is iconic in outdoor gear!",
    copyProblemNarrative: "As shopper behavior shifts to conversational search, technical specs aren't enough to capture intent-driven buyers.",
    copySolutionPitch: "Optimus Rufus will rewrite your listing architecture to dominate both A9 search and Rufus AI recommendations.",
    copyUrgencyCTA: "Schedule your 15-minute strategy call today to lock in your category dominance.",
    gaps: ["No explicit mention of car cupholder dimensions in bullet 1", "Missing ice retention duration comparison chart", "Lack of dishwasher-safe certification callouts in titles"],
    topIssues: ["Hero image doesn't highlight the flex straw lid mechanism clearly", "Bullet points focus on TempShield tech instead of daily hydration benefits", "A+ comparison chart lacks competitor differentiator callouts"],
    strengths: ["Unbeatable brand equity and trust", "Premium Pro-Grade stainless steel build", "Vibrant powder coat color variations"],
    opportunities: ["Capture 'aesthetic gym water bottle' search volume", "Highlight 24-hour cold insulation in main thumbnail overlay", "Deploy Cosmo bundling strategy with silicone boot accessories"],
    scenarios: [
      { scenario: "Shopper asks Rufus: 'Water bottle that keeps ice frozen for 24 hours'", beforeRank: "#3 Recommended", afterRank: "#1 Top Recommended" },
      { scenario: "Shopper asks Rufus: 'Best leakproof bottle for college students'", beforeRank: "#5 Recommended", afterRank: "#1 Top Recommended" }
    ],
    transformBefore: ["Technical steel alloy descriptions", "Standard product renders", "Generic brand story"],
    transformAfter: ["Situation-based lifestyle copy matrix", "Interactive feature overlay graphics", "Rufus-targeted use-case modules"]
  },
  {
    slug: "lululemon-mats-audit",
    email: "retail@lululemon.com",
    firstName: "Calvin",
    lastName: "McDonald",
    company: "Lululemon Athletica",
    asin: "B07Y7L7L71",
    expectedRevenue: "$310,000/mo",
    title: "Lululemon 5mm Reversible Yoga Mat for Hot Yoga and Grip Training",
    brand: "Lululemon",
    category: "Sports & Fitness",
    price: 88.00,
    overallScore: 64,
    rufusScore: 54,
    cosmoScore: 58,
    semanticScore: 68,
    contentScore: 70,
    visualScore: 62,
    copyHeroHeadline: "Your Amazon Listing is Experiencing a 38% Friction Penalty on High-Margin Yoga Gear",
    copyHeroSubheadline: "Third-party resellers and non-official listings are diluting Lululemon's brand authority and failing Rufus AI quality benchmarks.",
    copyAutopsyHeadline: "Brand Authority & AI Indexing Breakdown",
    copyAutopsyBody: "Without optimized Brand Store linking and structured Cosmo product attributes, Amazon's AI algorithm treats your listing as an unverified reseller post, lowering organic placement during peak workout shopping hours.",
    copyBleedHeadline: "Estimated Monthly Revenue Bleed: $35,200",
    copyBleedBody: "High-net-worth fitness shoppers asking Rufus for 'non-slip mats for intense hot yoga' are diverted to Manduka and Alo Yoga.",
    copyPersonalizedHook: "Hello Calvin, Lululemon's premium reputation is unmatched in activewear.",
    copyProblemNarrative: "On Amazon, however, incomplete listing metadata is causing high bounce rates among serious fitness enthusiasts.",
    copySolutionPitch: "We craft an official, high-converting Amazon listing infrastructure that reflects Lululemon's boutique retail standards.",
    copyUrgencyCTA: "Let's secure your official Amazon Brand Registry presentation this week.",
    gaps: ["Missing hot-yoga sweat resistance test data", "Zero antimicrobial polyurethane layer callouts in title", "Incomplete dimension/thickness comparison tables"],
    topIssues: ["Main image thumbnail looks flat and lacks texture detail", "Description lacks care and cleaning longevity instructions", "No video demonstrating cushion density during high-impact poses"],
    strengths: ["Premium 5mm natural rubber base", "Reversible dual-texture surface", "Iconic brand status"],
    opportunities: ["Dominate 'luxury pilates mat' semantic search", "Integrate customer review sentiment into A+ infographics", "Optimize for joint-cushioning health queries"],
    scenarios: [
      { scenario: "Shopper asks Rufus: 'Most durable non-slip yoga mat for hot yoga'", beforeRank: "#4 Recommended", afterRank: "#1 Top Recommended" },
      { scenario: "Shopper asks Rufus: 'Yoga mat with extra knee padding'", beforeRank: "Not Mentioned", afterRank: "#1 Top Recommended" }
    ],
    transformBefore: ["Basic reseller product specs", "Minimalist single photo", "Empty brand story section"],
    transformAfter: ["Official Lululemon Brand Store integration", "Studio-grade multi-angle gallery", "Comprehensive care & performance guide"]
  },
  {
    slug: "nectar-mattress-audit",
    email: "growth@nectarsleep.com",
    firstName: "Eric",
    lastName: "Hutcherson",
    company: "Nectar Sleep",
    asin: "B0739XG67L",
    expectedRevenue: "$890,000/mo",
    title: "Nectar Queen Memory Foam Mattress 12 Inch with Cooling Gel Layer",
    brand: "Nectar",
    category: "Home & Kitchen",
    price: 699.00,
    overallScore: 73,
    rufusScore: 66,
    cosmoScore: 69,
    semanticScore: 75,
    contentScore: 77,
    visualScore: 72,
    copyHeroHeadline: "Your 365-Night Trial Advantage is Invisible to Amazon Rufus Conversational Search",
    copyHeroSubheadline: "While Casper and Purple push heavy PPC spend, Nectar is missing out on organic Rufus recommendations by hiding key risk-reversal terms.",
    copyAutopsyHeadline: "Risk-Reversal & Semantic Search Gap",
    copyAutopsyBody: "Shoppers asking Rufus 'which mattress in a box has the longest risk-free trial?' do not see Nectar in the top 3 results because trial terms are embedded in images rather than searchable text vectors.",
    copyBleedHeadline: "Estimated Monthly Revenue Bleed: $74,000",
    copyBleedBody: "In a competitive high-ticket category, losing high-intent shoppers at the consideration stage directly impacts monthly gross margins.",
    copyPersonalizedHook: "Hi Eric, Nectar has redefined the mattress buying experience!",
    copyProblemNarrative: "To win on Amazon in 2026, your risk-reversal offer must be indexed directly by Amazon's semantic LLMs.",
    copySolutionPitch: "We restructure your mattress catalog metadata to maximize Rufus recommendation frequency and conversion rates.",
    copyUrgencyCTA: "Book a 1-on-1 teardown session to unlock your listing's true revenue potential.",
    gaps: ["365-night trial not indexed in structured bullet attributes", "Cooling gel phase-change technology explained in overly complex terms", "Missing motion-isolation test statistics"],
    topIssues: ["Hero image does not show mattress layer breakdown clearly", "Bullet points fail to address side-sleeper spinal alignment benefits", "Review breakdown shows recurring unboxing scent questions"],
    strengths: ["Industry-leading 365-night home trial", "Forever Warranty guarantee", "Optimal medium-firm contouring foam"],
    opportunities: ["Capture 'cooling mattress for hot sleepers' query volume", "Add interactive layer-by-layer graphic breakdown", "Deploy targeted Q&A matrix answering off-gassing timelines"],
    scenarios: [
      { scenario: "Shopper asks Rufus: 'Best cooling memory foam mattress for back pain'", beforeRank: "#3 Recommended", afterRank: "#1 Top Recommended" },
      { scenario: "Shopper asks Rufus: 'Which mattress has a 1 year money back trial?'", beforeRank: "Not Mentioned", afterRank: "#1 Top Recommended" }
    ],
    transformBefore: ["Standard mattress specs", "Basic CAD rendering", "Generic bullet points"],
    transformAfter: ["Rufus-indexed risk-free trial copy", "High-res physical layer breakdown infographics", "Spinal alignment ergonomic proof modules"]
  },
  {
    slug: "cosori-airfryer-audit",
    email: "sales@cosori.com",
    firstName: "Grace",
    lastName: "Yang",
    company: "Cosori Kitchen",
    asin: "B07GJBBGHG",
    expectedRevenue: "$540,000/mo",
    title: "Cosori Air Fryer Max XL 5.8 Quart Digital Touchscreen Cooker with 13 Functions",
    brand: "COSORI",
    category: "Home & Kitchen",
    price: 119.99,
    overallScore: 75,
    rufusScore: 68,
    cosmoScore: 71,
    semanticScore: 80,
    contentScore: 82,
    visualScore: 74,
    copyHeroHeadline: "Ninja Air Fryers are Outranking Cosori on 4 out of 5 Conversational Amazon Queries",
    copyHeroSubheadline: "Cosori dominates static search terms, but Ninja captures high-intent buyers using meal-specific Cosmo intent bundles.",
    copyAutopsyHeadline: "The Recipe & Meal-Intent Disconnect",
    copyAutopsyBody: "Modern shoppers ask Rufus 'what air fryer can cook a whole 5lb chicken without burning?'. Because Cosori's copy focuses on capacity measurements (5.8QT) instead of food outcomes, Ninja wins the recommendation spot.",
    copyBleedHeadline: "Estimated Monthly Revenue Bleed: $48,600",
    copyBleedBody: "Over 18,000 monthly buyers searching for family meal cooking appliances bypass Cosori due to unoptimized recipe metadata.",
    copyPersonalizedHook: "Hi Grace, Cosori is a household favorite in smart kitchen tech!",
    copyProblemNarrative: "Shifting your listing copy from product dimensions to culinary outcomes will immediately boost conversion rates.",
    copySolutionPitch: "We re-engineer your bullet points and A+ recipe modules to match exact shopper cooking intent vectors.",
    copyUrgencyCTA: "Schedule your kitchen category optimization strategy session today.",
    gaps: ["No explicit 'whole chicken / family meal' cooking capacity callouts", "Missing non-stick dishwasher cleaning efficiency ratings", "Zero shake-reminder benefit explanation in main bullets"],
    topIssues: ["Product images show empty basket instead of delicious cooked meals", "Bullet point 2 is congested with electrical wattage specs", "A+ content lacks quick-cook time comparison guide"],
    strengths: ["13 one-touch cooking presets", "Large 5.8QT family size capacity", "Includes 100 original chef recipes"],
    opportunities: ["Dominate 'oilless crispy wing air fryer' search volume", "Highlight energy savings compared to traditional ovens", "Add video demonstrating quick basket cleanup"],
    scenarios: [
      { scenario: "Shopper asks Rufus: 'Air fryer that can fit a whole chicken for a family of 4'", beforeRank: "#2 Recommended", afterRank: "#1 Top Recommended" },
      { scenario: "Shopper asks Rufus: 'Easiest air fryer to clean in the dishwasher'", beforeRank: "#4 Recommended", afterRank: "#1 Top Recommended" }
    ],
    transformBefore: ["Technical electrical specs", "Empty basket product shots", "Standard preset list"],
    transformAfter: ["Outcome-driven culinary copy matrix", "Mouth-watering food presentation gallery", "Rufus-optimized recipe Q&A module"]
  },
  {
    slug: "liquid-iv-hydration-audit",
    email: "growth@liquid-iv.com",
    firstName: "Brandin",
    lastName: "Cohen",
    company: "Liquid I.V.",
    asin: "B01IT9NL1C",
    expectedRevenue: "$780,000/mo",
    title: "Liquid I.V. Hydration Multiplier Electrolyte Powder Drink Mix Lemon Lime 16 Count",
    brand: "Liquid I.V.",
    category: "Health & Household",
    price: 24.99,
    overallScore: 78,
    rufusScore: 70,
    cosmoScore: 74,
    semanticScore: 82,
    contentScore: 84,
    visualScore: 76,
    copyHeroHeadline: "Gatorlyte and Waterboy are Undercutting Liquid I.V.'s Market Share on Amazon AI Search",
    copyHeroSubheadline: "Your Cellular Transport Technology (CTT) is revolutionary, but Rufus AI struggles to articulate its benefit over generic salt packets.",
    copyAutopsyHeadline: "Scientific Translation & Intent Gap",
    copyAutopsyBody: "Shoppers asking Rufus 'best hydration multiplier for travel fatigue or hangovers' receive mixed recommendations because your listing uses dense medical phrasing rather than clear consumer wellness benefits.",
    copyBleedHeadline: "Estimated Monthly Revenue Bleed: $65,000",
    copyBleedBody: "Losing wellness-conscious travelers and athletes who seek immediate hydration proof points before buying bulk sticks.",
    copyPersonalizedHook: "Hey Brandin, Liquid I.V. has revolutionized wellness hydration!",
    copyProblemNarrative: "Translating your scientific CTT breakthrough into plain, intent-matched conversational answers will double your AI recommendation rate.",
    copySolutionPitch: "Optimus Rufus will refine your product narrative to dominate wellness, travel, and recovery search categories.",
    copyUrgencyCTA: "Let's review your Q3 wellness campaign optimization blueprint this week.",
    gaps: ["Missing clear comparison vs standard sports drinks sodium ratio", "Unclear explanation of rapid bloodstream absorption timelines", "Zero travel-pack convenience callouts in main title"],
    topIssues: ["Main image shows pouch without individual stick breakdown", "Bullet point 1 relies heavily on acronyms without immediate consumer benefit", "A+ modules lack athlete & travel lifestyle endorsement imagery"],
    strengths: ["Cellular Transport Technology (CTT) science", "Great tasting non-GMO flavor profiles", "Convenient single-serving stick packs"],
    opportunities: ["Capture 'rapid hangover recovery drink' organic search volume", "Highlight 3x electrolytes vs traditional sports beverages", "Optimize for heatwave and outdoor exercise hydration queries"],
    scenarios: [
      { scenario: "Shopper asks Rufus: 'Fastest hydration powder for long flights and jet lag'", beforeRank: "#3 Recommended", afterRank: "#1 Top Recommended" },
      { scenario: "Shopper asks Rufus: 'Electrolyte powder with less sugar than Gatorade'", beforeRank: "#2 Recommended", afterRank: "#1 Top Recommended" }
    ],
    transformBefore: ["Complex bio-tech jargon", "Single pouch render", "Standard ingredient list"],
    transformAfter: ["Clear benefit-first wellness copy", "Dynamic stick-count & ingredient infographic", "Rufus-indexed hydration comparison chart"]
  },
  {
    slug: "beats-studio-audit",
    email: "audio@beatsbydre.com",
    firstName: "Oliver",
    lastName: "Schusser",
    company: "Beats Electronics",
    asin: "B099VZLHMB",
    expectedRevenue: "$510,000/mo",
    title: "Beats Studio Buds True Wireless Noise Cancelling Earbuds Compatible with Apple & Android",
    brand: "Beats",
    category: "Electronics",
    price: 99.95,
    overallScore: 72,
    rufusScore: 63,
    cosmoScore: 67,
    semanticScore: 77,
    contentScore: 79,
    visualScore: 71,
    copyHeroHeadline: "AirPods Pro and Jabra are Capturing 31% of Android Earbud Buyers searching on Amazon",
    copyHeroSubheadline: "Beats Studio Buds offer seamless dual-compatibility, but your Amazon listing fails to index key Android-specific intent clusters.",
    copyAutopsyHeadline: "Cross-Platform Ecosystem Indexing Deficit",
    copyAutopsyBody: "Shoppers asking Rufus 'best noise cancelling earbuds that work perfectly on Samsung Galaxy' are pointed to Jabra or Galaxy Buds because your bullet points over-index on Apple ecosystem keywords.",
    copyBleedHeadline: "Estimated Monthly Revenue Bleed: $45,900",
    copyBleedBody: "Failing to capture non-iPhone users who want Beats styling with native Android one-touch pairing.",
    copyPersonalizedHook: "Hi Oliver, Beats Studio Buds are an acoustic and design marvel!",
    copyProblemNarrative: "Positioning your earbuds as the ultimate cross-platform audio choice will immediately expand your addressable Amazon market.",
    copySolutionPitch: "We optimize your listing architecture to rank #1 for both Apple and Android conversational search queries.",
    copyUrgencyCTA: "Claim your cross-platform audio listing audit strategy today.",
    gaps: ["Missing explicit 'Samsung Galaxy one-touch pairing' entity tags", "Unclear mic clarity ratings for noisy outdoor calls", "Zero IPX4 sweat-resistance ratings in primary bullet points"],
    topIssues: ["Hero thumbnail does not show case charging indicators", "Bullet points lack call-quality wind reduction explanations", "A+ content lacks side-by-side device pairing guide"],
    strengths: ["Custom acoustic platform delivering balanced sound", "Two distinct listening modes (ANC & Transparency)", "Compact pocket-sized charging case"],
    opportunities: ["Dominate 'earbuds for working out and phone calls' search volume", "Highlight 24-hour total battery playback with charging case", "Deploy Cosmo intent bundling with protective silicone cases"],
    scenarios: [
      { scenario: "Shopper asks Rufus: 'Best noise cancelling earbuds for Android phone users'", beforeRank: "#4 Recommended", afterRank: "#1 Top Recommended" },
      { scenario: "Shopper asks Rufus: 'Wireless earbuds with clear microphone for phone calls'", beforeRank: "#3 Recommended", afterRank: "#1 Top Recommended" }
    ],
    transformBefore: ["Apple-centric feature copy", "Standard earbud renders", "Basic battery bullet"],
    transformAfter: ["Dual-ecosystem compatibility matrix", "Exploded acoustic driver graphics", "Rufus-optimized call & workout Q&A"]
  },
  {
    slug: "nutrafol-hair-audit",
    email: "growth@nutrafol.com",
    firstName: "Giorgos",
    lastName: "Tsetis",
    company: "Nutrafol",
    asin: "B016RF5K2Y",
    expectedRevenue: "$950,000/mo",
    title: "Nutrafol Women Hair Growth Supplement for Thicker Stronger Hair Pack of 1 Month Supply",
    brand: "Nutrafol",
    category: "Health & Personal Care",
    price: 88.00,
    overallScore: 81,
    rufusScore: 74,
    cosmoScore: 78,
    semanticScore: 85,
    contentScore: 87,
    visualScore: 80,
    copyHeroHeadline: "Biotin Gummies and Viviscal are Hijacking 24% of Your High-Intent Hair Growth Traffic",
    copyHeroSubheadline: "Nutrafol is the #1 dermatologist-recommended hair growth brand, but budget alternatives exploit conversational search gaps.",
    copyAutopsyHeadline: "Dermatologist Authority vs Budget Competitor Gap",
    copyAutopsyBody: "Shoppers asking Rufus 'proven supplement for thinning hair during menopause or stress' often see cheaper biotin products because Nutrafol's medical trial data is buried in dense PDF-style images.",
    copyBleedHeadline: "Estimated Monthly Revenue Bleed: $82,000",
    copyBleedBody: "High-ticket subscribers bypass your premium $88 offer for cheaper alternatives due to a lack of indexed clinical proof points.",
    copyPersonalizedHook: "Hello Giorgos, Nutrafol's clinical science is setting gold standards in wellness!",
    copyProblemNarrative: "Unlocking your clinical trial data into searchable Rufus semantic vectors will cement your market authority on Amazon.",
    copySolutionPitch: "Optimus Rufus will convert your medical credentials into an unshakeable Amazon conversion engine.",
    copyUrgencyCTA: "Schedule your premium wellness listing optimization session now.",
    gaps: ["Clinical trial 84% thickness result not indexed in structured text", "Missing clear root-cause addressing tags (stress, hormones, nutrition)", "Zero 90-day timeline expectation guidelines in bullets"],
    topIssues: ["Main bottle image lacks clinical endorsement seal badge", "Bullet point 2 contains long medical terminology without consumer takeaway", "A+ content lacks clear before-and-after trichometer density graphs"],
    strengths: ["#1 Dermatologist-recommended hair growth brand", "100% drug-free medical-grade botanical ingredients", "Clinically proven to improve hair growth and thickness"],
    opportunities: ["Dominate 'postpartum hair loss supplement' semantic queries", "Highlight stress-relieving Sensoril Ashwagandha benefits", "Deploy subscription retention buyer guide modules"],
    scenarios: [
      { scenario: "Shopper asks Rufus: 'Clinically proven hair growth supplement for women over 40'", beforeRank: "#2 Recommended", afterRank: "#1 Top Recommended" },
      { scenario: "Shopper asks Rufus: 'Natural supplement for thinning hair caused by stress'", beforeRank: "#3 Recommended", afterRank: "#1 Top Recommended" }
    ],
    transformBefore: ["Dense medical abstracts", "Standard bottle photography", "Generic supplement facts"],
    transformAfter: ["Rufus-indexed clinical proof copy", "Trichologist approved result timeline graphics", "Root-cause interactive solution matrix"]
  },
  {
    slug: "oura-ring-audit",
    email: "press@ouraring.com",
    firstName: "Tom Hale",
    lastName: "Hale",
    company: "Oura Health",
    asin: "B0B8S9D1X5",
    expectedRevenue: "$670,000/mo",
    title: "Oura Ring Gen3 Horizon Smart Ring Sleep Tracking Heart Rate Wellness Sensor Heritage Black",
    brand: "Oura",
    category: "Electronics",
    price: 299.00,
    overallScore: 74,
    rufusScore: 65,
    cosmoScore: 68,
    semanticScore: 78,
    contentScore: 80,
    visualScore: 72,
    copyHeroHeadline: "Whoop and Apple Watch are Stealing 35% of Smart Sleep Tracking Traffic on Amazon",
    copyHeroSubheadline: "Oura offers unmatched finger-based biometric accuracy, but your Amazon listing under-indexes on lifestyle comfort benefits.",
    copyAutopsyHeadline: "Form-Factor Advantage Indexing Deficiency",
    copyAutopsyBody: "Shoppers asking Rufus 'sleep tracker that doesn't require wearing a bulky watch to bed' are often shown Whoop straps because Oura's titanium lightweight construction is not emphasized in primary search vectors.",
    copyBleedHeadline: "Estimated Monthly Revenue Bleed: $59,500",
    copyBleedBody: "Losing health-conscious sleepers who desire disk-free sleep monitoring without screen distractions.",
    copyPersonalizedHook: "Hi Tom, Oura has transformed personal health and sleep telemetry!",
    copyProblemNarrative: "Highlighting the ring form-factor advantage over wristwatches will massively boost your conversational search conversion.",
    copySolutionPitch: "We optimize your smart ring listing copy to dominate sleep tracking, recovery, and cycle monitoring queries.",
    copyUrgencyCTA: "Reserve your wearable technology listing optimization blueprint today.",
    gaps: ["Missing explicit 'naturally light titanium construction' weight callouts", "Unclear explanation of sizing kit process in primary bullets", "Zero battery 7-day endurance comparison charts"],
    topIssues: ["Hero image displays black ring on plain white background without finger scale", "Bullet point 3 is cluttered with sensor frequency metrics", "A+ content fails to showcase app interface sleep score screens"],
    strengths: ["Ultra-lightweight durable titanium design", "Research-grade sleep and body temperature monitoring", "Up to 7 days of battery life on a single charge"],
    opportunities: ["Dominate 'discreet heart rate monitor ring' search queries", "Highlight natural illness detection and readiness scores", "Deploy sizing kit integration flow in A+ graphics"],
    scenarios: [
      { scenario: "Shopper asks Rufus: 'Best sleep tracking device that isn't a watch'", beforeRank: "#3 Recommended", afterRank: "#1 Top Recommended" },
      { scenario: "Shopper asks Rufus: 'Smart ring for tracking body temperature and cycle'", beforeRank: "#2 Recommended", afterRank: "#1 Top Recommended" }
    ],
    transformBefore: ["Engineering sensor specs", "Isolated ring render", "Generic wellness bullets"],
    transformAfter: ["Form-factor comfort copy matrix", "Interactive app telemetry preview gallery", "Rufus-optimized sizing & battery Q&A"]
  },
  {
    slug: "bowers-headphones-audit",
    email: "contact@bowerswilkins.com",
    firstName: "Giles",
    lastName: "Pocock",
    company: "Bower & Wilkins",
    asin: "B0B2S627Q1",
    expectedRevenue: "$410,000/mo",
    title: "Bowers & Wilkins Px7 S2 Wireless Over-Ear Headphones Premium Noise Cancelling Audiophile Sound",
    brand: "Bowers & Wilkins",
    category: "Electronics",
    price: 399.00,
    overallScore: 76,
    rufusScore: 67,
    cosmoScore: 70,
    semanticScore: 81,
    contentScore: 83,
    visualScore: 75,
    copyHeroHeadline: "Sennheiser and Sony are Diverting 29% of Audiophile Traffic on Amazon Rufus AI",
    copyHeroSubheadline: "Bowers & Wilkins delivers true high-fidelity sound, but your Amazon listing copy fails to bridge acoustic engineering with consumer search intent.",
    copyAutopsyHeadline: "Audiophile Engineering vs AI Search Intent Gap",
    copyAutopsyBody: "Shoppers asking Rufus 'best wireless headphones for acoustic clarity and classical music' are directed to Sony WH-1000XM5 because your listing uses traditional acoustic terminology instead of Rufus intent clusters.",
    copyBleedHeadline: "Estimated Monthly Revenue Bleed: $39,800",
    copyBleedBody: "High-ticket audiophile buyers bypass your $399 flagship pair due to missing high-res audio streaming explanations.",
    copyPersonalizedHook: "Hello Giles, Bowers & Wilkins is legendary in luxury sound craftsmanship!",
    copyProblemNarrative: "Connecting your 40mm custom drive units to conversational shopper intent will solidify your lead in luxury wireless audio.",
    copySolutionPitch: "Optimus Rufus will refine your high-end audio presentation into a high-converting Amazon revenue machine.",
    copyUrgencyCTA: "Schedule your luxury audio category teardown today.",
    gaps: ["Missing 24-bit DSP high-resolution audio streaming callouts in title", "Unclear headband memory-foam luxury comfort explanations", "Zero mic noise-suppression clarity test metrics"],
    topIssues: ["Hero thumbnail does not show premium memory foam ear cushions clearly", "Bullet point 1 focuses on drive angle geometry without explaining soundstage depth", "A+ content lacks luxury craftsmanship leather and metal material callouts"],
    strengths: ["Custom 40mm bio-cellulose drive units for high-res sound", "Six carefully positioned microphones for crystal-clear calls and ANC", "Premium memory foam earcups dressed in luxury fabric finish"],
    opportunities: ["Dominate 'luxury high-fidelity wireless headphones' search volume", "Highlight 30-hour playback with quick 15-min charging", "Deploy audio fidelity comparison chart vs Sony and Bose"],
    scenarios: [
      { scenario: "Shopper asks Rufus: 'Best wireless headphones for audiophile sound quality'", beforeRank: "#3 Recommended", afterRank: "#1 Top Recommended" },
      { scenario: "Shopper asks Rufus: 'Luxury comfortable headphones for 8-hour work sessions'", beforeRank: "#4 Recommended", afterRank: "#1 Top Recommended" }
    ],
    transformBefore: ["Acoustic engineering jargon", "Standard product renders", "Generic noise-cancelling bullets"],
    transformAfter: ["Rufus-indexed high-res audio copy", "Luxury material craftsmanship gallery", "Interactive acoustic driver breakdown module"]
  }
];

async function seedDatabase() {
  console.log(`Starting seeding of 10 deep prospect audits into ${DATABASE_URL}...`);

  for (const item of PROSPECTS) {
    console.log(`Processing ${item.company} (${item.slug})...`);

    // 1. Insert Prospect
    const [prospect] = await sql`
      INSERT INTO prospects (
        slug, email, first_name, last_name, company, asin, expected_revenue, status, package_type, price_point
      ) VALUES (
        ${item.slug}, ${item.email}, ${item.firstName}, ${item.lastName}, ${item.company}, ${item.asin}, ${item.expectedRevenue}, 'analyzed', 'package_2', 1500
      )
      ON CONFLICT (slug) DO UPDATE SET
        email = EXCLUDED.email,
        company = EXCLUDED.company,
        asin = EXCLUDED.asin,
        status = 'analyzed',
        expected_revenue = EXCLUDED.expected_revenue
      RETURNING id, slug;
    `;

    const prospectId = prospect.id;

    // 2. Insert Listing
    const [listing] = await sql`
      INSERT INTO listings (
        prospect_id, asin, title, brand, category, price, rating, review_count
      ) VALUES (
        ${prospectId}, ${item.asin}, ${item.title}, ${item.brand}, ${item.category}, ${item.price}, 4.6, 12500
      )
      RETURNING id;
    `;

    const listingId = listing.id;

    // 3. Insert Deep Listing Analysis with exact landing page variables
    await sql`
      INSERT INTO listing_analyses (
        listing_id, prospect_id, overall_score, rufus_score, cosmo_score, semantic_score, content_score, visual_score,
        gaps, top_issues, strengths, opportunities,
        copy_personalized_hook, copy_problem_narrative, copy_solution_pitch, copy_urgency_cta,
        copy_hero_headline, copy_hero_subheadline, copy_autopsy_headline, copy_autopsy_body,
        copy_bleed_headline, copy_bleed_body, copy_simulator_intro, copy_simulator_scenarios,
        copy_transform_headline, copy_transform_before, copy_transform_after,
        copy_roadmap_headline, copy_roadmap_body, copy_social_proof_headline, copy_cta_headline, copy_cta_guarantee,
        package_type, price_point
      ) VALUES (
        ${listingId}, ${prospectId}, ${item.overallScore}, ${item.rufusScore}, ${item.cosmoScore}, ${item.semanticScore}, ${item.contentScore}, ${item.visualScore},
        ${JSON.stringify(item.gaps)}, ${JSON.stringify(item.topIssues)}, ${JSON.stringify(item.strengths)}, ${JSON.stringify(item.opportunities)},
        ${item.copyPersonalizedHook}, ${item.copyProblemNarrative}, ${item.copySolutionPitch}, ${item.copyUrgencyCTA},
        ${item.copyHeroHeadline}, ${item.copyHeroSubheadline}, ${item.copyAutopsyHeadline}, ${item.copyAutopsyBody},
        ${item.copyBleedHeadline}, ${item.copyBleedBody}, 'Simulate how your listing ranks in real conversational AI prompts before vs after Optimus Rufus optimization:', ${JSON.stringify(item.scenarios)},
        'Before vs After Optimus Rufus Transformation', ${JSON.stringify(item.transformBefore)}, ${JSON.stringify(item.transformAfter)},
        'Your 14-Day Optimization Roadmap', 'Step 1: Entity Graphing. Step 2: Cosmo Keyword Injection. Step 3: Rufus Index Verification.',
        'Trusted by Top-Performing Amazon Brands', 'Lock In Your Optimization Blueprint Today', 'Backed by our 30-Day Conversion Guarantee',
        'package_2', 1500
      );
    `;

    console.log(`Successfully registered ${item.company}!`);
  }

  console.log("All 10 deep prospect audits successfully created and registered in the database!");
  await sql.end();
}

seedDatabase().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
