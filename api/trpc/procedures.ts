import { TRPCError } from "@trpc/server";
import { t } from "./context.js";

const API_KEY = process.env.API_KEY;

function extractBearerToken(req: Request): string | undefined {
  const auth = req.headers.get("authorization");
  if (!auth) return undefined;
  const [scheme, token] = auth.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return undefined;
  return token;
}

export const apiKeyProcedure = t.procedure.use(async ({ ctx, path, next }) => {
  const publicPaths = new Set([
    "health",
    "prospects.getBySlug",
    "prospects.incrementViews",
    "branding.getSettings",
    "agents.getStatus",
    "agents.getLatestJob",
    "catalogGraph.getGraph",
    "rufusTracker.getSOVHistory",
  ]);

  if (publicPaths.has(path)) {
    return next();
  }

  if (!API_KEY) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "API key is not configured on the server",
    });
  }

  const providedKey = extractBearerToken(ctx.req);
  if (!providedKey || providedKey !== API_KEY) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or missing API key",
    });
  }

  return next();
});
