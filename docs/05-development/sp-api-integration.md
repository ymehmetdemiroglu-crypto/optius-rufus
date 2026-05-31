# Amazon SP-API Integration Guide
# Amazon Listing Optimizer SaaS

**Version:** 1.0  
**SP-API Version:** 2022-04-01 (Catalog) / 2021-08-01 (Listings)  
**Authentication:** OAuth 2.0  

---

## 1. SP-API Overview

Amazon Selling Partner API (SP-API) is the official API for programmatic access to Amazon Seller Central data. Our platform uses SP-API to:

1. **Read listing data** (title, bullets, description, images)
2. **Read product catalog data** (category, brand, attributes)
3. **Read pricing data** (competitive pricing, buy box)
4. **Write optimized listings** (title, bullets, description updates)
5. **Read reports** (sales, inventory, performance)

---

## 2. Prerequisites

### 2.1 Amazon Developer Account

1. Register at [developer.amazonservices.com](https://developer.amazonservices.com)
2. Complete developer profile
3. Submit app registration (can take 2-4 weeks for approval)

### 2.2 App Registration

Required information:
- **App name:** Amazon Listing Optimizer
- **App type:** Public (third-party sellers can use)
- **OAuth redirect URI:** `https://yourdomain.com/api/spapi/callback`
- **IAM ARN:** AWS IAM role for SP-API access
- **Scopes:**
  - `sellingpartnerapi::catalog_read`
  - `sellingpartnerapi::listings_read`
  - `sellingpartnerapi::listings_write` (optional, for write-back)
  - `sellingpartnerapi::pricing_read`

### 2.3 AWS Setup

```bash
# Create IAM role for SP-API
aws iam create-role \
  --role-name AmazonListingOptimizer-SPAPI \
  --assume-role-policy-document file://trust-policy.json

# Attach necessary policies
aws iam attach-role-policy \
  --role-name AmazonListingOptimizer-SPAPI \
  --policy-arn arn:aws:iam::aws:policy/execute-api:Invoke
```

---

## 3. Authentication Flow

### 3.1 OAuth 2.0 Authorization Code Flow

```
Step 1: Generate Authorization URL
-----------------------------------
GET https://sellercentral.amazon.com/apps/authorize/consolidate?
  application_id=amzn1.sp.solution.xxx&
  state=random-state-string&
  version=beta

Step 2: User Authorizes
-----------------------
- Seller logs into Seller Central
- Grants permissions to our app
- Amazon redirects to callback URL with authorization code

Step 3: Exchange Code for Tokens
--------------------------------
POST https://api.amazon.com/auth/o2/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code&
code=AUTH_CODE&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET&
redirect_uri=https://yourdomain.com/api/spapi/callback

Response:
{
  "access_token": "Atza|...",
  "refresh_token": "Atzr|...",
  "token_type": "bearer",
  "expires_in": 3600
}

Step 4: Token Refresh (before expiry)
-------------------------------------
POST https://api.amazon.com/auth/o2/token

grant_type=refresh_token&
refresh_token=Atzr|...&
client_id=YOUR_CLIENT_ID&
client_secret=YOUR_CLIENT_SECRET
```

### 3.2 Implementation Code

```typescript
// api/services/spapi/auth.ts

const SP_API_TOKEN_URL = "https://api.amazon.com/auth/o2/token";
const SP_API_AUTH_URL = "https://sellercentral.amazon.com/apps/authorize/consolidate";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export function generateAuthUrl(marketplace: string, state: string): string {
  const params = new URLSearchParams({
    application_id: process.env.AMAZON_APP_ID!,
    state,
    version: "beta",
  });
  return `${SP_API_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  code: string
): Promise<TokenResponse> {
  const response = await fetch(SP_API_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.AMAZON_CLIENT_ID!,
      client_secret: process.env.AMAZON_CLIENT_SECRET!,
      redirect_uri: `${process.env.APP_URL}/api/spapi/callback`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenResponse> {
  const response = await fetch(SP_API_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: process.env.AMAZON_CLIENT_ID!,
      client_secret: process.env.AMAZON_CLIENT_SECRET!,
    }),
  });

  return response.json();
}

// Auto-refresh middleware
export async function getValidAccessToken(
  accountId: number
): Promise<string> {
  const account = await db.query.amazonAccounts.findFirst({
    where: eq(amazonAccounts.id, accountId),
  });

  if (!account) throw new Error("Account not found");

  // Check if token is expired (with 5-min buffer)
  const isExpired = !account.tokenExpiresAt || 
    new Date(account.tokenExpiresAt) < new Date(Date.now() + 5 * 60 * 1000);

  if (isExpired) {
    const tokens = await refreshAccessToken(account.refreshToken);
    
    // Update tokens in DB
    await db.update(amazonAccounts)
      .set({
        accessToken: tokens.access_token,
        tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      })
      .where(eq(amazonAccounts.id, accountId));
    
    return tokens.access_token;
  }

  return account.accessToken!;
}
```

---

## 4. API Endpoints

### 4.1 Get Catalog Item (Product Details)

```typescript
// GET /catalog/2022-04-01/items/{asin}
// Marketplace: US, UK, DE, FR, IT, ES, CA

