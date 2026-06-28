import * as prospectRepo from "../domains/prospect/repository.js";
import * as listingRepo from "../domains/listing/repository.js";
import * as analysisRepo from "../domains/analysis/repository.js";
import { logger } from "../infra/logger.js";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_SENDER = "Optimus Rufus <market@nexgenoptimusprime.com>";

export async function sendAuditReadyEmail(prospectId: number): Promise<void> {
  try {
    const prospect = await prospectRepo.getById(prospectId);
    if (!prospect) {
      throw new Error(`Prospect not found: ${prospectId}`);
    }

    const listing = await listingRepo.getLatestByProspectId(prospectId);
    if (!listing) {
      throw new Error(`Listing not found for prospect: ${prospectId}`);
    }

    const analysis = await analysisRepo.getLatestByListingId(listing.id);
    if (!analysis) {
      throw new Error(`Analysis not found for listing: ${listing.id}`);
    }

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const reportUrl = `${appUrl}/p/${prospect.slug}`;
    const name = prospect.firstName || "there";
    const brand = listing.brand || "your brand";
    const score = analysis.overallScore || analysis.rufusScore || 0;

    // Get expected revenue classification
    const expectedRevenue = prospect.expectedRevenue || "";
    let tierText = "Starter Tier";
    if (expectedRevenue.includes("Class_A") || expectedRevenue.toLowerCase().includes("enterprise")) {
      tierText = "Enterprise Tier";
    } else if (expectedRevenue.includes("Class_B") || expectedRevenue.toLowerCase().includes("growth")) {
      tierText = "Growth Tier";
    }

    const subject = `Your Amazon Listing AI Audit is Ready - ${brand}`;

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1a202c;">
        <h2 style="color: #b8860b; border-bottom: 2px solid #b8860b; padding-bottom: 10px; font-size: 24px; margin-top: 0;">OPTIMUS RUFUS</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">Hi ${name},</p>
        <p style="font-size: 16px; line-height: 1.6;">We have finished running our 7-agent AI audit on your Amazon listing for ASIN <strong>${listing.asin}</strong> (${brand}).</p>
        
        <div style="background-color: #f7fafc; padding: 15px; border-left: 4px solid #b8860b; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 16px;"><strong>Rufus Compatibility Score:</strong> <span style="font-size: 20px; color: ${score < 50 ? '#e53e3e' : '#38a169'}; font-weight: bold;">${score}/100</span></p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #718096;">Classification: <strong>${tierText}</strong></p>
        </div>

        <p style="font-size: 16px; line-height: 1.6;">Our analysis identified critical semantic gaps in your listing copy. Because of these gaps, Amazon's conversational search AI (Rufus) is currently steering buyers toward your direct competitors.</p>
        
        <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">We've generated a comprehensive diagnostic report, including a COSMO behavioral map, a live Rufus simulation showing competitor redirects, and fully optimized copy revisions addressing your gaps.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${reportUrl}" style="background-color: #000000; color: #ffffff; padding: 12px 30px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 4px; border: 2px solid #000000; box-shadow: 4px 4px 0px #b8860b; display: inline-block;">View Your Personalized Listing Audit</a>
        </div>

        <p style="font-size: 14px; color: #718096; line-height: 1.5; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
          Best regards,<br/>
          <strong>Optimus Rufus Delivery Bot</strong><br/>
          <span style="font-size: 12px;">nexgenoptimusprime.com</span>
        </p>
      </div>
    `;

    if (RESEND_API_KEY) {
      logger.info(`Sending audit ready email to ${prospect.email} using Resend...`);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: DEFAULT_SENDER,
          to: [prospect.email],
          subject: subject,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        throw new Error(`Resend email delivery failed: ${response.status} ${await response.text()}`);
      }
      logger.info(`Audit email sent successfully via Resend to ${prospect.email}`);
    } else {
      // Dev mode: output formatted preview
      console.log("\n----------------================ [OUTBOUND EMAIL LOG] ================----------------");
      console.log(`From:    ${DEFAULT_SENDER}`);
      console.log(`To:      ${prospect.email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Link:    ${reportUrl}`);
      console.log("--------------------------------------------------------------------------------------");
      console.log(htmlBody);
      console.log("----------------======================================================----------------\n");
      logger.info(`Dev mode: Outbound email logged to terminal console.`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to send audit ready email for prospect ${prospectId}: ${msg}`, { error: err });
  }
}

