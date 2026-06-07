import * as prospectRepo from "../../db/repositories/prospectRepository.js";
import * as listingRepo from "../../db/repositories/listingRepository.js";
import * as analysisRepo from "../../db/repositories/analysisRepository.js";
import * as bookingRepo from "../../db/repositories/bookingRepository.js";
import { triggerWebhook } from "../webhook.js";
import type {
  ProspectRecord,
  ListingRecord,
  ListingAnalysisRecord,
  BookingRecord,
  InsertProspectInput,
} from "../../db/types.js";

export interface CreateProspectInput {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  asin?: string;
  marketplace?: string;
  packageType?: string;
  pricePoint?: number;
}

export interface ListProspectsOptions {
  status?: string;
  limit?: number;
  offset?: number;
}

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10);
}

export async function createProspect(
  input: CreateProspectInput
): Promise<ProspectRecord> {
  const slug = generateSlug();
  const insertInput: InsertProspectInput = {
    slug,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    company: input.company,
    status: "new",
    landingPageViews: 0,
    packageType: input.packageType || "package_2",
    pricePoint: input.pricePoint ?? 1500,
  };
  try {
    return await prospectRepo.create(insertInput);
  } catch (err) {
    throw new Error("Failed to create prospect", { cause: err });
  }
}

export async function getProspectBySlug(
  slug: string
): Promise<{
  prospect: ProspectRecord;
  listing: ListingRecord | null;
  analysis: ListingAnalysisRecord | null;
}> {
  let prospect: ProspectRecord | undefined;
  try {
    prospect = await prospectRepo.getBySlug(slug);
  } catch (err) {
    throw new Error(`Failed to fetch prospect by slug ${slug}`, { cause: err });
  }
  if (!prospect) {
    throw new Error(`Prospect not found: ${slug}`);
  }

  let listing: ListingRecord | undefined;
  try {
    listing = await listingRepo.getLatestByProspectId(prospect.id);
  } catch (err) {
    throw new Error(`Failed to fetch listing for prospect ${prospect.id}`, {
      cause: err,
    });
  }

  let analysis: ListingAnalysisRecord | undefined;
  if (listing) {
    try {
      analysis = await analysisRepo.getLatestByListingId(listing.id);
    } catch (err) {
      throw new Error(`Failed to fetch analysis for listing ${listing.id}`, {
        cause: err,
      });
    }
  }

  return { prospect, listing: listing || null, analysis: analysis || null };
}

export async function listProspects(
  options: ListProspectsOptions
): Promise<{ items: ProspectRecord[]; count: number }> {
  try {
    return await prospectRepo.list(options);
  } catch (err) {
    throw new Error("Failed to list prospects", { cause: err });
  }
}

export async function getProspectById(
  id: number
): Promise<{
  prospect: ProspectRecord;
  listing: ListingRecord | null;
  analysis: ListingAnalysisRecord | null;
  bookings: BookingRecord[];
}> {
  let prospect: ProspectRecord | undefined;
  try {
    prospect = await prospectRepo.getById(id);
  } catch (err) {
    throw new Error(`Failed to fetch prospect by id ${id}`, { cause: err });
  }
  if (!prospect) {
    throw new Error(`Prospect not found: ${id}`);
  }

  let listing: ListingRecord | undefined;
  try {
    listing = await listingRepo.getLatestByProspectId(prospect.id);
  } catch (err) {
    throw new Error(`Failed to fetch listing for prospect ${prospect.id}`, {
      cause: err,
    });
  }

  let analysis: ListingAnalysisRecord | undefined;
  if (listing) {
    try {
      analysis = await analysisRepo.getLatestByListingId(listing.id);
    } catch (err) {
      throw new Error(`Failed to fetch analysis for listing ${listing.id}`, {
        cause: err,
      });
    }
  }

  let bookings: BookingRecord[];
  try {
    bookings = await bookingRepo.getByProspectId(prospect.id);
  } catch (err) {
    throw new Error(`Failed to fetch bookings for prospect ${prospect.id}`, {
      cause: err,
    });
  }

  return {
    prospect,
    listing: listing || null,
    analysis: analysis || null,
    bookings,
  };
}

export async function updateProspectStatus(
  id: number,
  status: string
): Promise<void> {
  try {
    await prospectRepo.updateStatus(id, status);
  } catch (err) {
    throw new Error(`Failed to update prospect ${id} status`, { cause: err });
  }
}

export async function incrementViews(slug: string): Promise<void> {
  try {
    await prospectRepo.incrementViews(slug);
  } catch (err) {
    throw new Error(`Failed to increment views for slug ${slug}`, {
      cause: err,
    });
  }
}

export async function recordActivity(
  prospectId: number,
  eventType: string,
  eventData: unknown,
  interestScore: number
): Promise<void> {
  // Persist activity to the database; failures are logged but not thrown
  // so that webhook delivery is still attempted.
  try {
    await prospectRepo.recordActivity(prospectId, eventType, eventData);
  } catch (err) {
    console.error("Failed to write activity to database:", err);
  }

  // Fetch prospect details to populate webhook payload.
  let prospectName = "Unknown Prospect";
  let company: string | undefined;
  let email: string | undefined;
  try {
    const prospect = await prospectRepo.getById(prospectId);
    if (prospect) {
      const name =
        [prospect.firstName, prospect.lastName].filter(Boolean).join(" ") ||
        prospect.email ||
        "Unknown Prospect";
      prospectName = name;
      company = prospect.company ?? undefined;
      email = prospect.email ?? undefined;
    }
  } catch (err) {
    console.error("Failed to read prospect details for webhook:", err);
  }

  // Dispatch webhook notification.
  try {
    await triggerWebhook(
      { name: prospectName, company, email },
      eventType,
      eventData,
      interestScore
    );
  } catch (err) {
    console.error("Failed to trigger webhook:", err);
  }
}
