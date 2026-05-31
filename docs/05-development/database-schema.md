# Database Schema Document
# Amazon Listing Optimizer SaaS

**Version:** 1.0  
**Database:** MySQL 8.0  
**ORM:** Drizzle ORM  
**Migration Tool:** Drizzle Kit  

---

## 1. Entity Relationship Diagram

![Database ERD](../../assets/images/database-erd.png)

---

## 2. Schema Definitions

### 2.1 Users Table

Central user account table. All user-related data is normalized here.

```typescript
// db/schema.ts
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  subscriptionTier: mysqlEnum("subscription_tier", [
    "free", "starter", "pro", "enterprise"
  ]).default("free").notNull(),
  paddleCustomerId: varchar("paddle_customer_id", { length: 255 }),
  emailVerified: boolean("email_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | serial | PK, auto-increment | Unique user identifier |
| `email` | varchar(255) | NOT NULL, UNIQUE | User email address |
| `name` | varchar(255) | nullable | Display name |
| `avatarUrl` | varchar(500) | nullable | Profile picture URL |
| `subscriptionTier` | enum | DEFAULT 'free' | Current plan level |
| `paddleCustomerId` | varchar(255) | nullable | Paddle customer reference |
| `emailVerified` | boolean | DEFAULT false | Email verification status |
| `createdAt` | timestamp | DEFAULT NOW() | Account creation time |
| `updatedAt` | timestamp | ON UPDATE NOW() | Last modification time |

**Indexes:**
- `PRIMARY KEY` on `id`
- `UNIQUE` on `email`
- `INDEX` on `subscriptionTier` (for plan-based queries)

---

### 2.2 Amazon Accounts Table

Stores Amazon Seller Central account connections via SP-API OAuth.

```typescript
export const amazonAccounts = mysqlTable("amazon_accounts", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sellerId: varchar("seller_id", { length: 50 }).notNull(),
  marketplace: varchar("marketplace", { length: 10 }).notNull(),
  refreshToken: text("refresh_token").notNull(),
  accessToken: text("access_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | serial | PK | Account identifier |
| `userId` | bigint unsigned | FK → users.id, ON DELETE CASCADE | Owner user |
| `sellerId` | varchar(50) | NOT NULL | Amazon seller ID |
| `marketplace` | varchar(10) | NOT NULL | Marketplace code (US, UK, DE, etc.) |
| `refreshToken` | text | NOT NULL | SP-API refresh token (encrypted) |
| `accessToken` | text | nullable | Current access token |
| `tokenExpiresAt` | timestamp | nullable | Access token expiry |
| `isActive` | boolean | DEFAULT true | Connection status |
| `createdAt` | timestamp | DEFAULT NOW() | Connection creation time |

**Indexes:**
- `PRIMARY KEY` on `id`
- `INDEX` on `userId` (for user's accounts lookup)
- `UNIQUE` on `(userId, sellerId, marketplace)` (prevent duplicate connections)

---

### 2.3 Subscriptions Table

Manages subscription lifecycle and billing status.

```typescript
export const subscriptions = mysqlTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: mysqlEnum("plan", ["free", "starter", "pro", "enterprise"])
    .notNull(),
  paddleSubscriptionId: varchar("paddle_subscription_id", { length: 255 }),
  status: mysqlEnum("status", [
    "active", "cancelled", "past_due", "paused", "trialing"
  ]).default("active").notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | serial | PK | Subscription identifier |
| `userId` | bigint unsigned | FK → users.id, CASCADE | Subscriber |
| `plan` | enum | NOT NULL | Subscription plan |
| `paddleSubscriptionId` | varchar(255) | nullable | Paddle subscription reference |
| `status` | enum | DEFAULT 'active' | Subscription status |
| `currentPeriodStart` | timestamp | nullable | Current billing period start |
| `currentPeriodEnd` | timestamp | nullable | Current billing period end |
| `cancelAtPeriodEnd` | boolean | DEFAULT false | Cancellation flag |
| `createdAt` | timestamp | DEFAULT NOW() | Creation time |

**Indexes:**
- `PRIMARY KEY` on `id`
- `INDEX` on `userId`
- `INDEX` on `paddleSubscriptionId`

---

### 2.4 Listings Table

Stores fetched Amazon product listings.

```typescript
export const listings = mysqlTable("listings", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amazonAccountId: bigint("amazon_account_id", { mode: "number", unsigned: true })
    .references(() => amazonAccounts.id, { onDelete: "set null" }),
  asin: varchar("asin", { length: 10 }).notNull(),
  marketplace: varchar("marketplace", { length: 10 }).notNull(),
  title: text("title"),
  bullets: json("bullets"),           // string[]
  description: text("description"),
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  brand: varchar("brand", { length: 255 }),
  images: json("images"),             // string[]
  price: decimal("price", { precision: 10, scale: 2 }),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: int("review_count"),
  currentScore: decimal("current_score", { precision: 5, scale: 2 }),
  embeddingVector: json("embedding_vector"), // number[] (1536 dims)
  lastAnalyzed: timestamp("last_analyzed"),
  fetchedAt: timestamp("fetched_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | serial | PK | Listing identifier |
| `userId` | bigint unsigned | FK → users.id, CASCADE | Owner |
| `amazonAccountId` | bigint unsigned | FK → amazonAccounts.id, SET NULL | Linked SP-API account |
| `asin` | varchar(10) | NOT NULL | Amazon Standard Identification Number |
| `marketplace` | varchar(10) | NOT NULL | Marketplace code |
| `title` | text | nullable | Product title |
| `bullets` | json | nullable | Bullet points array |
| `description` | text | nullable | Product description |
| `category` | varchar(100) | nullable | Product category |
| `subcategory` | varchar(100) | nullable | Product subcategory |
| `brand` | varchar(255) | nullable | Brand name |
| `images` | json | nullable | Image URLs array |
| `price` | decimal(10,2) | nullable | Current price |
| `rating` | decimal(3,2) | nullable | Star rating |
| `reviewCount` | int | nullable | Number of reviews |
| `currentScore` | decimal(5,2) | nullable | Last computed Rufus score |
| `embeddingVector` | json | nullable | OpenAI embedding (1536d) |
| `lastAnalyzed` | timestamp | nullable | Last analysis timestamp |
| `fetchedAt` | timestamp | DEFAULT NOW() | Data fetch timestamp |
| `createdAt` | timestamp | DEFAULT NOW() | Record creation |

**Indexes:**
- `PRIMARY KEY` on `id`
- `INDEX` on `userId`
- `INDEX` on `asin`
- `UNIQUE` on `(userId, asin, marketplace)` — prevent duplicates

---

### 2.5 Optimization Reports Table

Stores AI-generated optimization analysis results.

```typescript
export const optimizationReports = mysqlTable("optimization_reports", {
  id: serial("id").primaryKey(),
  listingId: bigint("listing_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rufusCompatibilityScore: int("rufus_compatibility_score"),
  cosmoAlignmentScore: int("cosmo_alignment_score"),
  semanticGaps: json("semantic_gaps"),
  optimizedTitle: text("optimized_title"),
  optimizedBullets: json("optimized_bullets"),     // string[]
  optimizedDescription: text("optimized_description"),
  optimizedQAs: json("optimized_qas"),             // QAPair[]
  keywordRecommendations: json("keyword_recommendations"),
  competitorBenchmarks: json("competitor_benchmarks"),
  aiAnalysisRaw: json("ai_analysis_raw"),          // Full AI response
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | serial | PK | Report identifier |
| `listingId` | bigint unsigned | FK → listings.id, CASCADE | Analyzed listing |
| `userId` | bigint unsigned | FK → users.id, CASCADE | Report owner |
| `rufusCompatibilityScore` | int (0-100) | nullable | Rufus compatibility score |
| `cosmoAlignmentScore` | int (0-100) | nullable | COSMO alignment score |
| `semanticGaps` | json | nullable | Gap analysis results array |
| `optimizedTitle` | text | nullable | AI-generated title |
| `optimizedBullets` | json | nullable | AI-generated bullets array |
| `optimizedDescription` | text | nullable | AI-generated description |
| `optimizedQAs` | json | nullable | Q&A suggestions array |
| `keywordRecommendations` | json | nullable | Keyword suggestions |
| `competitorBenchmarks` | json | nullable | Competitor comparison data |
| `aiAnalysisRaw` | json | nullable | Complete raw AI analysis |
| `createdAt` | timestamp | DEFAULT NOW() | Analysis timestamp |

**Indexes:**
- `PRIMARY KEY` on `id`
- `INDEX` on `listingId`
- `INDEX` on `userId`
- `INDEX` on `createdAt` (for history queries)

---

### 2.6 Competitor Analyses Table

Stores competitor listing comparison data.

```typescript
export const competitorAnalyses = mysqlTable("competitor_analyses", {
  id: serial("id").primaryKey(),
  listingId: bigint("listing_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  competitorAsin: varchar("competitor_asin", { length: 10 }).notNull(),
  competitorTitle: text("competitor_title"),
  competitorScore: decimal("competitor_score", { precision: 5, scale: 2 }),
  priceComparison: json("price_comparison"),
  reviewComparison: json("review_comparison"),
  strengths: json("strengths"),           // string[]
  weaknesses: json("weaknesses"),         // string[]
  embeddingSimilarity: float("embedding_similarity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Indexes:**
- `PRIMARY KEY` on `id`
- `INDEX` on `listingId`
- `INDEX` on `competitorAsin`

---

### 2.7 Q&A Optimizations Table

Stores generated Q&A optimization suggestions.

```typescript
export const qaOptimizations = mysqlTable("qa_optimizations", {
  id: serial("id").primaryKey(),
  listingId: bigint("listing_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  originalQuestion: text("original_question").notNull(),
  optimizedAnswer: text("optimized_answer").notNull(),
  category: varchar("category", { length: 50 }),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"])
    .default("medium").notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
  publishDate: timestamp("publish_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

### 2.8 Activity Logs Table

Audit trail for all user actions.

```typescript
export const activityLogs = mysqlTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true })
    .references(() => users.id, { onDelete: "set null" }),
  listingId: bigint("listing_id", { mode: "number", unsigned: true })
    .references(() => listings.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  metadata: json("metadata"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

### 2.9 Intent Vectors Table (AI Reference Data)

Pre-computed intent query embeddings for semantic analysis.

```typescript
export const intentVectors = mysqlTable("intent_vectors", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 100 }).notNull(),
  subcategory: varchar("subcategory", { length: 100 }),
  intentQuery: text("intent_query").notNull(),
  embeddingVector: json("embedding_vector").notNull(), // 1536 dims
  semanticDimensions: json("semantic_dimensions"),
  usageCount: int("usage_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

### 2.10 Paddle Webhooks Table

Stores incoming Paddle webhook events for processing.

```typescript
export const paddleWebhooks = mysqlTable("paddle_webhooks", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  payload: json("payload").notNull(),
  signature: varchar("signature", { length: 500 }).notNull(),
  processed: boolean("processed").default(false).notNull(),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

### 2.11 Waitlist Table

Pre-launch email collection.

```typescript
export const waitlist = mysqlTable("waitlist", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  company: varchar("company", { length: 255 }),
  categoryInterest: varchar("category_interest", { length: 100 }),
  monthlyRevenue: varchar("monthly_revenue", { length: 50 }),
  source: varchar("source", { length: 100 }),
  converted: boolean("converted").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## 3. Relationships

```
users (1) ────────< (N) amazon_accounts
    │
    ├────────────< (N) subscriptions
    │
    ├────────────< (N) listings
    │                   │
    │                   ├────────< (N) optimization_reports
    │                   │
    │                   ├────────< (N) competitor_analyses
    │                   │
    │                   ├────────< (N) qa_optimizations
    │                   │
    │                   └────────< (N) activity_logs
    │
    └────────────< (N) activity_logs
```

---

## 4. JSON Schema Definitions

### 4.1 Semantic Gap JSON Structure

```json
{
  "dimension": "sleep_support",
  "currentScore": 0.15,
  "targetScore": 0.80,
  "gap": 0.65,
  "priority": "critical",
  "recommendation": "Add explicit sleep support claims with melatonin regulation mechanism"
}
```

### 4.2 Q&A Pair JSON Structure

```json
{
  "question": "Is this safe for pregnant women?",
  "optimizedAnswer": "Consult your healthcare provider. This product contains [ingredient] which is generally considered safe, but individual needs vary during pregnancy.",
  "category": "safety",
  "priority": "high"
}
```

### 4.3 Keyword Recommendation JSON Structure

```json
{
  "keyword": "magnesium glycinate sleep",
  "searchVolume": 5400,
  "relevance": 0.95,
  "placement": "title"
}
```

---

## 5. Migration Strategy

### 5.1 Initial Migration

```bash
# Generate initial migration
npm run db:generate

# Apply to database
npm run db:migrate
```

### 5.2 Development Workflow

```bash
# Schema değişikliği sonrası (development)
npm run db:push        # Schema'yi DB'ye sync et

# Production migration
npm run db:generate    # Migration SQL oluştur
npm run db:migrate     # Migration'ları uygula
```

### 5.3 Backup Before Migration

```bash
# Her production migration öncesi backup
mysqldump -u root -p amazon_optimizer > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 6. Qdrant Vector Database Schema

### 6.1 Collection: listing_embeddings

```python
{
  "collection_name": "listing_embeddings",
  "vectors_config": {
    "size": 1536,
    "distance": "Cosine"
  },
  "payload_schema": {
    "listing_id": "integer",
    "user_id": "integer", 
    "asin": "string",
    "category": "string",
    "created_at": "datetime"
  }
}
```

### 6.2 Collection: intent_embeddings

```python
{
  "collection_name": "intent_embeddings",
  "vectors_config": {
    "size": 1536,
    "distance": "Cosine"
  },
  "payload_schema": {
    "intent_id": "integer",
    "category": "string",
    "subcategory": "string",
    "query": "string"
  }
}
```