export async function sendAuditLinkFallbackEmail(prospectId: number): Promise<void> {
  try {
    const prospect = await prospectRepo.getById(prospectId);
    if (!prospect) {
      throw new Error(`Prospect not found: ${prospectId}`);
    }

    const listing = await listingRepo.getLatestByProspectId(prospectId);
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const reportUrl = `${appUrl}/p/${prospect.slug}`;
    const name = prospect.firstName || "there";
    const brand = listing?.brand || prospect.company || "your brand";

    const subject = `Your Requested Interactive Listing Audit — ${brand}`;

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 2px solid #000000; border-radius: 4px; background-color: #ffffff; color: #1a202c; box-shadow: 6px 6px 0px #b8860b;">
        <h2 style="color: #000000; border-bottom: 3px solid #b8860b; padding-bottom: 10px; font-size: 22px; font-weight: 900; margin-top: 0; tracking: 1px;">OPTIMUS RUFUS DIAGNOSTIC TERMINAL</h2>
        <p style="font-size: 16px; line-height: 1.6; margin-top: 20px;">Hi ${name},</p>
        <p style="font-size: 16px; line-height: 1.6;">Thanks for requesting your interactive listing audit for <strong>${brand}</strong>.</p>
        
        <p style="font-size: 16px; line-height: 1.6;">We built a live interactive teardown environment mapping your listing's exact Rufus AI retrieval gaps, COSMO intent graph bottlenecks, and daily revenue leakage to competing brands.</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${reportUrl}" style="background-color: #b8860b; color: #000000; padding: 16px 36px; font-size: 18px; font-weight: 900; text-decoration: none; border-radius: 2px; border: 3px solid #000000; box-shadow: 4px 4px 0px #000000; display: inline-block; text-transform: uppercase;">Launch Live Interactive Terminal →</a>
        </div>

        <p style="font-size: 14px; color: #4a5568; line-height: 1.5;">You can also download your full 10-page clinical PDF diagnostic report directly inside the terminal.</p>

        <p style="font-size: 14px; color: #718096; line-height: 1.5; margin-top: 30px; border-top: 2px solid #e2e8f0; padding-top: 15px;">
          Best regards,<br/>
          <strong>Optimus Rufus Lead Diagnostics Team</strong><br/>
          <span style="font-size: 12px; font-family: monospace;">optimusrufus.com</span>
        </p>
      </div>
    `;

    if (RESEND_API_KEY) {
      logger.info(`Sending fallback audit link email to ${prospect.email}...`);
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: DEFAULT_SENDER,
          to: [prospect.email],
          subject: subject,
          html: htmlBody,
        }),
      });

      if (!response.ok) {
        throw new Error(`Resend email delivery failed: ${response.status} ${await response.text()}`);
      }
      logger.info(`Fallback audit email sent successfully to ${prospect.email}`);
    } else {
      console.log("\n----------------================ [FALLBACK AUDIT EMAIL LOG] ================----------------");
      console.log(`From:    ${DEFAULT_SENDER}`);
      console.log(`To:      ${prospect.email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Link:    ${reportUrl}`);
      console.log("--------------------------------------------------------------------------------------------\n");
      logger.info(`Dev mode: Fallback outbound email logged to terminal console.`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to send audit link fallback email for prospect ${prospectId}: ${msg}`, { error: err });
  }
}

