// scripts/lint/frontmatter-validator.ts
// Walks docs/**/*.md and validates the YAML frontmatter against
// docs/00-meta/frontmatter-spec.md.
//
// Exit 0 on clean, 1 on any violation. Per-file report is printed to stderr.

import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");
const DOCS_DIR = resolve(REPO_ROOT, "docs");

const ALLOWED_STATUS = new Set(["draft", "review", "canonical", "retired", "stale"]);
const ALLOWED_DIATAXIS = new Set(["tutorial", "how-to", "reference", "explanation"]);
const ALLOWED_C4 = new Set(["context", "container", "component", "code"]);
const ALLOWED_AUDIENCE = new Set(["engineering", "engineering,product"]);

const SOURCES_RE = /^[a-zA-Z0-9_\-/.]+:\d+(-\d+)?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

interface FmRecord {
  [k: string]: unknown;
}

interface ValidationResult {
  file: string;
  errors: string[];
}

function normalizeWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Tiny YAML-ish parser scoped to the simple frontmatter shapes we use:
 * - key: value
 * - key: "quoted value"
 * - key:
 *     - item
 *     - item
 * The repo's frontmatter is hand-written and uses only these forms. We do
 * NOT aim to be a general YAML parser — just enough to catch the violations.
 */
function parseFrontmatter(raw: string): FmRecord | null {
  // Files may begin with HTML comments (the codegen marker) before the
  // frontmatter fence. Find the first `---` on its own line.
  const lines = raw.split(/\r?\n/);
  let fenceStart = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      fenceStart = i;
      break;
    }
  }
  if (fenceStart < 0) return null;
  // Closing fence: another `---` on its own line after the first.
  let fenceEnd = -1;
  for (let i = fenceStart + 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      fenceEnd = i;
      break;
    }
  }
  if (fenceEnd < 0) return null;
  const bodyLines = lines.slice(fenceStart + 1, fenceEnd);

  const out: FmRecord = {};
  let i = 0;
  while (i < bodyLines.length) {
    const line = bodyLines[i];
    if (line.trim() === "" || line.trim().startsWith("#")) {
      i++;
      continue;
    }
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const key = m[1];
    const value = m[2];
    if (value === "" || value === undefined) {
      // Look ahead: list?
      const items: string[] = [];
      let j = i + 1;
      while (j < bodyLines.length) {
        const nl = bodyLines[j];
        const lm = nl.match(/^\s+-\s+(.*)$/);
        if (!lm) break;
        let item = lm[1].trim();
        if (
          (item.startsWith('"') && item.endsWith('"')) ||
          (item.startsWith("'") && item.endsWith("'"))
        ) {
          item = item.slice(1, -1);
        }
        items.push(item);
        j++;
      }
      if (items.length > 0) {
        out[key] = items;
        i = j;
        continue;
      }
      out[key] = "";
      i++;
      continue;
    }
    let v: unknown = value.trim();
    if (typeof v === "string") {
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = (v as string).slice(1, -1);
      } else if (v === "true") {
        v = true;
      } else if (v === "false") {
        v = false;
      } else if (v === "null") {
        v = null;
      }
    }
    out[key] = v;
    i++;
  }
  return out;
}

function extractH1(body: string): string | null {
  // The H1 is the first line starting with `# ` (ATX). Codegen marker is HTML
  // comment, not a heading, so it doesn't conflict.
  const lines = body.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^#\s+(.+?)\s*#*\s*$/);
    if (m) return m[1];
  }
  return null;
}

function relPath(absFile: string): string {
  return relative(REPO_ROOT, absFile).replaceAll("\\", "/");
}

