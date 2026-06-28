import fs from "fs";
import path from "path";

// Load .env
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const index = trimmed.indexOf("=");
        const key = trimmed.substring(0, index).trim();
        let val = trimmed.substring(index + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  console.error("Error loading .env", e);
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

console.log("Using Token:", token ? `${token.substring(0, 10)}...` : "None");
console.log("Using Chat ID:", chatId);

async function testTelegram() {
  if (!token || !chatId) {
    console.error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env");
    process.exit(1);
  }

  const text = `⚙️ *Optimus Rufus Telegram Test* ⚙️\n\nHello! The bot integration is successfully connected and online.`;
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      }),
    });
    
    if (response.ok) {
      console.log("✅ Message sent successfully!");
    } else {
      console.error(`❌ Send failed: ${response.status} - ${await response.text()}`);
    }
  } catch (err) {
    console.error("❌ Fetch error:", err);
  }
}

testTelegram();
