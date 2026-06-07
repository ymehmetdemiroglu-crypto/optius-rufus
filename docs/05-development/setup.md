# Development Setup Guide
# Amazon Listing Optimizer SaaS

**Version:** 1.0  
**Estimated Setup Time:** 30-45 minutes  
**Prerequisites:** Node.js 20+, Docker, Git  

---

## 1. Prerequisites Installation

### 1.1 Required Software

| Software | Version | Installation |
|----------|---------|-------------|
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) or `nvm` |
| npm | 10.x | Bundled with Node.js |
| Docker | 25.x | [docker.com](https://docker.com) |
| Docker Compose | 2.24+ | Bundled with Docker Desktop |
| Git | 2.40+ | [git-scm.com](https://git-scm.com) |

### 1.2 Verify Installations

```bash
node --version    # Should print v20.x.x
npm --version     # Should print 10.x.x
docker --version  # Should print Docker version 25.x
git --version     # Should print git version 2.x
```

---

## 2. Project Initialization

### 2.1 Clone Repository

```bash
git clone https://github.com/yourusername/amazon-listing-optimizer.git
cd amazon-listing-optimizer
```

### 2.2 Initialize Webapp (Frontend)

```bash
# Using webapp-building skill
bash /app/.agents/skills/webapp-building/scripts/init-webapp.sh "Amazon Listing Optimizer"
```

This creates:
- React 19 + TypeScript + Vite project
- Tailwind CSS + shadcn/ui components (40+)
- Path aliases configured
- Production build optimization

### 2.3 Initialize Backend

```bash
# Using backend-building skill (grafts onto existing webapp)
bash /app/.agents/skills/backend-building/scripts/init.sh "Amazon Listing Optimizer" --features auth
```

This adds:
- Hono + tRPC 11 backend
- Drizzle ORM + PostgreSQL connection
- Kimi OAuth 2.0 authentication
- Database schema folder
- TRPCProvider auto-wired

### 2.4 Verify Auto-Wiring

```bash
cd /mnt/agents/output/app

# Check TypeScript compilation
npm run check

# Should pass with zero errors
```

If `npm run check` fails:
1. Check `src/main.tsx` for `TRPCProvider` import
2. Check `src/App.tsx` for Login/NotFound routes
3. See [Post-Init Wiring](docs/Post-Init-Wiring.md) for manual steps

---

## 3. Environment Configuration

### 3.1 Create .env File

```bash
cp .env.example .env
```

### 3.2 Required Environment Variables

```env
# Database
DATABASE_URL=postgres://postgres:password@localhost:5432/amazon_optimizer

# Vector Database
QDRANT_URL=http://localhost:6333

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-your-openai-api-key

# Paddle (payments)
PADDLE_API_KEY=your-paddle-api-key
PADDLE_WEBHOOK_SECRET=your-paddle-webhook-secret
PADDLE_ENVIRONMENT=sandbox  # Change to 'production' for live

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Kimi OAuth (auto-populated by init.sh)
VITE_KIMI_AUTH_URL=https://auth.yourdomain.com
VITE_APP_ID=your-kimi-app-id
VITE_KIMI_AUTH_CLIENT_ID=your-kimi-client-id
KIMI_AUTH_CLIENT_SECRET=your-kimi-client-secret

# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=sntrys_your_auth_token
VITE_SENTRY_DSN=${SENTRY_DSN}
VITE_APP_VERSION=1.0.0
APP_VERSION=1.0.0
```

### 3.3 Get API Keys

**OpenAI API Key:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account → API Keys → Create new secret key
3. Set usage limits to prevent unexpected charges

**Paddle (Sandbox):**
1. Go to [sandbox-vendors.paddle.com](https://sandbox-vendors.paddle.com)
2. Sign up → Developer Tools → Authentication
3. Copy API key and webhook secret

### 3.3 Sentry Setup

**Create Sentry Project:**
1. Go to [sentry.io](https://sentry.io) and sign up / log in
2. Create a new organization (if needed)
3. Create two projects:
   - `amazon-optimizer-frontend` (React)
   - `amazon-optimizer-backend` (Node.js)
4. Copy the DSN from each project settings page

**Get Sentry Auth Token (for source maps):**
1. Go to Settings → Account → API → Auth Tokens
2. Create new token with `org:read` and `project:releases` scopes
3. Copy the token and add it to `.env` as `SENTRY_AUTH_TOKEN`

> **Note:** `SENTRY_AUTH_TOKEN` is only needed during builds to upload source maps. It does not need to be present in production.

---

## 4. Database Setup

### 4.1 Start PostgreSQL and Qdrant (Docker)

```bash
# From project root
docker-compose up -d postgres qdrant

# Verify services are running
docker-compose ps
```

### 4.2 Push Database Schema

```bash
npm run db:push
```

This creates all tables defined in `db/schema.ts`.

### 4.3 Seed Intent Vectors (Optional)

```bash
npx tsx db/seed.ts
```

This populates the `intent_vectors` table with pre-computed embeddings for health/supplements and beauty categories.

### 4.4 Verify Database

```bash
# Connect to PostgreSQL
docker exec -it amazon-optimizer-postgres psql -U postgres -d amazon_optimizer

# List tables
\dt

# Check users table
SELECT * FROM users;
```

---

## 5. Development Server

### 5.1 Start Development Server

```bash
npm run dev
```

This starts:
- Hono backend server on port 3000
- Vite dev server with HMR
- tRPC client auto-wired

### 5.2 Access Application

- **Web App:** http://localhost:3000
- **API:** http://localhost:3000/trpc
- **Qdrant Dashboard:** http://localhost:6333/dashboard

### 5.3 Hot Module Replacement (HMR)

Changes to:
- `src/` → Frontend auto-reloads
- `api/` → Backend auto-reloads
- `db/schema.ts` → Run `npm run db:push` manually

---

## 6. Development Workflow

### 6.1 Adding a New Feature

**Example: Adding a new tRPC router**

```typescript
// 1. Create router file
// api/routers/analytics.ts
import { router, publicProcedure } from '../trpc';
import { z } from 'zod';

export const analyticsRouter = router({
  getStats: publicProcedure
    .input(z.object({ period: z.enum(['7d', '30d', '90d']) }))
    .query(async ({ input }) => {
      // Implementation
      return { totalAnalyses: 100, avgScore: 72 };
    }),
});

// 2. Register in main router
// api/router.ts
import { analyticsRouter } from './routers/analytics';

export const appRouter = router({
  // ... existing routers
  analytics: analyticsRouter,
});

// 3. Use in frontend
// src/pages/Dashboard.tsx
const stats = trpc.analytics.getStats.useQuery({ period: '30d' });
```

### 6.2 Adding a Database Table

```typescript
// 1. Define schema in db/schema.ts
export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .references(() => users.id),
  metric: varchar("metric", { length: 100 }),
  value: decimal("value", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Push schema to database
npm run db:push

// 3. Use in queries
const results = await db.select().from(analytics);
```

### 6.3 Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run check` | Type-check TypeScript |
| `npm run format` | Format code with Prettier |
| `npm run test` | Run tests with Vitest |
| `npm run db:push` | Sync schema to database |
| `npm run db:generate` | Generate migration SQL |
| `npm run db:migrate` | Apply migrations |
| `npm start` | Start production server |

---

## 7. Testing

### 7.1 Unit Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test -- --watch
```

### 7.2 Manual Testing Checklist

| Feature | Test Steps | Expected Result |
|---------|-----------|----------------|
| **Login** | Click "Sign In" → Kimi OAuth → Return | Authenticated, see dashboard |
| **Connect Amazon** | Dashboard → "Connect Amazon" → Authorize | Account appears in settings |
| **Fetch Listing** | Enter ASIN → Click "Analyze" | Listing data displayed |
| **Run Analysis** | Click "Optimize" | Score and recommendations shown |
| **View Report** | Click on report card | Full optimization report |
| **Upgrade Plan** | Settings → "Upgrade" → Select plan | Paddle checkout opens |
| **Webhook** | Complete Paddle payment | Plan updated in app |

---

## 8. Troubleshooting

### 8.1 Common Issues

**Issue:** `Port 3000 already in use`
```bash
lsof -ti:3000 | xargs kill -9
```

**Issue:** `Database connection refused`
```bash
# Check PostgreSQL container
docker-compose ps
# If not running:
docker-compose up -d postgres
```

**Issue:** `Type errors after adding router`
```bash
# Ensure router is registered in api/router.ts
# Run type check
npm run check
```

**Issue:** `OAuth callback fails`
```bash
# Check VITE_KIMI_AUTH_URL matches callback URL
# Verify APP_ID in .env
```


### 8.2 Reset Development Environment

```bash
# Stop all containers
docker-compose down -v

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Restart
docker-compose up -d
npm run db:push
npm run dev
```

---

## 9. IDE Setup

### 9.1 VS Code Extensions (Recommended)

| Extension | Purpose |
|-----------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Tailwind CSS IntelliSense | Autocomplete Tailwind classes |
| Thunder Client / REST Client | API testing |
| GitLens | Git history |
| Docker | Container management |

### 9.2 VS Code Settings

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

---

## 10. Git Workflow

### 10.1 Branching Strategy

```
main          → Production-ready code
├── develop   → Integration branch
├── feature/* → New features
├── bugfix/*  → Bug fixes
└── hotfix/*  → Production fixes
```

### 10.2 Commit Convention

```
feat: add competitor analysis feature
fix: resolve scraper API token refresh issue
docs: update API documentation
refactor: optimize embedding pipeline
test: add unit tests for analysis service
chore: update dependencies
```

### 10.3 Pre-Commit Checklist

```bash
# Before every commit:
npm run check      # TypeScript compilation
npm run test       # Run tests
npm run format     # Format code
```
