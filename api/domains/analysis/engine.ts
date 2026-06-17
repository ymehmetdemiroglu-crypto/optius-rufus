import type { SemanticGap, AnalysisResult, CleanedText } from "../../pipeline/pipeline.types.js";
import { generateEmbedding, generateFallbackEmbedding } from "../../services/embedding.js";
import { cosineSimilarity } from "../../lib/math.js";
import { callLlm } from "../../services/llmGateway.js";

// -------------------------------------------------------------------------
// IntentDimension interface matching COSMO/Rufus intents
// -------------------------------------------------------------------------
interface IntentDimension {
  name: string;
  query: string;
  weight: number;
  recommendation: string;
}

// -------------------------------------------------------------------------
// Category-Specific Taxonomy Registry
// -------------------------------------------------------------------------
const CATEGORY_TAXONOMIES: Record<string, IntentDimension[]> = {
  health_supplements: [
    { name: "sleep_support", query: "What supplement is best for sleep and insomnia relief without side effects?", weight: 0.08, recommendation: "Add explicit sleep support claims with mechanism (e.g., 'promotes melatonin production')." },
    { name: "stress_anxiety_relief", query: "Which product helps with stress, anxiety, and relaxation naturally?", weight: 0.08, recommendation: "Include stress/anxiety relief messaging with calming mechanism details." },
    { name: "muscle_recovery", query: "Best supplement for muscle recovery, soreness, and post-workout cramps?", weight: 0.07, recommendation: "Detail muscle recovery benefits, timing post-workout, and cramp prevention." },
    { name: "skin_health", query: "What product improves skin elasticity, complexion, and reduces wrinkles?", weight: 0.04, recommendation: "Add skin health claims with specific ingredient mechanisms and expected timelines." },
    { name: "joint_bone_health", query: "Which supplement supports joint mobility and bone density?", weight: 0.04, recommendation: "Include joint mobility and bone density support language." },
    { name: "digestive_gentle", query: "What is gentle on the stomach and easy to digest without causing diarrhea?", weight: 0.06, recommendation: "Explicitly state gentleness on stomach, no laxative effect, and easy digestion." },
    { name: "energy_performance", query: "Which supplement boosts energy, reduces fatigue, and improves performance?", weight: 0.04, recommendation: "Add energy-boosting claims with sustained-release or non-jitter mechanism." },
    { name: "barrier_repair", query: "Best product for skin barrier repair and restoring damaged moisture barrier?", weight: 0.04, recommendation: "Detail skin barrier repair with ceramide complex or lipid matrix language." },
    { name: "brightening_pigmentation", query: "What fades dark spots, brightens dull skin, and reduces pigmentation?", weight: 0.04, recommendation: "Include brightening claims with specific ingredient concentrations and pH levels." },
    { name: "anti_aging", query: "Which product has anti-aging benefits, reduces fine lines, and improves firmness?", weight: 0.04, recommendation: "Add anti-aging mechanism language (collagen support, cell renewal, etc.)." },
    { name: "sensitive_skin_safe", query: "Is this safe for sensitive skin, eczema-prone skin, and won't cause breakouts?", weight: 0.04, recommendation: "Explicitly state safety for sensitive/eczema-prone skin with dermatologist testing." },
    { name: "hair_nail_strength", query: "What strengthens hair, reduces breakage, and improves nail growth?", weight: 0.03, recommendation: "Include hair and nail strengthening claims with biotin or keratin support." },
    { name: "pregnant_women", query: "Is this safe for pregnant women, prenatal use, and breastfeeding mothers?", weight: 0.04, recommendation: "Add pregnancy safety language and breastfeeding compatibility statements." },
    { name: "athletes_active", query: "Which product is ideal for athletes, active lifestyles, and fitness enthusiasts?", weight: 0.04, recommendation: "Target athletes with performance, recovery, and routine integration details." },
    { name: "mature_skin", query: "What is best for mature skin, aging skin, and adults over 50?", weight: 0.03, recommendation: "Include age-specific benefits and language targeting adults over 50." },
    { name: "sensitive_individuals", query: "Is this safe for sensitive individuals, allergy-prone people, and those with intolerances?", weight: 0.04, recommendation: "Explicitly state hypoallergenic, free-from common allergens, and sensitivity-safe." },
    { name: "vegan_vegetarian", query: "Is this vegan, vegetarian, plant-based, and free from animal products?", weight: 0.04, recommendation: "Add vegan/vegetarian/plant-based certifications and explicit labeling." },
    { name: "clinical_evidence", query: "Which product has clinical studies, research backing, and scientific evidence?", weight: 0.05, recommendation: "Reference clinical studies, research, trials, or scientific backing." },
    { name: "third_party_tested", query: "What is third-party tested, lab verified, and independently certified for purity?", weight: 0.05, recommendation: "Prominently feature third-party testing, COA availability, and lab verification." },
    { name: "certifications", query: "Which has GMP, Non-GMO, organic, vegan, or NSF certifications?", weight: 0.05, recommendation: "List all certifications: GMP, Non-GMO, Organic, NSF, Vegan, etc." },
    { name: "detailed_specifications", query: "What are the exact dosage, form, concentration, pH, and ingredient percentages?", weight: 0.04, recommendation: "Add exact dosage, form, concentration percentages, pH, and serving sizes." },
    { name: "intent_richness", query: "Does this explain HOW it works, the mechanism, and WHY it is effective?", weight: 0.04, recommendation: "Explain HOW the product works at a cellular/mechanism level, not just WHAT it does." },
    { name: "specific_use_cases", query: "What are the specific use cases, timing, routines, and lifestyle integrations?", weight: 0.04, recommendation: "Add timing guidelines, routine integration, and lifestyle-specific use cases." },
    { name: "comparison_differentiation", query: "How does this compare to alternatives, competitors, and generic versions?", weight: 0.03, recommendation: "Explicitly compare against generic alternatives and state unique differentiators." }
  ],
  beauty_skincare: [
    { name: "skin_hydration", query: "Does this product provide deep skin hydration, moisture retention, or prevent dryness?", weight: 0.10, recommendation: "State skin hydration benefits clearly with specific mechanisms (e.g. hyaluronic acid molecular weight)." },
    { name: "barrier_repair", query: "Does this product repair the skin barrier and restore the acid mantle?", weight: 0.09, recommendation: "Detail barrier repair properties using ceramide, lipid, or pH-balancing claims." },
    { name: "anti_aging", query: "Does this reduce wrinkles, fine lines, or improve skin firmness and collagen?", weight: 0.09, recommendation: "Add anti-aging mechanism descriptions like collagen synthesis support or peptide technology." },
    { name: "sensitive_skin", query: "Is this safe for sensitive, eczema-prone skin and free from fragrance/alcohol?", weight: 0.09, recommendation: "Include dermatologist-tested claims and explicitly mention suitability for sensitive/eczema-prone skin." },
    { name: "brightening", query: "Does it fade dark spots, brighten hyperpigmentation, or even out skin tone?", weight: 0.08, recommendation: "Mention brightening benefits with ingredient mechanism details (e.g. Niacinamide or Vitamin C stability)." },
    { name: "texture_smoothing", query: "Does it improve skin texture, minimize pores, or smooth rough patches?", weight: 0.08, recommendation: "Detail texture improvement, exfoliation mechanisms, or pore-minimizing features." },
    { name: "acne_breakout_safe", query: "Is it non-comedogenic, oil-free, or does it prevent acne and clogged pores?", weight: 0.07, recommendation: "Specify non-comedogenic, oil-free properties, or suitability for acne-prone skin." },
    { name: "ingredient_safety", query: "Is it free from parabens, sulfates, phthalates, and toxic chemicals?", weight: 0.07, recommendation: "Explicitly list clean-label credentials, free-from claims, and non-toxic parameters." },
    { name: "absorption_feel", query: "Does it absorb quickly without being greasy, sticky, or heavy?", weight: 0.07, recommendation: "Describe the product texture, absorption speed, and non-greasy skin feel." },
    { name: "clinical_evidence", query: "Is this recommended by dermatologists or backed by clinical trials?", weight: 0.07, recommendation: "Reference dermatologist reviews, clinical trials, or user study statistics." },
    { name: "specific_use_cases", query: "What is the recommended application routine, step order, and frequency?", weight: 0.07, recommendation: "Add detailed routine instructions, usage frequency, and step-by-step application order." },
    { name: "comparison", query: "How does this compare to other serums, moisturizers, or premium brands?", weight: 0.06, recommendation: "Add unique differentiators comparing its formulation or value to market leading alternatives." }
  ],
  electronics: [
    { name: "charging_speed", query: "What is the charging speed, wattage, or power delivery capacity?", weight: 0.10, recommendation: "Add exact charging specs, wattage metrics, and protocol compatibilities (e.g., PD 3.0, QC 4.0)." },
    { name: "compatibility", query: "What devices, operating systems, or ports is this compatible with?", weight: 0.10, recommendation: "Include an explicit compatibility list of devices, models, and OS versions." },
    { name: "durability_build", query: "Is the build quality durable, drop-tested, or made of high-quality materials?", weight: 0.09, recommendation: "Describe build material durability, drop-test ratings, or shielding materials." },
    { name: "battery_life", query: "What is the battery life, capacity, charging cycles, or runtime?", weight: 0.09, recommendation: "Detail battery performance, mAh capacity, and runtime under typical use conditions." },
    { name: "signal_connectivity", query: "Is the bluetooth/wifi range stable, latency-free, and easy to pair?", weight: 0.08, recommendation: "Specify wireless version, transmission range, latency speeds, and pairing ease." },
    { name: "sound_display_quality", query: "What is the audio resolution, bass depth, or screen brightness/refresh rate?", weight: 0.08, recommendation: "Detail technical display/audio specs (refresh rate, resolution, driver sizes, frequency response)." },
    { name: "setup_ease", query: "Is the setup process plug-and-play, easy to install, or does it need drivers?", weight: 0.08, recommendation: "Highlight plug-and-play ease, software installation requirements, or setup guides." },
    { name: "safety_protection", query: "Does it have overcurrent, short circuit, overheat, or surge protection?", weight: 0.08, recommendation: "Add explicit safety mechanisms such as temperature control, surge protection, or certifications (UL, CE, FCC)." },
    { name: "warranty_support", query: "What is the warranty period, return policy, and customer service reliability?", weight: 0.08, recommendation: "Clearly outline manufacturer warranty details and customer service response guarantees." },
    { name: "accessories_included", query: "What items, cables, cases, or adapters are included in the box?", weight: 0.08, recommendation: "List all items included in the packaging (cables, adapters, cases, manuals)." },
    { name: "size_portability", query: "Is it lightweight, compact, travel-friendly, and easy to carry?", weight: 0.07, recommendation: "Detail weight, dimensions, and portable features (foldable, travel pouch)." },
    { name: "comparison", query: "How does it compare to major name-brand competitors in performance and price?", weight: 0.05, recommendation: "Highlight performance advantages and value differentiation versus generic brands." }
  ],
  home_kitchen: [
    { name: "materials_safety", query: "Is it BPA-free, non-toxic, food-grade safe, or lead-free?", weight: 0.10, recommendation: "Highlight material safety attributes such as BPA-free, food-grade silicone, or stainless steel standard." },
    { name: "cleaning_maintenance", query: "Is it dishwasher safe, easy to clean, or stain-resistant?", weight: 0.10, recommendation: "Specify if it is dishwasher safe, easy to hand wash, or stain-resistant." },
    { name: "durability", query: "Is it heat-resistant, scratch-resistant, rust-proof, and long-lasting?", weight: 0.09, recommendation: "Detail material resistance to heat, scratching, cracking, or rust." },
    { name: "ease_of_use", query: "Is it easy to operate, ergonomic, and user-friendly for daily tasks?", weight: 0.09, recommendation: "Highlight ergonomic handle design, easy-pour rims, or user-friendly interface control." },
    { name: "size_capacity", query: "What are the exact dimensions, volume capacity, or storage footprint?", weight: 0.09, recommendation: "Specify exact product dimensions, volume capacities (e.g. quarts, liters), or size configurations." },
    { name: "performance_efficiency", query: "How quickly does it heat up, blend, cook, or perform its primary task?", weight: 0.08, recommendation: "Describe operational efficiency, speed parameters, power wattage, or performance rates." },
    { name: "design_aesthetics", query: "Does it look modern, fit standard countertops, and match kitchen decor?", weight: 0.08, recommendation: "Detail styling characteristics, color finishes, and how it complements modern decor." },
    { name: "storage_saving", query: "Is it stackable, space-saving, or easy to store in cabinets?", weight: 0.08, recommendation: "Mention space-saving attributes such as stackability or compact storage capability." },
    { name: "safety_features", query: "Does it have auto-shutoff, lock mechanisms, or cool-touch handles?", weight: 0.08, recommendation: "Highlight built-in safety controls like auto-shutoff, lock buttons, or cool-touch insulation." },
    { name: "versatility", query: "Can it be used on induction/gas stoves, or perform multiple kitchen functions?", weight: 0.08, recommendation: "Highlight multipurpose utility, multi-cook features, or cooktop compatibilities." },
    { name: "assembly_install", query: "Does it come pre-assembled or is it easy to install without extra tools?", weight: 0.07, recommendation: "Specify if no assembly is required or outline easy tool-free installation steps." },
    { name: "comparison", query: "How does it compare to premium kitchen brands in reliability and value?", weight: 0.04, recommendation: "Add unique differentiators highlighting craftsmanship, warranty, or cost benefits." }
  ]
};

