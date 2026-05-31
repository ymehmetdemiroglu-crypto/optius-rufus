# API Specification Document
# Amazon Listing Optimizer SaaS

**Version:** 1.0  
**Protocol:** tRPC 11 (HTTP/JSON over RPC)  
**Base URL:** `https://api.yourdomain.com/trpc`  
**Authentication:** JWT Bearer Token (HTTP-only cookie)  

---

## 1. API Overview

This API uses **tRPC 11** with **Hono** as the HTTP adapter. All endpoints are type-safe and auto-generated from the router definitions. The frontend consumes these endpoints via the tRPC client with React Query integration.

**Base Router Structure:**
```
appRouter
├── auth
├── listing
├── optimization
├── competitor
├── qa
├── user
├── payment
└── spapi
```

---

## 2. Authentication Router (`auth.`)

### 2.1 Get Current User
```typescript
auth.me
```
**Type:** Query  
**Input:** None  
**Output:**
```typescript
{
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  subscriptionTier: "free" | "starter" | "pro" | "enterprise";
  createdAt: Date;
}
```
**Errors:**
- `401 UNAUTHORIZED` — Invalid or expired session

### 2.2 Login Redirect
```typescript
auth.getOAuthUrl
```
**Type:** Query  
**Input:** `{ redirectUrl: string }`  
**Output:** `{ url: string }` — Kimi OAuth authorization URL  

### 2.3 OAuth Callback
```typescript
auth.callback
```
**Type:** Query (GET endpoint)  
**Input:** `{ code: string, state: string }` (query params)  
**Output:** Sets HTTP-only JWT cookie, redirects to app  
**Errors:**
- `400 BAD_REQUEST` — Invalid code
- `500 INTERNAL_ERROR` — Token exchange failed

### 2.4 Logout
```typescript
auth.logout
```
**Type:** Mutation  
**Input:** None  
**Output:** Success — clears JWT cookie  

---

## 3. Listing Router (`listing.`)

### 3.1 Fetch Listing from Amazon
```typescript
listing.fetchFromAmazon
```
**Type:** Mutation  
**Input (Zod Schema):**
```typescript
z.object({
  asin: z.string().length(10).regex(/^[A-Z0-9]{10}$/),
  marketplace: z.enum(["US", "UK", "DE", "FR", "IT", "ES", "CA"]),
})
```
**Output:**
```typescript
{
  id: number;
  asin: string;
  marketplace: string;
  title: string;
  bullets: string[];
  description: string;
  category: string;
  subcategory: string;
  brand: string;
  images: string[];
  price: number | null;
  rating: number | null;
  reviewCount: number | null;
  fetchedAt: Date;
}
```
**Errors:**
- `400 BAD_REQUEST` — Invalid ASIN format
- `401 UNAUTHORIZED` — Not authenticated
- `403 FORBIDDEN` — Subscription limit reached
- `404 NOT_FOUND` — ASIN not found on Amazon
- `429 TOO_MANY_REQUESTS` — Rate limit exceeded
- `502 BAD_GATEWAY` — SP-API error

### 3.2 Get User's Listings
```typescript
listing.getMyListings
```
**Type:** Query  
**Input:** `{ page?: number, limit?: number }` (default: page=1, limit=20)  
**Output:**
```typescript
{
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
}
```

### 3.3 Get Single Listing
```typescript
listing.getById
```
**Type:** Query  
**Input:** `{ id: number }`  
**Output:** `Listing`  
**Errors:**
- `404 NOT_FOUND` — Listing not found or not owned by user

### 3.4 Delete Listing
```typescript
listing.delete
```
**Type:** Mutation  
**Input:** `{ id: number }`  
**Output:** `{ success: boolean }`  

---

## 4. Optimization Router (`optimization.`)

