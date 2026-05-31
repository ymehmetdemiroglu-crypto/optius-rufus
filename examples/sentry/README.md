# Sentry Integration Examples

This directory contains reference implementations for integrating Sentry error tracking and performance monitoring into the Amazon Listing Optimizer SaaS.

## Files

### Frontend

| File | Purpose |
|------|---------|
| `frontend/main.tsx` | Sentry React SDK initialization |
| `frontend/ErrorBoundary.tsx` | React error boundary with Sentry fallback |
| `frontend/vite.config.ts` | Vite config with Sentry source map upload plugin |

### Backend

| File | Purpose |
|------|---------|
| `backend/boot.ts` | Sentry Node.js SDK initialization |
| `backend/index.ts` | Hono error handler setup |
| `backend/trpc.ts` | tRPC error interceptor with Sentry capture |
| `backend/middleware.ts` | Auth middleware setting Sentry user context |

## Usage

Copy these files into the appropriate locations in the project after scaffolding:

- `frontend/main.tsx` → `src/main.tsx`
- `frontend/ErrorBoundary.tsx` → `src/components/ErrorBoundary.tsx`
- `frontend/vite.config.ts` → `vite.config.ts`
- `backend/boot.ts` → `api/boot.ts`
- `backend/index.ts` → `api/index.ts`
- `backend/trpc.ts` → `api/trpc.ts`
- `backend/middleware.ts` → `api/middleware.ts`

## Documentation

Full setup instructions are in:
- [Development Setup Guide](../../docs/05-development/setup.md) — Environment variables and project creation
- [Deployment & DevOps Guide](../../docs/06-operations/deployment-devops.md) — Production configuration
- [Technical Architecture](../../docs/04-architecture/technical-architecture.md) — Integration architecture and data flow
