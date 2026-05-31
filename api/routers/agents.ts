import { z } from "zod";
import { OptimizationOrchestrator } from "../agents/orchestrator.js";
import type { PipelineState } from "../agents/types.js";

// Simple in-memory store for pipeline states (replace with Redis/DB in production)
const pipelineStore = new Map<string, PipelineState>();

const orchestrator = new OptimizationOrchestrator();

// tRPC router stub — in production this integrates with Hono + initTRPC
export const agentsRouter = {
  optimize: {
    type: "mutation" as const,
    input: z.object({
      asin: z.string().length(10).regex(/^[A-Z0-9]{10}$/),
      marketplace: z.enum(["US", "UK", "DE", "FR", "IT", "ES", "CA"]),
    }),
    resolve: async ({ input }: { input: { asin: string; marketplace: string } }) => {
      const state = await orchestrator.runPipeline(input.asin, input.marketplace);
      const pipelineId = `${input.asin}-${Date.now()}`;
      pipelineStore.set(pipelineId, state);
      return { pipelineId, state };
    },
  },

  getState: {
    type: "query" as const,
    input: z.object({ pipelineId: z.string() }),
    resolve: ({ input }: { input: { pipelineId: string } }) => {
      const state = pipelineStore.get(input.pipelineId);
      if (!state) {
        throw new Error(`Pipeline not found: ${input.pipelineId}`);
      }
      return state;
    },
  },

  retryStage: {
    type: "mutation" as const,
    input: z.object({
      pipelineId: z.string(),
      stage: z.number().int().min(0).max(5),
    }),
    resolve: async ({ input }: { input: { pipelineId: string; stage: number } }) => {
      // In production: retrieve pipeline, reset stage, re-run orchestrator from that point
      const state = pipelineStore.get(input.pipelineId);
      if (!state) {
        throw new Error(`Pipeline not found: ${input.pipelineId}`);
      }
      return state;
    },
  },
};

export default agentsRouter;
