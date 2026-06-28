import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import { sql } from "drizzle-orm";
import { execSync } from "child_process";

async function run() {
  console.log(`\n🏥 Starting Full System Diagnostics Self-Test...\n`);

  // 1. Ping PostgreSQL
  try {
    await db.execute(sql`SELECT 1`);
    console.log(`[PASS] 🗄️  PostgreSQL Connectivity`);
  } catch (err) {
    console.error(`[FAIL] 🗄️  PostgreSQL Connectivity: ${(err as Error).message}`);
  }

  // 2. Validate API Keys
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  const hasOpenRouter = openrouterKey && openrouterKey.trim() !== "" && !openrouterKey.includes("your-");
  const hasOpenAI = openaiKey && openaiKey.trim() !== "" && !openaiKey.includes("your-");
  
  if (hasOpenRouter || hasOpenAI) {
    console.log(`[PASS] 🔑 LLM API Configuration (${hasOpenRouter ? "OpenRouter" : "OpenAI"} key found)`);
  } else {
    console.error(`[FAIL] 🔑 LLM API Configuration: Both OPENROUTER_API_KEY and OPENAI_API_KEY are missing/invalid!`);
  }

  const otherKeys = [
    { name: "APOLLO_API_KEY", optional: false },
    { name: "APIFY_API_TOKEN", optional: false },
  ];

  for (const key of otherKeys) {
    const val = process.env[key.name];
    if (val && val.trim() !== "" && !val.includes("your-") && !val.includes("sk-your")) {
      console.log(`[PASS] 🔑 ${key.name} is configured`);
    } else {
      if (key.optional) {
        console.log(`[WARN] 🔑 ${key.name} is missing/not set (Optional)`);
      } else {
        console.error(`[FAIL] 🔑 ${key.name} is missing or has placeholder value!`);
      }
    }
  }

  // 3. Check Docker status
  try {
    const dockerVersion = execSync("docker --version", { stdio: "pipe" }).toString().trim();
    execSync("docker ps", { stdio: "pipe" });
    console.log(`[PASS] 🐳 Docker is running (${dockerVersion})`);
  } catch (err) {
    console.error(`[FAIL] 🐳 Docker Check failed: Make sure Docker Desktop is started.`);
  }

  // 4. Check PM2 status
  try {
    const pm2Version = execSync("pm2 -v", { stdio: "pipe" }).toString().trim();
    console.log(`[PASS] ⚙️  PM2 is installed (v${pm2Version})`);
  } catch (err) {
    console.warn(`[WARN] ⚙️  PM2 CLI not found in PATH or not running.`);
  }

  // 5. System Specs & Disk Space
  console.log(`\n💻 System Information:`);
  console.log(`  OS Platform:   ${process.platform}`);
  console.log(`  Node Version:  ${process.version}`);
  console.log(`  Process Arch:  ${process.arch}`);

  if (process.platform === "win32") {
    try {
      const diskInfo = execSync(`powershell -Command "Get-PSDrive C | Select-Object Used, Free"`, { stdio: "pipe" }).toString().trim();
      const lines = diskInfo.split("\n").map(l => l.trim()).filter(Boolean);
      console.log(`  Disk Space (C:):`);
      for (const line of lines) {
        console.log(`    ${line}`);
      }
    } catch (diskErr) {
      try {
        const wmicInfo = execSync("wmic logicaldisk get caption,freespace,size", { stdio: "pipe" }).toString().trim();
        console.log(`  Disk Space:\n${wmicInfo}`);
      } catch (wmicErr) {
        console.warn(`  Could not read disk space information.`);
      }
    }
  }

  console.log(`\n🏥 Diagnostics completed.\n`);
}

run();
