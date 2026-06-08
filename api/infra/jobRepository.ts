import type Database from "better-sqlite3";
import type { Job, JobOpts } from "./types.js";

export interface JobRepository {
  add(
    id: string,
    queue: string,
    name: string,
    data: unknown,
    opts: JobOpts,
    maxAttempts: number,
    now: number,
    delay: number
  ): Promise<void>;
  get(id: string): Promise<Job | null>;
  updateProgress(id: string, progress: number): Promise<void>;
  pollNext(queue: string, now: number): Promise<Job | null>;
  markActive(id: string, now: number): Promise<void>;
  markCompleted(id: string, now: number, returnValue: unknown): Promise<void>;
  getAttemptsInfo(id: string): Promise<{ attempts: number; maxAttempts: number } | null>;
  requeue(id: string, backoff: number, failedReason: string, stacktrace: string[]): Promise<void>;
  markFailed(id: string, now: number, failedReason: string, stacktrace: string[]): Promise<void>;
}

export class SqliteJobRepository implements JobRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  async add(
    id: string,
    queue: string,
    name: string,
    data: unknown,
    opts: JobOpts,
    maxAttempts: number,
    now: number,
    delay: number
  ): Promise<void> {
    this.db.prepare(
      `INSERT INTO jobs (id, queue, name, dataJSON, optsJSON, delay, timestamp, maxAttempts, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`
    ).run(
      id,
      queue,
      name,
      JSON.stringify(data),
      JSON.stringify(opts),
      delay,
      now,
      maxAttempts
    );
  }

  async get(id: string): Promise<Job | null> {
    const row = this.db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    return this.hydrate(row);
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    this.db.prepare("UPDATE jobs SET progress = ? WHERE id = ?").run(progress, id);
  }

  async pollNext(queue: string, now: number): Promise<Job | null> {
    const row = this.db
      .prepare(
        `SELECT * FROM jobs
         WHERE queue = ? AND status = 'pending' AND (delay = 0 OR timestamp + delay <= ?)
         ORDER BY timestamp ASC
         LIMIT 1`
      )
      .get(queue, now) as Record<string, unknown> | undefined;

    if (!row) return null;
    return this.hydrate(row);
  }

  async markActive(id: string, now: number): Promise<void> {
    this.db.prepare("UPDATE jobs SET status = 'active', processedOn = ?, attempts = attempts + 1 WHERE id = ?")
      .run(now, id);
  }

  async markCompleted(id: string, now: number, returnValue: unknown): Promise<void> {
    this.db.prepare(
      "UPDATE jobs SET status = 'completed', finishedOn = ?, returnValueJSON = ? WHERE id = ?"
    ).run(now, JSON.stringify(returnValue), id);
  }

  async getAttemptsInfo(id: string): Promise<{ attempts: number; maxAttempts: number } | null> {
    const job = this.db.prepare("SELECT attempts, maxAttempts FROM jobs WHERE id = ?").get(id) as
      | { attempts: number; maxAttempts: number }
      | undefined;
    if (!job) return null;
    return {
      attempts: Number(job.attempts),
      maxAttempts: Number(job.maxAttempts),
    };
  }

  async requeue(id: string, backoff: number, failedReason: string, stacktrace: string[]): Promise<void> {
    const now = Date.now();
    this.db.prepare(
      `UPDATE jobs SET status = 'pending', timestamp = ?, delay = ?, failedReason = ?, stacktraceJSON = ? WHERE id = ?`
    ).run(now, backoff, failedReason, JSON.stringify(stacktrace), id);
  }

  async markFailed(id: string, now: number, failedReason: string, stacktrace: string[]): Promise<void> {
    this.db.prepare(
      `UPDATE jobs SET status = 'failed', finishedOn = ?, failedReason = ?, stacktraceJSON = ? WHERE id = ?`
    ).run(now, failedReason, JSON.stringify(stacktrace), id);
  }

  private hydrate(row: Record<string, unknown>): Job {
    return {
      id: String(row.id),
      name: String(row.name),
      data: this.safeJsonParse(String(row.dataJSON), {}),
      opts: this.safeJsonParse(String(row.optsJSON), {}),
      progress: Number(row.progress ?? 0),
      attempts: Number(row.attempts ?? 0),
      maxAttempts: Number(row.maxAttempts ?? 3),
      status: String(row.status) as Job["status"],
      processedOn: row.processedOn ? Number(row.processedOn) : undefined,
      finishedOn: row.finishedOn ? Number(row.finishedOn) : undefined,
      returnValue: row.returnValueJSON
        ? this.safeJsonParse(String(row.returnValueJSON), undefined)
        : undefined,
      failedReason: row.failedReason ? String(row.failedReason) : undefined,
      stacktrace: row.stacktraceJSON
        ? this.safeJsonParse(String(row.stacktraceJSON), [])
        : undefined,
    };
  }

  private safeJsonParse<T>(text: string, fallback: T): T {
    try {
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  }
}
