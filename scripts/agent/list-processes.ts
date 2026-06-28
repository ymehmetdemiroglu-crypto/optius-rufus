import { execSync } from "child_process";

async function main() {
  console.log("=== RUNNING PROCESSES ===");
  try {
    const out = execSync("tasklist", { stdio: "pipe" }).toString();
    const lines = out.split("\n").filter(l => l.toLowerCase().includes("docker") || l.toLowerCase().includes("wsl") || l.toLowerCase().includes("vmmem") || l.toLowerCase().includes("postgres"));
    console.log(lines.join("\n"));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}

main().catch(console.error);
