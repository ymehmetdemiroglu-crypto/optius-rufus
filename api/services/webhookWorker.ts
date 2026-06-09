import { webhookQueue } from "../infra/queue.js";
import { eventBus } from "../infra/eventBus.js";
import { triggerWebhook } from "./webhook.js";
import { logger } from "../infra/logger.js";
import * as prospectRepo from "../domains/prospect/repository.js";

// Enqueue webhook jobs when prospect activity occurs
eventBus.on<{ prospectId: number; eventType: string; eventData: unknown; interestScore: number }>(
  "prospect:activity",
  (payload) => {
    webhookQueue.add("send-webhook", payload).catch((err) => {
      logger.error("Failed to enqueue webhook job", { error: String(err) });
    });
  }
);

/**
 * WebhookWorker polls the SQLite job queue and processes webhook jobs.
 * In a serverless environment, this should be triggered by a cron or
 * external scheduler. In a long-running process (PM2/VPS), start() runs
 * a continuous polling loop.
 */
export class WebhookWorker {
  private running = false;
  private timer?: NodeJS.Timeout;
  private readonly pollIntervalMs: number;

  constructor(pollIntervalMs = 3000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  /**
   * Process a single job from the queue.
   * Returns true if a job was processed, false if queue is empty.
   */
  async processOne(): Promise<boolean> {
    const job = await webhookQueue.pollNext();
    if (!job) return false;

    await webhookQueue.markActive(job.id);
    logger.info(`Processing webhook job ${job.id} (${job.name})`, { jobId: job.id });

    try {
      if (job.name === "send-webhook") {
        const data = job.data as {
          prospectId: number;
          eventType: string;
          eventData: unknown;
          interestScore: number;
        };

        // Fetch prospect details to populate webhook payload.
        let prospectName = "Unknown Prospect";
        let company: string | undefined;
        let email: string | undefined;
        try {
          const prospect = await prospectRepo.getById(data.prospectId);
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
          logger.error("Failed to read prospect details for webhook", {
            prospectId: data.prospectId,
            error: String(err),
          });
        }

        await triggerWebhook(
          { name: prospectName, company, email },
          data.eventType,
          data.eventData,
          data.interestScore
        );
      } else {
        throw new Error(`Unknown webhook job name: ${job.name}`);
      }

      await webhookQueue.markCompleted(job.id, { success: true });
      logger.info(`Webhook job ${job.id} completed`, { jobId: job.id });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack ?? "" : "";
      await webhookQueue.markFailed(job.id, message, stack ? [stack] : []);
      logger.error(`Webhook job ${job.id} failed`, { jobId: job.id, error: message });
      return true;
    }
  }

  /**
   * Start continuous polling loop.
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info("WebhookWorker started", { intervalMs: this.pollIntervalMs });

    const tick = async () => {
      if (!this.running) return;
      try {
        const hadWork = await this.processOne();
        // If work was found, process again immediately; otherwise wait
        this.timer = setTimeout(tick, hadWork ? 0 : this.pollIntervalMs);
      } catch (err) {
        logger.error("WebhookWorker tick error", { error: String(err) });
        this.timer = setTimeout(tick, this.pollIntervalMs);
      }
    };

    tick();
  }

  /**
   * Stop the polling loop.
   */
  stop(): void {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    logger.info("WebhookWorker stopped");
  }
}

// Singleton worker instance
export const webhookWorker = new WebhookWorker();