function validateOne(absFile: string, raw: string): string[] {
  const errors: string[] = [];
  const fm = parseFrontmatter(raw);
  if (fm === null) {
    errors.push("missing or malformed frontmatter (expected `---` block on line 1)");
    return errors;
  }

  // Required fields
  for (const req of ["title", "owner", "status", "last_verified", "diataxis_mode", "audience"]) {
    if (!(req in fm) || fm[req] === "" || fm[req] === undefined) {
      errors.push(`missing required field \`${req}\``);
    }
  }

  // status enum
  if (typeof fm.status === "string" && !ALLOWED_STATUS.has(fm.status)) {
    errors.push(
      `\`status\` must be one of ${[...ALLOWED_STATUS].join("|")}, got "${fm.status}"`,
    );
  }

  // diataxis_mode enum
  if (typeof fm.diataxis_mode === "string" && !ALLOWED_DIATAXIS.has(fm.diataxis_mode)) {
    errors.push(
      `\`diataxis_mode\` must be one of ${[...ALLOWED_DIATAXIS].join("|")}, got "${fm.diataxis_mode}"`,
    );
  }

  // last_verified: ISO date, not in the future
  if (typeof fm.last_verified === "string") {
    if (!DATE_RE.test(fm.last_verified)) {
      errors.push(`\`last_verified\` must be YYYY-MM-DD, got "${fm.last_verified}"`);
    } else {
      const d = new Date(fm.last_verified + "T00:00:00Z");
      const today = new Date();
      const todayUtc = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
      if (Number.isNaN(d.getTime())) {
        errors.push(`\`last_verified\` is not a real date: "${fm.last_verified}"`);
      } else if (d.getTime() > todayUtc.getTime()) {
        errors.push(`\`last_verified\` is in the future: "${fm.last_verified}"`);
      }
    }
  }

  // audience enum (allow comma-separated list membership)
  if (typeof fm.audience === "string") {
    const members = fm.audience.split(",").map((s) => s.trim());
    const ok = members.every((m) => m === "engineering" || m === "product");
    if (!ok) {
      errors.push(`\`audience\` must be a comma-list of engineering|product, got "${fm.audience}"`);
    }
  }

  // title matches H1 (case-insensitive, normalized whitespace)
  // The body starts after the closing frontmatter fence.
  const lines2 = raw.split(/\r?\n/);
  let fenceStart = -1;
  let fenceEnd = -1;
  for (let i = 0; i < lines2.length; i++) {
    if (lines2[i].trim() === "---") {
      if (fenceStart < 0) fenceStart = i;
      else { fenceEnd = i; break; }
    }
  }
  const body = fenceEnd >= 0 ? lines2.slice(fenceEnd + 1).join("\n") : "";
  const h1 = extractH1(body);
  if (typeof fm.title === "string" && h1) {
    if (normalizeWs(fm.title.toLowerCase()) !== normalizeWs(h1.toLowerCase())) {
      errors.push(`\`title\` ("${fm.title}") does not match H1 ("${h1}")`);
    }
  } else if (typeof fm.title === "string" && !h1) {
    errors.push("no H1 found in file body");
  }

  // c4_level only in 40-architecture/
  if (typeof fm.c4_level === "string") {
    if (!ALLOWED_C4.has(fm.c4_level)) {
      errors.push(
        `\`c4_level\` must be one of ${[...ALLOWED_C4].join("|")}, got "${fm.c4_level}"`,
      );
    }
    const rp = relPath(absFile);
    if (!rp.startsWith("40-architecture/") && !rp.startsWith("docs/40-architecture/")) {
      errors.push(
        `\`c4_level\` is only allowed in \`40-architecture/\`, got "${rp}"`,
      );
    }
  }

  // generated: true → file starts with codegen marker
  if (fm.generated === true) {
    if (!raw.includes("<!-- codegen:source=")) {
      errors.push(
        "`generated: true` requires the file to begin with a `<!-- codegen:source=... -->` marker",
      );
    }
  }

  // sources list entries match regex
  if (fm.sources !== undefined) {
    if (!Array.isArray(fm.sources)) {
      errors.push("`sources` must be a list");
    } else {
      fm.sources.forEach((s, idx) => {
        if (typeof s !== "string" || !SOURCES_RE.test(s)) {
          errors.push(`\`sources[${idx}]\` does not match \`^[a-zA-Z0-9_\\-/.]+:\\d+(-\\d+)?$\` (got "${String(s)}")`);
        }
      });
    }
  }

  return errors;
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        out.push(...(await walk(full)));
      } else if (ent.isFile() && ent.name.endsWith(".md")) {
        out.push(full);
      }
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

  const results: ValidationResult[] = [];
  for (const f of files) {
    const raw = await readFile(f, "utf8");
    const errs = validateOne(f, raw);
    if (errs.length > 0) results.push({ file: relPath(f), errors: errs });
  }

  if (results.length === 0) {
    process.stdout.write(
      `ok: frontmatter valid for ${files.length} file${files.length === 1 ? "" : "s"}\n`,
    );
    return 0;
  }

  process.stderr.write(`frontmatter violations (${results.length} file${results.length === 1 ? "" : "s"}):\n`);
  for (const r of results) {
    process.stderr.write(`\n  ${r.file}\n`);
    for (const e of r.errors) process.stderr.write(`    - ${e}\n`);
  }
  return 1;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    process.stderr.write(`frontmatter-validator crashed: ${String(err)}\n`);
    process.exit(2);
  },
);
