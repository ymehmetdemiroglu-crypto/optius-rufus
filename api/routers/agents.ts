import { z } from "zod";
import { OptimizationOrchestrator } from "../agents/orchestrator.js";
import type { PipelineState } from "../agents/types.js";
import { router, publicProcedure } from "../trpc.js";

// Simple in-memory store for pipeline states (replace with Redis/DB in production)
const pipelineStore = new Map<string, PipelineState>();

const orchestrator = new OptimizationOrchestrator();

export const agentsRouter = router({
  optimize: publicProcedure
    .input(
      z.object({
        asin: z.string().length(10).regex(/^[A-Z0-9]{10}$/),
        marketplace: z.enum(["US", "UK", "DE", "FR", "IT", "ES", "CA"]),
      })
    )
    .mutation(async ({ input }) => {
      const state = await orchestrator.runPipeline(input.asin, input.marketplace);
      const pipelineId = `${input.asin}-${Date.now()}`;
      pipelineStore.set(pipelineId, state);
      return { pipelineId, state };
    }),

  getState: publicProcedure
    .input(z.object({ pipelineId: z.string() }))
    .query(({ input }) => {
      const state = pipelineStore.get(input.pipelineId);
      if (!state) {
        throw new Error(`Pipeline not found: ${input.pipelineId}`);
      }
      return state;
    }),

  retryStage: publicProcedure
    .input(
      z.object({
        pipelineId: z.string(),
        stage: z.number().int().min(0).max(5),
      })
    )
    .mutation(async ({ input }) => {
      // In production: retrieve pipeline, reset stage, re-run orchestrator from that point
      const state = pipelineStore.get(input.pipelineId);
      if (!state) {
        throw new Error(`Pipeline not found: ${input.pipelineId}`);
      }
      return state;
    }),
});

export default agentsRouter;

