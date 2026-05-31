# Technical Architecture Document (TAD)
# Amazon Listing Optimizer SaaS

**Version:** 1.0  
**Date:** 2026-05-25  
**Status:** Approved for MVP  

---

## 1. Architecture Overview

### 1.1 Architectural Style

Platform, **monolithic service-oriented architecture** ile tasarlanmıştır. MVP aşamasında microservices'in operasyonel yükü gereksizdir; tek bir deployable unit olarak, Docker Compose ile yönetilen servisler halinde organize edilmiştir. Gelecekte (1000+ kullanıcı) servisler ayrılabilir.

**Mimari prensipler:**
- **Separation of Concerns:** Her katman tek bir sorumluluğa sahip
- **Type Safety:** Frontend-backend arasında end-to-end type safety (tRPC + Drizzle)
- **API-First:** OpenAPI specification-driven geliştirme
- **Stateless:** API servisleri stateless, state veritabanında
- **12-Factor App:** Environment-based config, disposable processes, dev/prod parity

### 1.2 System Architecture Diagram

![System Architecture](../../assets/images/system-architecture.png)

### 1.3 Technology Stack Detail

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Runtime** | Node.js | 20.x LTS | JavaScript runtime |
| **Frontend Framework** | React | 19.x | UI library |
| **Build Tool** | Vite | 6.x | Module bundler, dev server |
| **Language** | TypeScript | 5.7+ | Type-safe development |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first CSS |
| **UI Components** | shadcn/ui | latest | Pre-built accessible components |
| **Router** | react-router | 7.x | Client-side routing |
| **Backend Framework** | Hono | 4.x | Lightweight web framework |
| **API Protocol** | tRPC | 11.x | End-to-end typesafe APIs |
| **ORM** | Drizzle ORM | 0.30+ | Type-safe SQL query builder |
| **Database** | MySQL | 8.0 | Relational data storage |
| **Vector DB** | Qdrant | 1.x | Vector similarity search |
| **Auth** | Kimi OAuth 2.0 | — | Authentication & authorization |
| **Validation** | Zod | 3.23+ | Schema validation |
| **Process Manager** | PM2 | 5.x | Production process management |
| **Reverse Proxy** | Nginx | 1.25+ | SSL termination, static serving |
| **Container** | Docker | 25.x | Application containerization |
| **Orchestration** | Docker Compose | 2.24+ | Multi-container management |
| **AI Service** | OpenAI API | v1 | Text embedding generation |
| **Payments** | Paddle | v2 | Subscription management |
| **Monitoring** | Sentry | 8.x | Error tracking |
| **Metrics** | Grafana + Prometheus | 10.x / 2.x | Performance monitoring |

---

## 2. Layer Architecture

### 2.1 Presentation Layer (Frontend)

**Responsibilities:**
- User interface rendering
- Client-side state management
- tRPC client communication
- Form handling and validation
- Responsive design implementation

**Directory Structure:**
```
src/
├── pages/           # Route-level page components
│   ├── Dashboard.tsx
│   ├── Analyzer.tsx
│   ├── Report.tsx
│   ├── Competitors.tsx
│   ├── QAOptimizer.tsx
│   ├── Settings.tsx
│   └── Login.tsx
├── sections/        # Page sections (Hero, Features, etc.)
├── components/      # Reusable UI components
├── hooks/           # Custom React hooks
├── providers/       # Context providers (tRPC, Auth, Theme)
├── lib/             # Utility functions
└── types/           # Shared TypeScript types
```

**State Management:**
- **Local state:** React useState/useReducer
- **Server state:** tRPC + React Query ( caching, invalidation)
- **Global state:** React Context (auth, theme)
- **Form state:** React Hook Form + Zod resolver

### 2.2 API Layer (Backend)

**Responsibilities:**
- HTTP request handling
- tRPC router dispatching
- Authentication middleware
- Rate limiting
- Request/response logging

