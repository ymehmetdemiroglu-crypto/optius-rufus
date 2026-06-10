import type { Hono, Context } from "hono";
import fs from "fs";
import path from "path";
import { generatePdf } from "../infra/pdf.js";
import { pipelineSseHandler } from "../pipeline/sse.js";

function serveStatic(options: { root?: string; path?: string }) {
  return async (c: Context, next: () => Promise<void>) => {
    let filePath = options.path;
    if (!filePath && options.root) {
      const urlPath = c.req.path;
      filePath = path.join(options.root, urlPath);
    }
    if (filePath && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes: Record<string, string> = {
        ".html": "text/html", ".css": "text/css", ".js": "application/javascript",
        ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg",
        ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
      };
      c.header("Content-Type", mimeTypes[ext] || "application/octet-stream");
      return c.body(content);
    }
    await next();
  };
}

export function registerHttpRoutes(app: Hono) {
  app.get("/health", (c) => c.json({ status: "ok", version: process.env.APP_VERSION || "1.0.0" }));
  app.get("/api/sse/pipeline/:jobId", (c) => pipelineSseHandler(c));
  app.get("/api/pdf/:slug", async (c) => {
    const slug = c.req.param("slug");
    try {
      const pdfBuffer = await generatePdf(slug);
      c.header("Content-Type", "application/pdf");
      c.header("Content-Disposition", `attachment; filename="optimus-rufus-audit-${slug}.pdf"`);
      return c.body(new Uint8Array(pdfBuffer));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("❌ [Hono] PDF download route failed:", err);
      return c.text(`Failed to generate PDF: ${message}`, 500);
    }
  });
  if (process.env.NODE_ENV === "production") {
    app.use("/*", serveStatic({ root: "./dist" }));
    app.get("*", serveStatic({ path: "./dist/index.html" }));
  }
}
