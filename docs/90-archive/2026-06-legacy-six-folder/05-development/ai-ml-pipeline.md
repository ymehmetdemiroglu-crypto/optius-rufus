# AI/ML Pipeline Documentation
# Amazon Listing Optimizer SaaS

**Version:** 1.0  
**Date:** 2026-05-25  
**Model:** OpenAI text-embedding-3-small  
**Vector Dimension:** 1536  

---

## 1. Pipeline Overview

![AI Pipeline](../../assets/images/ai-pipeline.png)

The AI/ML pipeline transforms raw Amazon listing data into actionable optimization recommendations through a 6-stage process. Total latency: **3-5 seconds per listing**. Cost: **~$0.0002 per analysis**.

---

## 2. Pipeline Stages

### Stage 1: Input (ASIN + Marketplace)

**Input:**
```typescript
{
  asin: "B08XYZ1234",        // 10-char Amazon ID
  marketplace: "US",         // US, UK, DE, FR, IT, ES, CA
  userId: 123,               // Authenticated user
}
```

**Validation:**
- ASIN format: `^[A-Z0-9]{10}$` regex
- Marketplace: enum validation
- User subscription tier check (usage limit)

---

### Stage 2: Fetch (Apify / Rainforest API)

**Endpoints Called:**

| Endpoint | Purpose | Response Fields |
|----------|---------|----------------|
| `GET /api/scrape` | Product catalog data | title, images, brand, category, features |
| `GET /api/listing` | Listing content | title, bullets, description, keywords |
| `GET /api/pricing` | Pricing data | buyBoxPrice, lowestPrices |

**Raw Data Structure:**
```typescript
interface RawListingData {
  asin: string;
  title: string;
  bullets: string[];
  description: string;
  brand: string;
  category: string;
  subcategory: string;
  images: string[];
  price: number;
  rating: number;
  reviewCount: number;
  attributes: Record<string, any>;
}
```

**Error Handling:**
- API timeout: 10s, retry 3x with exponential backoff
- Rate limit: Queue with 2-second delay between requests
- Invalid ASIN: Return 404 with suggestion

---

### Stage 3: Preprocess (Text Cleaning)

**Cleaning Pipeline:**

```typescript
function preprocessListing(data: RawListingData): CleanedText {
  // 1. Concatenate all text fields
  const rawText = [
    data.title,
    ...data.bullets,
    data.description,
    data.brand,
    data.category,
    data.subcategory,
  ].join(" ");

  // 2. HTML tag removal
  const noHtml = rawText.replace(/<[^>]+>/g, " ");

  // 3. Lowercasing
  const lowercased = noHtml.toLowerCase();

  // 4. Special character normalization
  const normalized = lowercased
    .replace(/[\u2018\u2019]/g, "'")   // Smart quotes
    .replace(/[\u201C\u201D]/g, '"')   // Smart double quotes
    .replace(/[\u2013\u2014]/g, "-");  // Em/en dashes

  // 5. Extra whitespace removal
  const cleaned = normalized.replace(/\s+/g, " ").trim();

  // 6. Truncate to 8000 tokens max (OpenAI limit)
  const truncated = cleaned.slice(0, 32000); // ~8000 tokens

  return { text: truncated, source: data };
}
```

---

### Stage 4: Embedding (OpenAI API)

**API Call:**
```typescript
const response = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: cleanedText,
  encoding_format: "float",
});

const embedding: number[] = response.data[0].embedding; // 1536 dimensions
```

**Model Details:**

| Property | Value |
|----------|-------|
| Model | text-embedding-3-small |
| Dimensions | 1536 |
| Max Input Tokens | 8191 |
| Cost | $0.02 / 1M tokens |
| Typical Listing Cost | ~800 tokens = $0.000016 |
| Batch Size | Max 100 texts/request |

**Batch Processing:**
```typescript
// For multiple listings, use batch API for 50% cost savings
const batchResponse = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: listings.map(l => l.cleanedText), // Array of texts
});

// Cost: $0.02 / 1M tokens (vs $0.04 without batch)
```

