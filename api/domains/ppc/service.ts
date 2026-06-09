import * as listingRepo from "../listing/repository.js";
import * as analysisRepo from "../analysis/repository.js";

export interface PpcKeywordData {
  intent: string;
  keyword: string;
  difficulty: string;
  searchVolume: number;
  bidEstimate: number;
  organicRank?: number;
  isRankBooster?: boolean;
}

export interface PpcPlanResult {
  campaignName: string;
  dailyBudget: number;
  biddingStrategy: string;
  rankBoosterEnabled: boolean;
  adGroups: {
    name: string;
    keywords: PpcKeywordData[];
  }[];
  negativeKeywords: string[];
}

// Deterministic mock organic rank helper based on keyword string hash
export function getMockOrganicRank(keyword: string): number {
  let hash = 0;
  for (let i = 0; i < keyword.length; i++) {
    hash = keyword.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 48) + 1; // Returns a rank from 1 to 48
}

// Generate negative phrase keywords based on product form and gap analysis
export function generateNegatives(
  title: string,
  description: string,
  bullets: string[],
  gaps: any[]
): string[] {
  const text = `${title} ${description} ${bullets.join(" ")}`.toLowerCase();

  const forms = [
    { name: "capsule", terms: ["capsule", "capsules", "pill", "pills", "veggie cap", "veggie caps"] },
    { name: "powder", terms: ["powder", "powders", "mix", "drink mix"] },
    { name: "liquid", terms: ["liquid", "drops", "spray", "sprays"] },
    { name: "gummy", terms: ["gummy", "gummies", "chewable", "chewables"] },
    { name: "tablet", terms: ["tablet", "tablets"] }
  ];

  let detectedForm: string | null = null;
  for (const form of forms) {
    if (form.terms.some(term => text.includes(term))) {
      detectedForm = form.name;
      break;
    }
  }

  const negatives: string[] = [];
  if (detectedForm) {
    for (const form of forms) {
      if (form.name !== detectedForm) {
        negatives.push(form.name);
        if (form.name === "gummy") negatives.push("gummies");
      }
    }
  }

  // Check for dimensions where score is 0 or very low in gaps
  if (gaps && Array.isArray(gaps)) {
    for (const gap of gaps) {
      if (gap.currentScore === 0 || gap.currentScore === 0.0) {
        if (gap.dimension === "organic_certification" || gap.dimension === "ingredient_purity") {
          negatives.push("synthetic");
          negatives.push("artificial");
        } else if (gap.dimension === "usage_instructions") {
          negatives.push("pro");
        }
      }
    }
  }

  return [...new Set(negatives)];
}

export async function generatePpcPlan(
  prospectId: number,
  options: {
    dailyBudget?: number;
    biddingStrategy?: string;
    rankBooster?: boolean;
  } = {}
): Promise<PpcPlanResult> {
  const dailyBudget = options.dailyBudget ?? 50;
  const biddingStrategy = options.biddingStrategy ?? "dynamicBiddingUpDown";
  const rankBoosterEnabled = options.rankBooster ?? true;

  // 1. Fetch listing and analysis
  const listing = await listingRepo.getLatestByProspectId(prospectId);
  if (!listing) {
    throw new Error(`Listing not found for prospect ID ${prospectId}`);
  }

  const analysis = await analysisRepo.getLatestByProspectId(prospectId);
  if (!analysis) {
    throw new Error(`Analysis not found for prospect ID ${prospectId}`);
  }

  // 2. Parse keywords
  let keywordsList: PpcKeywordData[] = [];
  if (analysis.copyPpcKeywords) {
    try {
      keywordsList = JSON.parse(analysis.copyPpcKeywords) as PpcKeywordData[];
    } catch (err) {
      console.error("Failed to parse copyPpcKeywords:", err);
    }
  }

  // 3. Process keywords: calculate organic rank and adjust bids
  const processedKeywords = keywordsList.map((kw) => {
    const organicRank = kw.organicRank ?? getMockOrganicRank(kw.keyword);
    const isOnPage2 = organicRank >= 17 && organicRank <= 48;
    const isRankBooster = isOnPage2 && rankBoosterEnabled;
    const bidEstimate = isRankBooster
      ? parseFloat((kw.bidEstimate * 1.15).toFixed(2))
      : kw.bidEstimate;

    return {
      ...kw,
      organicRank,
      isRankBooster,
      bidEstimate,
    };
  });

  // 4. Intent Grouping: group keywords into ad groups
  const adGroupsMap = new Map<string, PpcKeywordData[]>();
  for (const kw of processedKeywords) {
    const intentName = kw.intent || "General";
    const adGroupName = `Intent_${intentName.replace(/\s+/g, "_")}`;
    if (!adGroupsMap.has(adGroupName)) {
      adGroupsMap.set(adGroupName, []);
    }
    adGroupsMap.get(adGroupName)!.push(kw);
  }

  const adGroups = Array.from(adGroupsMap.entries()).map(([name, keywords]) => ({
    name,
    keywords,
  }));

  // 5. Budget Defense: generate negative phrase keywords
  let gaps: any[] = [];
  if (analysis.gaps) {
    try {
      gaps = typeof analysis.gaps === "string" ? JSON.parse(analysis.gaps) : analysis.gaps;
    } catch {}
  }
  const bullets: string[] = Array.isArray(listing.bullets) ? (listing.bullets as string[]) : [];
  const negativeKeywords = generateNegatives(
    listing.title || "",
    listing.description || "",
    bullets,
    gaps
  );

  const brandName = listing.brand || "Brand";
  const campaignName = `SP_Manual_Synergy_${brandName.replace(/\s+/g, "_")}_${listing.asin}`;

  return {
    campaignName,
    dailyBudget,
    biddingStrategy,
    rankBoosterEnabled,
    adGroups,
    negativeKeywords,
  };
}