### 4.1 Analyze Listing
```typescript
optimization.analyze
```
**Type:** Mutation  
**Input:**
```typescript
z.object({
  listingId: z.number().int().positive(),
  includeCompetitors: z.boolean().default(false),
})
```
**Output:**
```typescript
{
  reportId: number;
  rufusCompatibilityScore: number;      // 0-100
  cosmoAlignmentScore: number;          // 0-100
  semanticGaps: SemanticGap[];
  optimizedTitle: string;
  optimizedBullets: string[];
  optimizedDescription: string | null;
  optimizedQAs: QAPair[];
  keywordRecommendations: KeywordRec[];
  competitorBenchmarks: CompetitorBenchmark[] | null;
  createdAt: Date;
}
```
**SemanticGap Structure:**
```typescript
{
  dimension: string;        // e.g., "sleep_support"
  currentScore: number;     // 0-1
  targetScore: number;      // 0-1
  gap: number;              // target - current
  priority: "critical" | "high" | "medium" | "low";
  recommendation: string;   // Actionable advice
}
```
**QAPair Structure:**
```typescript
{
  question: string;
  optimizedAnswer: string;
  category: string;         // "safety", "usage", "comparison", etc.
  priority: "critical" | "high" | "medium" | "low";
}
```
**KeywordRec Structure:**
```typescript
{
  keyword: string;
  searchVolume: number | null;
  relevance: number;        // 0-1
  placement: "title" | "bullet" | "backend";
}
```
**Errors:**
- `400 BAD_REQUEST` — Invalid listingId
- `403 FORBIDDEN` — Monthly analysis limit reached
- `404 NOT_FOUND` — Listing not found
- `502 BAD_GATEWAY` — OpenAI API error

### 4.2 Get Analysis Report
```typescript
optimization.getReport
```
**Type:** Query  
**Input:** `{ reportId: number }`  
**Output:** `OptimizationReport` (full report object)  

### 4.3 Get Report History
```typescript
optimization.getHistory
```
**Type:** Query  
**Input:** `{ listingId?: number, page?: number, limit?: number }`  
**Output:** Paginated list of reports  

### 4.4 Regenerate Optimized Content
```typescript
optimization.regenerate
```
**Type:** Mutation  
**Input:**
```typescript
z.object({
  listingId: z.number(),
  section: z.enum(["title", "bullets", "description", "qas"]),
})
```
**Output:** Regenerated section content  

---

## 5. Competitor Router (`competitor.`)

### 5.1 Fetch Competitors
```typescript
competitor.fetchForListing
```
**Type:** Mutation  
**Input:** `{ listingId: number, count?: number }` (default count: 5)  
**Output:**
```typescript
{
  competitors: {
    asin: string;
    title: string;
    brand: string;
    price: number;
    rating: number;
    reviewCount: number;
    score: number;            // Their Rufus score
    embeddingSimilarity: number; // Cosine similarity
  }[];
}
```
**Errors:**
- `403 FORBIDDEN` — Pro plan required
- `404 NOT_FOUND` — Listing not found

### 5.2 Get Competitor Analysis
```typescript
competitor.getAnalysis
```
**Type:** Query  
**Input:** `{ listingId: number }`  
**Output:** `CompetitorAnalysis[]`  

---

## 6. Q&A Router (`qa.`)

### 6.1 Generate Q&A Suggestions
```typescript
qa.generate
```
**Type:** Mutation  
**Input:** `{ listingId: number }`  
**Output:**
```typescript
{
  suggestions: {
    id: number;
    originalQuestion: string;
    optimizedAnswer: string;
    category: string;
    priority: "critical" | "high" | "medium" | "low";
  }[];
}
```

### 6.2 Get Q&A Optimizations
```typescript
qa.getForListing
```
**Type:** Query  
**Input:** `{ listingId: number }`  
**Output:** `QaOptimization[]`  

### 6.3 Publish Q&A to Amazon
```typescript
qa.publish
```
**Type:** Mutation  
**Input:** `{ qaId: number }`  
**Output:** `{ success: boolean, amazonResponse?: any }`  
**Note:** Requires write permission on SP-API  

---

## 7. User Router (`user.`)

### 7.1 Update Profile
```typescript
user.updateProfile
```
**Type:** Mutation  
**Input:**
```typescript
z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().optional(),
})
```
**Output:** Updated user object  

