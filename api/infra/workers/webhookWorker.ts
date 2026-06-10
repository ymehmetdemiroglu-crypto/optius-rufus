import { webhookQueue } from "../queue.js";
import { eventBus } from "../eventBus.js";
import { triggerWebhook } from "../../services/webhook.js";
import { logger } from "../logger.js";
import * as prospectRepo from "../../domains/prospect/repository.js";

eventBus.on<{ prospectId: number; eventType: string; eventData: unknown; interestScore: number }>(
  "prospect:activity",
  (payload) => {
    webhookQueue.add("send-webhook", payload).catch((err) => {
      logger.error("Failed to enqueue webhook job", { error: String(err) });
    });
  }
);

export class WebhookWorker {
  private running = false;
  private timer?: NodeJS.Timeout;
  private readonly pollIntervalMs: number;

  constructor(pollIntervalMs = 3000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  async processOne(): Promise<boolean> {
    const job = await webhookQueue.pollNext();
    if (!job) return false;

    await webhookQueue.markActive(job.id);

    try {
      const { prospectId, eventType, eventData, interestScore } = job.data as {
        prospectId: number;
        eventType: string;
        eventData: unknown;
        interestScore: number;
      };

      const prospect = await prospectRepo.getById(prospectId);
      const prospectName = prospect
        ? `${prospect.firstName || ""} ${prospect.lastName || ""}`.trim() || prospect.email || "Unknown"
        : "Unknown";

      await triggerWebhook(
        { name: prospectName, company: prospect?.company, email: prospect?.email },
        eventType,
        eventData,
        interestScore
      );

      await webhookQueue.markCompleted(job.id, { success: true });
      logger.info(`Webhook job ${job.id} completed`, { jobId: job.id });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Webhook job ${job.id} failed`, { jobId: job.id, error: errorMessage });
      await webhookQueue.markFailed(job.id, errorMessage, []);
      return true;
    }
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info("Webhook worker started");

    const loop = async () => {
      while (this.running) {
        try {
          const processed = await this.processOne();
          if (!processed) {
            await new Promise((resolve) => { this.timer = setTimeout(resolve, this.pollIntervalMs); });
          }
        } catch (err) {
          logger.error("Webhook worker loop error", { error: String(err) });
          await new Promise((resolve) => { this.timer = setTimeout(resolve, this.pollIntervalMs); });
        }
      }
    };

    loop().catch((err) => {
      logger.error("Webhook worker crashed", { error: String(err) });
      this.running = false;
    });
  }

  stop(): void {
    this.running = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    logger.info("Webhook worker stopped");
  }
}

export const webhookWorker = new WebhookWorker();
