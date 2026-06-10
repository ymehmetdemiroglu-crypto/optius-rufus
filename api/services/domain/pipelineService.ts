import { pipelineEngine } from "../../pipeline/engine.js";
import type { PipelineJob, StageName } from "../../pipeline/pipeline.types.js";

export async function createJob(
  prospectId: number,
  listingId: number | undefined,
  packageType: string
): Promise<{ jobId: number }> {
  try {
    return await pipelineEngine.createJob(prospectId, listingId, packageType);
  } catch (err) {
    throw new Error(
      `Failed to create pipeline job for prospect ${prospectId}`,
      { cause: err }
    );
  }
}

export async function getJob(jobId: number): Promise<PipelineJob | null> {
  try {
    return await pipelineEngine.getJob(jobId);
  } catch (err) {
    throw new Error(`Failed to fetch pipeline job ${jobId}`, { cause: err });
  }
}

export async function retryStage(
  jobId: number,
  stageName: StageName
): Promise<void> {
  try {
    await pipelineEngine.retryStage(jobId, stageName);
  } catch (err) {
    throw new Error(
      `Failed to retry stage ${stageName} for job ${jobId}`,
      { cause: err }
    );
  }
}
