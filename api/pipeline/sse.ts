import type { Context } from "hono";
import { eventBus } from "../infra/eventBus.js";
import { logger } from "../infra/logger.js";

/**
 * SSE handler for pipeline progress streaming.
 * Connects to the memory event bus and streams stage events for a specific job.
 */
export async function pipelineSseHandler(c: Context) {
  const jobId = c.req.param("jobId");
  if (!jobId || !/^\d+$/.test(jobId)) {
    return c.text("Invalid jobId", 400);
  }

  const targetJobId = Number(jobId);
  const correlationId = `sse-${targetJobId}-${Date.now()}`;

  logger.info(`SSE connection opened`, { jobId: targetJobId, correlationId });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      function sendEvent(event: string, data: unknown) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Stream already closed
        }
      }

      // Send initial connection event
      sendEvent("connected", { jobId: targetJobId, timestamp: Date.now() });

      // Subscribe to pipeline events for this job
      const handlers: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];

      function subscribe<T>(event: string, filter?: (payload: T) => boolean) {
        const handler = (payload: T) => {
          if (filter && !filter(payload)) return;
          sendEvent(event, payload);
        };
        eventBus.on(event, handler);
        handlers.push({ event, handler: handler as (...args: unknown[]) => void });
      }

      subscribe<{ jobId: number }>("stage:start", (p) => p.jobId === targetJobId);
      subscribe<{ jobId: number }>("stage:complete", (p) => p.jobId === targetJobId);
      subscribe<{ jobId: number }>("pipeline:complete", (p) => p.jobId === targetJobId);
      subscribe<{ jobId: number }>("pipeline:error", (p) => p.jobId === targetJobId);
      subscribe<{ jobId: number }>("review:warning", (p) => p.jobId === targetJobId);

      // Auto-close on completion or error
      const completionHandler = (payload: { jobId: number }) => {
        if (payload.jobId !== targetJobId) return;
        setTimeout(() => {
          // Unsubscribe all handlers
          for (const h of handlers) {
            eventBus.off(h.event, h.handler);
          }
          try {
            controller.close();
          } catch {
            // already closed
          }
          logger.info(`SSE connection closed`, { jobId: targetJobId, correlationId });
        }, 500);
      };

      eventBus.on("pipeline:complete", completionHandler as (...args: unknown[]) => void);
      eventBus.on("pipeline:error", completionHandler as (...args: unknown[]) => void);
      handlers.push({ event: "pipeline:complete", handler: completionHandler as (...args: unknown[]) => void });
      handlers.push({ event: "pipeline:error", handler: completionHandler as (...args: unknown[]) => void });

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: {}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15000);

      // Cleanup on client disconnect
      c.req.raw.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        for (const h of handlers) {
          eventBus.off(h.event, h.handler);
        }
        logger.info(`SSE client disconnected`, { jobId: targetJobId, correlationId });
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
