import { loadEnv } from "./envLoader.js";
loadEnv();

import { db } from "../../api/db/drizzle.js";
import * as schema from "../../api/db/schema.js";
import { inArray } from "drizzle-orm";

async function main() {
  const ids = [2, 5, 8, 13, 16];
  const rows = await db
    .select({
      id: schema.prospects.id,
      email: schema.prospects.email,
      status: schema.prospects.status,
      apolloContactId: schema.prospects.apolloContactId,
      apolloSequenceId: schema.prospects.apolloSequenceId,
    })
    .from(schema.prospects)
    .where(inArray(schema.prospects.id, ids));

  console.log("Inspect results:");
  console.log(rows);
}

main().catch(console.error);