**Directory Structure:**
```
api/
├── router.ts           # Main tRPC router composition
├── middleware.ts       # Auth, rate limiting, logging
├── lib/               # Framework internals (static serving)
├── kimi/              # Kimi SDK auth modules
├── routers/           # tRPC routers
│   ├── auth.ts
│   ├── listing.ts
│   ├── optimization.ts
│   ├── competitor.ts
│   ├── qa.ts
│   ├── user.ts
│   ├── payment.ts
│   └── spapi.ts
└── queries/           # Database query functions
    └── connection.ts  # Drizzle DB connection
```

**tRPC Router Structure:**
```typescript
// api/router.ts
import { router } from './trpc';
import { authRouter } from './routers/auth';
import { listingRouter } from './routers/listing';
import { optimizationRouter } from './routers/optimization';
import { competitorRouter } from './routers/competitor';
import { qaRouter } from './routers/qa';
import { userRouter } from './routers/user';
import { paymentRouter } from './routers/payment';
import { spapiRouter } from './routers/spapi';

export const appRouter = router({
  auth: authRouter,
  listing: listingRouter,
  optimization: optimizationRouter,
  competitor: competitorRouter,
  qa: qaRouter,
  user: userRouter,
  payment: paymentRouter,
  spapi: spapiRouter,
});

export type AppRouter = typeof appRouter;
```

### 2.3 Service Layer

**Responsibilities:**
- Business logic execution
- External API communication (SP-API, OpenAI, Paddle)
- Data transformation
- Caching strategies

**Service Modules:**

| Service | File | Responsibilities |
|---------|------|-----------------|
| **Auth Service** | `api/services/auth.ts` | OAuth flow, JWT management, session validation |
| **SP-API Service** | `api/services/spapi.ts` | Amazon SP-API calls, token refresh, error handling |
| **Embedding Service** | `api/services/embedding.ts` | OpenAI API calls, vector storage/retrieval |
| **Analysis Service** | `api/services/analysis.ts` | Semantic gap analysis, scoring algorithms |
| **Optimization Service** | `api/services/optimization.ts` | Title/bullet/Q&A generation, report creation |
| **Payment Service** | `api/services/payment.ts` | Paddle API, webhook handling, subscription sync |
| **Competitor Service** | `api/services/competitor.ts` | Competitor data fetch, benchmark comparison |

### 2.4 Data Layer

**Responsibilities:**
- Database operations
- Vector storage/retrieval
- Data integrity
- Migration management

**Database:** MySQL 8.0 via Drizzle ORM
**Vector Database:** Qdrant (self-hosted Docker container)

---

## 3. Data Flow Architecture

### 3.1 ASIN Analysis Flow

```
User Input (ASIN + Marketplace)
    |
    v
[Frontend] --tRPC--> [Backend API]
    |
    v
[Auth Middleware] --valid token?--> [SP-API Service]
    |                                        |
    v                                        v
[Rate Limit Check]              [SP-API: catalogItems]
    |                                        |
    v                                        v
[Listing Service] <-------------- [Raw Listing Data]
    |
    v
[Preprocessing: text cleaning, normalization]
    |
    v
[Embedding Service] --API--> [OpenAI: text-embedding-3-small]
    |                                        |
    v                                        v
[Vector Storage] <---------------- [1536-dim vector]
    | (Qdrant)
    v
[Analysis Service]
    - Fetch intent vectors from Qdrant
    - Compute cosine similarity
    - Calculate semantic gaps
    - Generate Rufus Compatibility Score
    |
    v
[Optimization Service]
    - Generate optimized title
    - Generate 5-bullet framework
    - Generate Q&A suggestions
    |
    v
[Report Assembly]
    |
    v
[Database: Save report]
    |
    v
[Frontend: Display results]
```

### 3.2 Authentication Flow

```
User clicks "Sign In"
    |
    v
[Frontend] redirects to Kimi OAuth URL
    |
    v
[Kimi Auth Server] --user authenticates--
    |
    v
[Callback: /api/oauth/callback]
    - Exchange code for tokens
    - Create/update user in DB
    - Generate JWT session
    - Set HTTP-only cookie
    |
    v
[Frontend: Authenticated state]
```

