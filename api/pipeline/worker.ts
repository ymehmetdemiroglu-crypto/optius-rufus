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

  /**
   * Start continuous polling loop.
   */
  start(): void {
    if (this.running) return;
    this.running = true;
    logger.info("QueueWorker started", { intervalMs: this.pollIntervalMs });

    const tick = async () => {
      if (!this.running) return;
      try {
        const hadWork = await this.processOne();
        // If work was found, process again immediately; otherwise wait
        this.timer = setTimeout(tick, hadWork ? 0 : this.pollIntervalMs);
      } catch (err) {
        logger.error("QueueWorker tick error", { error: String(err) });
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
    logger.info("QueueWorker stopped");
  }
}

// Singleton worker instance
export const queueWorker = new QueueWorker();
