import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./api/db/schema.ts",
  out: "./api/db/migrations/drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
