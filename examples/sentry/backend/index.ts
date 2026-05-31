import * as Sentry from "@sentry/node";
import { Hono } from "hono";

const app = new Hono();

// Sentry request instrumentation
Sentry.setupHonoErrorHandler(app);

// ... existing routes and middleware

export default app;
