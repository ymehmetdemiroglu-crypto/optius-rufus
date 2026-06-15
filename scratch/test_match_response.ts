import fs from "fs";
import { join } from "path";

// Load env
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

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

async function testMatch() {
  const id = "611c8e056386930001dbbf37"; // Andy Brocato
  console.log(`Querying /people/match for ID: ${id}`);
  
  const response = await fetch("https://api.apollo.io/api/v1/people/match", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": APOLLO_API_KEY!,
    },
    body: JSON.stringify({ id }),
  });

  console.log(`Status: ${response.status}`);
  const json = await response.json();
  console.log("Response JSON:");
  console.dir(json, { depth: null });
}

testMatch().catch(console.error);
