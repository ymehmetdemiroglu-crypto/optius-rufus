import { eq, and, desc } from "drizzle-orm";
import { db as pgDb } from "../../db/drizzle.js";
import * as schema from "../../db/schema.js";
import type {
  InsertPipelineJobInput,
  InsertPipelineJobStageInput,
} from "../../db/schema.types.js";
import type { PipelineJob, PipelineStageState, StageOutput } from "../../pipeline/pipeline.types.js";

export async function createJob(
  input: InsertPipelineJobInput
): Promise<PipelineJob> {
  try {
    const result = await pgDb
      .insert(schema.pipelineJobs)
      .values(input)
      .returning();
    return result[0] as unknown as PipelineJob;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to create pipeline job: ${message}`, { cause: err });
  }
}

export async function getJob(
  id: number
): Promise<PipelineJob | undefined> {
  try {
    const result = await pgDb
      .select()
      .from(schema.pipelineJobs)
      .where(eq(schema.pipelineJobs.id, id))
      .limit(1);
    return result[0] as unknown as PipelineJob | undefined;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch pipeline job ${id}: ${message}`, { cause: err });
  }
}

export async function updateJobStatus(
  id: number,
  status: string,
  currentStage?: string | null,
  errorLog?: string | null
): Promise<void> {
  try {
    const updateData: Partial<InsertPipelineJobInput> = {
      status,
      updatedAt: new Date(),
    };
    if (currentStage !== undefined) updateData.currentStage = currentStage;
    if (errorLog !== undefined) updateData.errorLog = errorLog;

    await pgDb
      .update(schema.pipelineJobs)
      .set(updateData)
      .where(eq(schema.pipelineJobs.id, id));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to update pipeline job ${id} status: ${message}`
    , { cause: err });
  }
}

export async function createStage(
  jobId: number,
  stageName: string
): Promise<void> {
  try {
    await pgDb.insert(schema.pipelineJobStages).values({
      jobId,
      stageName,
      status: "pending",
    } as InsertPipelineJobStageInput);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to create stage ${stageName} for job ${jobId}: ${message}`
    , { cause: err });
  }
}

export async function updateStageStatus(
  jobId: number,
  stageName: string,
  status: string,
  outputJSON?: unknown | null,
  errorMessage?: string | null
): Promise<void> {
  try {
    const updateData: Partial<InsertPipelineJobStageInput> = { status };
    if (outputJSON !== undefined)
      updateData.outputJSON = outputJSON === null ? null : (outputJSON as Record<string, unknown>);
    if (errorMessage !== undefined) updateData.errorMessage = errorMessage;

    await pgDb
      .update(schema.pipelineJobStages)
      .set(updateData)
      .where(
        and(
          eq(schema.pipelineJobStages.jobId, jobId),
          eq(schema.pipelineJobStages.stageName, stageName)
        )
      );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Failed to update stage ${stageName} for job ${jobId}: ${message}`
    , { cause: err });
  }
}

export async function getStagesForJob(
  jobId: number
): Promise<Record<string, PipelineStageState>> {
  try {
    const result = await pgDb
      .select()
      .from(schema.pipelineJobStages)
      .where(eq(schema.pipelineJobStages.jobId, jobId));

    const stages: Record<string, PipelineStageState> = {};
    for (const row of result) {
      stages[row.stageName] = {
        status: row.status as PipelineStageState["status"],
        output: row.outputJSON
          ? (row.outputJSON as StageOutput[keyof StageOutput])
          : undefined,
        errorMessage: row.errorMessage
          ? String(row.errorMessage)
          : undefined,
        startedAt: row.startedAt
          ? new Date(row.startedAt).toISOString()
          : undefined,
        completedAt: row.completedAt
          ? new Date(row.completedAt).toISOString()
          : undefined,
      };
    }
    return stages;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch stages for job ${jobId}: ${message}`, { cause: err });
  }
}

export async function getLatestJobForProspect(
  prospectId: number
): Promise<PipelineJob | undefined> {
  try {
    const result = await pgDb
      .select()
      .from(schema.pipelineJobs)
      .where(eq(schema.pipelineJobs.prospectId, prospectId))
      .orderBy(desc(schema.pipelineJobs.createdAt))
      .limit(1);
    return result[0] as unknown as PipelineJob | undefined;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to fetch latest job for prospect ${prospectId}: ${message}`, { cause: err });
  }
}
