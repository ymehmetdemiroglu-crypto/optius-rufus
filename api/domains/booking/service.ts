import * as bookingRepo from '../booking/repository.js';
import type { BookingRecord, InsertBookingInput } from "../../db/schema.types.js";

export interface CreateBookingInput {
  prospectId: number;
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
  const insertInput: InsertBookingInput = {
    prospectId: input.prospectId,
    name: input.name,
    email: input.email,
    company: input.company,
    revenue: input.revenue,
    notes: input.notes,
    scheduledDate: input.scheduledDate,
    status: "pending",
  };
  try {
    return await bookingRepo.create(insertInput);
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
