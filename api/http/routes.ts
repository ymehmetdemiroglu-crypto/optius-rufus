import type { Hono, Context } from "hono";

type AppVariables = {
  correlationId: string;
};
import fs from "fs/promises";
import path from "path";
import { generatePdf } from "../infra/pdf.js";
import { pipelineSseHandler } from "../pipeline/sse.js";
import { db } from "../db/drizzle.js";
import { sql } from "drizzle-orm";
import { logger } from "../infra/logger.js";

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

function serveStatic(options: { root?: string; path?: string }) {
  return async (c: Context, next: () => Promise<void>) => {
    let filePath: string | null = options.path ?? null;
    if (!filePath && options.root) {
      filePath = safeJoin(options.root, c.req.path);
    }

    if (!filePath) {
      return c.json({ error: "Forbidden" }, 403);
    }

    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) {
        await next();
        return;
      }

      const content = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
      };
      c.header("Content-Type", mimeTypes[ext] || "application/octet-stream");
      return c.body(content);
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? err.code : undefined;
      if (code === "ENOENT") {
        await next();
        return;
      }
      logger.error("serveStatic error", { path: filePath, error: String(err) });
      return c.json({ error: "Internal server error" }, 500);
    }
  };
}

export function registerHttpRoutes(app: Hono<{ Variables: AppVariables }>) {
  app.get("/health", async (c) => {
    try {
      await db.execute(sql`SELECT 1`);
      return c.json({
        status: "ok",
        version: process.env.APP_VERSION || "1.0.0",
        database: "ok",
      });
    } catch (err) {
      logger.error("Health check failed", { error: String(err) });
      return c.json(
        {
          status: "error",
          version: process.env.APP_VERSION || "1.0.0",
          database: "unreachable",
        },
        503
      );
    }
  });

  app.get("/api/sse/pipeline/:jobId", (c) => pipelineSseHandler(c));

  app.post("/api/webhooks/apollo", async (c) => {
    // TODO: verify Apollo webhook signature once the signing secret mechanism is
    // documented. Until then, validate the payload shape and reject malformed input.
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
    // Slugs are alphanumeric plus hyphen; reject anything else to avoid URL injection.
    if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return c.json({ error: "Invalid slug" }, 400);
    }

    try {
      const pdfBuffer = await generatePdf(slug);
      c.header("Content-Type", "application/pdf");
      c.header("Content-Disposition", `attachment; filename="optimus-rufus-audit-${slug}.pdf"`);
      return c.body(new Uint8Array(pdfBuffer));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error("PDF download route failed", { slug, error: message });
      return c.text(`Failed to generate PDF: ${message}`, 500);
    }
  });

  if (process.env.NODE_ENV === "production") {
    app.use("/*", serveStatic({ root: "./dist" }));
    app.get("*", serveStatic({ path: "./dist/index.html" }));
  }
}