**Vector Storage (Qdrant):**
```typescript
await qdrantClient.upsert("listing_embeddings", {
  points: [{
    id: listingId,
    vector: embedding,
    payload: {
      asin: data.asin,
      category: data.category,
      user_id: userId,
    }
  }]
});
```

---

### Stage 5: Analysis (Semantic Gap + Scoring)

#### 5.1 Cosine Similarity Computation

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

#### 5.2 Semantic Dimension Scoring

24 semantic dimensions are evaluated:

| Dimension Group | Dimensions | Weight |
|----------------|-----------|--------|
| **Functional Benefits** | sleep_support, stress_relief, muscle_recovery, skin_health, joint_health, digestive_gentle, energy, barrier_repair, brightening, anti_aging, sensitive_safe, hair_nail | 50% |
| **Target Audience** | pregnant, athletes, mature_skin, sensitive, vegan | 20% |
| **Trust Signals** | clinical_evidence, third_party_tested, certifications, specifications | 20% |
| **Content Quality** | intent_richness, use_cases, differentiation | 10% |

**Dimension Score Calculation:**
```typescript
function scoreDimension(
  listingText: string,
  dimension: string,
  keywords: string[]
): number {
  const text = listingText.toLowerCase();
  let score = 0;
  
  for (const keyword of keywords) {
    if (text.includes(keyword.toLowerCase())) {
      // Check if it's in a prominent position (title/bullet 1)
      const isProminent = text.indexOf(keyword) < 500;
      score += isProminent ? 0.3 : 0.15;
    }
  }
  
  // Check for depth (explanation, mechanism)
  const hasDepth = keywords.some(kw => 
    text.includes(`${kw} mechanism`) ||
    text.includes(`${kw} because`) ||
    text.includes(`${kw} by`) ||
    text.includes(`${kw} through`)
  );
  if (hasDepth) score += 0.2;
  
  return Math.min(score, 1.0);
}
```

#### 5.3 Rufus Compatibility Score (0-100)

```typescript
function calculateRufusScore(
  semanticScores: Record<string, number>,
  contentQuality: number,
  trustSignals: number
): number {
  // Functional benefits average (50% weight)
  const functionalKeys = ['sleep_support', 'stress_relief', 'muscle_recovery', 
    'skin_health', 'digestive_gentle', 'barrier_repair'];
  const functionalAvg = average(functionalKeys.map(k => semanticScores[k] || 0));
  
  // Audience targeting (20% weight)
  const audienceKeys = ['pregnant', 'athletes', 'sensitive', 'vegan'];
  const audienceAvg = average(audienceKeys.map(k => semanticScores[k] || 0));
  
  // Trust signals (20% weight)
  const trustAvg = trustSignals;
  
  // Content quality (10% weight)
  const qualityScore = contentQuality;
  
  const rawScore = 
    functionalAvg * 0.50 +
    audienceAvg * 0.20 +
    trustAvg * 0.20 +
    qualityScore * 0.10;
  
  return Math.round(rawScore * 100);
}
```

#### 5.4 Semantic Gap Analysis

```typescript
function analyzeSemanticGaps(
  currentScores: Record<string, number>,
  targetScores: Record<string, number>
): SemanticGap[] {
  const gaps: SemanticGap[] = [];
  
  for (const [dimension, target] of Object.entries(targetScores)) {
    const current = currentScores[dimension] || 0;
    const gap = target - current;
    
    if (gap > 0.1) { // Only report meaningful gaps
      gaps.push({
        dimension,
        currentScore: current,
        targetScore: target,
        gap,
        priority: gap > 0.5 ? "critical" : gap > 0.3 ? "high" : "medium",
        recommendation: generateRecommendation(dimension, gap),
      });
    }
  }
  
  // Sort by gap size (descending)
  return gaps.sort((a, b) => b.gap - a.gap);
}
```

---

### Stage 6: Output (Optimization Report)

#### 6.1 Optimized Title Generation

