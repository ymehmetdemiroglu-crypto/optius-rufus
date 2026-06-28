import { execSync } from "child_process";

async function main() {
  try {
    console.log("=== DOCKER PS ===");
    const ps = execSync("docker ps -a", { stdio: "pipe" }).toString();
    console.log(ps);

    console.log("\n=== POSTGRES CONTAINER LOGS ===");
    const logs = execSync("docker logs optimus-rufus-postgres", { stdio: "pipe" }).toString();
    console.log(logs.slice(-2000)); // Print last 2000 chars
  } catch (err: any) {
    console.error("Failed to run docker command:", err.message);
    if (err.stdout) console.log("Stdout:", err.stdout.toString());
    if (err.stderr) console.log("Stderr:", err.stderr.toString());
  }
}

main().catch(console.error);
