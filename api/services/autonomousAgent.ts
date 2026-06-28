import { db } from "../db/drizzle.js";
import * as schema from "../db/schema.js";
import { eq, desc, sql, and, isNotNull, ne, not, like } from "drizzle-orm";
import { logger } from "../infra/logger.js";
import { sendTelegramMessage, sendTelegramDocument } from "../infra/telegram.js";
import { pipelineQueue } from "../infra/queue.js";
import {
  approveAndEnroll,
  getDefaultSequenceIdForProspect,
} from "../domains/prospect/service.js";

let botPolling = false;
let agentInterval: NodeJS.Timeout | null = null;
let agentActive = true; // Pause/resume state
let isScanning = false;
let lastUpdateId = 0;

/**
 * Sends a Telegram message directly back to the source chat.
 */
async function replyToChat(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes("your_bot_token")) return;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
    if (!response.ok) {
      logger.error(`Telegram reply failed: ${response.status} - ${await response.text()}`);
    }
  } catch (err) {
    logger.error("Failed to send Telegram reply", { chatId, error: String(err) });
  }
}

/**
 * Process incoming Telegram Bot commands.
 */
async function handleTelegramCommand(message: {
  chat: { id: number };
  text?: string;
  from?: { first_name?: string };
}) {
  const text = message.text?.trim() || "";
  const chatId = message.chat.id;
  const senderName = message.from?.first_name || "there";

  if (!text.startsWith("/")) return;

  const parts = text.split(/\s+/);
  const command = parts[0].toLowerCase();

  logger.info(`Telegram Bot command received: ${command} from ${senderName}`);

  if (command === "/start" || command === "/help") {
    const helpMsg =
      `🤖 *Optimus Rufus Agent Bot Help* \n\n` +
      `Available commands:\n` +
      `• \`/status\` - Check server status, active queues, and prospect metrics\n` +
      `• \`/audit <ASIN>\` - Audit a new ASIN (creates a prospect)\n` +
      `• \`/audit <email> <ASIN>\` - Audit an ASIN under a specific email\n` +
      `• \`/pause\` - Pause the autonomous agent loop\n` +
      `• \`/resume\` - Resume the autonomous agent loop\n` +
      `• \`/approve <ID>\` - Manually approve and enroll a prospect in Apollo\n` +
      `• \`/help\` - Show this help menu`;
    await replyToChat(chatId, helpMsg);
  }

  else if (command === "/status") {
    try {
      // 1. Get prospects status counts
      const statusCounts = await db
        .select({
          status: schema.prospects.status,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.prospects)
        .groupBy(schema.prospects.status);

      let prospectStatusStr = "";
      for (const row of statusCounts) {
        prospectStatusStr += `  • *${row.status}*: ${row.count}\n`;
      }
      if (!prospectStatusStr) prospectStatusStr = "  • None\n";

      // 2. Get active/pending/failed queues
      const queueCounts = await db
        .select({
          queue: schema.jobs.queue,
          status: schema.jobs.status,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.jobs)
        .groupBy(schema.jobs.queue, schema.jobs.status);

      let queueStr = "";
      const depths: Record<string, Record<string, number>> = {};
      for (const row of queueCounts) {
        const qName = row.queue || "unknown";
        const stName = row.status || "pending";
        if (!depths[qName]) depths[qName] = {};
        depths[qName][stName] = row.count;
      }

      for (const [qName, stats] of Object.entries(depths)) {
        queueStr += `  • *${qName}* queue:\n`;
        for (const [st, cnt] of Object.entries(stats)) {
          queueStr += `    - ${st}: ${cnt}\n`;
        }
      }
      if (!queueStr) queueStr = "  • All queues empty\n";

      // 3. Memory & Uptime
      const memory = process.memoryUsage();
      const uptimeHours = (process.uptime() / 3600).toFixed(2);
      const heapUsedMb = Math.round(memory.heapUsed / 1024 / 1024);

      const statusMsg =
        `📊 *Optimus Rufus Server Status*\n\n` +
        `• *Agent State*: ${agentActive ? "🟢 RUNNING" : "🟡 PAUSED"}\n` +
        `• *Server Uptime*: ${uptimeHours} hours\n` +
        `• *Memory (Heap)*: ${heapUsedMb} MB\n\n` +
        `📈 *Prospect Metrics*:\n${prospectStatusStr}\n` +
        `⚙️ *Job Queues*:\n${queueStr}`;

      await replyToChat(chatId, statusMsg);
    } catch (err) {
      await replyToChat(chatId, `❌ Failed to fetch status: ${String(err)}`);
    }
  }

  else if (command === "/pause") {
    agentActive = false;
    await replyToChat(chatId, "🟡 *Autonomous Agent Loop has been paused.* New prospects won't be auto-audited/auto-enrolled until resumed.");
  }

  else if (command === "/resume") {
    agentActive = true;
    await replyToChat(chatId, "🟢 *Autonomous Agent Loop has been resumed.* Scanning for new and drafted prospects...");
  }

  else if (command === "/audit") {
    if (parts.length < 2) {
      await replyToChat(chatId, "⚠️ Usage:\n`/audit <ASIN>`\n`/audit <email> <ASIN>`");
      return;
    }

    let email = `telegram-audit-${Date.now()}@example.com`;
    let asin = "";

    if (parts.length === 2) {
      asin = parts[1].toUpperCase();
    } else {
      email = parts[1];
      asin = parts[2].toUpperCase();
    }

    if (!/^[A-Z0-9]{10}$/.test(asin)) {
      await replyToChat(chatId, `❌ Invalid ASIN format: \`${asin}\`. Must be 10 characters alphanumeric.`);
      return;
    }

    try {
      await replyToChat(chatId, `🔄 Triggering audit for ASIN \`${asin}\`...`);
      const { createProspect } = await import("../domains/prospect/service.js");
      const prospect = await createProspect({
        email,
        asin,
        company: "Telegram Lead",
        expectedRevenue: "Class_C",
      });

      await pipelineQueue.add("scrape-and-audit", {
        prospectId: prospect.id,
        asin: prospect.asin,
        marketplace: "US"
      });

      const { updateProspectStatus } = await import("../domains/prospect/service.js");
      await updateProspectStatus(prospect.id, "analyzing");

      await replyToChat(chatId, `✅ *Audit Enqueued!* \nProspect ID: \`${prospect.id}\` \nASIN: \`${prospect.asin}\`\nStatus set to *analyzing*.`);
    } catch (err) {
      await replyToChat(chatId, `❌ Failed to trigger audit: ${String(err)}`);
    }
  }

  else if (command === "/approve") {
    if (parts.length < 2) {
      await replyToChat(chatId, "⚠️ Usage: `/approve <ProspectId>`");
      return;
    }
    const prospectId = parseInt(parts[1], 10);
    if (isNaN(prospectId)) {
      await replyToChat(chatId, "❌ Invalid Prospect ID.");
      return;
    }

    try {
      await replyToChat(chatId, `🔄 Enrolling prospect ${prospectId} in Apollo sequence...`);
      const { getDefaultSequenceIdForProspect, approveAndEnroll } = await import("../domains/prospect/service.js");
      const sequenceId = await getDefaultSequenceIdForProspect(prospectId);
      if (!sequenceId) {
        await replyToChat(chatId, `❌ Could not determine default sequence for prospect ID ${prospectId}.`);
        return;
      }
      await approveAndEnroll(prospectId, sequenceId);
      await replyToChat(chatId, `✅ *Outreach Approved!* Prospect ${prospectId} successfully enrolled in sequence \`${sequenceId}\`.`);
    } catch (err) {
      await replyToChat(chatId, `❌ Failed to approve outreach: ${String(err)}`);
    }
  }

  else {
    await replyToChat(chatId, `🤖 Unrecognized command. Type \`/help\` for a list of available commands.`);
  }
}

/**
 * Long-polling Telegram Bot update loop.
 */
async function runBotPolling() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes("your_bot_token")) {
    logger.warn("Telegram Bot token not configured. Long polling disabled.");
    return;
  }

  botPolling = true;
  logger.info("Telegram Bot long polling started.");

  while (botPolling) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=20`);
      if (!response.ok) {
        // Wait 5 seconds before retrying to prevent rate limiting
        await new Promise((resolve) => setTimeout(resolve, 5000));
        continue;
      }
      const data = await response.json() as {
        ok: boolean;
        result: Array<{
          update_id: number;
          message?: {
            chat: { id: number };
            text?: string;
            from?: { first_name?: string };
          };
          callback_query?: {
            id: string;
            from: { first_name?: string };
            message?: { chat: { id: number }; message_id: number };
            data: string;
          };
        }>;
      };
      if (data.ok && data.result.length > 0) {
        for (const update of data.result) {
          lastUpdateId = Math.max(lastUpdateId, update.update_id);
          if (update.message && update.message.text) {
            await handleTelegramCommand(update.message);
          } else if (update.callback_query) {
            await handleTelegramCallback(update.callback_query);
          }
        }
      }
    } catch (err) {
      logger.error("Error in Telegram long polling loop", { error: String(err) });
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

/**
 * Handle Telegram Bot inline button callbacks.
 */
async function handleTelegramCallback(callbackQuery: {
  id: string;
  from: { first_name?: string };
  message?: { chat: { id: number }; message_id: number };
  data: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const data = callbackQuery.data;
  const chatId = callbackQuery.message?.chat.id;

  // Acknowledge callback query to stop loading spinner on user's client
  if (token) {
    try {
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
          text: "AEO Audit approved!",
        }),
      });
    } catch (err) {
      logger.error("Failed to answer callback query", { error: String(err) });
    }
  }

  if (data.startsWith("approve_reply_")) {
    const prospectId = parseInt(data.replace("approve_reply_", ""), 10);
    if (isNaN(prospectId)) return;

    if (chatId) {
      await replyToChat(chatId, `🔄 *Approve received.* Syncing custom fields to Apollo and enrolling prospect in the reply sequence...`);
    }

    try {
      const prospect = await db.query.prospects.findFirst({
        where: eq(schema.prospects.id, prospectId),
      });

      if (!prospect) {
        if (chatId) await replyToChat(chatId, `❌ Prospect ID ${prospectId} not found.`);
        return;
      }

      if (!prospect.apolloContactId) {
        if (chatId) await replyToChat(chatId, `❌ Prospect has no associated Apollo Contact ID.`);
        return;
      }

      const replySequenceId = process.env.APOLLO_REPLY_SEQUENCE_ID;
      if (!replySequenceId) {
        if (chatId) await replyToChat(chatId, `❌ \`APOLLO_REPLY_SEQUENCE_ID\` is not configured in env.`);
        return;
      }

      const listing = await db.query.listings.findFirst({
        where: eq(schema.listings.prospectId, prospectId),
        orderBy: [desc(schema.listings.id)],
      });
      const analysis = await db.query.listingAnalyses.findFirst({
        where: eq(schema.listingAnalyses.prospectId, prospectId),
        orderBy: [desc(schema.listingAnalyses.id)],
      });

      const rufusScore = analysis?.rufusScore ?? 45;
      const appUrl = process.env.APP_URL || "http://localhost:3000";
      const auditUrl = `${appUrl}/p/${prospect.slug}`;
      const category = listing?.category || "product listing";

      // Parse gaps and competitor
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

      const { syncCustomFieldsToApollo, enrollInSequence } = await import("../domains/apollo/service.js");
      
      // Update Apollo custom fields
      await syncCustomFieldsToApollo(prospect.apolloContactId, {
        rufusScore,
        topGap,
        competitorName,
        auditUrl,
        category,
        customSubject1: "Your Rufus Listing Teardown",
        customBody1: "Here is your requested interactive teardown.",
        customBody2: "",
        customBody3: "",
        customBody4: "",
        customBody5: "",
      });

      // Enroll contact in Apollo reply sequence
      await enrollInSequence(prospect.apolloContactId, replySequenceId);

      // Trigger direct backup email failsafe
      try {
        const { sendAuditLinkFallbackEmail } = await import("./email.js");
        await sendAuditLinkFallbackEmail(prospectId);
      } catch (emailErr) {
        logger.error("Fallback audit link email error:", { error: String(emailErr) });
      }

      // Update local db status
      await db
        .update(schema.prospects)
        .set({ status: "reply_sent", apolloSequenceId: replySequenceId })
        .where(eq(schema.prospects.id, prospectId));

      if (chatId) {
        await replyToChat(
          chatId,
          `🚀 *[Success]* Multi-channel delivery triggered (Apollo + Direct Email)!\n\n` +
          `• *Prospect:* ${prospect.company || "N/A"} (${prospect.email})\n` +
          `• *Apollo Contact:* \`${prospect.apolloContactId}\`\n` +
          `• *Enrolled in Sequence:* \`${replySequenceId}\`\n` +
          `• *Audit Link:* ${auditUrl}`
        );
      }
    } catch (err) {
      logger.error("Failed to execute reply approval:", { error: String(err) });
      if (chatId) {
        await replyToChat(chatId, `❌ Failed to approve and send audit link: ${String(err)}`);
      }
    }
  }

  else if (data.startsWith("discard_reply_")) {
    const prospectId = parseInt(data.replace("discard_reply_", ""), 10);
    if (isNaN(prospectId)) return;

    try {
      await db
        .update(schema.prospects)
        .set({ status: "reply_discarded" })
        .where(eq(schema.prospects.id, prospectId));

      if (chatId) {
        await replyToChat(chatId, `❌ *[Action]* Discarded reply action for prospect ID ${prospectId}. Status set to *reply_discarded*.`);
      }
    } catch (err) {
      logger.error("Failed to execute reply discard:", { error: String(err) });
      if (chatId) {
        await replyToChat(chatId, `❌ Failed to discard: ${String(err)}`);
      }
    }
  }
}

