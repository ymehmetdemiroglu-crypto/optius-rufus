/* eslint-disable @typescript-eslint/no-explicit-any */
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

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
