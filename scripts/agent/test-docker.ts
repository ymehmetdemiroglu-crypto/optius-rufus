import { execSync } from "child_process";

async function main() {
  try {
    console.log("Running execSync('docker ps')...");
    const out = execSync("docker ps", { stdio: "pipe" }).toString();
    console.log("Success! Output:", out);
  } catch (err: any) {
    console.error("Failed with error:", err.message);
    if (err.status) console.log("Exit Code:", err.status);
    if (err.stdout) console.log("Stdout:", err.stdout.toString());
    if (err.stderr) console.log("Stderr:", err.stderr.toString());
  }
}

main().catch(console.error);
