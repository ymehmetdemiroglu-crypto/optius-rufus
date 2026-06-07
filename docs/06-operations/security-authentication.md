# Security & Authentication Document
# Amazon Listing Optimizer SaaS

**Version:** 1.0  
**Classification:** Internal  
**Last Reviewed:** 2026-05-25  

---

## 1. Security Architecture Overview

### 1.1 Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|-----------|
| Unauthorized API access | Medium | High | JWT + OAuth 2.0 |
| SQL Injection | Low | Critical | Drizzle ORM (parameterized queries) |
| XSS Attack | Medium | High | React escaping + CSP headers |
| CSRF Attack | Low | Medium | SameSite cookies + CSRF tokens |
| Token theft | Low | High | HTTP-only cookies + short expiry |
| API credential leak | Low | Critical | AES-256 encryption |
| Rate limit abuse | Medium | Medium | Rate limiting per IP/user |
| Data breach | Low | Critical | Minimal PII, encrypted tokens |

### 1.2 Security Layers

```
[Internet]
    |
    v
[Cloudflare/WAF] -- DDoS protection, WAF rules
    |
    v
[Nginx] -- SSL termination, rate limiting, header security
    |
    v
[Hono App] -- Auth middleware, input validation, CORS
    |
    v
[tRPC Router] -- Zod validation, authorization checks
    |
    v
[Services] -- Encrypted DB access, secure API calls
    |
    +---> [PostgreSQL] -- Encrypted at rest (optional)
    +---> [Qdrant] -- Network isolated
    +---> [OpenAI API] -- API key auth
    +---> [Paddle] -- Webhook signature verification
```

---

## 2. Authentication

### 2.1 OAuth 2.0 (Kimi)

Primary authentication via Kimi OAuth 2.0 service.

**Flow:**
```
1. User clicks "Sign In"
2. Frontend redirects to Kimi authorization URL
3. User authenticates on Kimi
4. Kimi redirects to /api/oauth/callback with code
5. Backend exchanges code for tokens
6. Backend creates/updates user in DB
7. Backend sets JWT session cookie
8. User is authenticated
```

**Implementation:**
```typescript
// Provided by backend-building skill
// api/kimi/ -- OAuth implementation
// src/providers/trpc.tsx -- Auth provider
```

### 2.2 JWT Session Management

| Property | Value |
|----------|-------|
| Algorithm | HS256 |
| Secret | 256-bit random (env var) |
| Access Token Expiry | 24 hours |
| Refresh Token Expiry | 30 days |
| Cookie | HTTP-only, Secure, SameSite=Strict |

```typescript
// Cookie configuration
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  path: "/",
};
```

### 2.3 Session Validation

```typescript
// tRPC middleware
const authProcedure = t.procedure.use(async ({ ctx, next }) => {
  const token = ctx.req.cookie("auth_token");
  
  if (!token) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.userId),
    });
    
    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    
    return next({ ctx: { ...ctx, user } });
  } catch {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
});
```

---

## 3. Authorization

### 3.1 Role-Based Access Control (RBAC)

| Role | Description | Permissions |
|------|-------------|-------------|
| `user` | Standard user | Own data only, plan-limited features |
| `admin` | Platform admin | All data, user management, analytics |

### 3.2 Plan-Based Feature Gates

```typescript
const planLimits = {
  free: { analysesPerMonth: 3, competitorAnalysis: false, qaOptimization: false },
  starter: { analysesPerMonth: 20, competitorAnalysis: false, qaOptimization: true },
  pro: { analysesPerMonth: 100, competitorAnalysis: true, qaOptimization: true },
  enterprise: { analysesPerMonth: Infinity, competitorAnalysis: true, qaOptimization: true },
};

// Middleware to check plan limits
const checkPlanLimit = (feature: string) => 
  t.procedure.use(async ({ ctx, next }) => {
    const user = ctx.user;
    const limit = planLimits[user.subscriptionTier][feature];
    
    if (limit === false) {
      throw new TRPCError({ 
        code: "FORBIDDEN", 
        message: "This feature requires a higher plan" 
      });
    }
    
    if (typeof limit === "number") {
      const usage = await getMonthlyUsage(user.id, feature);
      if (usage >= limit) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: `Monthly limit reached (${limit}/${limit})` 
        });
      }
    }
    
    return next({ ctx });
  });
```

### 3.3 Resource Ownership

Every data operation verifies resource ownership:

```typescript
// Example: Listing router
listing.getById: authedProcedure
  .input(z.object({ id: z.number() }))
  .query(async ({ ctx, input }) => {
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, input.id),
    });
    
    if (!listing || listing.userId !== ctx.user.id) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }
    
    return listing;
  });
```

---

## 4. Data Protection

### 4.1 Encryption at Rest

| Data Type | Encryption Method | Key Management |
|-----------|------------------|----------------|
| API keys | AES-256-GCM | Environment variable |
| Database | Optional: PostgreSQL TDE | AWS KMS / Hetzner |

### 4.2 Encryption Implementation

```typescript
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ENCRYPTION_KEY = scryptSync(
  process.env.TOKEN_ENCRYPTION_SECRET!,
  "salt",
  32
);
const ALGORITHM = "aes-256-gcm";

export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  // Format: iv:authTag:encrypted
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
  
  const decipher = createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(ivHex, "hex")
  );
  
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
```