### 3.3 Payment Flow

```
User selects plan
    |
    v
[Frontend] --tRPC--> [Payment Router]
    |
    v
[Payment Service] --API--> [Paddle: create checkout]
    |
    v
[Frontend: Redirect to Paddle checkout]
    |
    v
[User completes payment on Paddle]
    |
    v
[Paddle Webhook] --> [Webhook Handler]
    - Verify signature
    - Update subscription in DB
    - Activate plan features
    |
    v
[Frontend: Plan activated]
```

---

## 4. External Integrations

### 4.1 Amazon Selling Partner API (SP-API)

**Authentication:** OAuth 2.0 (Seller Central authorization)
**Primary Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `catalog/2022-04-01/items/{asin}` | GET | Product catalog data |
| `listings/2021-08-01/items/{sellerId}/{sku}` | GET/PUT | Listing read/write |
| `productPricing/competitiveSummary` | POST | Competitive pricing |
| `reports/2021-06-30/reports` | POST/GET | Report generation |
| `notifications/v1/subscriptions` | POST | Event notifications |

**Rate Limits:** 1 request per 2 seconds (throttled)
**Error Handling:** Exponential backoff retry

### 4.2 OpenAI API

**Endpoint:** `https://api.openai.com/v1/embeddings`
**Model:** text-embedding-3-small
**Dimension:** 1536
**Cost:** $0.02 / 1M tokens
**Batch Size:** Max 100 texts per request

### 4.3 Paddle Payments

**Endpoints:**
- Checkout creation
- Subscription management
- Webhook handling (subscription.created, subscription.updated, etc.)

**Webhook Security:** Signature verification with public key

---

## 5. Security Architecture

### 5.1 Authentication

- **Protocol:** OAuth 2.0 (Kimi)
- **Session:** JWT tokens, HTTP-only cookies
- **Token Expiry:** Access: 24 hours, Refresh: 30 days
- **Logout:** Cookie deletion + token blacklisting

### 5.2 Authorization

- **Role-based:** user, admin
- **Plan-based:** free, starter, pro, enterprise
- **Permission matrix:**

| Feature | Free | Starter | Pro | Enterprise |
|---------|------|---------|-----|-----------|
| ASIN Analyses/month | 3 | 20 | 100 | Unlimited |
| Competitor Benchmark | No | No | Yes | Yes |
| Q&A Optimization | No | Yes | Yes | Yes |
| PDF Export | No | No | Yes | Yes |
| API Access | No | No | No | Yes |
| A+ Content | No | No | Yes | Yes |

### 5.3 Data Protection

- **SP-API tokens:** AES-256 encrypted in database
- **HTTPS:** All traffic TLS 1.3
- **CORS:** Whitelist-only
- **Rate Limiting:** 100 req/ip/minute
- **Input Sanitization:** Zod validation on all endpoints
- **SQL Injection Prevention:** Drizzle ORM parameterized queries
- **XSS Prevention:** React built-in escaping + CSP headers

---

## 6. Scalability Considerations

### 6.1 Current (MVP) Capacity

- **VPS:** Hetzner CPX31 (8 vCPU, 32 GB RAM)
- **Concurrent Users:** 100+
- **ASIN Analyses/Day:** 1,000+
- **Database Size:** 10 GB initial

### 6.2 Scaling Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| CPU > 70% sustained | 5 minutes | Scale to CPX41 (16 vCPU) |
| Memory > 80% sustained | 5 minutes | Add swap / upgrade RAM |
| DB size > 80 GB | — | Implement partitioning |
| Users > 1,000 | — | Separate app and DB servers |
| API latency > 500ms (p95) | — | Add Redis caching layer |

### 6.3 Future Architecture (1000+ users)

- **App Server:** Separate Hetzner instance (load balanced)
- **Database:** Managed MySQL (Hetzner or AWS RDS)
- **Vector DB:** Qdrant Cloud or Pinecone
- **CDN:** CloudFront for static assets
- **Queue:** Redis/RabbitMQ for async jobs
- **Monitoring:** Datadog or similar