async function getCatalogItem(
  asin: string,
  marketplace: string,
  accessToken: string
): Promise<CatalogItem> {
  const endpoint = getMarketplaceEndpoint(marketplace);
  
  const response = await fetch(
    `${endpoint}/catalog/2022-04-01/items/${asin}?` +
    `marketplaceIds=${getMarketplaceId(marketplace)}&` +
    `includedData=summaries,images,productTypes`,
    {
      headers: {
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status === 404) {
    throw new Error("ASIN_NOT_FOUND");
  }
  
  if (response.status === 429) {
    throw new Error("SPAPI_RATE_LIMITED");
  }

  return response.json();
}

// Response structure:
interface CatalogItem {
  asin: string;
  summaries: [{
    marketplaceId: string;
    brand: string;
    itemName: string;          // Title
    modelNumber: string;
    color: string;
    size: string;
    websiteDisplayGroup: string; // Category
    websiteDisplayGroupName: string;
  }];
  images: [{
    marketplaceId: string;
    images: Array<{
      variant: "MAIN" | "PT01" | "PT02" | ...;
      link: string;
      height: number;
      width: number;
    }>;
  }];
  productTypes: [{
    marketplaceId: string;
    productType: string;
  }];
}
```

### 4.2 Get Listing Item (Listing Content)

```typescript
// GET /listings/2021-08-01/items/{sellerId}/{sku}

async function getListingItem(
  sellerId: string,
  sku: string,
  marketplace: string,
  accessToken: string
): Promise<ListingItem> {
  const endpoint = getMarketplaceEndpoint(marketplace);
  
  const response = await fetch(
    `${endpoint}/listings/2021-08-01/items/${sellerId}/${sku}?` +
    `marketplaceIds=${getMarketplaceId(marketplace)}`,
    {
      headers: {
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
      },
    }
  );

  return response.json();
}

// Response structure:
interface ListingItem {
  sku: string;
  summaries: [{
    marketplaceId: string;
    asin: string;
    productType: string;
    status: "ACTIVE" | "INCOMPLETE" | ...;
    itemName: string;
    createdDate: string;
    lastUpdatedDate: string;
  }];
  attributes: {
    item_name: [{ value: string }];           // Title
    bullet_point: Array<{ value: string }>;   // Bullet points
    product_description: [{ value: string }]; // Description
    brand: [{ value: string }];
    // ... other attributes
  };
  issues: Array<{
    code: string;
    message: string;
    severity: "ERROR" | "WARNING";
  }>;
}
```

### 4.3 Get Competitive Pricing

```typescript
// POST /batches/products/pricing/v0/competitiveSummary

async function getCompetitivePricing(
  asins: string[],
  marketplace: string,
  accessToken: string
): Promise<CompetitiveSummary[]> {
  const endpoint = getMarketplaceEndpoint(marketplace);
  
  const response = await fetch(
    `${endpoint}/batches/products/pricing/v0/competitiveSummary`,
    {
      method: "POST",
      headers: {
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        asinValues: asins,
        marketplaceId: getMarketplaceId(marketplace),
      }),
    }
  );

  return response.json();
}
```

### 4.4 Update Listing (Write-Back)

```typescript
// PATCH /listings/2021-08-01/items/{sellerId}/{sku}

async function updateListing(
  sellerId: string,
  sku: string,
  marketplace: string,
  accessToken: string,
  updates: ListingUpdates
): Promise<UpdateResult> {
  const endpoint = getMarketplaceEndpoint(marketplace);
  
  const response = await fetch(
    `${endpoint}/listings/2021-08-01/items/${sellerId}/${sku}?` +
    `marketplaceIds=${getMarketplaceId(marketplace)}`,
    {
      method: "PATCH",
      headers: {
        "x-amz-access-token": accessToken,
        "Content-Type": "application/json",
        "content-language": "en-US",
      },
      body: JSON.stringify({
        productType: updates.productType,
        patches: [
          {
            op: "replace",
            path: "/attributes/item_name",
            value: [{ value: updates.title }],
          },
          {
            op: "replace",
            path: "/attributes/bullet_point",
            value: updates.bullets.map(b => ({ value: b })),
          },
          {
            op: "replace",
            path: "/attributes/product_description",
            value: [{ value: updates.description }],
          },
        ],
      }),
    }
  );

  return response.json();
}
```

---

## 5. Marketplace Configuration

| Marketplace | Code | Marketplace ID | Endpoint Host |
|------------|------|---------------|---------------|
| United States | US | ATVPDKIKX0DER | sellingpartnerapi-na.amazon.com |
| Canada | CA | A2EUQ1WTGCTBG2 | sellingpartnerapi-na.amazon.com |
| United Kingdom | UK | A1F83G8C2ARO7P | sellingpartnerapi-eu.amazon.com |
| Germany | DE | A1PA6795UKMFR9 | sellingpartnerapi-eu.amazon.com |
| France | FR | A13V1IB3VIYZZH | sellingpartnerapi-eu.amazon.com |
| Italy | IT | APJ6JRA9NG5V4 | sellingpartnerapi-eu.amazon.com |
| Spain | ES | A1RKKUPIHCS9HS | sellingpartnerapi-eu.amazon.com |

```typescript
const marketplaceConfig: Record<string, { id: string; endpoint: string }> = {
  US: { id: "ATVPDKIKX0DER", endpoint: "https://sellingpartnerapi-na.amazon.com" },
  UK: { id: "A1F83G8C2ARO7P", endpoint: "https://sellingpartnerapi-eu.amazon.com" },
  DE: { id: "A1PA6795UKMFR9", endpoint: "https://sellingpartnerapi-eu.amazon.com" },
  // ... etc
};
```

---

## 6. Rate Limiting & Error Handling

### 6.1 Rate Limits

| API | Limit | Window |
|-----|-------|--------|
| Catalog Items | 2 req/sec | Sustained |
| Listings Items | 2 req/sec | Sustained |
| Product Pricing | 1 req/sec | Sustained |
| Reports | 15 req/sec | Burst |

### 6.2 Retry Strategy

```typescript
async function spapiRequestWithRetry<T>(
  requestFn: () => Promise<Response>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await requestFn();
      
      if (response.ok) {
        return response.json();
      }
      
      if (response.status === 429) {
        // Rate limited - exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await sleep(delay);
        continue;
      }
      
      if (response.status >= 500) {
        // Server error - retry
        const delay = Math.pow(2, attempt) * 500;
        await sleep(delay);
        continue;
      }
      
      // Client error - don't retry
      throw new Error(`SP-API Error: ${response.status} ${response.statusText}`);
      
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }
  
  throw new Error("Max retries exceeded");
}
```

### 6.3 Common Error Codes

| Error Code | HTTP | Cause | Resolution |
|-----------|------|-------|-----------|
| `INPUT_INVALID` | 400 | Invalid ASIN format | Validate ASIN before calling |
| `NOT_FOUND` | 404 | ASIN doesn't exist | Inform user, suggest alternatives |
| `FORBIDDEN` | 403 | No permission for this ASIN | Check seller ownership |
| `QUOTA_EXCEEDED` | 429 | Rate limit hit | Implement backoff, queue requests |
| `INTERNAL_ERROR` | 500 | Amazon server error | Retry with exponential backoff |
| `SERVICE_UNAVAILABLE` | 503 | Temporary outage | Retry after delay |

---

## 7. Security Best Practices

### 7.1 Token Storage

```typescript
// Encrypt refresh tokens before storing
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, "hex");

