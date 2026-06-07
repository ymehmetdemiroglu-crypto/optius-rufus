import { TRPCError } from "@trpc/server";
import { t } from "../trpc.js";
import { verifyToken } from "./jwt.js";

export const isAuthed = t.middleware(async ({ ctx, next }) => {
  const authHeader = ctx.req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing or invalid Authorization header",
    });
  }

  const token = authHeader.substring(7);
  try {
    const user = await verifyToken(token);
    return next({
      ctx: {
        ...ctx,
        user,
      },
    });
  } catch (err) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
      cause: err,
    });
  }
});

export const authProcedure = t.procedure.use(isAuthed);
export const apiKeyProcedure = t.procedure.use(isAuthed); // Replaces or aliases apiKeyProcedure
