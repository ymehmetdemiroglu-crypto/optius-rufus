import { db } from "../db/client.js";
import type { Job, JobOpts, JobQueue } from "./types.js";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export class SQLiteJobQueue implements JobQueue {
  private queueName: string;

  constructor(queueName: string) {
    this.queueName = queueName;
  }

  async add(name: string, data: unknown, opts: JobOpts = {}): Promise<Job> {
    const id = generateId();
    const now = Date.now();
    const delay = opts.delay ?? 0;
    const maxAttempts = opts.maxAttempts ?? 3;

    db.prepare(
      `INSERT INTO jobs (id, queue, name, dataJSON, optsJSON, delay, timestamp, maxAttempts, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).run(
      id,
      this.queueName,
      name,
      JSON.stringify(data),
      JSON.stringify(opts),
      delay,
      now,
      maxAttempts
    );

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
    const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    return this.hydrate(row);
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    db.prepare("UPDATE jobs SET progress = ? WHERE id = ?").run(progress, id);
  }

  /**
   * Poll for the next pending job in this queue.
   * Returns null if no job is ready.
   */
  pollNext(): Job | null {
    const now = Date.now();
    const row = db
      .prepare(
        `SELECT * FROM jobs
         WHERE queue = ? AND status = 'pending' AND (delay = 0 OR timestamp + delay <= ?)
         ORDER BY timestamp ASC
         LIMIT 1`
      )
      .get(this.queueName, now) as Record<string, unknown> | undefined;

    if (!row) return null;
    return this.hydrate(row);
  }

  /**
   * Mark a job as active (lock it for processing).
   */
  markActive(id: string): void {
    db.prepare("UPDATE jobs SET status = 'active', processedOn = ?, attempts = attempts + 1 WHERE id = ?")
      .run(Date.now(), id);
  }

  /**
   * Mark a job as completed.
   */
  markCompleted(id: string, returnValue: unknown): void {
    db.prepare(
      "UPDATE jobs SET status = 'completed', finishedOn = ?, returnValueJSON = ? WHERE id = ?"
    ).run(Date.now(), JSON.stringify(returnValue), id);
  }

  /**
   * Mark a job as failed. Re-queues if attempts remain.
   */
  markFailed(id: string, reason: string, stacktrace: string[]): void {
    const job = db.prepare("SELECT attempts, maxAttempts FROM jobs WHERE id = ?").get(id) as
      | { attempts: number; maxAttempts: number }
      | undefined;

    if (!job) return;

    if (job.attempts < job.maxAttempts) {
      // Re-queue with exponential backoff
      const backoff = Math.pow(2, job.attempts) * 1000;
      db.prepare(
        `UPDATE jobs SET status = 'pending', delay = delay + ?, failedReason = ?, stacktraceJSON = ? WHERE id = ?`
      ).run(backoff, reason, JSON.stringify(stacktrace), id);
    } else {
      db.prepare(
        `UPDATE jobs SET status = 'failed', finishedOn = ?, failedReason = ?, stacktraceJSON = ? WHERE id = ?`
      ).run(Date.now(), reason, JSON.stringify(stacktrace), id);
    }
  }

  private hydrate(row: Record<string, unknown>): Job {
    return {
      id: String(row.id),
      name: String(row.name),
      data: safeJsonParse(String(row.dataJSON), {}),
      opts: safeJsonParse(String(row.optsJSON), {}),
      progress: Number(row.progress ?? 0),
      attempts: Number(row.attempts ?? 0),
      maxAttempts: Number(row.maxAttempts ?? 3),
      status: String(row.status) as Job["status"],
      processedOn: row.processedOn ? Number(row.processedOn) : undefined,
      finishedOn: row.finishedOn ? Number(row.finishedOn) : undefined,
      returnValue: row.returnValueJSON
        ? safeJsonParse(String(row.returnValueJSON), undefined)
        : undefined,
      failedReason: row.failedReason ? String(row.failedReason) : undefined,
      stacktrace: row.stacktraceJSON
        ? safeJsonParse(String(row.stacktraceJSON), [])
        : undefined,
    };
  }
}

function safeJsonParse<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

// Global queue instances
export const pipelineQueue = new SQLiteJobQueue("pipeline");
export const webhookQueue = new SQLiteJobQueue("webhook");
