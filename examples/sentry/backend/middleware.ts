import * as Sentry from "@sentry/node";
import { Hono } from "hono";

const app = new Hono();

app.use("/trpc/*", async (c, next) => {
  // Example auth middleware that sets Sentry user context
  const user = c.get("user"); // or however you extract the user

  if (user) {
    Sentry.setUser({
      id: user.id.toString(),
      email: user.email,
    });
  }

  await next();
});