export function convertPlanToCsv(plan: PpcPlanResult, asin: string): string {
  const headers = [
    "Product",
    "Entity",
    "Operation",
    "Campaign Id",
    "Ad Group Id",
    "Portfolio Id",
    "Campaign Name",
    "Ad Group Name",
    "Start Date",
    "End Date",
    "Targeting Type",
    "State",
    "Daily Budget",
    "SKU",
    "ASIN",
    "Bid",
    "Keyword Text",
    "Match Type",
    "Bidding Strategy",
  ];

  const rows: string[][] = [];

  const campaignId = plan.campaignName;
  const campaignName = plan.campaignName;
  const todayStr = new Date().toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD

  // 1. Campaign Row
  rows.push([
    "Sponsored Products",
    "Campaign",
    "Create",
    campaignId,
    "", // Ad Group Id
    "", // Portfolio Id
    campaignName,
    "", // Ad Group Name
    todayStr,
    "", // End Date
    "Manual",
    "enabled",
    plan.dailyBudget.toString(),
    "", // SKU
    "", // ASIN
    "", // Bid
    "", // Keyword Text
    "", // Match Type
    plan.biddingStrategy,
  ]);

  for (const ag of plan.adGroups) {
    const adGroupId = `${campaignId}_${ag.name}`;
    const adGroupName = ag.name;

    // 2. Ad Group Row
    rows.push([
      "Sponsored Products",
      "Ad Group",
      "Create",
      campaignId,
      adGroupId,
      "", // Portfolio Id
      campaignName,
      adGroupName,
      "", // Start Date
      "", // End Date
      "", // Targeting Type
      "enabled",
      "", // Daily Budget
      "", // SKU
      "", // ASIN
      "1.00", // Default bid
      "", // Keyword Text
      "", // Match Type
      "", // Bidding Strategy
    ]);

    // 3. Product Ad Row
    rows.push([
      "Sponsored Products",
      "Product Ad",
      "Create",
      campaignId,
      adGroupId,
      "", // Portfolio Id
      campaignName,
      adGroupName,
      "", // Start Date
      "", // End Date
      "", // Targeting Type
      "enabled",
      "", // Daily Budget
      "", // SKU
      asin,
      "", // Bid
      "", // Keyword Text
      "", // Match Type
      "", // Bidding Strategy
    ]);

    // 4. Keyword Rows
    for (const kw of ag.keywords) {
      rows.push([
        "Sponsored Products",
        "Keyword",
        "Create",
        campaignId,
        adGroupId,
        "", // Portfolio Id
        campaignName,
        adGroupName,
        "", // Start Date
        "", // End Date
        "", // Targeting Type
        "enabled",
        "", // Daily Budget
        "", // SKU
        "", // ASIN
        kw.bidEstimate.toFixed(2),
        kw.keyword,
        "broad",
        "", // Bidding Strategy
      ]);
    }
  }

  // 5. Campaign Negative Keyword Rows
  for (const neg of plan.negativeKeywords) {
    rows.push([
      "Sponsored Products",
      "Campaign Negative Keyword",
      "Create",
      campaignId,
      "", // Ad Group Id
      "", // Portfolio Id
      campaignName,
      "", // Ad Group Name
      "", // Start Date
      "", // End Date
      "", // Targeting Type
      "enabled",
      "", // Daily Budget
      "", // SKU
      "", // ASIN
      "", // Bid
      neg,
      "negative phrase",
      "", // Bidding Strategy
    ]);
  }

  const escapeCsvValue = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\r\n");

  return csvContent;
}
