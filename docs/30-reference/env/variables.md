<!-- codegen:source=.env.example -->
<!-- DO NOT EDIT — regenerate via `pnpm codegen:env` -->
---
title: Environment Variables
owner: "@yhia"
status: canonical
last_verified: 2026-06-10
diataxis_mode: reference
audience: engineering
generated: true
codegen_source: .env.example
---

# Environment Variables

Every variable declared in `.env.example`. Regenerate with `pnpm codegen:env`.

## Database (PostgreSQL)

| Name | Default | Required | Description |
|---|---|---|---|
| `DATABASE_URL` | `postgres://root:password@localhost:5432/amazon_optimizer` | no | — |
| `QDRANT_URL` | `http://localhost:6333` | no | SQLite Database Path (Optional, for persisting data outside the project directory on a VPS) |

## OpenAI (for embeddings)

| Name | Default | Required | Description |
|---|---|---|---|
| `OPENAI_API_KEY` | `sk-your-openai-api-key` | no | — |

## Paddle (payments)

| Name | Default | Required | Description |
|---|---|---|---|
| `PADDLE_API_KEY` | `your-paddle-api-key` | no | — |
| `PADDLE_WEBHOOK_SECRET` | `your-paddle-webhook-secret` | no | — |
| `PADDLE_ENVIRONMENT` | `sandbox` | no | — |

## JWT

| Name | Default | Required | Description |
|---|---|---|---|
| `JWT_SECRET` | `your-super-secret-jwt-key-min-32-chars` | no | — |

## Kimi OAuth

| Name | Default | Required | Description |
|---|---|---|---|
| `VITE_KIMI_AUTH_URL` | `https://auth.yourdomain.com` | no | — |
| `VITE_APP_ID` | `your-kimi-app-id` | no | — |
| `VITE_KIMI_AUTH_CLIENT_ID` | `your-kimi-client-id` | no | — |
| `KIMI_AUTH_CLIENT_SECRET` | `your-kimi-client-secret` | no | — |

## Application

| Name | Default | Required | Description |
|---|---|---|---|
| `NODE_ENV` | `development` | no | — |
| `PORT` | `3000` | no | — |
| `APP_URL` | `http://localhost:3000` | no | — |
| `APP_VERSION` | `1.0.0` | no | — |

## Sentry Monitoring

| Name | Default | Required | Description |
|---|---|---|---|
| `SENTRY_DSN` | `https://xxx@yyy.ingest.sentry.io/zzz` | no | — |
| `SENTRY_AUTH_TOKEN` | `sntrys_your_auth_token` | no | — |
| `VITE_SENTRY_DSN` | `${SENTRY_DSN}` | no | — |
| `VITE_APP_VERSION` | `${APP_VERSION}` | no | — |
