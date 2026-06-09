/* eslint-disable @typescript-eslint/no-explicit-any */
import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

export async function createContext({ req }: { req: Request }) {
  return {
    req,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

export const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Optional API-key authentication. If API_KEY env var is set, all mutations
// and sensitive queries require it via x-api-key header or ?apiKey query param.
const API_KEY = process.env.API_KEY;

export const apiKeyProcedure = t.procedure.use(async ({ getRawInput, path, next }) => {
  if (!API_KEY) {
    // Auth not configured — allow through (backward compatible)
    return next();
  }

  // Health check and public read endpoints stay open
  const publicPaths = [
    "health",
    "prospects.getBySlug",
    "prospects.incrementViews",
    "branding.getSettings",
    "agents.getStatus",
    "agents.getLatestJob",
    "catalogGraph.getGraph",
    "rufusTracker.getSOVHistory",
  ];
  if (publicPaths.includes(path)) {
    return next();
  }

  // Extract key from input payload for now (headers require custom context factory)
  const rawInput = await getRawInput();
  const input = rawInput as Record<string, unknown> | undefined;
  const providedKey = input?.apiKey || input?.api_key;
  if (providedKey !== API_KEY) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or missing API key",
    });
  }

  return next();
});


