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

/**
 * Converts our stub-style router objects to real tRPC routers.
 * Stub objects have: { type: 'query'|'mutation', input: ZodSchema, resolve: fn }
 */
export function stubToRouter(stub: Record<string, unknown>) {
  const converted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(stub)) {
    if (value === null || typeof value !== "object") {
      converted[key] = value;
      continue;
    }

    const v = value as Record<string, unknown>;

    if (v.type === "query" && typeof v.resolve === "function") {
      const proc = t.procedure;
      if (v.input && v.input instanceof z.ZodType) {
        converted[key] = proc.input(v.input as z.ZodTypeAny).query(v.resolve as any);
      } else {
        converted[key] = proc.query(v.resolve as any);
      }
    } else if (v.type === "mutation" && typeof v.resolve === "function") {
      const proc = t.procedure;
      if (v.input && v.input instanceof z.ZodType) {
        converted[key] = proc.input(v.input as z.ZodTypeAny).mutation(v.resolve as any);
      } else {
        converted[key] = proc.mutation(v.resolve as any);
      }
    } else {
      // Nested router object
      converted[key] = stubToRouter(v as Record<string, unknown>);
    }
  }

  return converted;
}
