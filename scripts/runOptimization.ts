import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runOptimization } from "../api/services/domain/optimizationService.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Load the .env file BEFORE importing database/services
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = value;
      }
    }
  }
}

// Helper to parse arguments
const args = process.argv.slice(2);
const getArg = (name: string): string | undefined => {
  const idx = args.indexOf(name);
  if (idx !== -1 && idx + 1 < args.length) {
    return args[idx + 1];
  }
  const prefix = name + "=";
  const match = args.find((a) => a.startsWith(prefix));
  if (match) {
    return match.slice(prefix.length);
  }
  return undefined;
};

async function main() {
  const asin = getArg("--asin");
  const packageStr = getArg("--package");
  const brand = getArg("--brand") || "Your Brand";
  const name = getArg("--name") || "Partner";
  const email = getArg("--email") || "partner@brand.com";
  const marketplace = getArg("--marketplace") || "US";
  const priceOverride = getArg("--price") ? parseFloat(getArg("--price")!) : undefined;

  if (!asin || !/^[A-Z0-9]{10}$/.test(asin)) {
    console.error("❌ Error: Please provide a valid 10-character Amazon ASIN using --asin");
    process.exit(1);
  }

  const packageNum = parseInt(packageStr || "2", 10);
  if (![1, 2, 3, 4].includes(packageNum)) {
    console.error("❌ Error: Package must be 1, 2, 3, or 4. Received: " + packageStr);
    process.exit(1);
  }

  console.log(`🚀 STARTING TIERED OPTIMIZATION RUN...`);
  console.log(`📦 ASIN: ${asin}`);
  console.log(`💼 Package: ${packageNum}`);
  console.log(`👤 Client: ${name} (${brand}) — Email: ${email}\n`);

  try {
    const result = await runOptimization({
      asin,
      packageNum,
      brand,
      name,
      email,
      marketplace,
      priceOverride,
    });

    console.log(`\n🎉 TIERED OPTIMIZATION COMPLETED SUCCESSFULLY!`);
    console.log(`👉 Preview URL: ${result.previewUrl}`);
    if (result.pdfPath) {
      console.log(`👉 PDF Report: ${result.pdfPath}`);
    }
  } catch (err) {
    console.error("\n💥 Execution failed:", err);
    process.exit(1);
  }
}

main();
