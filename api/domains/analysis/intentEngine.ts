import { callLlm } from "../../services/llmGateway.js";
import { generateEmbedding, generateFallbackEmbedding } from "../../services/embedding.js";
import { cosineSimilarity } from "../../lib/math.js";
import type {
  CleanedText,
  IntentCoverage,
  IntentJourney,
  PredictedIntent,
  SemanticGap,
} from "../../pipeline/pipeline.types.js";

export interface IntentDimension {
  name: string;
  query: string;
  weight: number;
  recommendation: string;
  journey: IntentJourney;
  signals: string[]; // keywords / phrases Rufus/COSMO looks for
}

interface AttributeInventory {
  dosage: string[];
  form: string[];
  certifications: string[];
  audience: string[];
  timing: string[];
  safety: string[];
  mechanism: string[];
}

// -------------------------------------------------------------------------
// Static category taxonomies enriched with journey stage and Rufus signals
// -------------------------------------------------------------------------
const CATEGORY_TAXONOMIES: Record<string, IntentDimension[]> = {
  health_supplements: [
    { name: "sleep_support", query: "What supplement is best for sleep and insomnia relief without side effects?", weight: 0.08, recommendation: "Add explicit sleep support claims with mechanism (e.g., 'promotes melatonin production').", journey: "usage", signals: ["sleep", "insomnia", "melatonin", "restful", "bedtime", "fall asleep"] },
    { name: "stress_anxiety_relief", query: "Which product helps with stress, anxiety, and relaxation naturally?", weight: 0.08, recommendation: "Include stress/anxiety relief messaging with calming mechanism details.", journey: "usage", signals: ["stress", "anxiety", "relaxation", "calm", "cortisol", "mood"] },
    { name: "muscle_recovery", query: "Best supplement for muscle recovery, soreness, and post-workout cramps?", weight: 0.07, recommendation: "Detail muscle recovery benefits, timing post-workout, and cramp prevention.", journey: "usage", signals: ["muscle", "recovery", "soreness", "post-workout", "cramp", "exercise"] },
    { name: "skin_health", query: "What product improves skin elasticity, complexion, and reduces wrinkles?", weight: 0.04, recommendation: "Add skin health claims with specific ingredient mechanisms and expected timelines.", journey: "usage", signals: ["skin", "elasticity", "wrinkles", "complexion", "collagen"] },
    { name: "joint_bone_health", query: "Which supplement supports joint mobility and bone density?", weight: 0.04, recommendation: "Include joint mobility and bone density support language.", journey: "usage", signals: ["joint", "mobility", "bone", "density", "osteo"] },
    { name: "digestive_gentle", query: "What is gentle on the stomach and easy to digest without causing diarrhea?", weight: 0.06, recommendation: "Explicitly state gentleness on stomach, no laxative effect, and easy digestion.", journey: "safety_trust", signals: ["gentle", "stomach", "digest", "laxative", "bloating", "nausea"] },
    { name: "energy_performance", query: "Which supplement boosts energy, reduces fatigue, and improves performance?", weight: 0.04, recommendation: "Add energy-boosting claims with sustained-release or non-jitter mechanism.", journey: "usage", signals: ["energy", "fatigue", "performance", "sustained", "jitter"] },
    { name: "barrier_repair", query: "Best product for skin barrier repair and restoring damaged moisture barrier?", weight: 0.04, recommendation: "Detail skin barrier repair with ceramide complex or lipid matrix language.", journey: "usage", signals: ["barrier", "ceramide", "lipid", "moisture barrier", "repair"] },
    { name: "brightening_pigmentation", query: "What fades dark spots, brightens dull skin, and reduces pigmentation?", weight: 0.04, recommendation: "Include brightening claims with specific ingredient concentrations and pH levels.", journey: "usage", signals: ["brightening", "dark spots", "pigmentation", "dull", "even tone"] },
    { name: "anti_aging", query: "Which product has anti-aging benefits, reduces fine lines, and improves firmness?", weight: 0.04, recommendation: "Add anti-aging mechanism language (collagen support, cell renewal, etc.).", journey: "usage", signals: ["anti-aging", "fine lines", "firmness", "collagen", "cell renewal"] },
    { name: "sensitive_skin_safe", query: "Is this safe for sensitive skin, eczema-prone skin, and won't cause breakouts?", weight: 0.04, recommendation: "Explicitly state safety for sensitive/eczema-prone skin with dermatologist testing.", journey: "safety_trust", signals: ["sensitive", "eczema", "dermatologist", "hypoallergenic", "non-irritating"] },
    { name: "hair_nail_strength", query: "What strengthens hair, reduces breakage, and improves nail growth?", weight: 0.03, recommendation: "Include hair and nail strengthening claims with biotin or keratin support.", journey: "usage", signals: ["hair", "nail", "breakage", "biotin", "keratin"] },
    { name: "pregnant_women", query: "Is this safe for pregnant women, prenatal use, and breastfeeding mothers?", weight: 0.04, recommendation: "Add pregnancy safety language and breastfeeding compatibility statements.", journey: "safety_trust", signals: ["pregnant", "prenatal", "breastfeeding", "nursing", "safe for pregnancy"] },
    { name: "athletes_active", query: "Which product is ideal for athletes, active lifestyles, and fitness enthusiasts?", weight: 0.04, recommendation: "Target athletes with performance, recovery, and routine integration details.", journey: "usage", signals: ["athletes", "active", "fitness", "workout", "sport"] },
    { name: "mature_skin", query: "What is best for mature skin, aging skin, and adults over 50?", weight: 0.03, recommendation: "Include age-specific benefits and language targeting adults over 50.", journey: "usage", signals: ["mature", "aging", "over 50", "age-defying", "adults"] },
    { name: "sensitive_individuals", query: "Is this safe for sensitive individuals, allergy-prone people, and those with intolerances?", weight: 0.04, recommendation: "Explicitly state hypoallergenic, free-from common allergens, and sensitivity-safe.", journey: "safety_trust", signals: ["sensitive", "allergy", "intolerance", "hypoallergenic", "free from"] },
    { name: "vegan_vegetarian", query: "Is this vegan, vegetarian, plant-based, and free from animal products?", weight: 0.04, recommendation: "Add vegan/vegetarian/plant-based certifications and explicit labeling.", journey: "safety_trust", signals: ["vegan", "vegetarian", "plant-based", "animal-free", "cruelty-free"] },
    { name: "clinical_evidence", query: "Which product has clinical studies, research backing, and scientific evidence?", weight: 0.05, recommendation: "Reference clinical studies, research, trials, or scientific backing.", journey: "safety_trust", signals: ["clinical", "study", "research", "trial", "scientific", "evidence"] },
    { name: "third_party_tested", query: "What is third-party tested, lab verified, and independently certified for purity?", weight: 0.05, recommendation: "Prominently feature third-party testing, COA availability, and lab verification.", journey: "safety_trust", signals: ["third-party", "lab tested", "independent", "coa", "purity"] },
    { name: "certifications", query: "Which has GMP, Non-GMO, organic, vegan, or NSF certifications?", weight: 0.05, recommendation: "List all certifications: GMP, Non-GMO, Organic, NSF, Vegan, etc.", journey: "safety_trust", signals: ["gmp", "non-gmo", "organic", "nsf", "vegan", "certified"] },
    { name: "detailed_specifications", query: "What are the exact dosage, form, concentration, pH, and ingredient percentages?", weight: 0.04, recommendation: "Add exact dosage, form, concentration percentages, pH, and serving sizes.", journey: "informational", signals: ["mg", "mcg", "capsules", "serving", "dosage", "concentration", "ph"] },
    { name: "intent_richness", query: "Does this explain HOW it works, the mechanism, and WHY it is effective?", weight: 0.04, recommendation: "Explain HOW the product works at a cellular/mechanism level, not just WHAT it does.", journey: "informational", signals: ["mechanism", "how it works", "bioavailability", "absorption", "cellular"] },
    { name: "specific_use_cases", query: "What are the specific use cases, timing, routines, and lifestyle integrations?", weight: 0.04, recommendation: "Add timing guidelines, routine integration, and lifestyle-specific use cases.", journey: "usage", signals: ["timing", "routine", "morning", "night", "with food", "daily"] },
    { name: "comparison_differentiation", query: "How does this compare to alternatives, competitors, and generic versions?", weight: 0.03, recommendation: "Explicitly compare against generic alternatives and state unique differentiators.", journey: "comparison", signals: ["unlike", "compared", "generic", "alternative", "superior", "difference"] },
  ],
  beauty_skincare: [
    { name: "skin_hydration", query: "Does this product provide deep skin hydration, moisture retention, or prevent dryness?", weight: 0.10, recommendation: "State skin hydration benefits clearly with specific mechanisms (e.g. hyaluronic acid molecular weight).", journey: "usage", signals: ["hydration", "moisture", "dryness", "hyaluronic", "plump"] },
    { name: "barrier_repair", query: "Does this product repair the skin barrier and restore the acid mantle?", weight: 0.09, recommendation: "Detail barrier repair properties using ceramide, lipid, or pH-balancing claims.", journey: "usage", signals: ["barrier", "ceramide", "repair", "acid mantle", "lipid"] },
    { name: "anti_aging", query: "Does this reduce wrinkles, fine lines, or improve skin firmness and collagen?", weight: 0.09, recommendation: "Add anti-aging mechanism descriptions like collagen synthesis support or peptide technology.", journey: "usage", signals: ["wrinkles", "fine lines", "firmness", "collagen", "anti-aging", "peptide"] },
    { name: "sensitive_skin", query: "Is this safe for sensitive, eczema-prone skin and free from fragrance/alcohol?", weight: 0.09, recommendation: "Include dermatologist-tested claims and explicitly mention suitability for sensitive/eczema-prone skin.", journey: "safety_trust", signals: ["sensitive", "eczema", "dermatologist", "fragrance-free", "alcohol-free"] },
    { name: "brightening", query: "Does it fade dark spots, brighten hyperpigmentation, or even out skin tone?", weight: 0.08, recommendation: "Mention brightening benefits with ingredient mechanism details (e.g. Niacinamide or Vitamin C stability).", journey: "usage", signals: ["brightening", "dark spots", "hyperpigmentation", "even tone", "niacinamide", "vitamin c"] },
    { name: "texture_smoothing", query: "Does it improve skin texture, minimize pores, or smooth rough patches?", weight: 0.08, recommendation: "Detail texture improvement, exfoliation mechanisms, or pore-minimizing features.", journey: "usage", signals: ["texture", "pores", "smooth", "exfoliate", "rough"] },
    { name: "acne_breakout_safe", query: "Is it non-comedogenic, oil-free, or does it prevent acne and clogged pores?", weight: 0.07, recommendation: "Specify non-comedogenic, oil-free properties, or suitability for acne-prone skin.", journey: "safety_trust", signals: ["non-comedogenic", "oil-free", "acne", "clogged pores", "breakout"] },
    { name: "ingredient_safety", query: "Is it free from parabens, sulfates, phthalates, and toxic chemicals?", weight: 0.07, recommendation: "Explicitly list clean-label credentials, free-from claims, and non-toxic parameters.", journey: "safety_trust", signals: ["paraben-free", "sulfate-free", "phthalate-free", "clean", "toxic-free"] },
    { name: "absorption_feel", query: "Does it absorb quickly without being greasy, sticky, or heavy?", weight: 0.07, recommendation: "Describe the product texture, absorption speed, and non-greasy skin feel.", journey: "usage", signals: ["absorb", "greasy", "sticky", "lightweight", "non-greasy", "fast-absorbing"] },
    { name: "clinical_evidence", query: "Is this recommended by dermatologists or backed by clinical trials?", weight: 0.07, recommendation: "Reference dermatologist reviews, clinical trials, or user study statistics.", journey: "safety_trust", signals: ["dermatologist", "clinical", "study", "trial", "recommended"] },
    { name: "specific_use_cases", query: "What is the recommended application routine, step order, and frequency?", weight: 0.07, recommendation: "Add detailed routine instructions, usage frequency, and step-by-step application order.", journey: "usage", signals: ["routine", "step", "frequency", "morning", "night", "apply"] },
    { name: "comparison", query: "How does this compare to other serums, moisturizers, or premium brands?", weight: 0.06, recommendation: "Add unique differentiators comparing its formulation or value to market leading alternatives.", journey: "comparison", signals: ["compare", "versus", "premium", "alternative", "unique"] },
  ],
  electronics: [
    { name: "charging_speed", query: "What is the charging speed, wattage, or power delivery capacity?", weight: 0.10, recommendation: "Add exact charging specs, wattage metrics, and protocol compatibilities (e.g., PD 3.0, QC 4.0).", journey: "informational", signals: ["watt", "charging speed", "power delivery", "pd", "quick charge", "fast charge"] },
    { name: "compatibility", query: "What devices, operating systems, or ports is this compatible with?", weight: 0.10, recommendation: "Include an explicit compatibility list of devices, models, and OS versions.", journey: "informational", signals: ["compatible", "iphone", "android", "usb-c", "lightning", "device"] },
    { name: "durability_build", query: "Is the build quality durable, drop-tested, or made of high-quality materials?", weight: 0.09, recommendation: "Describe build material durability, drop-test ratings, or shielding materials.", journey: "safety_trust", signals: ["durable", "drop-tested", "nylon", "braided", "aluminum", "reinforced"] },
    { name: "battery_life", query: "What is the battery life, capacity, charging cycles, or runtime?", weight: 0.09, recommendation: "Detail battery performance, mAh capacity, and runtime under typical use conditions.", journey: "informational", signals: ["mah", "battery life", "runtime", "hours", "cycles", "capacity"] },
    { name: "signal_connectivity", query: "Is the bluetooth/wifi range stable, latency-free, and easy to pair?", weight: 0.08, recommendation: "Specify wireless version, transmission range, latency speeds, and pairing ease.", journey: "usage", signals: ["bluetooth", "range", "latency", "pair", "stable", "connectivity"] },
    { name: "sound_display_quality", query: "What is the audio resolution, bass depth, or screen brightness/refresh rate?", weight: 0.08, recommendation: "Detail technical display/audio specs (refresh rate, resolution, driver sizes, frequency response).", journey: "informational", signals: ["resolution", "refresh rate", "hz", "bass", "frequency", "brightness"] },
    { name: "setup_ease", query: "Is the setup process plug-and-play, easy to install, or does it need drivers?", weight: 0.08, recommendation: "Highlight plug-and-play ease, software installation requirements, or setup guides.", journey: "usage", signals: ["plug-and-play", "easy setup", "install", "driver", "pairing"] },
    { name: "safety_protection", query: "Does it have overcurrent, short circuit, overheat, or surge protection?", weight: 0.08, recommendation: "Add explicit safety mechanisms such as temperature control, surge protection, or certifications (UL, CE, FCC).", journey: "safety_trust", signals: ["overcurrent", "short circuit", "overheat", "surge", "protection", "ul", "ce", "fcc"] },
    { name: "warranty_support", query: "What is the warranty period, return policy, and customer service reliability?", weight: 0.08, recommendation: "Clearly outline manufacturer warranty details and customer service response guarantees.", journey: "safety_trust", signals: ["warranty", "return", "support", "customer service", "guarantee"] },
    { name: "accessories_included", query: "What items, cables, cases, or adapters are included in the box?", weight: 0.08, recommendation: "List all items included in the packaging (cables, adapters, cases, manuals).", journey: "informational", signals: ["included", "cable", "adapter", "case", "manual", "box"] },
    { name: "size_portability", query: "Is it lightweight, compact, travel-friendly, and easy to carry?", weight: 0.07, recommendation: "Detail weight, dimensions, and portable features (foldable, travel pouch).", journey: "usage", signals: ["lightweight", "compact", "travel", "portable", "pocket", "foldable"] },
    { name: "comparison", query: "How does it compare to major name-brand competitors in performance and price?", weight: 0.05, recommendation: "Highlight performance advantages and value differentiation versus generic brands.", journey: "comparison", signals: ["compare", "vs", "competitor", "value", "performance"] },
  ],
  home_kitchen: [
    { name: "materials_safety", query: "Is it BPA-free, non-toxic, food-grade safe, or lead-free?", weight: 0.10, recommendation: "Highlight material safety attributes such as BPA-free, food-grade silicone, or stainless steel standard.", journey: "safety_trust", signals: ["bpa-free", "non-toxic", "food-grade", "lead-free", "stainless steel", "silicone"] },
    { name: "cleaning_maintenance", query: "Is it dishwasher safe, easy to clean, or stain-resistant?", weight: 0.10, recommendation: "Specify if it is dishwasher safe, easy to hand wash, or stain-resistant.", journey: "usage", signals: ["dishwasher", "easy clean", "stain-resistant", "hand wash", "non-stick"] },
    { name: "durability", query: "Is it heat-resistant, scratch-resistant, rust-proof, and long-lasting?", weight: 0.09, recommendation: "Detail material resistance to heat, scratching, cracking, or rust.", journey: "safety_trust", signals: ["heat-resistant", "scratch-resistant", "rust-proof", "durable", "long-lasting"] },
    { name: "ease_of_use", query: "Is it easy to operate, ergonomic, and user-friendly for daily tasks?", weight: 0.09, recommendation: "Highlight ergonomic handle design, easy-pour rims, or user-friendly interface control.", journey: "usage", signals: ["easy to use", "ergonomic", "user-friendly", "comfortable grip", "one-handed"] },
    { name: "size_capacity", query: "What are the exact dimensions, volume capacity, or storage footprint?", weight: 0.09, recommendation: "Specify exact product dimensions, volume capacities (e.g. quarts, liters), or size configurations.", journey: "informational", signals: ["quart", "liter", "capacity", "dimensions", "inches", "cm"] },
    { name: "performance_efficiency", query: "How quickly does it heat up, blend, cook, or perform its primary task?", weight: 0.08, recommendation: "Describe operational efficiency, speed parameters, power wattage, or performance rates.", journey: "informational", signals: ["watt", "heat up", "blend", "cook", "fast", "powerful"] },
    { name: "design_aesthetics", query: "Does it look modern, fit standard countertops, and match kitchen decor?", weight: 0.08, recommendation: "Detail styling characteristics, color finishes, and how it complements modern decor.", journey: "transactional", signals: ["modern", "aesthetic", "countertop", "sleek", "color"] },
    { name: "storage_saving", query: "Is it stackable, space-saving, or easy to store in cabinets?", weight: 0.08, recommendation: "Mention space-saving attributes such as stackability or compact storage capability.", journey: "usage", signals: ["stackable", "space-saving", "compact", "nest", "cabinet"] },
    { name: "safety_features", query: "Does it have auto-shutoff, lock mechanisms, or cool-touch handles?", weight: 0.08, recommendation: "Highlight built-in safety controls like auto-shutoff, lock buttons, or cool-touch insulation.", journey: "safety_trust", signals: ["auto-shutoff", "lock", "cool-touch", "safety", "non-slip"] },
    { name: "versatility", query: "Can it be used on induction/gas stoves, or perform multiple kitchen functions?", weight: 0.08, recommendation: "Highlight multipurpose utility, multi-cook features, or cooktop compatibilities.", journey: "usage", signals: ["induction", "gas", "multi-purpose", "versatile", "oven-safe"] },
    { name: "assembly_install", query: "Does it come pre-assembled or is it easy to install without extra tools?", weight: 0.07, recommendation: "Specify if no assembly is required or outline easy tool-free installation steps.", journey: "usage", signals: ["pre-assembled", "no tools", "easy install", "assembly"] },
    { name: "comparison", query: "How does it compare to premium kitchen brands in reliability and value?", weight: 0.04, recommendation: "Add unique differentiators highlighting craftsmanship, warranty, or cost benefits.", journey: "comparison", signals: ["compare", "premium", "value", "craftsmanship", "warranty"] },
  ],
};