### 4.3 Encryption in Transit

- **TLS 1.3** for all client-server communication
- **HSTS** header enforced
- **Certificate:** Let's Encrypt (auto-renewal)

```nginx
# Nginx SSL configuration
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/domain/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/domain/privkey.pem;
    ssl_protocols TLSv1.3;
    ssl_ciphers 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256';
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
}
```

---

## 5. Input Validation

### 5.1 Zod Schema Validation

All API inputs validated with Zod:

```typescript
import { z } from "zod";

// ASIN validation
const asinSchema = z.string()
  .length(10, "ASIN must be exactly 10 characters")
  .regex(/^[A-Z0-9]{10}$/, "ASIN must contain only uppercase letters and numbers");

// Marketplace validation
const marketplaceSchema = z.enum(["US", "UK", "DE", "FR", "IT", "ES", "CA"]);

// Listing analysis input
const analyzeInput = z.object({
  listingId: z.number().int().positive(),
  includeCompetitors: z.boolean().default(false),
});

// User profile update
const updateProfileInput = z.object({
  name: z.string().min(1).max(255).optional(),
  avatarUrl: z.string().url().optional(),
});
```

### 5.2 SQL Injection Prevention

Drizzle ORM uses parameterized queries exclusively:

```typescript
// SAFE - Drizzle ORM
await db.select().from(listings).where(eq(listings.asin, userInput));

// NEVER do this
await db.execute(`SELECT * FROM listings WHERE asin = '${userInput}'`);
```

---

## 6. Security Headers

### 6.1 HTTP Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` | XSS prevention |
| `X-Frame-Options` | `DENY` | Clickjacking prevention |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing prevention |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage prevention |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Feature restriction |

### 6.2 Nginx Configuration

```nginx
# Security headers
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

# CSP
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.openai.com https://api.paddle.com;" always;
```

---

## 7. Rate Limiting

### 7.1 Implementation

```typescript
import { rateLimit } from "hono-rate-limiter";

// General API rate limit
app.use("/trpc/*", rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  keyGenerator: (c) => c.req.header("x-forwarded-for") || c.req.ip,
  handler: (c) => c.json({ error: "Too many requests" }, 429),
}));

// Stricter limits for sensitive endpoints
app.use("/trpc/payment.*", rateLimit({
  windowMs: 60 * 1000,
  max: 10,
}));

```

### 7.2 Rate Limit Tiers

| Endpoint | Limit | Window |
|----------|-------|--------|
| Authentication | 10 | 1 minute |
| Listing fetch | 30 | 1 minute |
| Optimization | 10 | 1 minute |
| Payment | 10 | 1 minute |
| General API | 100 | 1 minute |

---

## 8. Audit Logging

### 8.1 Logged Events

| Event | Data Logged | Retention |
|-------|------------|-----------|
| Login/Logout | User ID, timestamp, IP, user agent | 90 days |
| Listing fetch | User ID, ASIN, timestamp | 30 days |
| Analysis run | User ID, listing ID, score | 90 days |
| Plan change | User ID, old plan, new plan | 1 year |
| Payment event | User ID, event type, amount | 7 years |
| Failed auth | IP, timestamp, reason | 30 days |

### 8.2 Log Format

```typescript
interface AuditLog {
  id: number;
  userId: number | null;
  listingId: number | null;
  action: string;           // e.g., "LISTING_FETCHED"
  metadata: Record<string, any>; // Contextual data
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}
```

---

## 9. Incident Response

### 9.1 Security Incident Classification

| Severity | Examples | Response Time |
|----------|----------|---------------|
| Critical | Data breach, token compromise | Immediate |
| High | Unauthorized access attempt | 1 hour |
| Medium | Rate limit abuse | 4 hours |
| Low | Failed login attempts | 24 hours |

### 9.2 Response Playbook

1. **Detect:** Sentry alerts, log analysis, user reports
2. **Contain:** Revoke tokens, disable accounts, block IPs
3. **Investigate:** Review logs, identify scope, find root cause
4. **Remediate:** Patch vulnerability, rotate credentials
5. **Communicate:** Notify affected users if required
6. **Document:** Post-incident review, update procedures

---

## 10. Compliance

### 10.1 GDPR (EU Users)

- **Data minimization:** Only collect necessary data
- **Right to access:** Users can export their data
- **Right to deletion:** Account deletion wipes all data
- **Consent:** Clear privacy policy, opt-in for marketing
- **Breach notification:** 72-hour notification requirement

### 10.2 Data Retention

| Data Type | Retention Period | Deletion Method |
|-----------|-----------------|----------------|
| User accounts | Until deletion | Soft delete + 30-day purge |
| Listing data | Until account deletion | Cascade delete |
| Analysis reports | 90 days | Automated cleanup |
| Activity logs | 90 days | Automated cleanup |
| Payment records | 7 years | Legal requirement |
| Paddle webhooks | 30 days | Automated cleanup |

### 10.3 Privacy Policy Requirements

- What data is collected
- How data is used
- Data sharing (none with third parties except necessary services)
- User rights
- Contact information
