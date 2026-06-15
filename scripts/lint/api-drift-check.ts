// scripts/lint/api-drift-check.ts
// Detects API drift: when a PR touches an API router file but not the matching
// reference doc. Warning only — never fails CI by itself.
//
// Usage:
//   tsx scripts/lint/api-drift-check.ts                       # base=origin/main
//   tsx scripts/lint/api-drift-check.ts --base=main           # base=main
//   API_DRIFT_BASE=main tsx scripts/lint/api-drift-check.ts   # base via env

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

function parseBase(): string {
  const arg = process.argv.slice(2).find((a) => a.startsWith("--base="));
  if (arg) return arg.slice("--base=".length);
  if (process.env.API_DRIFT_BASE) return process.env.API_DRIFT_BASE!;
  return "origin/main";
}

function changedFiles(base: string): string[] {
  // `git diff --name-only` is line-oriented; we read stdout and split on newlines.
  // If git fails (e.g. no origin/main in shallow clones) we treat that as
  // "no diff to compare" and return [] — the script never blocks CI on its own.
  const r = spawnSync(
    "git",
    ["diff", "--name-only", `${base}...HEAD`],
    { cwd: REPO_ROOT, encoding: "utf8" },
  );
  if (r.status !== 0) {
    process.stderr.write(
      `warning: could not run \`git diff --name-only ${base}...HEAD\` (status=${r.status ?? "?"}). Treating as no changes.\n`,
    );
    if (r.stderr) process.stderr.write(r.stderr);
    return [];
  }
  return r.stdout
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function matchesAny(file: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(file));
}

async function main(): Promise<number> {
  const base = parseBase();
  const files = changedFiles(base);
  if (files.length === 0) {
    process.stdout.write(`ok: no changes vs ${base}; no drift to check.\n`);
    return 0;
  }

  const API_PATTERNS = [
    /^api\/trpc\/router\.ts$/,
    /^api\/domains\/.+\/router\.ts$/,
  ];
  const DOCS_API_DIR = "docs/30-reference/api/";

  const apiHits = files.filter((f) => matchesAny(f, API_PATTERNS));
  const docHits = files.filter((f) => f.startsWith(DOCS_API_DIR));

  if (apiHits.length === 0) {
    process.stdout.write(
      `ok: no API routers changed vs ${base}; drift check not applicable.\n`,
    );
    return 0;
  }

  if (docHits.length > 0) {
    process.stdout.write(
      `ok: ${apiHits.length} API router file(s) and ${docHits.length} API doc file(s) changed together.\n`,
    );
    for (const f of apiHits) process.stdout.write(`  - api: ${f}\n`);
    for (const f of docHits) process.stdout.write(`  - doc: ${f}\n`);
    return 0;
  }

  // Drift detected — warn but do not fail.
  process.stdout.write(
    `\nWARNING: API drift detected (no build failure).\n`,
  );
  process.stdout.write(
    `  The following API router files were changed vs ${base}, but no files under ${DOCS_API_DIR} were updated:\n`,
  );
  for (const f of apiHits) process.stdout.write(`  - ${f}\n`);
  process.stdout.write(
    `\n  If your change adds, removes, or renames a tRPC procedure, run \`pnpm codegen:domains\` and update \`docs/30-reference/api/procedures.md\` in the same PR.\n`,
  );
  // Warnings only — exit 0. Set NONZERO=1 to opt into a hard fail.
  if (process.env.API_DRIFT_STRICT === "1") {
    return 1;
  }
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`api-drift-check crashed: ${String(err)}\n`);
    process.exit(2);
  },
);
