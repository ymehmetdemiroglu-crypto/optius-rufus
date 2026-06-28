import { execSync } from "child_process";

async function main() {
  console.log("=== DOCKER ENV ===");
  for (const [key, val] of Object.entries(process.env)) {
    if (key.toLowerCase().includes("docker") || key.toLowerCase().includes("path")) {
      console.log(`${key}: ${val}`);
    }
  }
}

main().catch(console.error);
