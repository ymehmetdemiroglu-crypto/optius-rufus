import * as bookingRepo from '../booking/repository.js';
import * as prospectRepo from '../prospect/repository.js';
import type { BookingRecord, InsertBookingInput } from "../../db/schema.types.js";

async function sendTelegramNotification(booking: BookingRecord) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || token.includes("your_bot_token") || chatId.includes("your_telegram_chat_id")) {
    console.warn("Telegram bot token or chat ID not configured. Skipping notification.");
    return;
  }

  try {
    const prospect = await prospectRepo.getById(booking.prospectId);
    const slug = prospect?.slug || "";
    const auditUrl = slug ? `https://optimusrufus.com/p/${slug}` : "N/A";

    const text = `🚨 *New Rufus Audit Booking!* 🚨\n\n` +
      `👤 *Name:* ${booking.name}\n` +
      `📧 *Email:* ${booking.email}\n` +
      `🏢 *Company:* ${booking.company || prospect?.company || "N/A"}\n` +
      `💰 *Monthly Revenue:* ${booking.revenue || prospect?.expectedRevenue || "N/A"}\n` +
      `📝 *Notes:* ${booking.notes || "None"}\n` +
      `🔗 *Audit Page:* ${auditUrl}`;

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
    } else {
      console.log("✅ Telegram booking notification sent successfully!");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Error sending Telegram notification:", message);
  }
}

export interface CreateBookingInput {
  prospectId?: number;
  name: string;
  email: string;
  company?: string;
  revenue?: string;
  notes?: string;
  scheduledDate?: string;
}

export async function createBooking(
  input: CreateBookingInput
): Promise<BookingRecord> {
  let targetProspectId = input.prospectId;

  if (!targetProspectId) {
    try {
      const existing = await prospectRepo.getByEmail(input.email);
      if (existing) {
        targetProspectId = existing.id;
      } else {
        const slug = `organic-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const nameParts = input.name.trim().split(" ");
        const newProspect = await prospectRepo.create({
          slug,
          email: input.email,
          firstName: nameParts[0] || input.name,
          lastName: nameParts.slice(1).join(" ") || undefined,
          company: input.company,
          expectedRevenue: input.revenue,
          status: "organic_lead",
        });
        targetProspectId = newProspect.id;
      }
    } catch (err) {
      console.warn("Could not query/create organic prospect, proceeding with fallback ID 1:", err);
      targetProspectId = 1;
    }
  }

  const insertInput: InsertBookingInput = {
    prospectId: targetProspectId,
    name: input.name,
    email: input.email,
    company: input.company,
    revenue: input.revenue,
    notes: input.notes,
    scheduledDate: input.scheduledDate,
    status: "pending",
  };
  try {
    const booking = await bookingRepo.create(insertInput);
    
    // Dispatch Telegram message asynchronously
    sendTelegramNotification(booking).catch(err => {
      console.error("Failed to dispatch Telegram message:", err);
    });
    
    return booking;
  } catch (err) {
    throw new Error("Failed to create booking", { cause: err });
  }
}


export async function getBookingsByProspectId(
  prospectId: number
): Promise<BookingRecord[]> {
  try {
    return await bookingRepo.getByProspectId(prospectId);
  } catch (err) {
    throw new Error(
      `Failed to fetch bookings for prospect ${prospectId}`,
      { cause: err }
    );
  }
}

export async function listAllBookings(): Promise<BookingRecord[]> {
  try {
    return await bookingRepo.listAll();
  } catch (err) {
    throw new Error("Failed to list bookings", { cause: err });
  }
}
