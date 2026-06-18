import * as prospectRepo from "./repository.js";
import * as listingRepo from "../listing/repository.js";
import * as analysisRepo from "../analysis/repository.js";
import * as bookingRepo from '../booking/repository.js';
import { eventBus } from "../../infra/eventBus.js";
import type {
  ProspectRecord,
  ListingRecord,
  ListingAnalysisRecord,
  BookingRecord,
  InsertProspectInput,
} from "../../db/schema.types.js";

export interface CreateProspectInput {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  asin?: string;
  marketplace?: string;
  packageType?: string;
  pricePoint?: number;
  expectedRevenue?: string;
}

export interface ListProspectsOptions {
  status?: string;
  limit?: number;
  offset?: number;
}

interface ApolloWebhookPayload {
  contact?: {
    email?: string;
    first_name?: string;
    last_name?: string;
    organization_name?: string;
    custom_fields?: {
      expected_revenue?: string;
      asin?: string;
      ASIN?: string;
      [key: string]: unknown;
    };
  };
  email_message?: {
    sender_email?: string;
    body_text?: string;
    subject?: string;
    [key: string]: unknown;
  };
  email?: string;
  first_name?: string;
  last_name?: string;
  company?: string;
  expectedRevenue?: string;
  asin?: string;
  body_text?: string;
  [key: string]: unknown;
}

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function classifyProspectRevenue(expectedRevenue?: string): "Class_A" | "Class_B" | "Class_C" {
  if (!expectedRevenue) return "Class_C";
  
  const lower = expectedRevenue.toLowerCase();
  
  // 1. Check for text indicators
  if (lower.includes("enterprise") || lower.includes("class_a") || lower.includes("class a")) {
    return "Class_A";
  }
  if (lower.includes("growth") || lower.includes("class_b") || lower.includes("class b")) {
    return "Class_B";
  }
  if (lower.includes("starter") || lower.includes("class_c") || lower.includes("class c")) {
    return "Class_C";
  }
  
  // 2. Parse number
  let num = parseFloat(expectedRevenue.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) {
    return "Class_C";
  }
  
  const isThousand = lower.includes("thousand") || /\d+\s*k\b/.test(lower);
  const isMillion = lower.includes("million") || /\d+\s*m\b/.test(lower);
  const isMonthly = lower.includes("month") || lower.includes("/mo") || lower.includes("monthly");
  
  // If string indicates thousands (e.g. 150k)
  if (isThousand) {
    num = num * 1000;
  }
  // If string indicates millions (e.g. 1.2M or 1.2 million)
  else if (isMillion) {
    num = num * 1000000;
  }
  
  // If string indicates monthly revenue (e.g. $10k/mo or $10,000/monthly)
  if (isMonthly) {
    num = num * 12;
  }
  
  if (num >= 1000000) return "Class_A";
  if (num >= 100000) return "Class_B";
  return "Class_C";
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
    asin: input.asin,
    expectedRevenue: input.expectedRevenue,
    status: "new",
    landingPageViews: 0,
    packageType: input.packageType || "package_2",
    pricePoint: input.pricePoint ?? 1500,
  };
  try {
    const prospect = await prospectRepo.create(insertInput);

    // Auto-enroll the prospect in the matching Apollo sequence based on expected revenue
    try {
      const { createContact, enrollInSequence } = await import("../apollo/service.js");
      const contact = await createContact({
        email: prospect.email,
        firstName: prospect.firstName || undefined,
        lastName: prospect.lastName || undefined,
        company: prospect.company || undefined,
      });

      const tier = classifyProspectRevenue(prospect.expectedRevenue || undefined);
      const sequenceMap = {
        Class_A: "6a3005fee287cb000c007e03", // Enterprise
        Class_B: "6a300617700f6b000cee5416", // Growth
        Class_C: "6a30063082147b001cd1f361", // Starter
      };
      const sequenceId = sequenceMap[tier];

      await enrollInSequence(contact.id, sequenceId);

      await prospectRepo.updateApolloFields(prospect.id, {
        apolloContactId: contact.id,
        apolloSequenceId: sequenceId,
        status: "emailed",
      });
    } catch (apolloErr) {
      console.error("Failed to auto-enroll prospect in Apollo campaign:", apolloErr);
    }

    return (await prospectRepo.getById(prospect.id)) || prospect;
  } catch (err) {
    throw new Error("Failed to create prospect", { cause: err });
  }
}