```typescript
function generateOptimizedTitle(
  currentTitle: string,
  gaps: SemanticGap[],
  keywords: string[]
): string {
  const maxLength = 200; // Amazon title limit
  
  // Extract brand and key product descriptor
  const brand = extractBrand(currentTitle);
  const productType = extractProductType(currentTitle);
  
  // Build title with high-priority keywords
  const priorityKeywords = gaps
    .filter(g => g.priority === "critical" || g.priority === "high")
    .slice(0, 3)
    .map(g => dimensionToKeyword(g.dimension));
  
  const titleParts = [
    brand,
    productType,
    ...priorityKeywords,
    ...keywords.slice(0, 2),
  ];
  
  let title = titleParts.join(" - ");
  
  // Ensure within Amazon limits
  if (title.length > maxLength) {
    title = title.slice(0, maxLength - 3) + "...";
  }
  
  return title;
}
```

#### 6.2 5-Bullet Framework Generation

| Bullet | Focus | Content Type |
|--------|-------|-------------|
| **1** | Primary Differentiator | Form, absorption, key mechanism |
| **2** | Core Use Case | Sleep/stress/skin + target audience |
| **3** | Safety/Certifications | FDA, GMP, third-party tested |
| **4** | Specifications | Dosage, count, usage instructions |
| **5** | Social Proof/Comparison | Clinical results, vs alternatives |

```typescript
function generateBulletPoints(
  gaps: SemanticGap[],
  category: string,
  brand: string
): string[] {
  const bullets: string[] = [];
  
  // Bullet 1: Primary Differentiator
  const topGap = gaps[0];
  bullets.push(generateDifferentiatorBullet(topGap, brand));
  
  // Bullet 2: Core Use Case
  const useCaseGap = gaps.find(g => 
    ['sleep_support', 'stress_relief', 'skin_health'].includes(g.dimension)
  );
  bullets.push(generateUseCaseBullet(useCaseGap, category));
  
  // Bullet 3: Safety/Certifications
  bullets.push(generateSafetyBullet(category));
  
  // Bullet 4: Specifications
  bullets.push(generateSpecsBullet(category));
  
  // Bullet 5: Social Proof
  bullets.push(generateSocialProofBullet());
  
  return bullets;
}
```

#### 6.3 Q&A Suggestions Generation

```typescript
function generateQASuggestions(
  category: string,
  gaps: SemanticGap[],
  listing: Listing
): QAPair[] {
  const qaTemplates = getQATemplates(category);
  
  return qaTemplates.map(template => ({
    question: template.question,
    optimizedAnswer: fillTemplate(template.answer, listing, gaps),
    category: template.category,
    priority: template.priority,
  }));
}

// Example templates for Health/Supplements:
const healthQATemplates = [
  {
    question: "What form of [ingredient] is this?",
    answer: "This is [form], which is [benefit over other forms]. It's [absorption detail].",
    category: "product_info",
    priority: "high",
  },
  {
    question: "Will this cause [side effect]?",
    answer: "No, [form] is the gentlest form and does not cause [side effect] at recommended doses.",
    category: "safety",
    priority: "critical",
  },
  {
    question: "Is this safe for [audience]?",
    answer: "Consult your healthcare provider. [General safety statement].",
    category: "safety",
    priority: "high",
  },
];
```

---

## 3. Competitor Benchmark Algorithm

### 3.1 Competitor Fetch

```typescript
async function fetchCompetitors(
  asin: string,
  category: string,
  count: number = 5
): Promise<Competitor[]> {
  // Search Amazon for similar products in same category
  const searchResults = await scraper.searchItems({
    keywords: extractKeywordsFromASIN(asin),
    category,
    pageSize: count * 2, // Fetch extra for filtering
  });
  
  // Filter out own product and low-relevance items
  const competitors = searchResults.items
    .filter(item => item.asin !== asin)
    .slice(0, count);
  
  // Fetch detailed data for each competitor
  return Promise.all(competitors.map(async comp => {
    const detail = await scraper.getCatalogItem(comp.asin);
    const embedding = await generateEmbedding(detail);
    
    return {
      asin: comp.asin,
      title: detail.title,
      brand: detail.brand,
      price: comp.price,
      rating: comp.rating,
      reviewCount: comp.reviewCount,
      score: await calculateRufusScore(detail),
      embeddingSimilarity: cosineSimilarity(mainEmbedding, embedding),
    };
  }));
}
```

