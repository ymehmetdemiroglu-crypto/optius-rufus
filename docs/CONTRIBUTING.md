---
title: Contributing to Optimus Rufus Documentation
owner: "@yhia"
status: canonical
last_verified: 2026-06-10
diataxis_mode: how-to
audience: engineering
---

# Contributing to Optimus Rufus Documentation

How to add, move, or retire a doc without breaking the system. Five minutes to read, fifteen minutes per doc to apply.

## When to write a doc

Write a doc when **one of these is true**:

- You made a decision that future-you will question in 3 months → [ADR](00-meta/adr/)
- You wrote a script the team will run more than once → recipe in [20-how-to/](20-how-to/)
- You added a tRPC procedure, table, or env var → update [30-reference/](30-reference/) (often codegen)
- You are about to do this again → recipe
- You are about to explain it in Slack → doc

Do **not** write a doc to summarize a PR. PR descriptions stay in PRs.

## Pick the mode first

The folder you write into is determined by **what the reader is trying to do**, not by topic.

| Folder | Reader's intent | Failure mode if you pick wrong |
|---|---|---|
| `10-explanation/` | "Teach me" / "I want to understand" | Becomes a how-to; reader can't act |
| `20-how-to/` | "I need to do X" | Becomes a tutorial; reader is blocked by step 1 |
| `30-reference/` | "What's the exact value of Y" | Becomes prose; reader can't scan |
| `40-architecture/` | "How does the system fit together" | Becomes a list; reader can't navigate |
| `50-runbooks/` | "It's 3am, fix it" | Becomes a postmortem; reader is on-call |

If your doc doesn't fit any of these, **don't write it yet** — that is usually a sign the decision isn't ready.

## File naming

- Use `kebab-case.md` — never `snake_case`, never `PascalCase`.
- Use full words — `how-to-onboard.md`, not `how-to-onb.md`.
- For runbooks, name after the symptom, not the system: `pipeline-stuck.md`, not `pipeline-debugging.md`.
- For reference, name after the artifact: `procedures.md`, `schema.md`, `variables.md`.

## Required frontmatter

Every `.md` file in this site **must** have a YAML frontmatter block. See [frontmatter-spec.md](00-meta/frontmatter-spec.md) for the full contract. The minimum:

```yaml
---
title: How to add a domain
owner: "@yhia"
status: draft
last_verified: 2026-06-10
diataxis_mode: how-to
audience: engineering
---
```

CI fails the build if any required field is missing.

## One H1, stable anchors

- Exactly one `#` heading per file. It is the title and must match the frontmatter `title` (modulo capitalization).
- No skipped levels: `#` → `##` → `###`. No `#` → `###`.
- Headings become anchors. Prefer nouns and short phrases: `## Pipeline stages`, not `## A list of all the pipeline stages that we have`.

## Linking

- **Internal link** — relative path, no extension trickery: `[domain map](10-explanation/domain-map.md)`.
- **Section link** — anchor in the same file: `[verify](#verify)`.
- **Code reference** — backticks + relative path + line: `[ref: api/boot.ts:60](../api/boot.ts)`.
- **External** — full URL, no shortenings: `[tRPC docs](https://trpc.io/docs)`.

Do **not** use `[[wikilink]]` syntax. It requires a VS Code extension to render; this site must work in a stock IDE and on GitHub.

## Diagrams

- Use **Mermaid**, not PNG. Mermaid is plain text and diffs.
- One diagram per concept; do not stack three flowcharts in one block.
- Diagrams live in the file that explains them. Do not link to a shared `diagrams.md`.
- If a diagram must be regenerated from data, put the data in a `*.mmd` file under `30-reference/` and reference it from prose.

## Code blocks

- Always declare the language: ` ```ts `, ` ```bash `, ` ```json `, ` ```mermaid `.
- Show **why** in a one-line comment above the block, not inside it.
- For commands, show the full command, not aliases. The reader copy-pastes.

## Tables over prose

When you have three or more comparable items, use a table. Prose burns screen real estate and IDE outline space.

| Wrong | Right |
|---|---|
| "There are three env vars for OpenAI. The first is the API key, which is required. The second…" | Table of 3 rows. |

## When the doc is wrong

1. Edit the file directly. Do not open a meta-doc to "discuss updating the doc".
2. Update `last_verified` in the frontmatter to today's date.
3. If the change invalidates another doc, update that one in the same commit. Cross-link them in the commit message.
4. If the change invalidates an ADR, **do not edit the ADR**. Write a new ADR that supersedes it and add `supersedes: 0001-...` in the new file's frontmatter.

## Retire, don't delete

When a doc is obsolete:

1. Move it to `90-archive/YYYY-MM-…/`.
2. Set `status: retired` in the frontmatter.
3. Add a single line at the top: `> Retired on YYYY-MM-DD. Superseded by [new path].`
4. Do not delete unless it contains a security issue.

## Local checks before committing

Run before opening a PR:

```bash
pnpm docs:lint        # markdownlint + link-check
pnpm docs:frontmatter # frontmatter validator
pnpm docs:codegen     # regenerate all reference files
pnpm docs:stale       # flag anything > 180 days
```

If any fails, the PR will not merge — fix locally first.

## Related

- [00-meta/documentation-policy.md](00-meta/documentation-policy.md)
- [00-meta/frontmatter-spec.md](00-meta/frontmatter-spec.md)
- [00-meta/lint-rules.md](00-meta/lint-rules.md)
- [00-meta/codegen-pipeline.md](00-meta/codegen-pipeline.md)
