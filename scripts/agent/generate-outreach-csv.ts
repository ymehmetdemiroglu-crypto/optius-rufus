import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { and, eq, inArray, or, isNotNull, ilike } from "drizzle-orm";
import { getProspectById } from "../../api/domains/prospect/service.js";
import * as fs from "fs";
import * as path from "path";

function cleanCompanyName(company: string): string {
  if (!company) return "";
  let name = company;
  name = name.replace(/^Visit the\s+/i, "");
  name = name.replace(/\s+Store$/i, "");
  name = name.replace(/^Brand:\s+/i, "");
  return name.trim();
}

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/[\r\n]+/g, " ").trim();
  return `"${str.replace(/"/g, '""')}"`;
}

async function run() {
  const sequenceId = process.env.APOLLO_REPLY_SEQUENCE_ID || "6a38e400a82e22001cd289df";
  console.log(`Generating CSV for sequence ID: ${sequenceId}`);

  try {
    // Fetch all prospects (drafted or emailed) that have prepared outreach emails
    const prospects = await db
      .select({ id: schema.prospects.id })
      .from(schema.prospects)
      .where(
        and(
          or(
            eq(schema.prospects.status, "drafted"),
            eq(schema.prospects.status, "emailed")
          ),
          isNotNull(schema.prospects.outreachEmails)
        )
      );

    console.log(`Found ${prospects.length} prospects matching criteria.`);

    const headers = [
      "Email",
      "First Name",
      "Last Name",
      "Company",
      "Website",
      "rufus_score",
      "top_gap",
      "competitor_name",
      "audit_url",
      "product_category",
      "custom_subject_1",
      "custom_body_1",
      "custom_body_2",
      "custom_body_3",
      "custom_body_4",
      "custom_body_5"
    ];

    const rows = [headers.join(",")];

    for (const p of prospects) {
      const data = await getProspectById(p.id);
      const { prospect, listing, analysis } = data;
      const emails = prospect.outreachEmails;
      if (!emails) continue;

      const rufusScore = analysis?.rufusScore ?? 45;
      const auditUrl = `https://optimusrufus.com/p/${prospect.slug}`;
      const category = listing?.category || "product listing";

      let topGap = "safety warnings and usage routine guidelines";
      let competitorName = "your direct rivals";

      if (analysis?.copySimulatorScenarios) {
        try {
          const scenarios = typeof analysis.copySimulatorScenarios === "string"
            ? JSON.parse(analysis.copySimulatorScenarios)
            : analysis.copySimulatorScenarios;
          if (Array.isArray(scenarios) && scenarios.length > 0) {
            const gapItems = scenarios.map((s: any) => s.failReason || s.buyerQuestion).slice(0, 2).filter(Boolean);
            if (gapItems.length > 0) {
              topGap = gapItems.join(" and ");
            }
            competitorName = scenarios[0].competitorName || competitorName;
          }
        } catch (e) {
          // Ignored
        }
      }

      const cleanedCompany = cleanCompanyName(prospect.company || "");
      const website = prospect.websiteUrl || (cleanedCompany ? `${cleanedCompany.toLowerCase().replace(/[^a-z0-9]/g, "")}.com` : "");

      const row = [
        escapeCSV(prospect.email),
        escapeCSV(prospect.firstName || ""),
        escapeCSV(prospect.lastName || ""),
        escapeCSV(cleanedCompany || prospect.company || ""),
        escapeCSV(website),
        escapeCSV(rufusScore),
        escapeCSV(topGap),
        escapeCSV(competitorName),
        escapeCSV(auditUrl),
        escapeCSV(category),
        escapeCSV(emails.subject),
        escapeCSV(emails.body1),
        escapeCSV(emails.body2),
        escapeCSV(emails.body3),
        escapeCSV(emails.body4),
        escapeCSV(emails.body5)
      ];

      rows.push(row.join(","));
    }

    const csvContent = rows.join("\n");
    const outputPath = path.resolve(".", "apollo_custom_fields_import.csv");
    fs.writeFileSync(outputPath, csvContent, "utf-8");

    console.log(`=========================================`);
    console.log(`✅ CSV generated successfully!`);
    console.log(`File path: ${outputPath}`);
    console.log(`=========================================`);
  } catch (err: any) {
    console.error("Error generating CSV:", err.message);
  }
}

run();
