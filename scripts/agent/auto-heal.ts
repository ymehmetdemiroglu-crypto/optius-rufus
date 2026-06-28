import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import { sql } from "drizzle-orm";
import { execSync } from "child_process";

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

async function sendTelegramAlert(text: string) {
  if (!token || !chatId || token.includes("your_bot_token") || chatId.includes("your_telegram_chat_id")) {
    console.warn("Telegram bot token or chat ID not configured. Skipping alert.");
    return;
  }
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Failed to send Telegram alert:", err);
  }
}

async function isPostgresHealthy(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch {
    return false;
  }
}

function isDockerRunning(): boolean {
  try {
    execSync("docker ps", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

async function runAutoHeal() {
  console.log("🩹 Starting Auto-Healing Diagnostics...");
  let dockerHealed = false;
  let containersHealed = false;

  // 1. Check if Docker is running
  if (!isDockerRunning()) {
    console.log("⚠️ Docker is not running. Attempting to start Docker Desktop...");
    try {
      if (process.platform === "win32") {
        execSync('start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"', { stdio: "ignore" });
        console.log("⏳ Docker Desktop command issued. Waiting for daemon to boot (up to 60 seconds)...");
        
        let attempts = 12;
        while (attempts > 0) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          if (isDockerRunning()) {
            console.log("🟢 Docker Daemon has started successfully!");
            dockerHealed = true;
            break;
          }
          attempts--;
          console.log(`⏳ Still waiting for Docker Daemon... (${attempts * 5}s left)`);
        }
      } else {
        console.error("❌ Auto-starting Docker is only supported on Windows in this configuration.");
      }
    } catch (err) {
      console.error("❌ Failed to start Docker Desktop:", err);
    }
  } else {
    console.log("🟢 Docker Daemon is active.");
  }

  // 2. If Docker is running, make sure docker compose stack is up
  if (isDockerRunning()) {
    console.log("🔍 Checking Docker Compose container status...");
    try {
      const composeStatus = execSync("docker compose ps --format json", { stdio: "pipe" }).toString().trim();
      const needsStart = !composeStatus || composeStatus.includes('"State":"exited"') || composeStatus.includes('"State":"dead"');
      
      if (needsStart) {
        console.log("🔄 Starting Docker Compose services...");
        execSync("docker compose up -d", { stdio: "inherit" });
        console.log("🟢 Docker Compose services started!");
        containersHealed = true;
      } else {
        console.log("🟢 Docker Compose containers are running.");
      }
    } catch (err) {
      console.log("🔄 Forcing docker compose up -d...");
      try {
        execSync("docker compose up -d", { stdio: "inherit" });
        containersHealed = true;
      } catch (composeErr) {
        console.error("❌ Failed to start Docker Compose:", composeErr);
      }
    }
  }

  // 3. Verify PostgreSQL
  console.log("🔍 Verifying PostgreSQL connection...");
  let postgresConnected = false;
  let pgAttempts = 5;
  while (pgAttempts > 0) {
    if (await isPostgresHealthy()) {
      console.log("🟢 PostgreSQL database is reachable and healthy.");
      postgresConnected = true;
      break;
    }
    pgAttempts--;
    console.log(`⏳ Database not ready yet, retrying... (${pgAttempts} attempts left)`);
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  // 4. Send Telegram updates
  if (dockerHealed || containersHealed) {
    const statusMsg = postgresConnected ? "🟢 ONLINE & HEALTHY" : "🔴 OFFLINE (Database Unreachable)";
    await sendTelegramAlert(
      `🩹 *[Agent Auto-Heal]* System healing completed!\n\n` +
      `• *Docker Daemon started:* ${dockerHealed ? "✅ Yes" : "➖ No (already active)"}\n` +
      `• *Docker Compose started:* ${containersHealed ? "✅ Yes" : "➖ No (already active)"}\n` +
      `• *Database Status:* ${postgresConnected ? "✅ Reachable" : "❌ Unreachable"}\n` +
      `• *Final System State:* ${statusMsg}`
    );
  } else if (!postgresConnected) {
    await sendTelegramAlert(
      `🚨 *[Agent Auto-Heal] Critical Failure!*\n\n` +
      `The database remains unreachable even after verifying Docker Compose services.`
    );
  } else {
    console.log("🟢 No healing actions were required.");
  }
}

runAutoHeal().catch((err) => {
  console.error("Fatal error in auto-heal script:", err);
});