export async function handleApolloReply(payload: ApolloWebhookPayload): Promise<{
  success: boolean;
  prospectId: number;
  slug: string;
  auditTriggered: boolean;
  asin?: string;
}> {
  const email = payload.contact?.email || payload.email_message?.sender_email || payload.email;
  if (!email) {
    throw new Error("No email found in Apollo webhook payload");
  }

  const firstName = payload.contact?.first_name || payload.first_name || "";
  const lastName = payload.contact?.last_name || payload.last_name || "";
  const company = payload.contact?.organization_name || payload.company || "";
  const expectedRevenue = payload.expectedRevenue || payload.contact?.custom_fields?.expected_revenue || "";

  // Extract ASIN
  let asin = payload.contact?.custom_fields?.asin || 
             payload.contact?.custom_fields?.ASIN || 
             payload.asin;
             
  const bodyText = payload.email_message?.body_text || payload.body_text || "";
  if (!asin && bodyText) {
    const asinMatch = bodyText.match(/\b(B[A-Z0-9]{9})\b/i);
    if (asinMatch) {
      asin = asinMatch[1].toUpperCase();
    }
  }

  // Find or Create Prospect
  let prospect = await prospectRepo.getByEmail(email);
  let isNew = false;
  
  if (!prospect) {
    isNew = true;
    prospect = await createProspect({
      email,
      firstName,
      lastName,
      company,
      expectedRevenue,
    });
  } else {
    // Update expected revenue if provided in webhook and not already set
    if (expectedRevenue && prospect.expectedRevenue !== expectedRevenue) {
      await prospectRepo.updateReplyDetails(prospect.id, {
        repliedAt: new Date(),
        apolloReplyData: payload.email_message || payload,
        asin: asin || prospect.asin || undefined,
        expectedRevenue,
      });
    }
  }

  // Update status to 'replied'
  await prospectRepo.updateStatus(prospect.id, "replied");
  await prospectRepo.updateReplyDetails(prospect.id, {
    repliedAt: new Date(),
    apolloReplyData: payload.email_message || payload,
    asin: asin || prospect.asin || undefined,
  });

  // Record activity
  await recordActivity(prospect.id, "email_replied", {
    subject: payload.email_message?.subject || "Apollo Email Reply",
    snippet: bodyText.slice(0, 500) || "User replied to Apollo outreach",
    isNewProspect: isNew,
  }, 20);

  // Trigger Scrape & Audit if ASIN is present
  const finalAsin = asin || prospect.asin;
  let auditTriggered = false;

  if (finalAsin) {
    const existingListing = await listingRepo.getLatestByProspectId(prospect.id);
    let existingAnalysis = null;
    if (existingListing) {
      existingAnalysis = await analysisRepo.getLatestByListingId(existingListing.id);
    }

    if (!existingAnalysis) {
      const { pipelineQueue } = await import("../../infra/queue.js");
      await pipelineQueue.add("scrape-and-audit", {
        prospectId: prospect.id,
        asin: finalAsin,
        marketplace: "US"
      });
      auditTriggered = true;
      await prospectRepo.updateStatus(prospect.id, "analyzing");
    }
  }

  const updatedProspect = await prospectRepo.getById(prospect.id);

  return {
    success: true,
    prospectId: prospect.id,
    slug: updatedProspect?.slug || prospect.slug,
    auditTriggered,
    asin: finalAsin,
  };
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
  // so that event emission is still attempted.
  try {
    await prospectRepo.recordActivity(prospectId, eventType, eventData);
  } catch (err) {
    console.error("Failed to write activity to database:", err);
  }

  // Emit async domain event for downstream webhook delivery
  eventBus.emit("prospect:activity", { prospectId, eventType, eventData, interestScore });
}
