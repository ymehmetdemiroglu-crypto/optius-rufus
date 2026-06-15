// scripts/lint/staleness-check.ts
// Walks docs/**/*.md and flags any whose frontmatter `last_verified` is more
// than 180 days before today. Exit 0 if all fresh, 1 with a per-file report
// otherwise.

import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const DOCS_DIR = resolve(REPO_ROOT, "docs");
const MAX_AGE_DAYS = 180;

interface FmRecord {
  [k: string]: unknown;
}

function relPath(absFile: string): string {
  return relative(REPO_ROOT, absFile).replaceAll("\\", "/");
}

function extractFrontmatter(raw: string): FmRecord | null {
  if (!raw.startsWith("---")) return null;
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return null;
  const body = raw.slice(3, end).replace(/^\n/, "");
  const out: FmRecord = {};
  for (const line of body.split(/\r?\n/)) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!m) continue;
    let v: unknown = m[2].trim();
    if (typeof v === "string") {
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = (v as string).slice(1, -1);
      }
    }
    out[m[1]] = v;
  }
  return out;
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) out.push(...(await walk(full)));
      else if (ent.isFile() && ent.name.endsWith(".md")) out.push(full);
    }
  } catch {
    // Ignore errors
  }
  return out;
}

async function main(): Promise<number> {
  let files: string[] = [];
  try {
    const s = await stat(DOCS_DIR);
    if (s.isDirectory()) files = await walk(DOCS_DIR);
  } catch {
    process.stderr.write(`error: docs directory not found at ${DOCS_DIR}\n`);
    return 1;
  }
  files.sort();

  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  interface StaleRow {
    file: string;
    lastVerified: string;
    daysOld: number;
  }
  const stale: StaleRow[] = [];
  let scanned = 0;
  let missing = 0;

  for (const f of files) {
    const raw = await readFile(f, "utf8");
    const fm = extractFrontmatter(raw);
    if (!fm || typeof fm.last_verified !== "string") {
      missing++;
      continue;
    }
    scanned++;
    const d = new Date(fm.last_verified + "T00:00:00Z");
    if (Number.isNaN(d.getTime())) continue;
    const age = daysBetween(d, todayUtc);
    if (age > MAX_AGE_DAYS) {
      stale.push({ file: relPath(f), lastVerified: fm.last_verified, daysOld: age });
    }
  }

  if (stale.length === 0) {
    process.stdout.write(
      `ok: ${scanned} docs are fresh (<= ${MAX_AGE_DAYS} days). ${missing} skipped (no last_verified).\n`,
    );
    return 0;
  }

  process.stderr.write(
    `stale docs: ${stale.length} of ${scanned} older than ${MAX_AGE_DAYS} days\n`,
  );
  for (const row of stale) {
    process.stderr.write(
      `  ${row.file}  last_verified=${row.lastVerified}  (${row.daysOld} days old)\n`,
    );
  }
  return 1;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`staleness-check crashed: ${String(err)}\n`);
    process.exit(2);
  },
);
