import * as pipelineRepo from "../db/repositories/pipelineRepository.js";
import { eventBus } from "../infra/eventBus.js";
import { logger } from "../infra/logger.js";
import { pipelineQueue } from "../infra/queue.js";
import type { PipelineJob, StageName, StageOutput, StageContext, PipelineStageState } from "./types.js";
import { STAGE_ORDER } from "./definitions.js";
import { stageExecutors } from "./executors.js";

export class PipelineEngine {
  /**
   * Insert pipeline job and stage rows into DB.
   */
  private async insertJob(
    prospectId: number,
    listingId: number | undefined,
    packageType: string
  ): Promise<{ jobId: number; correlationId: string }> {
    const correlationId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      const jobRecord = await pipelineRepo.createJob({
        prospectId,
        listingId: listingId ?? null,
        packageType,
        status: "pending",
        stagesJSON: {},
        tokenUsage: 0,
      });

      const jobId = jobRecord.id;

      // Initialize stage rows
      for (const stage of STAGE_ORDER) {
        await pipelineRepo.createStage(jobId, stage.name);
      }

      logger.info(`Pipeline job created`, { jobId, prospectId, packageType, correlationId });
      eventBus.emit("pipeline:created", { jobId, prospectId, packageType }, String(correlationId));

      return { jobId, correlationId };
    } catch (err) {
      throw new Error(`Failed to insert pipeline job for prospect ${prospectId}`, { cause: err });
    }
  }

  /**
   * Create a new pipeline job and enqueue it for async processing.
   */
  async createJob(
    prospectId: number,
    listingId: number | undefined,
    packageType: string
  ): Promise<{ jobId: number }> {
    try {
      const { jobId, correlationId } = await this.insertJob(prospectId, listingId, packageType);
      await pipelineQueue.add("run-pipeline", { jobId, correlationId });
      return { jobId };
    } catch (err) {
      throw new Error(`Failed to create job for prospect ${prospectId}`, { cause: err });
    }
  }

  /**
   * Create and run a pipeline job synchronously (for backward-compatible routes).
   */
  async createAndRunJob(
    prospectId: number,
    listingId: number | undefined,
    packageType: string
  ): Promise<PipelineJob> {
    try {
      const { jobId, correlationId } = await this.insertJob(prospectId, listingId, packageType);
      await this.runJob(jobId, correlationId);
      const job = await this.getJob(jobId);
      if (!job) throw new Error(`Pipeline job ${jobId} disappeared after run`);
      return job;
    } catch (err) {
      throw new Error(`Failed to create and run job for prospect ${prospectId}`, { cause: err });
    }
  }

  /**
   * Get the current state of a pipeline job.
   */
  async getJob(jobId: number): Promise<PipelineJob | null> {
    try {
      const row = await pipelineRepo.getJob(jobId);
      if (!row) return null;

      const stageRows = await pipelineRepo.getStagesForJob(jobId);

      const stages: PipelineJob["stages"] = {} as PipelineJob["stages"];
      for (const sr of stageRows) {
        stages[sr.stageName as StageName] = {
          status: sr.status as PipelineStageState["status"],
          output: sr.outputJSON ? (sr.outputJSON as StageOutput[keyof StageOutput]) : undefined,
          errorMessage: sr.errorMessage ? String(sr.errorMessage) : undefined,
          startedAt: sr.startedAt ? new Date(sr.startedAt).toISOString() : undefined,
          completedAt: sr.completedAt ? new Date(sr.completedAt).toISOString() : undefined,
        };
      }

      return {
        id: Number(row.id),
        prospectId: Number(row.prospectId),
        listingId: row.listingId ? Number(row.listingId) : undefined,
        packageType: String(row.packageType ?? "package_2"),
        status: String(row.status) as PipelineJob["status"],
        currentStage: row.currentStage ? (String(row.currentStage) as StageName) : undefined,
        stages,
        tokenUsage: Number(row.tokenUsage ?? 0),
        errorLog: row.errorLog ? String(row.errorLog) : undefined,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : "",
        updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : "",
      };
    } catch (err) {
      throw new Error(`Failed to retrieve job ${jobId}`, { cause: err });
    }
  }

  /**
   * Run (or resume) a pipeline job.
   */
  async runJob(jobId: number, correlationId: string): Promise<void> {
    const job = await this.getJob(jobId);
    if (!job) {
      throw new Error(`Pipeline job ${jobId} not found`);
    }

    logger.info(`Pipeline run starting`, { jobId, correlationId });
    eventBus.emit("pipeline:start", { jobId }, String(correlationId));

    try {
      await pipelineRepo.updateJobStatus(jobId, "running");

      const stageOutputs: StageOutput = {};

      for (const stageDef of STAGE_ORDER) {
        const stageState = job.stages[stageDef.name];

        // Skip already completed stages, but load their output
        if (stageState && stageState.status === "completed" && stageState.output) {
          (stageOutputs as Record<string, unknown>)[stageDef.name] = stageState.output;
          continue;
        }

        // Check dependencies
        if (stageState) {
          const missingDeps = stageDef.dependencies.filter(
            (dep) => !stageOutputs[dep] && job.stages[dep]?.status !== "completed"
          );
          if (missingDeps.length > 0) {
            throw new Error(
              `Stage ${stageDef.name} cannot run: missing dependencies [${missingDeps.join(", ")}]`
            );
          }
        }

        // Mark stage as running
        await pipelineRepo.updateStageStatus(jobId, stageDef.name, "running");
        await pipelineRepo.updateJobStatus(jobId, "running", stageDef.name);

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
          await pipelineRepo.updateStageStatus(jobId, stageDef.name, "completed", output);
        } catch (stageErr) {
          const message = stageErr instanceof Error ? stageErr.message : String(stageErr);

          await pipelineRepo.updateStageStatus(jobId, stageDef.name, "failed", null, message);
          await pipelineRepo.updateJobStatus(jobId, "failed", null, message);

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
      await pipelineRepo.updateJobStatus(jobId, "completed", null);

      logger.info(`Pipeline completed`, { jobId, correlationId });
      eventBus.emit("pipeline:complete", { jobId }, String(correlationId));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      try {
        await pipelineRepo.updateJobStatus(jobId, "failed", null, message);
      } catch (updateErr) {
        logger.error(`Failed to mark job as failed: ${String(updateErr)}`, { jobId });
      }

      logger.error(`Pipeline failed`, { jobId, error: message, correlationId });
      eventBus.emit("pipeline:error", { jobId, error: message }, String(correlationId));
    }
  }

  /**
   * Retry a specific failed stage.
   */
  async retryStage(jobId: number, stageName: StageName): Promise<void> {
    try {
      const job = await this.getJob(jobId);
      if (!job) throw new Error(`Job ${jobId} not found`);

      const correlationId = `retry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      await pipelineRepo.updateStageStatus(jobId, stageName, "pending", null, null);
      await pipelineRepo.updateJobStatus(jobId, "pending", null, null);

      await pipelineQueue.add("run-pipeline", { jobId, correlationId, retryStage: stageName });

      logger.info(`Stage retry enqueued`, { jobId, stage: stageName, correlationId });
      eventBus.emit("pipeline:retry", { jobId, stage: stageName }, String(correlationId));
    } catch (err) {
      throw new Error(`Failed to retry stage ${stageName} for job ${jobId}`, { cause: err });
    }
  }
}

export const pipelineEngine = new PipelineEngine();
