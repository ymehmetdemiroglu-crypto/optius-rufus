import { Hono } from "hono";
import { cors } from "hono/cors";
import { registerHttpRoutes } from "./http/routes.js";
import { registerTrpcHandler } from "./trpc/handler.js";
import { startWorkers } from "./workers/bootstrap.js";
import "./db/schema.js";

export const app = new Hono();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : process.env.NODE_ENV === "production" ? [] : ["*"];

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return origin;
    if (allowedOrigins.includes("*")) return origin;
    if (allowedOrigins.includes(origin)) return origin;
    return null;
  },
}));

registerHttpRoutes(app);
registerTrpcHandler(app);

const port = parseInt(process.env.PORT || "3000", 10);
console.log(`🚀 Optimus Rufus server running on http://localhost:${port}`);

import { createServer } from "http";

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const request = new Request(url, {
    method: req.method,
    headers: new Headers(Object.entries(req.headers).map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : String(v || "")]) as HeadersInit),
    body: (req.method !== "GET" && req.method !== "HEAD" ? await getBody(req) : undefined) as BodyInit | undefined,
  });
  const response = await app.fetch(request);
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
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
    startWorkers();
  });
}
