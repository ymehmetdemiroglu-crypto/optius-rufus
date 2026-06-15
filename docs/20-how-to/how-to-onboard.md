---
title: How to onboard onto Optimus Rufus
owner: "@yhia"
status: canonical
last_verified: 2026-06-10
diataxis_mode: how-to
audience: engineering
estimated_time: 10m
---

# How to onboard onto Optimus Rufus

The five-minute recipe for going from a clean machine to `localhost` running Optimus Rufus. If a step is unclear, the explanation is in [domain map](../10-explanation/domain-map.md) and [container model](../10-explanation/container-model.md).

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | 20+ | Vite, tRPC, Hono, Drizzle all target Node 20 |
| pnpm | latest | The package manager used in this repo |
| Git | any | Clone the repo |
| Docker (or local Postgres + Qdrant) | Docker 24+ | Hosts the two data stores. Optional if you have native Postgres/Qdrant. |

Verify before you start:

```bash
node --version    # v20.x or higher
pnpm --version    # 9.x or higher
docker --version  # optional
```

## Steps

### 1. Clone and install

```bash
git clone <repo-url> optimus-rufus-webapp
cd optimus-rufus-webapp
pnpm install
```

### 2. Create the env file

```bash
cp .env.example .env
```

Open `.env` and set **`OPENAI_API_KEY`** to a real key. Everything else can stay as a placeholder for the first run — the dev server will boot without a valid Paddle, Kimi, or Sentry config; it just won't be able to call those integrations.

The full env-var list is documented in [env vars reference](../30-reference/env/variables.md) and the source of truth is [.env.example:1](../../.env.example).

### 3. Start the data stores

Postgres on `:5432` and Qdrant on `:6333` are required for the server to boot cleanly.

> **Note:** as of 2026-06-10 there is no `docker-compose.yml` checked into the repo. Ask the team for the compose file, or run a local Postgres + Qdrant any way you prefer. The default `DATABASE_URL` and `QDRANT_URL` in `.env.example` point at the canonical local ports:
>
> ```ini
> DATABASE_URL=postgres://root:password@localhost:5432/amazon_optimizer
> QDRANT_URL=http://localhost:6333
> ```

If you have the compose file:

```bash
docker compose up -d
```

### 4. Apply the database schema

There is no `db:migrate` script in `package.json` — schema is applied directly with Drizzle Kit:

```bash
pnpm exec drizzle-kit push
```

This reads [drizzle.config.ts:1](../../drizzle.config.ts) and pushes the schema from [api/db/schema.ts:1](../../api/db/schema.ts) to the `DATABASE_URL` target.

### 5. Run the dev servers

In one terminal, the Vite client:

```bash
pnpm dev:client
```

In a second terminal, the Hono server (which also starts the worker):

```bash
pnpm dev:server
```

The Vite dev server proxies `/api/*` to the Hono server on `:3000` [`ref: vite.config.ts`](../../vite.config.ts), so the SPA talks to the API without CORS configuration.

### 6. Open the app

The Vite dev server listens on the default port **`http://localhost:5173`**. Open it in a browser. The React 19 SPA loads, the dashboard mounts, and you should see the empty-state UI.

### 7. Verify

Hit a public tRPC procedure to confirm the API is wired:

```bash
curl 'http://localhost:3000/api/trpc/scraper.health?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%2C%22meta%22%3A%7B%22values%22%3A%5B%22undefined%22%5D%7D%7D%7D'
```

You should get a JSON `200` with a `result.data` object. The exact tRPC keys you can hit are listed in [tRPC procedures](../30-reference/api/procedures.md) (codegen'd from [api/trpc/router.ts:13](../../api/trpc/router.ts)).

If the SPA loads and the curl returns `200`, onboarding is complete. Total wall time on a clean machine: 5–10 minutes.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Error: connect ECONNREFUSED 127.0.0.1:5432` on boot | Postgres is not running or `DATABASE_URL` is wrong | Start Postgres / Docker, or fix the URL in `.env` to match your local setup [`ref: .env.example:2](../../.env.example) |
| `Error: fetch failed` to `http://localhost:6333` | Qdrant is not running | Start Qdrant (`docker compose up -d` or your local install). The Qdrant port is `6333` per `.env.example` [`ref: .env.example:5](../../.env.example) |
| `Port 3000 is already in use` when starting `dev:server` | Another process is on the Hono port | Stop the conflicting process, or set `PORT=3001` in `.env` and update the Vite proxy in `vite.config.ts` to match [`ref: api/boot.ts:26](../../api/boot.ts) |
| `Port 5173 is already in use` when starting `dev:client` | Another Vite app is on the default port | Stop the conflict, or pass `--port 5174` to `pnpm dev:client` |
| `OpenAI API key not configured` warnings in the server log | `OPENAI_API_KEY` is the placeholder | Set a real key in `.env`. The server boots without one; the analysis/optimization stages fail when invoked. |
| `pnpm exec drizzle-kit push` complains about missing `DATABASE_URL` | `.env` not loaded by the shell session | Run with a one-shot env load: `DATABASE_URL=... pnpm exec drizzle-kit push`, or `dotenv -e .env -- pnpm exec drizzle-kit push` |
| CORS error in the browser console | The Vite proxy is not running, or you're hitting the wrong port | Confirm Vite is on `:5173` and the proxy target is `http://localhost:3000` [`ref: vite.config.ts:9](../../vite.config.ts) |

## What to read next

| You want to… | Read |
|---|---|
| Understand the system shape | [Domain map](../10-explanation/domain-map.md) — C4 Level 1 |
| See what runs where | [Container model](../10-explanation/container-model.md) — C4 Level 2 |
| Know what each env var does | [Env vars reference](../30-reference/env/variables.md) |
| Look up a tRPC procedure | [tRPC procedures](../30-reference/api/procedures.md) |
| See the database schema | [DB schema](../30-reference/database/schema.md) |
| Understand the pipeline | [Pipeline stages](../30-reference/pipeline-stages.md) |
| Add a new domain | [How to add a domain](how-to-add-a-domain.md) |
| Add a new pipeline stage | [How to add a pipeline stage](how-to-add-a-pipeline-stage.md) |
