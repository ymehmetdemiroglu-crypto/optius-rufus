import { eq, and, or, asc, lte, sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { db } from "../db/drizzle.js";
import * as schema from "../db/schema.js";
import type { Job, JobOpts } from "./infra.types.js";

export interface IJobRepository {
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

export class JobRepository implements IJobRepository {
  private db: NodePgDatabase<typeof schema>;

  constructor(dbInstance?: NodePgDatabase<typeof schema>) {
    this.db = dbInstance ?? (db as NodePgDatabase<typeof schema>);
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
    await this.db.insert(schema.jobs).values({
      id,
      queue,
      name,
      dataJSON: data,
      optsJSON: opts,
      delay,
      timestamp: now,
      maxAttempts,
      status: "pending",
    });
  }

  async get(id: string): Promise<Job | null> {
    const rows = await this.db
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.id, id))
      .limit(1);
    if (!rows.length) return null;
    return this.hydrate(rows[0]);
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    await this.db
      .update(schema.jobs)
      .set({ progress })
      .where(eq(schema.jobs.id, id));
  }

  async pollNext(queue: string, now: number): Promise<Job | null> {
    const rows = await this.db
      .select()
      .from(schema.jobs)
      .where(
        and(
          eq(schema.jobs.queue, queue),
          eq(schema.jobs.status, "pending"),
          or(
            eq(schema.jobs.delay, 0),
            lte(sql`${schema.jobs.timestamp} + ${schema.jobs.delay}`, now)
          )
        )
      )
      .orderBy(asc(schema.jobs.timestamp))
      .limit(1);

    if (!rows.length) return null;
    return this.hydrate(rows[0]);
  }

  async markActive(id: string, now: number): Promise<void> {
    await this.db
      .update(schema.jobs)
      .set({
        status: "active",
        processedOn: now,
        attempts: sql`${schema.jobs.attempts} + 1`,
      })
      .where(eq(schema.jobs.id, id));
  }

  async markCompleted(id: string, now: number, returnValue: unknown): Promise<void> {
    await this.db
      .update(schema.jobs)
      .set({
        status: "completed",
        finishedOn: now,
        returnValueJSON: returnValue,
      })
      .where(eq(schema.jobs.id, id));
  }

  async getAttemptsInfo(id: string): Promise<{ attempts: number; maxAttempts: number } | null> {
    const rows = await this.db
      .select({
        attempts: schema.jobs.attempts,
        maxAttempts: schema.jobs.maxAttempts,
      })
      .from(schema.jobs)
      .where(eq(schema.jobs.id, id))
      .limit(1);

    if (!rows.length) return null;
    return {
      attempts: Number(rows[0].attempts),
      maxAttempts: Number(rows[0].maxAttempts),
    };
  }

  async requeue(id: string, backoff: number, failedReason: string, stacktrace: string[]): Promise<void> {
    const now = Date.now();
    await this.db
      .update(schema.jobs)
      .set({
        status: "pending",
        timestamp: now,
        delay: backoff,
        failedReason,
        stacktraceJSON: stacktrace,
      })
      .where(eq(schema.jobs.id, id));
  }

  async markFailed(id: string, now: number, failedReason: string, stacktrace: string[]): Promise<void> {
    await this.db
      .update(schema.jobs)
      .set({
        status: "failed",
        finishedOn: now,
        failedReason,
        stacktraceJSON: stacktrace,
      })
      .where(eq(schema.jobs.id, id));
  }

  private hydrate(row: Record<string, unknown>): Job {
    return {
      id: String(row.id),
      name: String(row.name),
      data: (row.dataJSON ?? {}) as unknown,
      opts: (row.optsJSON ?? {}) as JobOpts,
      progress: Number(row.progress ?? 0),
      attempts: Number(row.attempts ?? 0),
      maxAttempts: Number(row.maxAttempts ?? 3),
      status: String(row.status) as Job["status"],
      processedOn: row.processedOn ? Number(row.processedOn) : undefined,
      finishedOn: row.finishedOn ? Number(row.finishedOn) : undefined,
      returnValue: row.returnValueJSON ?? undefined,
      failedReason: row.failedReason ? String(row.failedReason) : undefined,
      stacktrace: (row.stacktraceJSON ?? []) as string[],
    };
  }
}
