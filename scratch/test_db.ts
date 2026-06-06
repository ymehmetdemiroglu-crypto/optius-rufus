import '../api/db/schema.js';
import { db } from '../api/db/client.js';
console.log('FK enabled:', db.pragma('foreign_keys'));
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{name: string}>;
console.log('Tables:', tables.map(r => r.name));
const migrations = db.prepare("SELECT filename FROM schema_migrations").all() as Array<{filename: string}>;
console.log('Migrations:', migrations.map(r => r.filename));
