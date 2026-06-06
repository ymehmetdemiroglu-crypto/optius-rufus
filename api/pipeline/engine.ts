import { db, withTransaction } from "../db/client.js";
import { eventBus } from "../infra/eventBus.js";
import { logger } from "../infra/logger.js";
import { pipelineQueue } from "../infra/queue.js";
import type { PipelineJob, StageName, StageOutput, StageContext } from "./types.js";
import { STAGE_ORDER, stageExecutors } from "./stages.js";

function safeJson<T>(text: string | undefined | null, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export class PipelineEngine {
  /**
   * Insert pipeline job and stage rows into DB.
   */
  private insertJob(
    prospectId: number,
    listingId: number | undefined,
    packageType: string
  ): { jobId: number; correlationId: string } {
    const correlationId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const result = db
      .prepare(
        `INSERT INTO pipeline_jobs (prospectId, listingId, packageType, status, stagesJSON)
         VALUES (?, ?, ?, 'pending', '{}')`
      )
      .run(prospectId, listingId ?? null, packageType);

    const jobId = Number(result.lastInsertRowid);

    // Initialize stage rows
    const insertStage = db.prepare(
      `INSERT INTO pipeline_job_stages (jobId, stageName, status)
       VALUES (?, ?, 'pending')`
    );
    for (const stage of STAGE_ORDER) {
      insertStage.run(jobId, stage.name);
    }

    logger.info(`Pipeline job created`, { jobId, prospectId, packageType, correlationId });
    eventBus.emit("pipeline:created", { jobId, prospectId, packageType }, String(correlationId));

    return { jobId, correlationId };
  }

  /**
   * Create a new pipeline job and enqueue it for async processing.
   */
  async createJob(
    prospectId: number,
    listingId: number | undefined,
    packageType: string
  ): Promise<{ jobId: number }> {
    const { jobId, correlationId } = this.insertJob(prospectId, listingId, packageType);
    await pipelineQueue.add("run-pipeline", { jobId, correlationId });
    return { jobId };
  }

  /**
   * Create and run a pipeline job synchronously (for backward-compatible routes).
   */
  async createAndRunJob(
    prospectId: number,
    listingId: number | undefined,
    packageType: string
  ): Promise<PipelineJob> {
    const { jobId, correlationId } = this.insertJob(prospectId, listingId, packageType);
    await this.runJob(jobId, correlationId);
    const job = this.getJob(jobId);
    if (!job) throw new Error(`Pipeline job ${jobId} disappeared after run`);
    return job;
  }

  /**
   * Get the current state of a pipeline job.
   */
  getJob(jobId: number): PipelineJob | null {
    const row = db.prepare("SELECT * FROM pipeline_jobs WHERE id = ?").get(jobId) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;

    const stageRows = db
      .prepare("SELECT * FROM pipeline_job_stages WHERE jobId = ?")
      .all(jobId) as Array<Record<string, unknown>>;

    const stages: PipelineJob["stages"] = {} as PipelineJob["stages"];
    for (const sr of stageRows) {
      stages[sr.stageName as StageName] = {
        status: sr.status as PipelineJob["stages"][StageName]["status"],
        output: sr.outputJSON ? safeJson(String(sr.outputJSON), undefined) : undefined,
        errorMessage: sr.errorMessage ? String(sr.errorMessage) : undefined,
        startedAt: sr.startedAt ? String(sr.startedAt) : undefined,
        completedAt: sr.completedAt ? String(sr.completedAt) : undefined,
      };
    }

    return {
      id: Number(row.id),
      prospectId: Number(row.prospectId),
      listingId: row.listingId ? Number(row.listingId) : undefined,
      packageType: String(row.packageType),
      status: String(row.status) as PipelineJob["status"],
      currentStage: row.currentStage ? String(row.currentStage) as StageName : undefined,
      stages,
      tokenUsage: Number(row.tokenUsage ?? 0),
      errorLog: row.errorLog ? String(row.errorLog) : undefined,
      createdAt: String(row.createdAt),
      updatedAt: String(row.updatedAt),
    };
  }

  /**
   * Run (or resume) a pipeline job.
   */
  async runJob(jobId: number, correlationId: string): Promise<void> {
    const job = this.getJob(jobId);
    if (!job) {
      throw new Error(`Pipeline job ${jobId} not found`);
    }

    logger.info(`Pipeline run starting`, { jobId, correlationId });
    eventBus.emit("pipeline:start", { jobId }, String(correlationId));

    db.prepare("UPDATE pipeline_jobs SET status = 'running', updatedAt = datetime('now') WHERE id = ?")
      .run(jobId);

    try {
      const stageOutputs: StageOutput = {};

      for (const stageDef of STAGE_ORDER) {
        const stageState = job.stages[stageDef.name];

        // Skip already completed stages, but load their output
        if (stageState.status === "completed" && stageState.output) {
          (stageOutputs as Record<string, unknown>)[stageDef.name] = stageState.output;
          continue;
        }

        // Check dependencies
        const missingDeps = stageDef.dependencies.filter(
          (dep) => !stageOutputs[dep] && job.stages[dep]?.status !== "completed"
        );
        if (missingDeps.length > 0) {
          throw new Error(
            `Stage ${stageDef.name} cannot run: missing dependencies [${missingDeps.join(", ")}]`
          );
        }

        // Mark stage as running
        db.prepare(
          `UPDATE pipeline_job_stages
           SET status = 'running', startedAt = datetime('now')
           WHERE jobId = ? AND stageName = ?`
        ).run(jobId, stageDef.name);

        db.prepare(
          `UPDATE pipeline_jobs SET currentStage = ?, updatedAt = datetime('now') WHERE id = ?`
        ).run(stageDef.name, jobId);

        const executor = stageExecutors.find((e) => e.name === stageDef.name);
        if (!executor) {
          throw new Error(`No executor found for stage ${stageDef.name}`);
        }

        const ctx: StageContext = {
          jobId,
          prospectId: job.prospectId,
          packageType: job.packageType,
          correlationId,
          stageOutputs,
        };

        try {
          const output = await executor.execute(ctx);
          (stageOutputs as Record<string, unknown>)[stageDef.name] = output;

          // Persist stage completion
          db.prepare(
            `UPDATE pipeline_job_stages
             SET status = 'completed', outputJSON = ?, completedAt = datetime('now')
             WHERE jobId = ? AND stageName = ?`
          ).run(JSON.stringify(output), jobId, stageDef.name);
        } catch (stageErr) {
          const message = stageErr instanceof Error ? stageErr.message : String(stageErr);

          db.prepare(
            `UPDATE pipeline_job_stages
             SET status = 'failed', errorMessage = ?
             WHERE jobId = ? AND stageName = ?`
          ).run(message, jobId, stageDef.name);

          db.prepare(
            `UPDATE pipeline_jobs SET status = 'failed', errorLog = ?, updatedAt = datetime('now') WHERE id = ?`
          ).run(message, jobId);

          logger.error(`Pipeline stage failed`, {
            jobId,
            stage: stageDef.name,
            error: message,
            correlationId,
          });
          eventBus.emit("pipeline:error", { jobId, stage: stageDef.name, error: message }, String(correlationId));
          return;
        }
      }

      // All stages completed
      db.prepare(
        `UPDATE pipeline_jobs SET status = 'completed', currentStage = NULL, updatedAt = datetime('now') WHERE id = ?`
      ).run(jobId);

      logger.info(`Pipeline completed`, { jobId, correlationId });
      eventBus.emit("pipeline:complete", { jobId }, String(correlationId));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      db.prepare(
        `UPDATE pipeline_jobs SET status = 'failed', errorLog = ?, updatedAt = datetime('now') WHERE id = ?`
      ).run(message, jobId);

      logger.error(`Pipeline failed`, { jobId, error: message, correlationId });
      eventBus.emit("pipeline:error", { jobId, error: message }, String(correlationId));
    }
  }

  /**
   * Retry a specific failed stage.
   */
  async retryStage(jobId: number, stageName: StageName): Promise<void> {
    const job = this.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    const correlationId = `retry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    db.prepare(
      `UPDATE pipeline_job_stages SET status = 'pending', errorMessage = NULL WHERE jobId = ? AND stageName = ?`
    ).run(jobId, stageName);

    db.prepare(
      `UPDATE pipeline_jobs SET status = 'pending', errorLog = NULL, updatedAt = datetime('now') WHERE id = ?`
    ).run(jobId);

    await pipelineQueue.add("run-pipeline", { jobId, correlationId, retryStage: stageName });

    logger.info(`Stage retry enqueued`, { jobId, stage: stageName, correlationId });
    eventBus.emit("pipeline:retry", { jobId, stage: stageName }, String(correlationId));
  }
}

export const pipelineEngine = new PipelineEngine();