const GENERIC_TAXONOMY: IntentDimension[] = [
  { name: "product_quality", query: "Is this product durable, high quality, and worth the money?", weight: 0.12, recommendation: "Describe material durability, warranty policies, and manufacturing quality standards.", journey: "transactional", signals: ["quality", "durable", "premium", "worth", "built to last"] },
  { name: "safety_certifications", query: "What safety certifications, standards, or tests has this passed?", weight: 0.12, recommendation: "Detail safety certifications, third-party lab tests, and clean materials standards.", journey: "safety_trust", signals: ["certified", "tested", "safety", "lab", "third-party"] },
  { name: "compatibility_specs", query: "What are the exact specifications, dimensions, and compatibility details?", weight: 0.12, recommendation: "Provide exact specs, dimensions, weights, and accessory compatibility listings.", journey: "informational", signals: ["specifications", "dimensions", "compatible", "size", "weight"] },
  { name: "ease_of_use", query: "Is this easy to set up, operate, and use daily?", weight: 0.10, recommendation: "Highlight simple step-by-step setup guides or operational ease details.", journey: "usage", signals: ["easy", "simple", "setup", "operate", "user-friendly"] },
  { name: "target_audience", query: "Who is the ideal user for this product and who is it not recommended for?", weight: 0.10, recommendation: "Specify ideal buyer personas and explicit use suitability statements.", journey: "informational", signals: ["ideal for", "recommended for", "adults", "kids", "men", "women"] },
  { name: "specific_use_cases", query: "What are the recommended use cases, routines, and environments for this?", weight: 0.10, recommendation: "Add guidance on usage environments, schedules, or contextual applications.", journey: "usage", signals: ["use case", "routine", "daily", "environment", "timing"] },
  { name: "manufacturer_trust", query: "Is this from a reputable brand with a good warranty and customer support?", weight: 0.10, recommendation: "Include brand history, customer satisfaction commitment, and warranty details.", journey: "safety_trust", signals: ["brand", "warranty", "support", "trusted", "guarantee"] },
  { name: "differentiation", query: "How is this product superior to cheaper, generic alternatives?", weight: 0.08, recommendation: "List unique performance advantages and value additions over standard copycats.", journey: "comparison", signals: ["unlike", "compared", "generic", "superior", "unique"] },
  { name: "shipping_packaging", query: "What is included in the package and is it securely packed?", weight: 0.08, recommendation: "Provide a detailed list of what's in the box and describes secure packaging elements.", journey: "informational", signals: ["included", "package", "box", "packaging", "accessories"] },
  { name: "environmental_ethical", query: "Is this eco-friendly, organic, cruelty-free, or made of sustainable materials?", weight: 0.08, recommendation: "Add eco-friendly, cruelty-free, or recyclable material details if applicable.", journey: "safety_trust", signals: ["eco-friendly", "organic", "cruelty-free", "sustainable", "recyclable"] },
];

