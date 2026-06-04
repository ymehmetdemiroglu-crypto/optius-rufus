interface ProspectDetails {
  name: string;
  company?: string;
  email?: string;
}

/**
 * Triggers an external webhook event for prospect activity tracking.
 * Automatically formats payloads for Discord embeds, Slack Block Kit, or Zapier JSON.
 */
export async function triggerWebhook(
  prospect: ProspectDetails,
  eventType: string,
  eventData: any = {},
  interestScore: number = 0
) {
  const webhookUrl = process.env.TRACKING_WEBHOOK_URL;
  const isHotLead = interestScore >= 50;

  // Format details text
  let detailsText = "No additional metadata.";
  if (eventData) {
    if (typeof eventData === "string") {
      detailsText = eventData;
    } else {
      detailsText = Object.entries(eventData)
        .map(([key, value]) => `**${key}**: ${JSON.stringify(value)}`)
        .join("\n");
    }
  }

  // Define colors (Decimal formats for Discord embeds)
  const COLOR_BLUE = 3899990;    // #3b82f6
  const COLOR_YELLOW = 15381256;  // #eab308
  const COLOR_GREEN = 2278750;    // #22c55e
  const COLOR_RED = 15673644;     // #ef4444

  let embedColor = COLOR_BLUE;
  if (eventType === "click_booking") embedColor = COLOR_GREEN;
  else if (eventType === "sandbox_test") embedColor = COLOR_YELLOW;
  else if (eventType === "copy_qa" || eventType === "download_ppc") embedColor = COLOR_GREEN;
  else if (isHotLead) embedColor = COLOR_YELLOW;

  const eventLabel = eventType.replace(/_/g, " ").toUpperCase();
  const leadTag = isHotLead ? "🔥 HOT LEAD" : "⚡ Active Prospect";

  // 1. Mock local logging if no webhook URL is provided
  if (!webhookUrl) {
    console.log("---------------- [WEBHOOK MOCK TRIGGER] ----------------");
    console.log(`Event: ${eventLabel} | Status: ${leadTag}`);
    console.log(`Prospect: ${prospect.name} (${prospect.company || "No Company"}, ${prospect.email || "No Email"})`);
    console.log(`Interest Score: ${interestScore}/100`);
    console.log(`Details:\n${detailsText}`);
    console.log("--------------------------------------------------------");
    return;
  }

  try {
    let payload: any = {};

    // 2. Format for Discord Webhook
    if (webhookUrl.includes("discord.com/api/webhooks/")) {
      payload = {
        embeds: [
          {
            title: `Prospect Event: ${eventLabel}`,
            description: `Prospect is interacting with their Listing Autopsy report page.`,
            color: embedColor,
            fields: [
              { name: "Prospect Name", value: prospect.name, inline: true },
              { name: "Company", value: prospect.company || "Unknown", inline: true },
              { name: "Email", value: prospect.email || "Unknown", inline: true },
              { name: "Interest Score", value: `**${interestScore}/100** (${leadTag})`, inline: true },
              { name: "Event Metadata", value: detailsText.slice(0, 1024) }
            ],
            timestamp: new Date().toISOString(),
            footer: { text: "Optimus Rufus Tracker" }
          }
        ]
      };
    }
    // 3. Format for Slack Webhook
    else if (webhookUrl.includes("hooks.slack.com/services/")) {
      payload = {
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: `🚨 Prospect Activity: ${eventLabel}`,
              emoji: true
            }
          },
          {
            type: "section",
            fields: [
              { type: "mrkdwn", text: `*Prospect:* ${prospect.name}` },
              { type: "mrkdwn", text: `*Company:* ${prospect.company || "N/A"}` },
              { type: "mrkdwn", text: `*Email:* ${prospect.email || "N/A"}` },
              { type: "mrkdwn", text: `*Interest Score:* ${interestScore}/100 (${leadTag})` }
            ]
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Event Details:*\n${detailsText}`
            }
          },
          { type: "divider" }
        ]
      };
    }
    // 4. Default JSON formatting (Zapier / Make.com)
    else {
      payload = {
        timestamp: new Date().toISOString(),
        prospectName: prospect.name,
        company: prospect.company || null,
        email: prospect.email || null,
        eventType,
        eventLabel,
        interestScore,
        status: isHotLead ? "hot_lead" : "active",
        details: eventData
      };
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`❌ Webhook trigger failed with status ${response.status}`);
    } else {
      console.log(`✅ Webhook dispatched successfully for event: ${eventType}`);
    }
  } catch (error) {
    console.error("❌ Error disptaching webhook:", error);
  }
}