/**
 * Periodic autonomous scanning function.
 */
async function runAutonomousScan() {
  if (!agentActive) return;
  if (isScanning) return;

  isScanning = true;

  try {
    // 1. Process New prospects
    const newProspects = await db
      .select()
      .from(schema.prospects)
      .where(eq(schema.prospects.status, "new"));

    for (const prospect of newProspects) {
      try {
        if (prospect.asin) {
          logger.info(`Autonomous Agent: Auto-triggering audit for prospect ${prospect.id} (ASIN: ${prospect.asin})`);

          await pipelineQueue.add("scrape-and-audit", {
            prospectId: prospect.id,
            asin: prospect.asin,
            marketplace: "US",
          });

          await db
            .update(schema.prospects)
            .set({ status: "analyzing" })
            .where(eq(schema.prospects.id, prospect.id));

          await sendTelegramMessage(
            `🔍 *[Agent]* Auto-enqueued audit for prospect:\n` +
            `• *Email*: ${prospect.email}\n` +
            `• *Company*: ${prospect.company || "N/A"}\n` +
            `• *ASIN*: \`${prospect.asin}\``
          );
        }
      } catch (err: any) {
        logger.error(`Autonomous Agent: Failed to auto-trigger audit for new prospect ${prospect.id}:`, { error: err.message });
      }
    }

    // 2. Process Drafted prospects
    const draftedProspects = await db
      .select()
      .from(schema.prospects)
      .where(
        and(
          eq(schema.prospects.status, "drafted"),
          isNotNull(schema.prospects.apolloContactId),
          ne(schema.prospects.apolloContactId, ""),
          not(like(schema.prospects.apolloContactId, "mock-%"))
        )
      );

    for (const prospect of draftedProspects) {
      try {
        // Find latest listing analysis
        const analysisRows = await db
          .select()
          .from(schema.listingAnalyses)
          .where(eq(schema.listingAnalyses.prospectId, prospect.id))
          .orderBy(desc(schema.listingAnalyses.id))
          .limit(1);

        const analysis = analysisRows[0];
        if (analysis) {
          const rufusScore = analysis.rufusScore ?? 0;

          if (rufusScore < 80) {
            // Qualified lead -> Auto-approve and enroll
            const sequenceId = await getDefaultSequenceIdForProspect(prospect.id);
            if (sequenceId) {
              logger.info(`Autonomous Agent: Auto-approving & enrolling prospect ${prospect.id} in sequence ${sequenceId}`);

              await approveAndEnroll(prospect.id, sequenceId);

              await sendTelegramMessage(
                `🚀 *[Agent] Auto-Enroll Success!*\n\n` +
                `• *Prospect*: ${prospect.company || "N/A"} (${prospect.email})\n` +
                `• *ASIN*: \`${prospect.asin}\`\n` +
                `• *Rufus Score*: *${rufusScore}/100* (Target < 80)\n` +
                `• *Sequence*: \`${sequenceId}\``
              );
            } else {
              logger.warn(`Autonomous Agent: Could not find sequence for prospect ${prospect.id}`);
            }
          } else {
            // Already optimized -> Mark completed
            logger.info(`Autonomous Agent: Prospect ${prospect.id} has high score ${rufusScore}; marking completed.`);

            await db
              .update(schema.prospects)
              .set({ status: "completed" })
              .where(eq(schema.prospects.id, prospect.id));

            await sendTelegramMessage(
              `ℹ️ *[Agent] Prospect Filtered (High Score)*\n\n` +
              `• *Prospect*: ${prospect.company || "N/A"} (${prospect.email})\n` +
              `• *ASIN*: \`${prospect.asin}\`\n` +
              `• *Rufus Score*: *${rufusScore}/100* (>= 80)\n` +
              `• *Status*: set to *completed*`
            );
          }
        }
      } catch (err: any) {
        logger.error(`Autonomous Agent: Failed to auto-enroll drafted prospect ${prospect.id}:`, { error: err.message });
      }
    }

    // 3. Process Reply Audit Ready prospects
    const replyReadyProspects = await db
      .select()
      .from(schema.prospects)
      .where(eq(schema.prospects.status, "reply_audit_ready"));

    for (const prospect of replyReadyProspects) {
      try {
        logger.info(`Autonomous Agent: Sending Telegram approval for replied prospect ${prospect.id}`);
        
        const analysis = await db.query.listingAnalyses.findFirst({
          where: eq(schema.listingAnalyses.prospectId, prospect.id),
          orderBy: [desc(schema.listingAnalyses.id)],
        });
        
        const rufusScore = analysis?.rufusScore ?? 45;
        const appUrl = process.env.APP_URL || "http://localhost:3000";
        const auditUrl = `${appUrl}/p/${prospect.slug}`;
        
        const message = 
          `📩 *[Reply Action Needed]*\n\n` +
          `• *Prospect:* ${prospect.company || "N/A"} (${prospect.email})\n` +
          `• *ASIN:* \`${prospect.asin}\`\n` +
          `• *Rufus Score:* *${rufusScore}/100*\n\n` +
          `Shopper replied! The interactive listing teardown page is ready. Preview it here:\n` +
          `${auditUrl}\n\n` +
          `Click below to approve sending this audit link to them via Apollo.`;

        const replyMarkup = {
          inline_keyboard: [
            [
              { text: "✅ Approve & Send", callback_data: `approve_reply_${prospect.id}` },
              { text: "❌ Discard", callback_data: `discard_reply_${prospect.id}` }
            ]
          ]
        };

        await sendTelegramMessage(message, replyMarkup);

        await db
          .update(schema.prospects)
          .set({ status: "reply_telegram_sent" })
          .where(eq(schema.prospects.id, prospect.id));

      } catch (err) {
        logger.error(`Failed to process reply_audit_ready prospect ${prospect.id}:`, { error: String(err) });
      }
    }
  } catch (err) {
    logger.error("Error in autonomous agent scanner", { error: String(err) });
  } finally {
    isScanning = false;
  }
}

/**
 * Start the autonomous agent system.
 */
export function startAutonomousAgent() {
  logger.info("Autonomous Agent controller starting...");

  // 1. Run Bot long polling loop in background (detached promise)
  runBotPolling().catch((err) => {
    logger.error("Fatal error starting Telegram Bot long polling", { error: String(err) });
  });

  // 2. Set up interval for scanning prospects
  agentInterval = setInterval(() => {
    runAutonomousScan().catch((err) => {
      logger.error("Unhandled autonomous scan tick error", { error: String(err) });
    });
  }, 60 * 1000); // scan every 60 seconds

  logger.info("Autonomous Agent controller active.");
}

/**
 * Stop the autonomous agent system.
 */
export function stopAutonomousAgent() {
  logger.info("Stopping Autonomous Agent controller...");
  botPolling = false;
  if (agentInterval) {
    clearInterval(agentInterval);
    agentInterval = null;
  }
  logger.info("Autonomous Agent controller stopped.");
}
