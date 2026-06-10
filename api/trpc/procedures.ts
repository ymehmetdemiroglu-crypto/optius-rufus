import { TRPCError } from "@trpc/server";
import { t } from "./context.js";

const API_KEY = process.env.API_KEY;

export const apiKeyProcedure = t.procedure.use(async ({ getRawInput, path, next }) => {
  if (!API_KEY) return next();
  const publicPaths = [
    "health", "prospects.getBySlug", "prospects.incrementViews",
    "branding.getSettings", "agents.getStatus", "agents.getLatestJob",
    "catalogGraph.getGraph", "rufusTracker.getSOVHistory",
  ];
  if (publicPaths.includes(path)) return next();
  const rawInput = await getRawInput();
  const input = rawInput as Record<string, unknown> | undefined;
  const providedKey = input?.apiKey || input?.api_key;
  if (providedKey !== API_KEY) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid or missing API key" });
  }
  return next();
});
