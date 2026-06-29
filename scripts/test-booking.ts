import { createBooking } from "./api/domains/booking/service.js";

async function main() {
  console.log("Creating test booking...");
  const booking = await createBooking({
    prospectId: 1,
    name: "Yahya Taha",
    email: "yahya@optimusrufus.com",
    company: "Anker Direct",
    revenue: "$450,000/mo",
    notes: "Testing live Telegram notifications!",
  });
  console.log("✅ Booking created successfully! ID:", booking.id);
}

main().catch(console.error);
