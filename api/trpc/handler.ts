import type { Hono } from "hono";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./context.js";

export function registerTrpcHandler(app: Hono) {
  app.use("/api/trpc/*", async (c) => {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc", req: c.req.raw, router: appRouter, createContext,
    });
    return response;
  });
}
