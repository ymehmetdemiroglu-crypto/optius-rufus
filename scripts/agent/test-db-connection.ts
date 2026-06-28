import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import { sql } from "drizzle-orm";

async function main() {
  console.log(`DATABASE_URL: "${process.env.DATABASE_URL}"`);
  try {
    const res = await db.execute(sql`SELECT 1`);
    console.log("Success:", res);
  } catch (err: any) {
    console.error("Connection failed:", err);
  }
}

main().catch(console.error);
