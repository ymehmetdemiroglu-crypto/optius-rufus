// Shared infrastructure types for event bus and job queue

export interface DomainEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  correlationId?: string;
}

/**
 * Generic job-queue entry (e.g., BullMQ-style). This is intentionally separate
 * from the domain-specific `PipelineJob` in `api/pipeline/types.ts`.
 */
export interface Job {
  id: string;
  name: string;
  data: unknown;
  opts: JobOpts;
  progress: number;
  attempts: number;
  maxAttempts: number;
  status: "pending" | "active" | "completed" | "failed" | "delayed";
  processedOn?: number;
  finishedOn?: number;
  returnValue?: unknown;
  failedReason?: string;
  stacktrace?: string[];
}

export interface JobOpts {
  delay?: number;
  maxAttempts?: number;
  priority?: number;
}

export interface IJobQueue {
  add(name: string, data: unknown, opts?: JobOpts): Promise<Job>;
  getJob(id: string): Promise<Job | null>;
  updateProgress(id: string, progress: number): Promise<void>;
  pollNext(): Promise<Job | null>;
  markActive(id: string): Promise<void>;
  markCompleted(id: string, returnValue: unknown): Promise<void>;
  markFailed(id: string, reason: string, stacktrace: string[]): Promise<void>;
}

export interface EventBus {
  emit<T>(event: string, payload: T, correlationId?: string): void;
  on<T>(event: string, handler: (payload: T, meta: { correlationId?: string }) => void): void;
  off<T>(event: string, handler: (payload: T, meta: { correlationId?: string }) => void): void;
}
