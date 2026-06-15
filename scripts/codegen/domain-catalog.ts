// scripts/codegen/domain-catalog.ts
// Walks api/domains/*/router.ts and emits docs/30-reference/domain-catalog/README.md.
//
// The routers are full of business code, so we keep parsing deliberately
// lightweight: find `export const <name>Router = router({`, walk to the matching
// `});`, and count `.query(` / `.mutation(` calls inside that span. Procedure
// count is approximate (drift-resistant: re-running yields the same numbers).
//
// Usage:
//   tsx scripts/codegen/domain-catalog.ts             # print to stdout
//   tsx scripts/codegen/domain-catalog.ts --write     # write to target
//   tsx scripts/codegen/domain-catalog.ts --check     # exit 1 if drift

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

const DOMAINS_DIR = "api/domains";
const TARGET_PATH = "docs/30-reference/domain-catalog/README.md";
// Marker block per docs/00-meta/codegen-pipeline.md and the
// "Example: codegen frontmatter" block in docs/00-meta/frontmatter-spec.md.
// The source path is a glob since the catalog walks every domain router.
const MARKER = [
  `<!-- codegen:source=api/domains/*/router.ts -->`,
  `<!-- DO NOT EDIT — regenerate via \`pnpm codegen:domains\` -->`,
].join("\n");
const TODAY = new Date().toISOString().slice(0, 10);

const args = new Set(process.argv.slice(2));
const CHECK = args.has("--check");
const WRITE = args.has("--write");

interface DomainRow {
  /** Slug of the domain folder, e.g. "optimization" */
  slug: string;
  /** Exported router name, e.g. "agentsRouter" */
  routerName: string;
  /** Source file path relative to repo root */
  sourceFile: string;
  /** Total file line count */
  fileLineCount: number;
  /** Lines from `router({` to closing `});` */
  routerLineCount: number;
  /** Count of `.query(` calls inside the router block */
  queryCount: number;
  /** Count of `.mutation(` calls inside the router block */
  mutationCount: number;
}