---

## 7. Development Environment

### 7.1 Local Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd amazon-listing-optimizer

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 4. Start database (Docker)
docker-compose up -d mysql qdrant

# 5. Push database schema
npm run db:push

# 6. Start development server
npm run dev
```

### 7.2 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | MySQL connection string |
| `QDRANT_URL` | Yes | Qdrant connection URL |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `PADDLE_API_KEY` | Yes | Paddle API key |
| `PADDLE_WEBHOOK_SECRET` | Yes | Paddle webhook secret |
| `AMAZON_CLIENT_ID` | Yes | SP-API client ID |
| `AMAZON_CLIENT_SECRET` | Yes | SP-API client secret |
| `JWT_SECRET` | Yes | JWT signing secret |
| `VITE_KIMI_AUTH_URL` | Yes | Kimi OAuth URL |
| `VITE_APP_ID` | Yes | Kimi App ID |
| `SENTRY_DSN` | No | Sentry error tracking DSN |
| `SENTRY_AUTH_TOKEN` | No | Sentry auth token for source map uploads |
| `VITE_SENTRY_DSN` | No | Frontend Sentry DSN (mirrors SENTRY_DSN) |
| `VITE_APP_VERSION` | No | Frontend release version |
| `APP_VERSION` | No | Backend release version |

---

## 8. Sentry Integration Architecture

### 8.1 Integration Points

```
[Frontend React App]
    |
    +-- @sentry/react init (main.tsx)
    +-- ErrorBoundary (src/components/ErrorBoundary.tsx)
    +-- Browser tracing + replay
    +-- User context from auth state
    |
    v
[Sentry Cloud] <--- Source maps (vite-plugin)
    ^
    |
[Backend Hono App]
    |
    +-- @sentry/node init (api/boot.ts)
    +-- setupHonoErrorHandler (api/index.ts)
    +-- tRPC onError capture (api/trpc.ts)
    +-- User context from auth middleware
    +-- Performance tracing + profiling
```

### 8.2 Data Flow

| Direction | Event | Captured By | Context |
|-----------|-------|-------------|---------|
| Frontend | Uncaught exception | @sentry/react | URL, browser, user |
| Frontend | Component crash | ErrorBoundary | Component stack, user |
| Frontend | Failed API call | tRPC client link | Procedure path, error |
| Frontend | Page load | browserTracingIntegration | Route, timing |
| Backend | Uncaught exception | setupHonoErrorHandler | Request, headers |
| Backend | tRPC error | onError handler | Procedure, input, user |
| Backend | Slow request | Performance tracing | Duration, DB queries |

### 8.3 Sampling Strategy

| Environment | Errors | Traces | Profiles | Replays |
|-------------|--------|--------|----------|---------|
| Development | 100% | 100% | 100% | 0% |
| Production | 100% | 10% | 10% | On error only |

### 8.4 Privacy & Security

- **Replay masking:** Inputs masked by default; no password fields captured
- **User context:** Only `id`, `email`, `username` sent — no PII in tags
- **Source maps:** Uploaded during build, deleted after upload; not served to clients
- **Auth token:** Build-time only, never exposed in frontend bundle

---

## 9. Deployment Architecture

### 9.1 Production Deployment

```
[Internet]
    |
    v
[Cloudflare DNS] --(optional)--
    |
    v
[Nginx Reverse Proxy] (SSL termination)
    |
    v
[Node.js App] (PM2 managed)
    |
    +---> [MySQL 8.0] (Docker)
    +---> [Qdrant] (Docker)
```

### 9.2 Deployment Process

```bash
# 1. Build application
npm run build

# 2. Run database migrations
npm run db:migrate

# 3. Restart PM2
pm2 restart ecosystem.config.js

# 4. Verify health check
curl https://api.yourdomain.com/health
```

### 9.3 Backup Strategy

- **Database:** Daily automated mysqldump (cron job)
- **Qdrant:** Weekly snapshot
- **Backups stored:** S3-compatible object storage (Hetzner or AWS S3)
- **Retention:** 30 days
