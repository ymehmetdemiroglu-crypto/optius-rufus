const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN || process.env.APIFY_TOKEN;
const BASE_URL = "https://api.apify.com/v2";

export async function triggerScrape(
  asin: string,
  marketplace = "US"
): Promise<{ runId: string; datasetId: string }> {
  if (!APIFY_API_TOKEN) {
    return {
      runId: `mock-${Date.now()}`,
      datasetId: `mock-dataset-${Date.now()}`,
    };
  }

  const response = await fetch(`${BASE_URL}/acts/junglee~amazon-product-scraper/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${APIFY_API_TOKEN}`,
    },
    body: JSON.stringify({
      startUrls: [{ url: `https://www.amazon.com/dp/${asin}` }],
      marketplace,
    }),
  });

  if (!response.ok) {
    throw new Error(`Apify trigger failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { data: { id: string; defaultDatasetId: string } };
  return {
    runId: data.data.id,
    datasetId: data.data.defaultDatasetId,
  };
}

export async function getRunStatus(runId: string): Promise<"RUNNING" | "SUCCEEDED" | "FAILED"> {
  if (!APIFY_API_TOKEN || runId.startsWith("mock-")) {
    return "SUCCEEDED";
  }

  const response = await fetch(`${BASE_URL}/actor-runs/${runId}`, {
    headers: { Authorization: `Bearer ${APIFY_API_TOKEN}` },
  });

  if (!response.ok) {
    throw new Error(`Apify status check failed: ${response.status}`);
  }

  const data = (await response.json()) as { data: { status: string } };
  const status = data.data.status;
  if (status === "RUNNING" || status === "READY") return "RUNNING";
  if (status === "SUCCEEDED") return "SUCCEEDED";
  return "FAILED";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getDatasetItems(datasetId: string): Promise<any[]> {
  if (!APIFY_API_TOKEN || datasetId.startsWith("mock-")) {
    return [
      {
        asin: "B0TEST1234",
        title: "Premium Test Product",
        bullets: ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
        description: "<p>Test description</p>",
        brand: "TestBrand",
        category: "Test Category",
        price: 29.99,
        rating: 4.5,
        reviewCount: 100,
        images: ["img1.jpg", "img2.jpg"],
      },
    ];
  }

  const response = await fetch(`${BASE_URL}/datasets/${datasetId}/items`, {
    headers: { Authorization: `Bearer ${APIFY_API_TOKEN}` },
  });

  if (!response.ok) {
    throw new Error(`Apify dataset fetch failed: ${response.status}`);
  }

  return response.json();
}
