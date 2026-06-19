import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { eq } from "drizzle-orm";
import { approveAndEnroll, getDefaultSequenceIdForProspect } from "../../api/domains/prospect/service.js";

async function run() {
  const args = process.argv.slice(2);
  let id: number | undefined = undefined;
  let sequenceId: string | undefined = undefined;

  for (const arg of args) {
    if (arg.startsWith("--id=")) {
      id = parseInt(arg.split("=")[1], 10);
    } else if (arg.startsWith("--sequence-id=")) {
      sequenceId = arg.split("=")[1];
    }
  }

  if (!id && process.argv[2] && !isNaN(parseInt(process.argv[2]))) {
    id = parseInt(process.argv[2]);
  }

  if (!id) {
    console.error("\n❌ Error: Please specify a Prospect ID.");
    console.error("Usage: node scripts/agent/approve-outreach.ts <prospectId> [--sequence-id=<sequenceId>]\n");
    process.exit(1);
  }

  console.log(`\n✍️  Processing outreach approval for Prospect ID ${id}...`);

  try {
    const prospectRows = await db
      .select()
      .from(schema.prospects)
      .where(eq(schema.prospects.id, id))
      .limit(1);

    if (prospectRows.length === 0) {
      console.error(`❌ Error: Prospect ID ${id} not found in database.\n`);
      process.exit(1);
    }
    const prospect = prospectRows[0];

    if (!sequenceId) {
      console.log(`   Auto-selecting sequence based on expected revenue: '${prospect.expectedRevenue || "Class_C"}'`);
      sequenceId = await getDefaultSequenceIdForProspect(id);
    }

    if (!sequenceId) {
      console.error(`❌ Error: Could not determine sequence ID for prospect ${id}.\n`);
      process.exit(1);
    }

    console.log(`   Selected Sequence ID: ${sequenceId}`);
    console.log(`   Enrolling contact ${prospect.apolloContactId || "N/A"}...`);

    await approveAndEnroll(id, sequenceId);

    console.log(`\n✅ Outreach approved and enrolled successfully!`);
    console.log(`   Prospect status updated to 'emailed'.\n`);

  } catch (err) {
    console.error(`\n❌ Failed to approve outreach:`, (err as Error).message);
    process.exit(1);
  }
}

run();
