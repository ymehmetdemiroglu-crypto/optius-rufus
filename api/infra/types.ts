// Shared infrastructure types for event bus and job queue

export interface DomainEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  correlationId?: string;
}

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

export interface JobQueue {
  add(name: string, data: unknown, opts?: JobOpts): Promise<Job>;
  getJob(id: string): Promise<Job | null>;
  updateProgress(id: string, progress: number): Promise<void>;
}

export interface EventBus {
  emit<T>(event: string, payload: T, correlationId?: string): void;
  on<T>(event: string, handler: (payload: T, meta: { correlationId?: string }) => void): void;
  off<T>(event: string, handler: (payload: T, meta: { correlationId?: string }) => void): void;
}
