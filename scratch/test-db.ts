import { db } from '../api/db/drizzle.js';
import { sql } from 'drizzle-orm';

async function test() {
  try {
    const res = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
    console.log("Existing tables:", res.rows);
  } catch (err) {
    console.error("Query error:", err);
  }
}
test();