const GENERIC_TAXONOMY: IntentDimension[] = [
  { name: "product_quality", query: "Is this product durable, high quality, and worth the money?", weight: 0.12, recommendation: "Describe material durability, warranty policies, and manufacturing quality standards." },
  { name: "safety_certifications", query: "What safety certifications, standards, or tests has this passed?", weight: 0.12, recommendation: "Detail safety certifications, third-party lab tests, and clean materials standards." },
  { name: "compatibility_specs", query: "What are the exact specifications, dimensions, and compatibility details?", weight: 0.12, recommendation: "Provide exact specs, dimensions, weights, and accessory compatibility listings." },
  { name: "ease_of_use", query: "Is this easy to set up, operate, and use daily?", weight: 0.10, recommendation: "Highlight simple step-by-step setup guides or operational ease details." },
  { name: "target_audience", query: "Who is the ideal user for this product and who is it not recommended for?", weight: 0.10, recommendation: "Specify ideal buyer personas and explicit use suitability statements." },
  { name: "specific_use_cases", query: "What are the recommended use cases, routines, and environments for this?", weight: 0.10, recommendation: "Add guidance on usage environments, schedules, or contextual applications." },
  { name: "manufacturer_trust", query: "Is this from a reputable brand with a good warranty and customer support?", weight: 0.10, recommendation: "Include brand history, customer satisfaction commitment, and warranty details." },
  { name: "differentiation", query: "How is this product superior to cheaper, generic alternatives?", weight: 0.08, recommendation: "List unique performance advantages and value additions over standard copycats." },
  { name: "shipping_packaging", query: "What is included in the package and is it securely packed?", weight: 0.08, recommendation: "Provide a detailed list of what's in the box and describes secure packaging elements." },
  { name: "environmental_ethical", query: "Is this eco-friendly, organic, cruelty-free, or made of sustainable materials?", weight: 0.08, recommendation: "Add eco-friendly, cruelty-free, or recyclable material details if applicable." }
];