### 7.2 Get Usage Stats
```typescript
user.getUsage
```
**Type:** Query  
**Input:** None  
**Output:**
```typescript
{
  plan: "free" | "starter" | "pro" | "enterprise";
  analysesUsed: number;
  analysesLimit: number;
  analysesRemaining: number;
  periodStart: Date;
  periodEnd: Date;
}
```

---

## 8. Payment Router (`payment.`)

### 8.1 Create Checkout
```typescript
payment.createCheckout
```
**Type:** Mutation  
**Input:** `{ plan: "starter" | "pro" | "enterprise" }`  
**Output:** `{ checkoutUrl: string }`  

### 8.2 Get Subscription
```typescript
payment.getSubscription
```
**Type:** Query  
**Input:** None  
**Output:**
```typescript
{
  id: number;
  plan: string;
  status: "active" | "cancelled" | "past_due";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}
```

### 8.3 Cancel Subscription
```typescript
payment.cancel
```
**Type:** Mutation  
**Input:** None  
**Output:** `{ success: boolean }`  

### 8.4 Webhook Handler
```typescript
payment.webhook
```
**Type:** Mutation (POST endpoint, public)  
**Input:** Raw Paddle webhook payload + signature header  
**Output:** `200 OK`  
**Security:** Signature verification with `PADDLE_WEBHOOK_SECRET`  

---

## 9. SP-API Router (`spapi.`)

### 9.1 Connect Amazon Account
```typescript
spapi.getAuthUrl
```
**Type:** Query  
**Input:** `{ marketplace: string }`  
**Output:** `{ url: string }` — Amazon OAuth URL  

### 9.2 Handle Amazon Callback
```typescript
spapi.handleCallback
```
**Type:** Query  
**Input:** `{ code: string, state: string, selling_partner_id: string }`  
**Output:** `{ success: boolean, account: AmazonAccount }`  

### 9.3 Get Connected Accounts
```typescript
spapi.getAccounts
```
**Type:** Query  
**Input:** None  
**Output:** `AmazonAccount[]`  

### 9.4 Disconnect Account
```typescript
spapi.disconnect
```
**Type:** Mutation  
**Input:** `{ accountId: number }`  
**Output:** `{ success: boolean }`  

---

## 10. Error Handling

### 10.1 Standard Error Format

All errors return HTTP 200 with JSON-RPC error structure:
```typescript
{
  error: {
    json: {
      message: string;           // Human-readable error
      code: number;              // tRPC error code
      data: {
        code: string;            // Custom error code
        httpStatus: number;      // HTTP status
        path?: string;           // Router path
        stack?: string;          // Stack trace (dev only)
      }
    }
  }
}
```

### 10.2 Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `PARSE_ERROR` | 400 | Invalid JSON |
| `BAD_REQUEST` | 400 | Invalid input |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `TIMEOUT` | 408 | Request timeout |
| `CONFLICT` | 409 | Resource conflict |
| `PRECONDITION_FAILED` | 412 | Subscription limit reached |
| `PAYLOAD_TOO_LARGE` | 413 | Request too large |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |
| `BAD_GATEWAY` | 502 | External API error |

### 10.3 Custom Error Codes

| Code | Description |
|------|-------------|
| `SPAPI_INVALID_ASIN` | ASIN format invalid |
| `SPAPI_NOT_FOUND` | Product not found on Amazon |
| `SPAPI_RATE_LIMITED` | Amazon rate limit hit |
| `SPAPI_AUTH_EXPIRED` | Amazon token expired |
| `SUBSCRIPTION_LIMIT_REACHED` | Monthly analysis limit exceeded |
| `OPENAI_ERROR` | OpenAI API error |
| `PADDLE_WEBHOOK_INVALID` | Invalid webhook signature |

---

## 11. Rate Limiting

| Endpoint Category | Limit | Window |
|------------------|-------|--------|
| Authentication | 10 | per minute |
| Listing fetch | 30 | per minute |
| Optimization | 10 | per minute |
| Competitor | 5 | per minute |
| General API | 100 | per minute per IP |
| Paddle webhooks | No limit | — |

---

## 12. API Versioning

API versioning is handled via URL path:
- Current: `/trpc` (v1)
- Future versions: `/trpc/v2`

Breaking changes will be announced 30 days in advance with migration guides.
