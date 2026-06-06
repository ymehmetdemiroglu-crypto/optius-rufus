import { z } from "zod";
import { db } from "../db/client.js";
import { router, publicProcedure } from "../trpc.js";
import { pipelineEngine } from "../pipeline/engine.js";
import { queueWorker } from "../pipeline/worker.js";
import { logger } from "../infra/logger.js";

// On Vercel, process jobs immediately after enqueueing since there's no background worker
const isVercel = !!process.env.VERCEL;

export const agentsRouter = router({
  optimize: publicProcedure
    .input(
      z.object({
        prospectId: z.number().int().positive(),
        listingId: z.number().int().positive().optional(),
        packageType: z.enum(["package_1", "package_2", "package_3", "package_4"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Determine package type from prospect if not provided
      let packageType = input.packageType;
      if (!packageType) {
        // Default to package_2; frontend should ideally pass the correct packageType
        packageType = "package_2";
      }

      const { jobId } = await pipelineEngine.createJob(
        input.prospectId,
        input.listingId,
        packageType
      );

      logger.info(`Pipeline optimize mutation returned jobId`, { jobId, prospectId: input.prospectId });

      // On Vercel, trigger immediate background processing since there's no long-running worker
      if (isVercel) {
        setImmediate(async () => {
          try {
            await queueWorker.processOne();
          } catch (err) {
            logger.error(`Vercel background job processing failed`, { jobId, error: String(err) });
          }
        });
      }

      return { jobId };
    }),

  getStatus: publicProcedure
    .input(z.object({ jobId: z.number().int().positive() }))
    .query(({ input }) => {
      const job = pipelineEngine.getJob(input.jobId);
      if (!job) {
        throw new Error(`Job not found: ${input.jobId}`);
      }
      return job;
    }),

  retryStage: publicProcedure
    .input(
      z.object({
        jobId: z.number().int().positive(),
        stage: z.enum(["fetch", "preprocess", "embedding", "semantic", "optimize", "competitor"]),
      })
    )
    .mutation(async ({ input }) => {
      await pipelineEngine.retryStage(input.jobId, input.stage);

      if (isVercel) {
        setImmediate(async () => {
          try {
            await queueWorker.processOne();
          } catch (err) {
            logger.error(`Vercel background retry processing failed`, { jobId: input.jobId, error: String(err) });
          }
        });
      }

      return { success: true };
    }),

  getLatestJob: publicProcedure
    .input(z.object({ prospectId: z.number().int().positive() }))
    .query(({ input }) => {
      const row = db.prepare(
        `SELECT id FROM pipeline_jobs WHERE prospectId = ? ORDER BY createdAt DESC LIMIT 1`
      ).get(input.prospectId) as { id: number } | undefined;
      if (!row) return null;
      return pipelineEngine.getJob(row.id);
    }),
});

export default agentsRouter;
