import { loadEnv } from "../scripts/agent/envLoader.js";
loadEnv();

import { db } from "../api/db/drizzle.js";
import { sql } from "drizzle-orm";

async function run() {
  const tables = [
    "prospects",
    "listings",
    "listing_analyses",
    "bookings",
    "prospect_activities",
    "brand_settings",
    "rufus_queries",
    "rufus_query_runs",
    "catalog_links",
    "pipeline_jobs",
    "pipeline_job_stages",
    "usage_events"
  ];

  console.log("🔄 Resetting and synchronizing all table sequences in Postgres...");

  for (const table of tables) {
    try {
      // Get the max id
      const maxIdResult = await db.execute(sql.raw(`SELECT max(id) as max_id FROM "${table}"`));
      const maxId = maxIdResult.rows[0]?.max_id ? Number(maxIdResult.rows[0].max_id) : 0;
      
      console.log(`Table: ${table}, Max ID: ${maxId}`);
      
      if (maxId > 0) {
        // Reset the sequence
        const seqNameQuery = await db.execute(sql.raw(`SELECT pg_get_serial_sequence('"${table}"', 'id') as seq_name`));
        const seqName = seqNameQuery.rows[0]?.seq_name;
        
        if (seqName) {
          await db.execute(sql.raw(`SELECT setval('${seqName}', ${maxId})`));
          console.log(`  Successfully reset sequence ${seqName} to ${maxId}`);
        } else {
          // Fallback sequence name if pg_get_serial_sequence is null
          const fallbackSeq = `"${table}_id_seq"`;
          await db.execute(sql.raw(`SELECT setval('${fallbackSeq}', ${maxId})`));
          console.log(`  Successfully reset sequence (fallback) ${fallbackSeq} to ${maxId}`);
        }
      }
    } catch (err) {
      console.error(`  ❌ Failed to sync sequence for table ${table}:`, (err as Error).message);
    }
  }

  console.log("🎉 All sequence synchronizations completed!");
}

run();
