import { loadEnv } from "./envLoader.js";
loadEnv();

const APOLLO_API_KEY = process.env.APOLLO_API_KEY;

async function testCombination(name: string, headers: Record<string, string>, body: any = {}) {
  const url = "https://api.apollo.io/v1/emailer_campaigns/search";
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });

    console.log(`[${name}] Status: ${response.status}`);
    const text = await response.text();
    if (response.status === 200) {
      console.log(`  ✅ SUCCESS!`);
      // Print first 100 chars of body
      console.log(`  Body: ${text.slice(0, 100)}...`);
      return true;
    } else {
      console.log(`  ❌ Failed: ${text.slice(0, 150)}`);
      return false;
    }
  } catch (err: any) {
    console.log(`[${name}] Error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log(`Testing key: "${APOLLO_API_KEY}"\n`);
  if (!APOLLO_API_KEY) {
    console.error("APOLLO_API_KEY not found in env");
    return;
  }

  // 1. Literal header api_key
  await testCombination("Header: api_key", {
    "api_key": APOLLO_API_KEY
  });

  // 2. Literal header Api-Key
  await testCombination("Header: Api-Key", {
    "Api-Key": APOLLO_API_KEY
  });

  // 3. Literal header X-Api-Key
  await testCombination("Header: X-Api-Key", {
    "X-Api-Key": APOLLO_API_KEY
  });

  // 4. Literal header Authorization: Api-Token
  await testCombination("Header: Authorization: Api-Token", {
    "Authorization": `Api-Token ${APOLLO_API_KEY}`
  });

  // 5. Literal header Authorization: Bearer
  await testCombination("Header: Authorization: Bearer", {
    "Authorization": `Bearer ${APOLLO_API_KEY}`
  });

  // 6. Body api_key
  await testCombination("Body: api_key", {}, {
    "api_key": APOLLO_API_KEY
  });
}

main().catch(console.error);
