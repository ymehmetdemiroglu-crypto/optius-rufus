import { pipelineQueue } from "../infra/queue.js";
import { logger } from "../infra/logger.js";
import { pipelineEngine } from "./engine.js";

/**
 * QueueWorker polls the SQLite job queue and processes pipeline jobs.
 * In a serverless environment, this should be triggered by a cron or
 * external scheduler. In a long-running process (PM2/VPS), start() runs
 * a continuous polling loop.
 */
export class QueueWorker {
  private running = false;
  private timer?: NodeJS.Timeout;
  private activePromise?: Promise<unknown>;
  private readonly pollIntervalMs: number;

  constructor(pollIntervalMs = 2000) {
    this.pollIntervalMs = pollIntervalMs;
  }

  /**
   * Process a single job from the queue.
   * Returns true if a job was processed, false if queue is empty.
   */
  async processOne(): Promise<boolean> {
    const job = await pipelineQueue.pollNext();
    if (!job) return false;

    await pipelineQueue.markActive(job.id);
    logger.info(`Processing job ${job.id} (${job.name})`, { jobId: job.id });

    try {
      if (job.name === "run-pipeline") {
        const data = job.data as { jobId: number; correlationId: string; retryStage?: string };
        await pipelineEngine.runJob(data.jobId, data.correlationId);
      } else if (job.name === "scrape-and-audit") {
        const data = job.data as { prospectId: number; asin: string; marketplace?: string };
        const { scrapeAndAudit } = await import("../domains/analysis/service.js");
        await scrapeAndAudit(data.prospectId, data.asin, data.marketplace || "US");
      } else {
        throw new Error(`Unknown job name: ${job.name}`);
      }

      await pipelineQueue.markCompleted(job.id, { success: true });
      logger.info(`Job ${job.id} completed`, { jobId: job.id });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack ?? "" : "";
      await pipelineQueue.markFailed(job.id, message, stack ? [stack] : []);
      logger.error(`Job ${job.id} failed`, { jobId: job.id, error: message });
      return true;
    }
  }

  private async tick(): Promise<void> {
    if (!this.running) return;
    try {
      this.activePromise = this.processOne();
      const hadWork = await this.activePromise;
      this.activePromise = undefined;
      // If work was found, process again immediately; otherwise wait
      this.timer = setTimeout(() => this.tick(), hadWork ? 0 : this.pollIntervalMs);
    } catch (err) {
      this.activePromise = undefined;
      logger.error("QueueWorker tick error", { error: String(err) });
      this.timer = setTimeout(() => this.tick(), this.pollIntervalMs);
    }
  }

  /**
   * Start continuous polling loop.
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info("QueueWorker started", { intervalMs: this.pollIntervalMs });
    this.tick();
  }

  /**
   * Stop the polling loop and wait for the active job to finish.
   */
  async stop(): Promise<void> {
    this.running = false;
    if (this.timer) clearTimeout(this.timer);
    if (this.activePromise) {
      logger.info("QueueWorker waiting for active job to finish...");
      await this.activePromise.catch((err) => {
        logger.error("Active job failed during shutdown", { error: String(err) });
      });
    }
    logger.info("QueueWorker stopped");
  }
}

// Singleton worker instance
export const queueWorker = new QueueWorker();