// Caches
const dynamicTaxonomyCache = new Map<string, { dimensions: IntentDimension[]; cachedAt: number }>();
const intentEmbeddingCache = new Map<string, number[]>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24h

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

export function extractAttributeInventory(text: string): AttributeInventory {
  const lower = text.toLowerCase();
  const inventory: AttributeInventory = {
    dosage: [],
    form: [],
    certifications: [],
    audience: [],
    timing: [],
    safety: [],
    mechanism: [],
  };

  const dosageMatches = lower.match(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|oz|capsules?|caps?|tablets?|pills?|softgels?|servings?)\b/g);
  if (dosageMatches) inventory.dosage.push(...Array.from(new Set(dosageMatches)));

  const formMatches = lower.match(/\b(capsules?|tablets?|softgels?|powder|liquid|cream|serum|gel|moisturizer|cleanser|oil|spray)\b/g);
  if (formMatches) inventory.form.push(...Array.from(new Set(formMatches)));

  const certMatches = lower.match(/\b(third-party tested|gmp|non-gmo|organic|vegan|gluten-free|coa|nsf|usda|fda|ul|ce|fcc|certified|lab tested)\b/g);
  if (certMatches) inventory.certifications.push(...Array.from(new Set(certMatches)));

  const audienceMatches = lower.match(/\b(athletes|pregnant|women|men|seniors|adults|kids|children|sensitive|vegan|vegetarian|active|fitness|mature)\b/g);
  if (audienceMatches) inventory.audience.push(...Array.from(new Set(audienceMatches)));

  const timingMatches = lower.match(/\b(morning|night|evening|daily|before bed|with meals?|empty stomach|post-workout|am|pm|bedtime)\b/g);
  if (timingMatches) inventory.timing.push(...Array.from(new Set(timingMatches)));

  const safetyMatches = lower.match(/\b(safe|warning|allergen|consult|side effects?|doctor|hypoallergenic|free from|non-toxic)\b/g);
  if (safetyMatches) inventory.safety.push(...Array.from(new Set(safetyMatches)));

  const mechanismMatches = lower.match(/\b(absorption|bioavailability|clinically studied|mechanism|how it works|cellular|study|research|trial)\b/g);
  if (mechanismMatches) inventory.mechanism.push(...Array.from(new Set(mechanismMatches)));

  return inventory;
}

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
    "you", "youd", "youll", "youre", "youve", "your", "yours", "yourself", "yourselves",
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

