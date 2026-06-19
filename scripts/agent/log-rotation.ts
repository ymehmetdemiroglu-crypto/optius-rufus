import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log("🪵 Starting log rotation process...");

  let rootDir = __dirname;
  while (rootDir) {
    if (fs.existsSync(path.join(rootDir, "package.json"))) {
      break;
    }
    const parent = path.dirname(rootDir);
    if (parent === rootDir) break;
    rootDir = parent;
  }

  const logsDir = path.join(rootDir, "logs");
  if (!fs.existsSync(logsDir)) {
    console.log("Logs directory does not exist. Nothing to rotate.");
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const logFiles = ["out.log", "err.log"];

  for (const logFile of logFiles) {
    const fullPath = path.join(logsDir, logFile);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.size > 0) {
        const rotatedName = logFile.replace(".log", `-${timestamp}.log`);
        const rotatedPath = path.join(logsDir, rotatedName);
        fs.renameSync(fullPath, rotatedPath);
        console.log(`Rotated ${logFile} -> ${rotatedName} (${(stats.size / 1024).toFixed(2)} KB)`);
      }
    }
  }

  try {
    console.log("Signaling PM2 to reload logs...");
    execSync("npx pm2 reloadLogs", { stdio: "inherit" });
  } catch (err) {
    console.warn("Failed to notify PM2 to reload logs (is PM2 running or installed?):", (err as Error).message);
  }

  const files = fs.readdirSync(logsDir);
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  for (const file of files) {
    if (file.match(/^(out|err)-\d{4}-\d{2}-\d{2}T.*\.log$/)) {
      const filePath = path.join(logsDir, file);
      const fileStats = fs.statSync(filePath);
      if (fileStats.mtimeMs < sevenDaysAgo) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old rotated log: ${file} (modified at ${new Date(fileStats.mtimeMs).toLocaleDateString()})`);
      }
    }
  }

  console.log("🪵 Log rotation completed.");
}

run().catch(err => {
  console.error("❌ Log rotation failed:", err);
  process.exit(1);
});