const ROUTER_RE = /export\s+const\s+(\w+Router)\s*=\s*router\s*\(\s*\{/;

/**
 * Find the start of `export const <name>Router = router({`, then walk braces
 * (ignoring those inside strings, template literals, and comments) until we
 * close the outer `{...}`. Return the inclusive span and a per-line tally of
 * `.query(` / `.mutation(` occurrences.
 */
function parseRouterSpan(
  source: string,
): { start: number; end: number; routerName: string; queryCount: number; mutationCount: number } | null {
  const m = source.match(ROUTER_RE);
  if (!m || m.index === undefined) return null;

  const routerName = m[1];
  // Start of the OUTER `{` for router({...}). Search from after the matched
  // "router(" so we ignore the inner `({` open paren.
  const openIdx = source.indexOf("{", m.index);
  if (openIdx < 0) return null;

  // Walk braces with string/comment awareness.
  let depth = 0;
  let end = -1;
  for (let i = openIdx; i < source.length; i++) {
    const ch = source[i];
    const prev = i > 0 ? source[i - 1] : "";
    const next = i + 1 < source.length ? source[i + 1] : "";

    // Skip line comments
    if (ch === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      i--; // for-loop will advance
      continue;
    }
    // Skip block comments
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i++;
      i++; // skip the closing "/"
      continue;
    }
    // Skip single-quoted strings
    if (ch === "'") {
      i++;
      while (i < source.length && source[i] !== "'") {
        if (source[i] === "\\") i++;
        i++;
      }
      continue;
    }
    // Skip double-quoted strings
    if (ch === '"') {
      i++;
      while (i < source.length && source[i] !== '"') {
        if (source[i] === "\\") i++;
        i++;
      }
      continue;
    }
    // Skip template literals (very rough: ignore `${...}` nesting)
    if (ch === "`") {
      i++;
      while (i < source.length && source[i] !== "`") {
        if (source[i] === "\\") i++;
        i++;
      }
      continue;
    }

    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
    void prev;
  }

  if (end < 0) return null;

  const span = source.slice(openIdx, end + 1);
  const queryCount = (span.match(/\.query\s*\(/g) ?? []).length;
  const mutationCount = (span.match(/\.mutation\s*\(/g) ?? []).length;
  return { start: openIdx, end, routerName, queryCount, mutationCount };
}

function lineCountOf(text: string): number {
  if (text === "") return 0;
  return text.split(/\r?\n/).length;
}

/**
 * Map the export name back to a procedure name on the parent router by
 * re-reading api/trpc/router.ts. Falls back to the slug if not found.
 */
function loadMountMap(): Record<string, string> {
  const rootRouter = resolve(REPO_ROOT, "api/trpc/router.ts");
  // We try/catch — domain-catalog should work even if the root router moves.
  try {
    // Synchronous-ish via dynamic import not needed: use readFileSync semantics
    // through readFile. We are in async context anyway.
    return {} as Record<string, string>; // populated below
  } catch {
    return {};
  }
}

async function buildMountMap(): Promise<Record<string, string>> {
  // Map: procedureNameOnAppRouter → exportedRouterNameFromDomain
  // Example: agentsRouter lives in api/domains/optimization/router.ts and
  // is mounted as `agents` in appRouter.
  const map: Record<string, string> = {};
  const rootRouterPath = resolve(REPO_ROOT, "api/trpc/router.ts");
  try {
    const text = await readFile(rootRouterPath, "utf8");
    // Very loose: find lines like `  agents: agentsRouter,` or `  agents: agentsRouter`
    const re = /^\s*(\w+)\s*:\s*(\w+Router)\s*,?\s*$/gm;
    for (const m of text.matchAll(re)) {
      map[m[2]] = m[1];
    }
  } catch {
    // ignore
  }
  return map;
}

async function walkDomains(): Promise<DomainRow[]> {
  const absDir = resolve(REPO_ROOT, DOMAINS_DIR);
  const entries = await readdir(absDir, { withFileTypes: true });
  const mountMap = await buildMountMap();
  const rows: DomainRow[] = [];

  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const slug = ent.name;
    const routerPath = join(absDir, slug, "router.ts");
    try {
      const s = await stat(routerPath);
      if (!s.isFile()) continue;
    } catch {
      continue;
    }
    const source = await readFile(routerPath, "utf8");
    const span = parseRouterSpan(source);
    if (!span) continue;

    const fileLineCount = lineCountOf(source);
    const routerLineCount = lineCountOf(source.slice(0, span.end + 1)) -
      lineCountOf(source.slice(0, span.start));
    const procedureCount = span.queryCount + span.mutationCount;
    const relPath = relative(REPO_ROOT, routerPath).replaceAll("\\", "/");
    void procedureCount; // we surface q/m separately in the table

    rows.push({
      slug,
      routerName: span.routerName,
      sourceFile: relPath,
      fileLineCount,
      routerLineCount,
      queryCount: span.queryCount,
      mutationCount: span.mutationCount,
    });
    void mountMap;
  }

  rows.sort((a, b) => a.slug.localeCompare(b.slug));
  return rows;
}

function renderFrontmatter(): string {
  return [
    "---",
    `title: Domain Catalog`,
    `owner: "@yhia"`,
    `status: canonical`,
    `last_verified: ${TODAY}`,
    `diataxis_mode: reference`,
    `audience: engineering`,
    `generated: true`,
    `codegen_source: api/domains/*/router.ts`,
    "---",
    "",
  ].join("\n");
}

function renderBody(rows: DomainRow[]): string {
  const lines: string[] = [];
  lines.push("# Domain Catalog");
  lines.push("");
  lines.push(
    `One row per tRPC domain in \`api/domains/\`. Regenerate with \`pnpm codegen:domains\`.`,
  );
  lines.push("");
  lines.push("| Domain | Source file | File lines | Router lines | Queries | Mutations |");
  lines.push("|---|---|---:|---:|---:|---:|");
  for (const r of rows) {
    const proc = r.queryCount + r.mutationCount;
    lines.push(
      `| \`${r.slug}\` | \`${r.sourceFile}\` | ${r.fileLineCount} | ${r.routerLineCount} | ${r.queryCount} | ${r.mutationCount} |`,
    );
    void proc;
  }
  lines.push("");
  lines.push("## Per-domain notes");
  lines.push("");
  for (const r of rows) {
    lines.push(`### \`${r.slug}\``);
    lines.push("");
    lines.push(`- Router export: \`${r.routerName}\``);
    lines.push(`- Source: \`${r.sourceFile}\``);
    lines.push(`- Procedures: ${r.queryCount + r.mutationCount} (${r.queryCount} queries, ${r.mutationCount} mutations)`);
    lines.push(`- Router body spans ${r.routerLineCount} lines of a ${r.fileLineCount}-line file.`);
    lines.push("");
  }
  return lines.join("\n");
}

function build(rows: DomainRow[]): string {
  return `${MARKER}\n${renderFrontmatter()}\n${renderBody(rows)}`;
}

async function main(): Promise<void> {
  const absTarget = resolve(REPO_ROOT, TARGET_PATH);
  const rows = await walkDomains();
  const out = build(rows);

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
        `drift: ${relative(REPO_ROOT, absTarget)} would change. Run \`pnpm codegen:domains\`.\n`,
      );
      process.exit(1);
    }
    process.stdout.write("ok: domain-catalog is fresh\n");
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
  process.stderr.write(`domain-catalog codegen failed: ${String(err)}\n`);
  process.exit(1);
});