async function generateDynamicTaxonomy(
  category: string,
  subcategory: string,
  productTitle: string
): Promise<IntentDimension[]> {
  const cacheKey = `${category.toLowerCase().trim()}_${subcategory.toLowerCase().trim()}`;
  const cached = dynamicTaxonomyCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.dimensions;
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
2. A natural "query" (a realistic search query or question a buyer would ask Rufus).
3. A relative "weight" (float 0.05-0.15, sum to exactly 1.0).
4. A concrete "recommendation" (copywriting instruction if the listing fails this intent).
5. A "journey" stage: one of informational, transactional, comparison, safety_trust, usage.
6. A list of 5-8 "signals" (keywords/phrases Rufus/COSMO expects to see in a listing that satisfies this intent).

Return ONLY a valid JSON object with the key "intents" containing an array of objects. Do not include markdown codeblocks or extra text. Output must be raw JSON:
{
  "intents": [
    {
      "name": "string",
      "query": "string",
      "weight": number,
      "recommendation": "string",
      "journey": "informational|transactional|comparison|safety_trust|usage",
      "signals": ["string", ...]
    }
  ]
}`;

  try {
    const response = await callLlm({
      messages: [
        { role: "system", content: "You are a database parser that outputs raw JSON array. Never wrap output in markdown code blocks." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    }, { service: "dynamic_taxonomy" });

    const data = JSON.parse(response.content) as { intents: Array<Partial<IntentDimension>> };
    if (data && Array.isArray(data.intents) && data.intents.length > 0) {
      let sum = data.intents.reduce((acc, d) => acc + (d.weight || 0.1), 0);
      if (sum === 0) sum = 1;
      const validJourneys: IntentJourney[] = ["informational", "transactional", "comparison", "safety_trust", "usage"];
      const normalized: IntentDimension[] = data.intents.map((d) => ({
        name: d.name || "intent",
        query: d.query || "Query",
        weight: (d.weight || 0.1) / sum,
        recommendation: d.recommendation || "Improve listing information for this intent.",
        journey: validJourneys.includes(d.journey as IntentJourney) ? (d.journey as IntentJourney) : "informational",
        signals: Array.isArray(d.signals) && d.signals.length > 0 ? d.signals : ["quality", "details"],
      }));
      dynamicTaxonomyCache.set(cacheKey, { dimensions: normalized, cachedAt: Date.now() });
      return normalized;
    }
  } catch (err) {
    console.error(`[Intent Engine] Failed to generate dynamic taxonomy for ${category}/${subcategory}:`, err);
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
      console.error("[Intent Engine] Failed to generate batched intent embeddings, falling back element-by-element:", err);
      for (const q of uncachedQueries) {
        try {
          const emb = await generateEmbedding(q);
          intentEmbeddingCache.set(q, emb);
          resolved.set(q, emb);
        } catch {
          const dummy = generateFallbackEmbedding(q);
          intentEmbeddingCache.set(q, dummy);
          resolved.set(q, dummy);
        }
      }
    }
  }

  return resolved;
}

function matchesSignal(text: string, signal: string): boolean {
  const escaped = signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "i");
  return regex.test(text);
}

function computeSignalCoverage(text: string, signals: string[]): { matched: string[]; missing: string[] } {
  const matched: string[] = [];
  const missing: string[] = [];
  for (const signal of signals) {
    if (matchesSignal(text, signal)) {
      matched.push(signal);
    } else {
      missing.push(signal);
    }
  }
  return { matched, missing };
}

export async function resolveIntentTaxonomy(
  category: string,
  subcategory: string,
  title: string
): Promise<IntentDimension[]> {
  const matchedKey = matchCategoryKey(category, subcategory);
  if (matchedKey) return CATEGORY_TAXONOMIES[matchedKey];
  if (category || subcategory) return generateDynamicTaxonomy(category, subcategory, title);
  return GENERIC_TAXONOMY;
}

export interface IntentScoreResult {
  dimension: IntentDimension;
  embeddingScore: number;
  lexicalScore: number;
  signalCoverage: number;
  compositeScore: number;
  gap: number;
  matchedSignals: string[];
  missingSignals: string[];
}

export async function scoreIntents(
  listingEmbedding: number[],
  cleaned: CleanedText,
  taxonomy?: IntentDimension[]
): Promise<IntentScoreResult[]> {
  const dims = taxonomy || (await resolveIntentTaxonomy(
    cleaned.source.category,
    cleaned.source.subcategory,
    cleaned.source.title
  ));

  const fallbackVector = generateFallbackEmbedding(cleaned.text);
  const isFallbackListing = cosineSimilarity(listingEmbedding, fallbackVector) > 0.999;

  const queries = dims.map((d) => d.query);
  const intentEmbeddings = await resolveIntentEmbeddings(queries);

  const results: IntentScoreResult[] = [];
  const targetScore = 0.85;

  for (const dim of dims) {
    let embeddingScore: number;
    if (isFallbackListing) {
      embeddingScore = computeLocalTextSimilarity(cleaned.text, dim.query);
    } else {
      const intentEmbedding = intentEmbeddings.get(dim.query);
      if (intentEmbedding) {
        embeddingScore = cosineSimilarity(listingEmbedding, intentEmbedding);
      } else {
        embeddingScore = computeLocalTextSimilarity(cleaned.text, dim.query);
      }
    }

    const lexicalScore = computeLocalTextSimilarity(cleaned.text, dim.query);
    const { matched: matchedSignals, missing: missingSignals } = computeSignalCoverage(cleaned.text, dim.signals);
    const signalCoverage = dim.signals.length > 0 ? matchedSignals.length / dim.signals.length : 0;

    // Hybrid composite: 45% embedding, 35% lexical, 20% signal coverage
    const compositeScore = 0.45 * embeddingScore + 0.35 * lexicalScore + 0.20 * signalCoverage;
    const normalizedComposite = Math.max(0, Math.min(1, compositeScore));
    const gap = Math.max(0, targetScore - normalizedComposite);

    results.push({
      dimension: dim,
      embeddingScore: Math.round(embeddingScore * 100) / 100,
      lexicalScore: Math.round(lexicalScore * 100) / 100,
      signalCoverage: Math.round(signalCoverage * 100) / 100,
      compositeScore: Math.round(normalizedComposite * 100) / 100,
      gap: Math.round(gap * 100) / 100,
      matchedSignals,
      missingSignals,
    });
  }

  return results.sort((a, b) => b.gap - a.gap);
}

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
    /for men|for women|unisex|kids|children/i,
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
    /dosage|serving|apply|take|consume|swallow/i,
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
    /non-gmo|organic|vegan|gluten-free|coa/i,
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
    /better than|standard|traditional|ordinary/i,
  ];
  let diffMatches = 0;
  for (const p of diffPatterns) {
    if (p.test(lower)) diffMatches++;
  }
  score += Math.min(25, diffMatches * 8);

  return score;
}

export function buildSemanticGaps(results: IntentScoreResult[]): SemanticGap[] {
  const targetScore = 0.85;
  return results
    .filter((r) => r.gap > 0.05)
    .map((r) => ({
      dimension: r.dimension.name,
      currentScore: r.compositeScore,
      targetScore: Math.round(targetScore * 100) / 100,
      gap: r.gap,
      priority: r.gap > 0.40 ? "critical" : r.gap > 0.20 ? "high" : r.gap > 0.10 ? "medium" : "low",
      recommendation: r.dimension.recommendation,
    }));
}

export function buildPredictedIntents(results: IntentScoreResult[]): PredictedIntent[] {
  return results.map((r) => ({
    dimension: r.dimension.name,
    query: r.dimension.query,
    journey: r.dimension.journey,
    coverage: Math.round(r.compositeScore * 100),
    weight: Math.round(r.dimension.weight * 100) / 100,
    priority: r.gap > 0.40 ? "critical" : r.gap > 0.20 ? "high" : r.gap > 0.10 ? "medium" : "low",
    signals: r.matchedSignals,
    missingSignals: r.missingSignals,
  }));
}

export function buildIntentCoverage(results: IntentScoreResult[]): IntentCoverage {
  let weightedSum = 0;
  let totalWeight = 0;
  const journeyWeights: Record<IntentJourney, number> = {
    informational: 0,
    transactional: 0,
    comparison: 0,
    safety_trust: 0,
    usage: 0,
  };
  const journeyScores: Record<IntentJourney, number> = {
    informational: 0,
    transactional: 0,
    comparison: 0,
    safety_trust: 0,
    usage: 0,
  };

  let criticalCount = 0;
  let highCount = 0;

  for (const r of results) {
    const w = r.dimension.weight;
    weightedSum += r.compositeScore * w;
    totalWeight += w;
    journeyWeights[r.dimension.journey] += w;
    journeyScores[r.dimension.journey] += r.compositeScore * w;
    if (r.gap > 0.40) criticalCount++;
    else if (r.gap > 0.20) highCount++;
  }

  const byJourney: Record<IntentJourney, number> = {
    informational: 0,
    transactional: 0,
    comparison: 0,
    safety_trust: 0,
    usage: 0,
  };

  for (const journey of Object.keys(journeyWeights) as IntentJourney[]) {
    const denom = journeyWeights[journey] || 1;
    byJourney[journey] = Math.round((journeyScores[journey] / denom) * 100);
  }

  return {
    overall: Math.round((weightedSum / (totalWeight || 1)) * 100),
    byJourney,
    totalIntents: results.length,
    criticalCount,
    highCount,
  };
}