// Caches for optimization
const dynamicTaxonomyCache = new Map<string, IntentDimension[]>();
const intentEmbeddingCache = new Map<string, number[]>();

function matchCategoryKey(category: string, subcategory: string): string | null {
  const text = `${category} ${subcategory}`.toLowerCase();
  if (text.includes("supplement") || text.includes("vitamin") || text.includes("dietary") || text.includes("health & household")) {
    return "health_supplements";
  }
  if (text.includes("beauty") || text.includes("skincare") || text.includes("skin") || text.includes("serum") || text.includes("moisturizer") || text.includes("cosmetics")) {
    return "beauty_skincare";
  }
  if (text.includes("electronic") || text.includes("phone") || text.includes("charger") || text.includes("cable") || text.includes("headphone") || text.includes("camera") || text.includes("laptop")) {
    return "electronics";
  }
  if (text.includes("kitchen") || text.includes("home & kitchen") || text.includes("cookware") || text.includes("appliance")) {
    return "home_kitchen";
  }
  return null;
}

async function generateDynamicTaxonomy(
  category: string,
  subcategory: string,
  productTitle: string
): Promise<IntentDimension[]> {
  const cacheKey = `${category.toLowerCase().trim()}_${subcategory.toLowerCase().trim()}`;
  if (dynamicTaxonomyCache.has(cacheKey)) {
    return dynamicTaxonomyCache.get(cacheKey)!;
  }

  const prompt = `You are an Amazon SEO and conversational search AI expert.
Your job is to generate a custom 10-item buyer intent taxonomy for a product category on Amazon.
These intents will be used to compute a Rufus AI alignment score by measuring vector similarity against listing text.

PRODUCT CATEGORY: ${category}
PRODUCT SUBCATEGORY: ${subcategory}
PRODUCT SAMPLE TITLE: ${productTitle}

For this category, what are the top 10 distinct, specific questions or search intents that buyers ask Amazon's Rufus AI assistant?
For each intent, define:
1. An internal snake_case "name" (e.g. "hypoallergenic_safe", "battery_life").
2. A natural "query" (a realistic search query or question a buyer would ask Rufus, e.g., "Is this safe for sensitive dogs?", "How long does the battery last on a single charge?").
3. A relative "weight" (a float between 0.05 and 0.15, such that the sum of all 10 weights equals exactly 1.0).
4. A concrete, actionable "recommendation" template (what copywriting instruction should be given if the listing fails this intent, e.g., "Explicitly state hypoallergenic status and list certified allergen-free ingredients.").

Return ONLY a valid JSON object with the key "intents" containing an array of objects. Do not include markdown codeblocks or extra text. Output must be raw JSON:
{
  "intents": [
    {
      "name": "string",
      "query": "string",
      "weight": number,
      "recommendation": "string"
    }
  ]
}`;

  try {
    const response = await callLlm({
      messages: [
        { role: "system", content: "You are a database parser that outputs raw JSON array. Never wrap output in markdown code blocks." },
        { role: "user", content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    }, { service: "dynamic_taxonomy" });

    const data = JSON.parse(response.content) as { intents: IntentDimension[] };
    if (data && Array.isArray(data.intents) && data.intents.length > 0) {
      let sum = data.intents.reduce((acc, d) => acc + (d.weight || 0.1), 0);
      if (sum === 0) sum = 1;
      const normalized = data.intents.map((d) => ({
        name: d.name || "intent",
        query: d.query || "Query",
        weight: (d.weight || 0.1) / sum,
        recommendation: d.recommendation || "Improve listing information for this intent."
      }));
      dynamicTaxonomyCache.set(cacheKey, normalized);
      return normalized;
    }
  } catch (err) {
    console.error(`[Analysis Engine] Failed to generate dynamic taxonomy for ${category}/${subcategory}:`, err);
  }

  return GENERIC_TAXONOMY;
}

async function resolveIntentEmbeddings(queries: string[]): Promise<Map<string, number[]>> {
  const resolved = new Map<string, number[]>();
  const uncachedQueries: string[] = [];

  for (const q of queries) {
    if (intentEmbeddingCache.has(q)) {
      resolved.set(q, intentEmbeddingCache.get(q)!);
    } else {
      uncachedQueries.push(q);
    }
  }

  if (uncachedQueries.length > 0) {
    try {
      const embeddings = await generateEmbedding(uncachedQueries);
      for (let i = 0; i < uncachedQueries.length; i++) {
        const q = uncachedQueries[i];
        const emb = embeddings[i];
        intentEmbeddingCache.set(q, emb);
        resolved.set(q, emb);
      }
    } catch (err) {
      console.error("[Analysis Engine] Failed to generate batched intent embeddings, falling back element-by-element:", err);
      for (const q of uncachedQueries) {
        try {
          const emb = await generateEmbedding(q);
          intentEmbeddingCache.set(q, emb);
          resolved.set(q, emb);
        } catch (e) {
          const dummy = generateFallbackEmbedding(q);
          intentEmbeddingCache.set(q, dummy);
          resolved.set(q, dummy);
        }
      }
    }
  }

  return resolved;
}

// -------------------------------------------------------------------------
// Local text similarity fallback (Jaccard + Word Overlap scaled to [0.35, 0.90])
// -------------------------------------------------------------------------
export function computeLocalTextSimilarity(text1: string, text2: string): number {
  const stopwords = new Set([
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at",
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can", "cant", "cannot", "could", "couldnt",
    "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during",
    "each", "few", "for", "from", "further",
    "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here", "heres",
    "hers", "herself", "him", "himself", "his", "how", "hows",
    "i", "id", "ill", "im", "ive", "if", "in", "into", "is", "isnt", "it", "its", "itself",
    "lets", "me", "more", "most", "mustnt", "my", "myself",
    "no", "nor", "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
    "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such",
    "than", "that", "thats", "the", "their", "theirs", "them", "themselves", "then", "there", "theres", "these", "they",
    "theyd", "theyll", "theyre", "theyve", "this", "those", "through", "to", "too", "under", "until", "up", "very",
    "was", "wasnt", "we", "wed", "well", "were", "weve", "werent", "what", "whats", "when", "whens", "where", "wheres",
    "which", "while", "who", "whos", "whom", "why", "whys", "with", "wont", "would", "wouldnt",
    "you", "youd", "youll", "youre", "youve", "your", "yours", "yourself", "yourselves"
  ]);

  const tokenize = (t: string) => {
    return new Set(
      t
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !stopwords.has(word))
    );
  };

  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  if (tokens1.size === 0 || tokens2.size === 0) {
    return 0.35;
  }

  let intersection = 0;
  for (const token of tokens2) {
    if (tokens1.has(token)) {
      intersection++;
    }
  }

  const union = tokens1.size + tokens2.size - intersection;
  const jaccard = intersection / union;

  // Map Jaccard [0, 1] to a typical embedding cosine similarity range [0.35, 0.90]
  return 0.35 + 0.55 * jaccard;
}

// -------------------------------------------------------------------------
// COSMO structural readiness check
// -------------------------------------------------------------------------
export function evaluateCosmoReadiness(text: string): number {
  const lower = text.toLowerCase();
  let score = 0;

  // 1. Target Demographics (max 25 points)
  const demographicPatterns = [
    /pregnant|prenatal|breastfeeding|postnatal/i,
    /athlete|active|fitness|workout|gym/i,
    /mature|aging|adults?|elderly|over 50/i,
    /sensitive|allergy|allergies|intolerance|eczema/i,
    /vegan|vegetarian|plant-based/i,
    /for men|for women|unisex|kids|children/i
  ];
  let demographicMatches = 0;
  for (const p of demographicPatterns) {
    if (p.test(lower)) demographicMatches++;
  }
  score += Math.min(25, demographicMatches * 10);

  // 2. Contextual Use Cases & Routine (max 25 points)
  const useCasePatterns = [
    /direction|timing|routine|frequency|guidelines/i,
    /morning|night|daily|weekly|bedtime|pm|am/i,
    /before|after|with meals?|empty stomach|post-workout/i,
    /dosage|serving|apply|take|consume|swallow/i
  ];
  let useCaseMatches = 0;
  for (const p of useCasePatterns) {
    if (p.test(lower)) useCaseMatches++;
  }
  score += Math.min(25, useCaseMatches * 8);

  // 3. Trust Signals & Certifications (max 25 points)
  const trustPatterns = [
    /clinical|study|studies|trial|research|backed/i,
    /tested|independent|third-party|lab/i,
    /gmp|certified|certification|standard|facility/i,
    /non-gmo|organic|vegan|gluten-free|coa/i
  ];
  let trustMatches = 0;
  for (const p of trustPatterns) {
    if (p.test(lower)) trustMatches++;
  }
  score += Math.min(25, trustMatches * 8);

  // 4. Competitive Differentiation (max 25 points)
  const diffPatterns = [
    /unlike|compared|alternative|generic|substitute/i,
    /unique|differentiator|standout|exclusive/i,
    /superior|bioavail|absorption|premium/i,
    /better than|standard|traditional|ordinary/i
  ];
  let diffMatches = 0;
  for (const p of diffPatterns) {
    if (p.test(lower)) diffMatches++;
  }
  score += Math.min(25, diffMatches * 8);

  return score;
}

/**
 * Analyze semantic gaps by computing cosine similarity between the listing
 * embedding and dynamic or category-specific intent vectors. Returns a real
 * Rufus Score (0-100) and prioritized gap analysis.
 */
export async function analyzeSemanticGaps(
  embedding: number[],
  cleaned: CleanedText
): Promise<AnalysisResult> {
  const gaps: SemanticGap[] = [];
  let weightedScore = 0;
  let totalWeight = 0;

  const category = cleaned.source?.category || "";
  const subcategory = cleaned.source?.subcategory || "";
  const title = cleaned.source?.title || "";

  // 1. Resolve taxonomy dimensions
  let taxonomy = GENERIC_TAXONOMY;
  const matchedKey = matchCategoryKey(category, subcategory);
  if (matchedKey) {
    taxonomy = CATEGORY_TAXONOMIES[matchedKey];
  } else if (category || subcategory) {
    taxonomy = await generateDynamicTaxonomy(category, subcategory, title);
  }

  // 2. Check if embedding is fallback vector
  const fallbackVector = generateFallbackEmbedding(cleaned.text);
  const isFallbackListing = cosineSimilarity(embedding, fallbackVector) > 0.999;

  // 3. Resolve all intent query embeddings
  const queries = taxonomy.map((d) => d.query);
  const intentEmbeddings = await resolveIntentEmbeddings(queries);

  // 4. Calculate similarities and gaps
  for (const dim of taxonomy) {
    let similarity = 0;
    if (isFallbackListing) {
      similarity = computeLocalTextSimilarity(cleaned.text, dim.query);
    } else {
      const intentEmbedding = intentEmbeddings.get(dim.query);
      if (intentEmbedding) {
        similarity = cosineSimilarity(embedding, intentEmbedding);
      } else {
        similarity = computeLocalTextSimilarity(cleaned.text, dim.query);
      }
    }

    const normalizedScore = Math.max(0, similarity);
    const targetScore = 0.85;
    const gap = Math.max(0, targetScore - normalizedScore);

    weightedScore += normalizedScore * dim.weight;
    totalWeight += dim.weight;

    if (gap > 0.05) {
      gaps.push({
        dimension: dim.name,
        currentScore: Math.round(normalizedScore * 100) / 100,
        targetScore: Math.round(targetScore * 100) / 100,
        gap: Math.round(gap * 100) / 100,
        priority: gap > 0.40 ? "critical" : gap > 0.20 ? "high" : gap > 0.10 ? "medium" : "low",
        recommendation: dim.recommendation,
      });
    }
  }

  gaps.sort((a, b) => b.gap - a.gap);

  // Normalize Rufus score from similarity range [0.35, 0.85] to [0, 100]
  const avgSimilarity = weightedScore / (totalWeight || 1);
  const rawRufusScore = Math.round(((avgSimilarity - 0.35) / 0.50) * 100);
  const rufusScore = Math.min(100, Math.max(0, rawRufusScore));

  // COSMO Score: structural readiness score combined with Rufus Score
  const cosmoReadiness = evaluateCosmoReadiness(cleaned.text);
  const cosmoScore = Math.round(rufusScore * 0.4 + cosmoReadiness * 0.6);

  return {
    rufusScore,
    cosmoScore: Math.min(100, Math.max(0, cosmoScore)),
    semanticGaps: gaps,
  };
}
