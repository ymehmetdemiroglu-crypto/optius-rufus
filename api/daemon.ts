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
import { startWatchdog, stopWatchdog } from "./infra/watchdog.js";
import "./db/schema.js";

type AppVariables = {
  correlationId: string;
};

export const app = new Hono<{ Variables: AppVariables }>();

// Allow local origin for localhost tRPC/API calls
app.use("*", cors({
  origin: ["http://127.0.0.1:3000", "http://localhost:3000"],
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
  logger.error("Unhandled request error in daemon", {
    path: c.req.path,
    method: c.req.method,
    correlationId,
    error: err.message,
    stack: err.stack,
  });
  return c.json({ error: "Internal server error", correlationId }, 500);
});

const port = parseInt(process.env.PORT || "3000", 10);
const host = process.env.HOST || "127.0.0.1";

async function boot() {
  logger.info("Initializing Optimus Rufus headless daemon...");

  try {
    await runMigrations();
    logger.info("Database migrations executed successfully");
  } catch (err) {
    logger.fatal("Failed to run migrations; aborting daemon boot", {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }

  const server = serve({
    fetch: app.fetch,
    port,
    hostname: host,
  });

  logger.info(`🚀 Headless Daemon running on http://${host}:${port}`);
  logger.info(`📡 Private tRPC: http://${host}:${port}/api/trpc`);
  logger.info(`📊 SSE pipeline endpoint: http://${host}:${port}/api/sse/pipeline/:jobId`);

  // Start background processes
  startWorkers();
  startWatchdog();

  // Log memory stats every 5 minutes (300,000ms)
  const memoryStatsInterval = setInterval(() => {
    const memory = process.memoryUsage();
    logger.info("System Memory Stats", {
      rss: Math.round(memory.rss / 1024 / 1024) + "MB",
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + "MB",
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + "MB",
      external: Math.round(memory.external / 1024 / 1024) + "MB",
      uptimeSeconds: Math.round(process.uptime()),
    });
  }, 5 * 60 * 1000);

  const shutdown = async (signal: string) => {
    logger.warn(`Received ${signal}; starting graceful daemon shutdown...`);
    
    clearInterval(memoryStatsInterval);
    
    server.close(() => {
      logger.info("Daemon HTTP server closed");
    });
    
    await stopWorkers();
    logger.info("Daemon workers stopped");

    stopWatchdog();
    logger.info("Daemon watchdog stopped");

    logger.info("Daemon shutdown complete. Goodbye!");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("uncaughtException", (err) => {
    logger.fatal("Uncaught Exception in Daemon", {
      error: err.message,
      stack: err.stack,
    });
    // Wait briefly for telegram notify then exit
    setTimeout(() => process.exit(1), 1000);
  });

  process.on("unhandledRejection", (reason) => {
    logger.fatal("Unhandled Promise Rejection in Daemon", {
      reason: String(reason),
    });
  });
}

boot().catch((err) => {
  logger.fatal("Fatal daemon boot error", {
    error: String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });
  setTimeout(() => process.exit(1), 1000);
});
