export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || token.includes("your_bot_token") || chatId.includes("your_telegram_chat_id")) {
    return;
  }
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
    if (!response.ok) {
      console.error(`Telegram notification failed: ${response.status} - ${await response.text()}`);
    }
  } catch (err) {
    console.error("Error sending Telegram notification:", err);
  }
}
