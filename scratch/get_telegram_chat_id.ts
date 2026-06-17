import { join } from "path";
import fs from "fs";

function loadEnv() {
  try {
    const envPath = join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const firstEqual = trimmed.indexOf("=");
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const val = trimmed.slice(firstEqual + 1).trim().replace(/^['"]|['"]$/g, "");
            process.env[key] = val;
          }
        }
      }
    }
  } catch (e) {
    console.error("Failed to load .env manually:", e);
  }
}

loadEnv();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.includes("your_bot_token")) {
  console.error("❌ Please make sure TELEGRAM_BOT_TOKEN is set in .env");
  process.exit(1);
}

async function getChatId() {
  console.log("=========================================");
  console.log("🤖 Telegram Chat ID Finder");
  console.log("=========================================");
  console.log("Instructions:\n1. Open Telegram.\n2. Search for your bot.\n3. Send any message to the bot (e.g. 'hello').\n4. Run this script again.");
  console.log("-----------------------------------------");
  console.log("Fetching bot updates...");
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`);
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Telegram API Error: ${data.description}`);
    }
    
    const results = data.result || [];
    if (results.length === 0) {
      console.log("⚠️ No messages received yet. Send a message to the bot first!");
      return;
    }
    
    console.log(`\nFound ${results.length} recent interaction(s):\n`);
    const processedChats = new Set<number>();
    
    for (const update of results) {
      const message = update.message || update.edited_message;
      if (message && message.chat) {
        const chat = message.chat;
        if (!processedChats.has(chat.id)) {
          processedChats.add(chat.id);
          console.log(`👤 User: ${chat.first_name || ""} ${chat.last_name || ""} (@${chat.username || "no_username"})`);
          console.log(`🆔 Chat ID: ${chat.id}`);
          console.log(`💬 Message: "${message.text || ""}"`);
          console.log("-----------------------------------------");
        }
      }
    }
    
    console.log("💡 Copy the Chat ID above and paste it into your .env as TELEGRAM_CHAT_ID!");
  } catch (err: any) {
    console.error("❌ Failed to fetch Telegram updates:", err.message);
  }
}

getChatId();
