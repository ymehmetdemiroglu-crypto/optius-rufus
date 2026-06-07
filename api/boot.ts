import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import { createContext } from "./trpc.js";
import "./db/schema.js";
import fs from "fs";
import path from "path";

import { generatePdf } from "./services/pdf.js";
import { pipelineSseHandler } from "./sse/pipeline.js";
import { queueWorker } from "./pipeline/worker.js";
import { db } from "./db/client.js";

export const app = new Hono();

// A simple serveStatic replacement using Node fs for portable and error-free execution
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
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
      };
      c.header("Content-Type", mimeTypes[ext] || "application/octet-stream");
      return c.body(content);
    }
    await next();
  };
}

// CORS — restrict in production, allow all in development
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

// Health check with DB connectivity
app.get("/health", (c) => {
  try {
    db.prepare("SELECT 1").get();
    return c.json({ status: "ok", version: process.env.APP_VERSION || "1.0.0", db: "connected" });
  } catch {
    return c.json({ status: "degraded", version: process.env.APP_VERSION || "1.0.0", db: "disconnected" }, 503);
  }
});

// SSE pipeline progress streaming
app.get("/api/sse/pipeline/:jobId", (c) => pipelineSseHandler(c));

// PDF Download route
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

// tRPC API endpoint
app.use("/api/trpc/*", async (c) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
  return response;
});

// Serve static frontend files in production
if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ path: "./dist/index.html" }));
}

const port = parseInt(process.env.PORT || "3000", 10);

console.log(`🚀 Optimus Rufus server running on http://localhost:${port}`);

// Bun/Deno/Node compatibility

// Node native fetch server
import { createServer } from "http";

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const request = new Request(url, {
    method: req.method,
    headers: new Headers(
      Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : String(v || "")]) as HeadersInit
    ),
    body: (req.method !== "GET" && req.method !== "HEAD" ? await getBody(req) : undefined) as BodyInit | undefined,
  });

  const response = await app.fetch(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
  }
  res.end();
});

function getBody(req: import("http").IncomingMessage): Promise<Buffer> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

if (!process.env.VERCEL) {
  httpServer.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
    console.log(`📡 tRPC endpoint: http://localhost:${port}/api/trpc`);
    console.log(`📊 SSE endpoint: http://localhost:${port}/api/sse/pipeline/:jobId`);

    // Start background job worker for non-serverless environments
    queueWorker.start();
  });
}
