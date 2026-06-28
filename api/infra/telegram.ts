export async function sendTelegramMessage(text: string, replyMarkup?: any): Promise<void> {
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
        reply_markup: replyMarkup,
      }),
    });
    if (!response.ok) {
      console.error(`Telegram notification failed: ${response.status} - ${await response.text()}`);
    }
  } catch (err) {
    console.error("Error sending Telegram notification:", err);
  }
}

export async function sendTelegramDocument(
  pdfBuffer: Buffer,
  filename: string,
  caption: string,
  replyMarkup?: any
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || token.includes("your_bot_token") || chatId.includes("your_telegram_chat_id")) {
    return;
  }
  try {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append("caption", caption);
    formData.append("parse_mode", "Markdown");
    
    const blob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
    formData.append("document", blob, filename);

    if (replyMarkup) {
      formData.append("reply_markup", JSON.stringify(replyMarkup));
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) {
      console.error(`Telegram sendDocument failed: ${response.status} - ${await response.text()}`);
    }
  } catch (err) {
    console.error("Error sending Telegram document:", err);
  }
}
