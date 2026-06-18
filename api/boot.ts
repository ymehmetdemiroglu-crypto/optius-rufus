import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { bodyLimit } from "hono/body-limit";
import { secureHeaders } from "hono/secure-headers";
import { serve } from "@hono/node-server";
import { registerHttpRoutes } from "./http/routes.js";
import { registerTrpcHandler } from "./trpc/handler.js";
import { startWorkers, stopWorkers } from "./workers/bootstrap.js";
import { runMigrations } from "./db/migrate.js";
import { logger } from "./infra/logger.js";
import "./db/schema.js";

type AppVariables = {
  correlationId: string;
};

export const app = new Hono<{ Variables: AppVariables }>();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : process.env.NODE_ENV === "production"
    ? []
    : ["*"];

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return origin;
    if (allowedOrigins.includes("*")) return origin;
    if (allowedOrigins.includes(origin)) return origin;
    return null;
  },
}));

app.use("*", secureHeaders());
app.use("*", honoLogger((message: string, ...rest: string[]) => {
  logger.info(message, { args: rest });
}));
app.use(
  "*",
  bodyLimit({
    maxSize: 10 * 1024 * 1024, // 10 MB
    onError: (c) => {
      logger.warn("Request body exceeded size limit", { path: c.req.path });
      return c.json({ error: "Payload too large" }, 413);
    },
  })
);

// Correlation ID middleware
app.use("*", async (c, next) => {
  const correlationId = c.req.header("x-correlation-id") ?? crypto.randomUUID();
  c.set("correlationId", correlationId);
  c.header("x-correlation-id", correlationId);
  await next();
});

registerHttpRoutes(app);
registerTrpcHandler(app);

// Global error handler
app.onError((err, c) => {
  const correlationId = c.get("correlationId");
  logger.error("Unhandled request error", {
    path: c.req.path,
    method: c.req.method,
    correlationId,
    error: err.message,
    stack: err.stack,
  });
  return c.json({ error: "Internal server error", correlationId }, 500);
});

const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "0.0.0.0";

async function boot() {
  try {
    await runMigrations();
  } catch (err) {
    logger.error("Failed to run migrations; aborting boot", {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }

  const server = serve({
    fetch: app.fetch,
    port,
    hostname: host,
  });

  logger.info(`🚀 Optimus Rufus server running on http://${host}:${port}`);
  logger.info(`📡 tRPC endpoint: http://${host}:${port}/api/trpc`);
  logger.info(`📊 SSE endpoint: http://${host}:${port}/api/sse/pipeline/:jobId`);

  startWorkers();

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}; shutting down gracefully...`);
    server.close(() => {
      logger.info("HTTP server closed");
    });
    await stopWorkers();
    logger.info("Workers stopped");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

boot().catch((err) => {
  logger.error("Fatal boot error", { error: String(err), stack: err instanceof Error ? err.stack : undefined });
  process.exit(1);
});
