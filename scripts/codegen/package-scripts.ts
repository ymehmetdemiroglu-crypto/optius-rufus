// scripts/codegen/package-scripts.ts
// Generates docs/30-reference/cli/scripts.md from package.json `scripts`.
//
// Usage:
//   tsx scripts/codegen/package-scripts.ts             # print to stdout
//   tsx scripts/codegen/package-scripts.ts --write     # write to target
//   tsx scripts/codegen/package-scripts.ts --check     # exit 1 if drift

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, relative, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..", "..");

const SOURCE_PATH = "package.json";
const TARGET_PATH = "docs/30-reference/cli/scripts.md";
// Marker block per docs/00-meta/codegen-pipeline.md and the
// "Example: codegen frontmatter" block in docs/00-meta/frontmatter-spec.md.
const MARKER = [
  `<!-- codegen:source=${SOURCE_PATH} -->`,
  `<!-- DO NOT EDIT — regenerate via \`pnpm codegen:scripts\` -->`,
].join("\n");
const TODAY = new Date().toISOString().slice(0, 10);

const args = new Set(process.argv.slice(2));
const CHECK = args.has("--check");
const WRITE = args.has("--write");

interface PackageJson {
  scripts?: Record<string, string>;
  name?: string;
}

/**
 * Turn a script name like "dev:server" into a human-readable description.
 * Inference only — the table is meant to be a quick map, not a manual.
 */
function describe(name: string): string {
  // Strip a leading scope if present, e.g. "docs:lint" → scope="docs", cmd="lint"
  const [scope, ...rest] = name.split(":");
  const cmd = rest.length > 0 ? rest.join(":") : scope;
  const bare = scope && rest.length > 0 ? cmd : name;

  // Common verbs we recognise; default is "Runs `<name>`."
  const KNOWN: Record<string, string> = {
    dev: "Start the dev server in watch mode.",
    build: "Build the project for production.",
    "build:client": "Build the frontend bundle with Vite.",
    "build:server": "Compile the server TypeScript.",
    start: "Start the production server.",
    "dev:server": "Run the API server via tsx.",
    "dev:client": "Run the Vite dev server for the frontend.",
    test: "Run the test suite once (Vitest).",
    "test:watch": "Run the test suite in watch mode.",
    lint: "Run the linter (ESLint).",
    "lint:fix": "Run the linter with auto-fix.",
    format: "Format source files with Prettier.",
    "format:check": "Check formatting without writing.",
    check: "Run the TypeScript type-check (no emit).",
    typecheck: "Run the TypeScript type-check (no emit).",
    clean: "Remove build artifacts.",
    "docs:lint": "Lint all docs (markdownlint + link-check).",
    "docs:frontmatter": "Validate frontmatter on every doc.",
    "docs:stale": "Report docs that are stale (last_verified > 180d).",
    "docs:codegen": "Regenerate all codegen-produced docs.",
    "docs:codegen:check": "Verify codegen output is fresh (CI gate).",
    "docs:drift": "Check for API/schema/env drift in this PR.",
    "docs:check": "Run all docs checks (fail-fast).",
    "codegen:scripts": "Regenerate the package-scripts table.",
    "codegen:env": "Regenerate the env-vars table.",
    "codegen:domains": "Regenerate the domain-catalog index.",
    "codegen:trpc": "Regenerate the tRPC procedure list.",
    "codegen:schema": "Regenerate the DB schema reference.",
    "codegen:erd": "Regenerate the ERD Mermaid diagram.",
    "codegen:pipeline": "Regenerate the pipeline-stages list.",
  };
  if (KNOWN[name]) return KNOWN[name];
  if (KNOWN[bare]) return KNOWN[bare];

  // Fall back to a generic phrasing so the table is never empty.
  return `Runs \`${name}\`.`;
}

function renderFrontmatter(): string {
  return [
    "---",
    `title: CLI Scripts`,
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

function renderBody(pkg: PackageJson): string {
  const scripts = pkg.scripts ?? {};
  const names = Object.keys(scripts).sort((a, b) => a.localeCompare(b));

  const lines: string[] = [];
  lines.push("# CLI Scripts");
  lines.push("");
  lines.push(
    `Every script exposed by the root \`package.json\`. Regenerate with \`pnpm codegen:scripts\`.`,
  );
  lines.push("");
  lines.push("| Name | Command | Description |");
  lines.push("|---|---|---|");
  for (const name of names) {
    const cmd = scripts[name] ?? "";
    lines.push(`| \`${name}\` | \`${cmd}\` | ${describe(name)} |`);
  }
  lines.push("");
  return lines.join("\n");
}

function build(pkg: PackageJson): string {
  return `${MARKER}\n${renderFrontmatter()}\n${renderBody(pkg)}`;
}

async function main(): Promise<void> {
  const absSource = resolve(REPO_ROOT, SOURCE_PATH);
  const absTarget = resolve(REPO_ROOT, TARGET_PATH);
  const raw = await readFile(absSource, "utf8");
  const pkg = JSON.parse(raw) as PackageJson;
  const out = build(pkg);

  if (CHECK) {
    let existing = "";
    try {
      existing = await readFile(absTarget, "utf8");
    } catch {
      // missing target counts as drift
      process.stderr.write(`drift: target ${relative(REPO_ROOT, absTarget)} is missing\n`);
      process.exit(1);
    }
    if (existing !== out) {
      process.stderr.write(
        `drift: ${relative(REPO_ROOT, absTarget)} would change. Run \`pnpm codegen:scripts\`.\n`,
      );
      process.exit(1);
    }
    process.stdout.write("ok: package-scripts is fresh\n");
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
  process.stderr.write(`package-scripts codegen failed: ${String(err)}\n`);
  process.exit(1);
});
