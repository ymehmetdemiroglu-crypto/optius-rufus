import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { and, eq, gte, sum, sql } from "drizzle-orm";
import { tokenBudgetService } from "../../api/infra/tokenBudget.js";

async function run() {
  const args = process.argv.slice(2);
  let prospectId: number | undefined = undefined;

  for (const arg of args) {
    if (arg.startsWith("--prospect-id=")) {
      prospectId = parseInt(arg.split("=")[1], 10);
    }
  }

  if (!prospectId && process.argv[2] && !isNaN(parseInt(process.argv[2]))) {
    prospectId = parseInt(process.argv[2]);
  }

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  try {
    if (prospectId) {
      console.log(`\n💰 Cost & Token Report for Prospect ID ${prospectId} (Current Month):\n`);

      const pRows = await db
        .select()
        .from(schema.prospects)
        .where(eq(schema.prospects.id, prospectId))
        .limit(1);

      if (pRows.length === 0) {
        console.error(`❌ Prospect ID ${prospectId} not found.\n`);
        process.exit(1);
      }
      const p = pRows[0];
      const packageType = p.packageType || "package_2";
      const capCents = tokenBudgetService.getTierCap(packageType);

      const events = await db
        .select({
          service: schema.usageEvents.service,
          promptTokens: sql<number>`sum(prompt_tokens)::int`,
          completionTokens: sql<number>`sum(completion_tokens)::int`,
          totalTokens: sql<number>`sum(total_tokens)::int`,
          costCents: sql<number>`sum(cost_cents)::int`,
        })
        .from(schema.usageEvents)
        .where(
          and(
            eq(schema.usageEvents.prospectId, prospectId),
            gte(schema.usageEvents.createdAt, startOfMonth)
          )
        )
        .groupBy(schema.usageEvents.service);

      let totalSpentCents = 0;
      let totalTokensCount = 0;

      console.log(`Package Tier:      ${packageType}`);
      console.log(`Monthly Budget:    $${(capCents / 100).toFixed(2)}`);
      console.log("-".repeat(50));
      console.log(
        "Service".padEnd(20) +
        "Tokens".padStart(10) +
        "Prompt".padStart(10) +
        "Completion".padStart(12) +
        "Cost".padStart(10)
      );
      console.log("-".repeat(62));

      for (const e of events) {
        totalSpentCents += e.costCents;
        totalTokensCount += e.totalTokens;
        console.log(
          e.service.padEnd(20) +
          e.totalTokens.toString().padStart(10) +
          e.promptTokens.toString().padStart(10) +
          e.completionTokens.toString().padStart(12) +
          `$${(e.costCents / 100).toFixed(2)}`.padStart(10)
        );
      }

      console.log("-".repeat(62));
      const remainingCents = Math.max(0, capCents - totalSpentCents);
      console.log(`Total Spent:       $${(totalSpentCents / 100).toFixed(2)} (${totalTokensCount} tokens)`);
      console.log(`Budget Remaining:  $${(remainingCents / 100).toFixed(2)}`);
      console.log(`Status:            ${totalSpentCents >= capCents ? "🔴 EXCEEDED" : "🟢 WITHIN BUDGET"}\n`);

    } else {
      console.log(`\n💰 Global System Cost & Token Report (Current Month):\n`);

      const events = await db
        .select({
          service: schema.usageEvents.service,
          promptTokens: sql<number>`sum(prompt_tokens)::int`,
          completionTokens: sql<number>`sum(completion_tokens)::int`,
          totalTokens: sql<number>`sum(total_tokens)::int`,
          costCents: sql<number>`sum(cost_cents)::int`,
        })
        .from(schema.usageEvents)
        .where(gte(schema.usageEvents.createdAt, startOfMonth))
        .groupBy(schema.usageEvents.service);

      let totalSpentCents = 0;
      let totalTokensCount = 0;

      console.log(
        "Service".padEnd(25) +
        "Tokens".padStart(10) +
        "Prompt".padStart(10) +
        "Completion".padStart(12) +
        "Cost".padStart(10)
      );
      console.log("-".repeat(67));

      for (const e of events) {
        totalSpentCents += e.costCents;
        totalTokensCount += e.totalTokens;
        console.log(
          e.service.padEnd(25) +
          e.totalTokens.toString().padStart(10) +
          e.promptTokens.toString().padStart(10) +
          e.completionTokens.toString().padStart(12) +
          `$${(e.costCents / 100).toFixed(2)}`.padStart(10)
        );
      }

      console.log("-".repeat(67));
      console.log(`Total Spent across all prospects: $${(totalSpentCents / 100).toFixed(2)}`);
      console.log(`Total Tokens processed:           ${totalTokensCount} tokens\n`);
    }

  } catch (err) {
    console.error(`❌ Failed to retrieve cost report:`, (err as Error).message);
  }
}

run();
