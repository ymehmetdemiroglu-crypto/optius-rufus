// scripts/codegen/env-table.ts
// Generates docs/30-reference/env/variables.md from .env.example.
//
// Usage:
//   tsx scripts/codegen/env-table.ts             # print to stdout
//   tsx scripts/codegen/env-table.ts --write     # write to target
//   tsx scripts/codegen/env-table.ts --check     # exit 1 if drift

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

const SOURCE_PATH = ".env.example";
const TARGET_PATH = "docs/30-reference/env/variables.md";
// Marker block per docs/00-meta/codegen-pipeline.md and the
// "Example: codegen frontmatter" block in docs/00-meta/frontmatter-spec.md.
const MARKER = [
  `<!-- codegen:source=${SOURCE_PATH} -->`,
  `<!-- DO NOT EDIT — regenerate via \`pnpm codegen:env\` -->`,
].join("\n");
const TODAY = new Date().toISOString().slice(0, 10);

const args = new Set(process.argv.slice(2));
const CHECK = args.has("--check");
const WRITE = args.has("--write");

interface EnvEntry {
  name: string;
  raw: string;
  defaultValue: string;
  description: string;
  required: boolean;
}

interface EnvBlock {
  groupTitle: string;
  entries: EnvEntry[];
}

/**
 * Strip an inline `${OTHER}` interpolation, quote, and trailing whitespace.
 * We don't try to resolve the interpolation — we just show the literal default.
 */
function cleanDefault(raw: string): string {
  let v = raw.trim();
  // Strip surrounding quotes if balanced.
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v;
}

/**
 * Decide "required" from the inline comment (if any) attached to the same line.
 * A line like `FOO=bar # required` → required. A comment of `# Optional` → optional.
 * Blank / placeholder defaults like `sk-your-…`, `xxx`, `your-…` are NOT auto-required
 * unless an explicit `required` token is found.
 */
function isRequiredFromComment(comment: string): boolean | null {
  if (/\brequired\b/i.test(comment)) return true;
  if (/\boptional\b/i.test(comment)) return false;
  return null;
}

function parseEnv(source: string): EnvBlock[] {
  const lines = source.split(/\r?\n/);
  const blocks: EnvBlock[] = [];
  let current: EnvBlock = { groupTitle: "General", entries: [] };
  let pendingDescription: string[] = [];

  const flushBlock = () => {
    if (current.entries.length > 0) blocks.push(current);
    current = { groupTitle: "General", entries: [] };
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === "") {
      // blank line ends the current group if we already emitted entries
      flushBlock();
      continue;
    }
    if (line.startsWith("#")) {
      const text = line.replace(/^#\s*/, "").trim();
      if (text.length === 0) continue;
      // Skip commented-out variable lines like `# DB_PATH=/var/lib/optimus/optimus.db`.
      // They are not descriptions; including them pollutes the next variable's description.
      if (/^[A-Z_][A-Z0-9_]*\s*=/.test(text)) continue;
      // A comment line WITHOUT a `=` on it is a group/description header.
      // Heuristic: if the next non-empty line is a variable, treat this as a group title.
      pendingDescription.push(text);
      continue;
    }

    // Variable line: NAME=default [# comment]
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const name = line.slice(0, eq).trim();
    const rest = line.slice(eq + 1);
    const hashIdx = rest.indexOf("#");
    const valuePart = hashIdx >= 0 ? rest.slice(0, hashIdx) : rest;
    const inlineComment = hashIdx >= 0 ? rest.slice(hashIdx + 1).trim() : "";

    const defaultValue = cleanDefault(valuePart);
    // Description = stacked comments above + inline comment, deduped.
    const descParts: string[] = [];
    for (const d of pendingDescription) {
      // Skip lines that are just "Database", "Application", etc. group titles.
      // We use a simple heuristic: short (<=40 chars), no period, looks like a heading.
      if (
        d.length <= 40 &&
        !d.includes(".") &&
        /^[A-Z][A-Za-z0-9 &/()_-]*$/.test(d) &&
        inlineComment === "" &&
        pendingDescription.length === 1
      ) {
        current.groupTitle = d;
        continue;
      }
      descParts.push(d);
    }
    if (inlineComment) descParts.push(inlineComment);
    const description = descParts.join(" ").trim() || "—";

    const requiredFlag = isRequiredFromComment(description);
    const required = requiredFlag ?? false;

    current.entries.push({ name, raw: valuePart, defaultValue, description, required });
    pendingDescription = [];
  }

  flushBlock();
  return blocks;
}

function renderFrontmatter(): string {
  return [
    "---",
    `title: Environment Variables`,
    `owner: "@yhia"`,
    `status: canonical`,
    `last_verified: ${TODAY}`,
    `diataxis_mode: reference`,
    `audience: engineering`,
    `generated: true`,
    `codegen_source: ${SOURCE_PATH}`,
    "---",
    "",
  ].join("\n");
}

function renderBody(blocks: EnvBlock[]): string {
  const lines: string[] = [];
  lines.push("# Environment Variables");
  lines.push("");
  lines.push(
    `Every variable declared in \`.env.example\`. Regenerate with \`pnpm codegen:env\`.`,
  );
  lines.push("");

  if (blocks.length === 0) {
    lines.push("_No variables declared._");
    lines.push("");
    return lines.join("\n");
  }

  for (const block of blocks) {
    lines.push(`## ${block.groupTitle}`);
    lines.push("");
    lines.push("| Name | Default | Required | Description |");
    lines.push("|---|---|---|---|");
    for (const e of block.entries) {
      const def = e.defaultValue === "" ? "_(empty)_" : `\`${e.defaultValue}\``;
      const req = e.required ? "yes" : "no";
      lines.push(`| \`${e.name}\` | ${def} | ${req} | ${e.description} |`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function build(source: string): string {
  const blocks = parseEnv(source);
  return `${MARKER}\n${renderFrontmatter()}\n${renderBody(blocks)}`;
}

async function main(): Promise<void> {
  const absSource = resolve(REPO_ROOT, SOURCE_PATH);
  const absTarget = resolve(REPO_ROOT, TARGET_PATH);
  const raw = await readFile(absSource, "utf8");
  const out = build(raw);

  if (CHECK) {
    let existing = "";
    try {
      existing = await readFile(absTarget, "utf8");
    } catch {
      process.stderr.write(
        `drift: target ${relative(REPO_ROOT, absTarget)} is missing\n`,
      );
      process.exit(1);
    }
    if (existing !== out) {
      process.stderr.write(
        `drift: ${relative(REPO_ROOT, absTarget)} would change. Run \`pnpm codegen:env\`.\n`,
      );
      process.exit(1);
    }
    process.stdout.write("ok: env-table is fresh\n");
    return;
  }

  if (WRITE) {
    await writeFile(absTarget, out, "utf8");
    process.stdout.write(
      `wrote ${relative(REPO_ROOT, absTarget)} (${out.length} bytes)\n`,
    );
    return;
  }

  process.stdout.write(out);
}

main().catch((err) => {
  process.stderr.write(`env-table codegen failed: ${String(err)}\n`);
  process.exit(1);
});
