import type { Hono, Context } from "hono";

type AppVariables = {
  correlationId: string;
};
import fs from "fs/promises";
import path from "path";
import { pipelineSseHandler } from "../pipeline/sse.js";
import { db } from "../db/drizzle.js";
import { sql } from "drizzle-orm";
import { logger } from "../infra/logger.js";
import { queueWorker } from "../pipeline/worker.js";
import { webhookWorker } from "../infra/workers/webhookWorker.js";
import { getAllCircuitBreakers } from "../infra/circuitBreaker.js";
import * as schema from "../db/schema.js";

function safeJoin(root: string, urlPath: string): string | null {
  // Strip leading slashes and decode URL segments to avoid traversal.
  const segments = decodeURIComponent(urlPath)
    .split("/")
    .filter((s) => s && s !== ".");

  if (segments.some((s) => s === "..")) {
    return null;
  }

  const resolved = path.resolve(root, ...segments);
  const rootResolved = path.resolve(root);
  if (!resolved.startsWith(rootResolved + path.sep) && resolved !== rootResolved) {
    return null;
  }
  return resolved;
}

export function registerHttpRoutes(app: Hono<{ Variables: AppVariables }>) {
  app.get("/health", async (c) => {
    try {
      // 1. Database ping
      await db.execute(sql`SELECT 1`);
      
      // 2. Fetch worker states
      const queueWorkerRunning = queueWorker.isRunning;
      const webhookWorkerRunning = webhookWorker.isRunning;
      
      // 3. Query queue depths from database
      const queueCounts = await db
        .select({
          queue: schema.jobs.queue,
          status: schema.jobs.status,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.jobs)
        .groupBy(schema.jobs.queue, schema.jobs.status);

      const queueDepths: Record<string, Record<string, number>> = {};
      for (const row of queueCounts) {
        const queueName = row.queue || "unknown";
        const statusName = row.status || "pending";
        if (!queueDepths[queueName]) {
          queueDepths[queueName] = {};
        }
        queueDepths[queueName][statusName] = row.count;
      }

      // 4. Circuit Breakers status
      const breakersInfo: Record<string, string> = {};
      for (const [name, breaker] of getAllCircuitBreakers().entries()) {
        breakersInfo[name] = breaker.getState();
      }

      // 5. Memory & Uptime
      const memory = process.memoryUsage();
      const uptime = process.uptime();

      return c.json({
        status: "ok",
        version: process.env.APP_VERSION || "1.0.0",
        database: "ok",
        uptime,
        memory: {
          rss: Math.round(memory.rss / 1024 / 1024) + "MB",
          heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + "MB",
          heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + "MB",
          external: Math.round(memory.external / 1024 / 1024) + "MB",
        },
        workers: {
          queueWorker: queueWorkerRunning ? "running" : "stopped",
          webhookWorker: webhookWorkerRunning ? "running" : "stopped",
        },
        queues: queueDepths,
        circuitBreakers: breakersInfo,
      });
    } catch (err) {
      logger.error("Health check failed", { error: String(err) });
      return c.json(
        {
          status: "error",
          version: process.env.APP_VERSION || "1.0.0",
          database: "unreachable",
          error: String(err),
        },
        503
      );
    }
  });

  app.get("/api/sse/pipeline/:jobId", (c) => pipelineSseHandler(c));

  app.get("/api/pdf-report/:slug", async (c) => {
    const { renderPdfReportHtml } = await import("./pdfReport.js");
    return renderPdfReportHtml(c);
  });

  app.post("/api/webhooks/apollo", async (c) => {
    try {
      const body = await c.req.json();
      if (!body || typeof body !== "object") {
        return c.json({ success: false, error: "Invalid payload" }, 400);
      }
      const { handleApolloReply } = await import("../domains/prospect/service.js");
      const result = await handleApolloReply(body);
      return c.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("Apollo webhook handler failed", { error: message });
      return c.json({ success: false, error: message }, 500);
    }
  });

  app.get("/api/pdf/:slug", async (c) => {
    const slug = c.req.param("slug");
    try {
      const { generatePdf } = await import("../infra/pdf.js");
      const pdfBuffer = await generatePdf(slug);
      c.header("Content-Type", "application/pdf");
      c.header("Content-Disposition", `attachment; filename="${slug}-rufus-audit.pdf"`);
      return c.body(pdfBuffer as any);
    } catch (err: any) {
      logger.error("Failed to generate PDF", { error: err.message, slug });
      return c.json({ error: "Failed to generate PDF: " + err.message }, 500);
    }
  });

  app.post("/api/admin/circuit-breaker/reset", async (c) => {
    try {
      const body = await c.req.json() as { name?: string };
      const { name } = body;
      if (!name) {
        return c.json({ success: false, error: "Missing breaker name" }, 400);
      }
      const breakers = getAllCircuitBreakers();
      const breaker = breakers.get(name);
      if (!breaker) {
        return c.json({ success: false, error: `Circuit breaker '${name}' not found` }, 404);
      }
      breaker.reset();
      return c.json({ success: true, message: `Circuit breaker '${name}' manually reset` });
    } catch (err) {
      return c.json({ success: false, error: String(err) }, 500);
    }
  });
}
