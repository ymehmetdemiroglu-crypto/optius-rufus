import { Hono, type Context } from "hono";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router.js";
import "./db/schema.js";
import fs from "fs";
import path from "path";

import { generatePdf } from "./services/pdf.js";

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

// CORS
app.use("*", cors({ origin: "*" }));

// Health check
app.get("/health", (c) => c.json({ status: "ok", version: process.env.APP_VERSION || "1.0.0" }));

// PDF Download route
app.get("/api/pdf/:slug", async (c) => {
  const slug = c.req.param("slug");
  try {
    const pdfBuffer = await generatePdf(slug);
    c.header("Content-Type", "application/pdf");
    c.header("Content-Disposition", `attachment; filename="optimus-rufus-audit-${slug}.pdf"`);
    return c.body(pdfBuffer as any);
  } catch (err: any) {
    console.error("❌ [Hono] PDF download route failed:", err);
    return c.text(`Failed to generate PDF: ${err.message}`, 500);
  }
});

// tRPC API endpoint
app.use("/api/trpc/*", async (c) => {
  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext: () => ({}),
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
      Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : v || ""]) as any
    ),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: (req.method !== "GET" && req.method !== "HEAD" ? await getBody(req) : undefined) as any,
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
  });
}