export function encryptToken(token: string): { encrypted: string; iv: string; tag: string } {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  return {
    encrypted,
    iv: iv.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
  };
}

export function decryptToken(
  encrypted: string,
  iv: string,
  tag: string
): string {
  const decipher = createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, "hex")
  );
  decipher.setAuthTag(Buffer.from(tag, "hex"));
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}
```

### 7.2 Access Token Lifecycle

- **Access tokens:** Stored in memory only (not database), refreshed automatically
- **Refresh tokens:** Encrypted with AES-256-GCM in database
- **Token expiry:** Checked before every API call with 5-minute buffer
- **Token revocation:** Handled via webhook or periodic check

---

## 8. Testing

### 8.1 Sandbox Environment

Amazon provides a sandbox environment for testing:

```typescript
const SANDBOX_ENDPOINT = "https://sandbox.sellingpartnerapi-na.amazon.com";

// Use sandbox ASINs for testing
const TEST_ASINS = {
  US: "B08N5WRWNW",  // Test product in sandbox
};
```

### 8.2 Mock Service (Development)

```typescript
// Mock SP-API for local development without Amazon credentials
export const mockSpapiService = {
  async getCatalogItem(asin: string): Promise<CatalogItem> {
    return {
      asin,
      summaries: [{
        marketplaceId: "ATVPDKIKX0DER",
        brand: "TestBrand",
        itemName: `Test Product ${asin}`,
        websiteDisplayGroup: "health",
        websiteDisplayGroupName: "Health & Personal Care",
      }],
      images: [{ marketplaceId: "ATVPDKIKX0DER", images: [] }],
      productTypes: [{ marketplaceId: "ATVPDKIKX0DER", productType: "HEALTH_PERSONAL_CARE" }],
    };
  },
  // ... other mock methods
};
```
