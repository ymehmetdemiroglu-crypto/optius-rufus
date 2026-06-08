import { PgJobRepository, type JobRepository } from "./jobRepository.js";
import type { Job, JobOpts, JobQueue } from "./types.js";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export class SQLiteJobQueue implements JobQueue {
  private queueName: string;
  private repo: JobRepository;

  constructor(queueName: string, repo: JobRepository = new PgJobRepository()) {
    this.queueName = queueName;
    this.repo = repo;
  }

  async add(name: string, data: unknown, opts: JobOpts = {}): Promise<Job> {
    const id = generateId();
    const now = Date.now();
    const delay = opts.delay ?? 0;
    const maxAttempts = opts.maxAttempts ?? 3;

    await this.repo.add(id, this.queueName, name, data, opts, maxAttempts, now, delay);

    return {
      id,
      name,
      data,
      opts,
      progress: 0,
      attempts: 0,
      maxAttempts,
      status: delay > 0 ? "delayed" : "pending",
    };
  }

  async getJob(id: string): Promise<Job | null> {
    return this.repo.get(id);
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await this.repo.updateProgress(id, progress);
  }

  /**
   * Poll for the next pending job in this queue.
   * Returns null if no job is ready.
   */
  async pollNext(): Promise<Job | null> {
    const now = Date.now();
    return this.repo.pollNext(this.queueName, now);
  }

  /**
   * Mark a job as active (lock it for processing).
   */
  async markActive(id: string): Promise<void> {
    await this.repo.markActive(id, Date.now());
  }

  /**
   * Mark a job as completed.
   */
  async markCompleted(id: string, returnValue: unknown): Promise<void> {
    await this.repo.markCompleted(id, Date.now(), returnValue);
  }

  /**
   * Mark a job as failed. Re-queues if attempts remain.
   */
  async markFailed(id: string, reason: string, stacktrace: string[]): Promise<void> {
    const jobInfo = await this.repo.getAttemptsInfo(id);
    if (!jobInfo) return;

    if (jobInfo.attempts < jobInfo.maxAttempts) {
      // Re-queue with exponential backoff
      const backoff = Math.pow(2, jobInfo.attempts) * 1000;
      await this.repo.requeue(id, backoff, reason, stacktrace);
    } else {
      await this.repo.markFailed(id, Date.now(), reason, stacktrace);
    }
  }
}

// Global queue instances
export const pipelineQueue = new SQLiteJobQueue("pipeline");
export const webhookQueue = new SQLiteJobQueue("webhook");