### 3.2 Competitor Comparison Matrix

| Metric | Your Product | Competitor 1 | Competitor 2 | Gap |
|--------|-------------|-------------|-------------|-----|
| Rufus Score | 65 | 78 | 72 | -13 / -7 |
| Title Quality | Good | Excellent | Good | — |
| Bullet Depth | 3/5 | 5/5 | 4/5 | -2 / -1 |
| Certifications | 2 | 4 | 3 | -2 / -1 |
| Q&A Count | 5 | 18 | 12 | -13 / -7 |

---

## 4. Performance Optimization

### 4.1 Caching Strategy

| Cache Layer | Key | TTL | Purpose |
|------------|-----|-----|---------|
| Scraper Response | `scraper:{asin}:{marketplace}` | 1 hour | Avoid repeated Amazon calls |
| Embedding | `emb:{asin}` | 24 hours | Embeddings don't change often |
| Intent Vectors | `intent:{category}` | 7 days | Reference data is stable |
| Analysis Report | `report:{listingId}:latest` | 1 hour | Recent reports |

### 4.2 Async Processing

For Pro/Enterprise plans with competitor analysis:
```typescript
// Background job for heavy analysis
async function analyzeAsync(listingId: number) {
  // Step 1: Quick response (title + bullets)
  const quickReport = await generateQuickReport(listingId);
  
  // Step 2: Background processing (competitors + deep analysis)
  setImmediate(async () => {
    const fullReport = await generateFullReport(listingId);
    await notifyUser(listingId, fullReport);
  });
  
  return quickReport; // Return immediately
}
```

---

## 5. Cost Analysis

### 5.1 Per-Analysis Cost Breakdown

| Component | Cost per Analysis | Notes |
|-----------|------------------|-------|
| OpenAI Embedding | $0.000016 | ~800 tokens @ $0.02/1M |
| Qdrant Storage | $0 | Self-hosted |
| Qdrant Query | $0 | Self-hosted |
| Scraper API Call | $0 | Apify / Rainforest |
| **Total** | **~$0.0002** | Including overhead |

### 5.2 Monthly Cost Projections

| Users | Analyses/Month | OpenAI Cost | Infrastructure |
|-------|---------------|-------------|----------------|
| 20 (Starter) | 400 | $0.006 | $33 VPS |
| 100 (mixed) | 3,000 | $0.05 | $33 VPS |
| 500 (mixed) | 15,000 | $0.25 | $66 VPS |
| 1,000 (mixed) | 40,000 | $0.65 | $100 VPS |

---

## 6. Model Selection Rationale

### 6.1 Why text-embedding-3-small?

| Model | Dimensions | MTEB Score | Cost/1M | Latency | Choice |
|-------|-----------|-----------|---------|---------|--------|
| text-embedding-3-large | 3072 | 64.6% | $0.13 | Higher | Overkill |
| **text-embedding-3-small** | **1536** | **62.3%** | **$0.02** | **Fast** | **Best balance** |
| all-mpnet-base-v2 | 768 | ~62% | Self-host | Medium | Future option |
| all-MiniLM-L6-v2 | 384 | ~60% | Self-host | Fastest | Edge deployment |

**Decision:** text-embedding-3-small offers the best cost-performance ratio for our use case. 1536 dimensions provide sufficient semantic resolution for listing analysis.

### 6.2 Future Model Upgrades

- **Phase 2:** Fine-tuned embedding model on Amazon listing corpus
- **Phase 3:** Category-specific models (health vs beauty vs supplements)
- **Phase 4:** Self-hosted open-source alternative for cost reduction
