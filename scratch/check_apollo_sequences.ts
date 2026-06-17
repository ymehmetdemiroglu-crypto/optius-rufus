import { join } from "path";
import fs from "fs";

// Manually load .env if present
function loadEnv() {
  try {
    const envPath = join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const firstEqual = trimmed.indexOf("=");
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const val = trimmed.slice(firstEqual + 1).trim().replace(/^['"]|['"]$/g, "");
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to load .env manually:", e);
  }
}

loadEnv();

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;
if (!APOLLO_API_KEY) {
  console.error("❌ APOLLO_API_KEY is not defined in .env");
  process.exit(1);
}

async function listSequences() {
  console.log("Searching campaigns/sequences in Apollo...");
  try {
    const response = await fetch("https://api.apollo.io/api/v1/emailer_campaigns/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": APOLLO_API_KEY,
      },
      body: JSON.stringify({
        page: 1,
        per_page: 100
      })
    });

    if (!response.ok) {
      throw new Error(`Apollo API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    console.log(`\nSuccess! Found ${data.emailer_campaigns?.length || 0} campaigns/sequences in Apollo:\n`);
    
    if (data.emailer_campaigns && data.emailer_campaigns.length > 0) {
      for (const c of data.emailer_campaigns) {
        console.log(`- ID: "${c.id}" | Name: "${c.name}" | Active: ${c.active} | Contacts Count: ${c.num_contacts}`);
      }
    } else {
      console.log("No campaigns found in Apollo.");
    }
  } catch (err: any) {
    console.error("❌ Error fetching sequences:", err.message);
  }
}

listSequences();
