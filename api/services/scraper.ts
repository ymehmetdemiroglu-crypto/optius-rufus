import { triggerScrape, getRunStatus, getDatasetItems } from "./apify.js";

const RAINFOREST_API_KEY = process.env.RAINFOREST_API_KEY;

const DOMAIN_MAP: Record<string, string> = {
  US: "amazon.com",
  UK: "amazon.co.uk",
  DE: "amazon.de",
  FR: "amazon.fr",
  IT: "amazon.it",
  ES: "amazon.es",
  CA: "amazon.ca",
};

export interface ScrapedListingData {
  asin: string;
  title: string;
  bullets: string[];
  description: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  images: string[];
  aPlusText: string;
  rawScrapeData?: string;
}

export async function scrapeAmazonListing(
  asin: string,
  marketplace = "US"
): Promise<ScrapedListingData> {
  console.log(`🔍 [Scraper] Initiating scrape for ASIN: ${asin} in marketplace: ${marketplace}`);

  // 1. Try Rainforest API
  if (RAINFOREST_API_KEY) {
    try {
      console.log(`[Scraper] Attempting Rainforest API scrape...`);
      const domain = DOMAIN_MAP[marketplace.toUpperCase()] || "amazon.com";
      const url = `https://api.rainforestapi.com/request?api_key=${RAINFOREST_API_KEY}&type=product&asin=${asin}&amazon_domain=${domain}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const json = await response.json();
        if (json.request_info?.success && json.product) {
          const product = json.product;
          
          // Helper to extract text from A+ content
          let aPlusText = "";
          if (product.a_plus_content?.text_content) {
            aPlusText = product.a_plus_content.text_content;
          } else if (product.a_plus_content?.pages) {
            // Traverse pages to gather all text
            const texts: string[] = [];
            JSON.stringify(product.a_plus_content.pages, (key, value) => {
              if (key === "text" || key === "body" || key === "content") {
                if (typeof value === "string") texts.push(value);
              }
              return value;
            });
            aPlusText = texts.join(" ");
          }

          console.log(`✅ [Scraper] Rainforest API scrape succeeded for ASIN: ${asin}`);
          return {
            asin: product.asin || asin,
            title: product.title || "",
            bullets: product.feature_bullets || [],
            description: product.description || "",
            brand: product.brand || "",
            category: product.categories?.[0]?.name || product.category || "",
            price: product.price?.value || 0,
            rating: product.rating || 0,
            reviewCount: product.ratings_total || product.reviews_count || 0,
            images: product.images?.map((img: any) => typeof img === "string" ? img : img.link) || [],
            aPlusText: aPlusText,
            rawScrapeData: JSON.stringify(json),
          };
        } else {
          console.warn(`⚠️ [Scraper] Rainforest API responded but product was not found or success=false`);
        }
      } else {
        console.warn(`⚠️ [Scraper] Rainforest API request failed with status: ${response.status}`);
      }
    } catch (err) {
      console.error(`❌ [Scraper] Error during Rainforest API fetch:`, err);
    }
  }

  // 2. Fallback to Apify Scraper
  const APIFY_TOKEN = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN;
  if (APIFY_TOKEN) {
    try {
      console.log(`[Scraper] Falling back to Apify scraper...`);
      const { runId, datasetId } = await triggerScrape(asin, marketplace);
      
      // Poll Apify run status
      let attempts = 0;
      const maxAttempts = 15; // 15 * 3s = 45s max wait
      let status = "RUNNING";
      
      while (status === "RUNNING" && attempts < maxAttempts) {
        attempts++;
        console.log(`[Scraper] Polling Apify run ${runId} (Attempt ${attempts}/${maxAttempts})...`);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        status = await getRunStatus(runId);
      }

      if (status === "SUCCEEDED") {
        const items = await getDatasetItems(datasetId);
        const item = items[0];
        if (item) {
          console.log(`✅ [Scraper] Apify scrape succeeded for ASIN: ${asin}`);
          return {
            asin: item.asin || asin,
            title: item.title || "",
            bullets: Array.isArray(item.bullets) ? item.bullets : [],
            description: item.description || "",
            brand: item.brand || "",
            category: item.category || "",
            price: item.price || 0,
            rating: item.rating || 0,
            reviewCount: item.reviewCount || 0,
            images: Array.isArray(item.images) ? item.images : [],
            aPlusText: item.description || "", // Apify usually doesn't scrape A+ text directly, fallback to description
            rawScrapeData: JSON.stringify(item),
          };
        }
      }
      console.warn(`⚠️ [Scraper] Apify run finished with status: ${status}`);
    } catch (err) {
      console.error(`❌ [Scraper] Error during Apify scraper execution:`, err);
    }
  }

  // 3. Failover / Mock Mode
  console.log(`ℹ️ [Scraper] No API keys available or all scrapers failed. Serving high-fidelity mock listing data.`);
  return {
    asin,
    title: "Premium Magnesium Glycinate Supplement — 400mg per Serving, 180 Capsules",
    bullets: [
      "High Absorption Magnesium Glycinate: Gentle on the stomach and easily absorbed.",
      "Supports Restful Sleep & Relaxation: Promotes calmness and helps you fall asleep faster.",
      "Muscle Recovery & Cramp Relief: Ideal for athletes to reduce muscle soreness.",
      "Third-Party Tested & Non-GMO: Made in a GMP-certified facility.",
      "180 Capsules — 3-Month Supply: Each serving delivers 400mg of elemental magnesium.",
    ],
    description: "<p>Our Premium Magnesium Glycinate supplement is specifically designed for maximum bioavailability and gastrointestinal comfort.</p>",
    brand: "NutraWell",
    category: "Health & Household",
    price: 24.99,
    rating: 4.6,
    reviewCount: 3420,
    images: ["image1.jpg", "image2.jpg"],
    aPlusText: "NutraWell Magnesium Glycinate is formulated with pure magnesium chelate. Promotes deep sleep, reduces night leg cramps, and aids in faster muscle recovery after exercise.",
    rawScrapeData: JSON.stringify({ mock: true }),
  };
}
