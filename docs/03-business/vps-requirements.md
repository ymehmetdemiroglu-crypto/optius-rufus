# VPS Üzerinde SaaS Listing Optimizasyon Platformu: Komple İhtiyaç Listesi ve Teknik Rota

## TL;DR

VPS üzerinde bir Amazon listing optimizasyon SaaS platformu kurmak için teknik olarak **7 ana bileşene** ihtiyacın var: **VPS Hosting** (~$33/ay), **Web Uygulaması** (React + Node.js/Python), **Veritabanı** (MySQL/PostgreSQL + Vector DB), **AI/Embedding Katmanı** (OpenAI API ~$2–5/ay), **Amazon SP-API Entegrasyonu** (ücretsiz), **Ödeme Sistemi** (Stripe/Paddle ~%2.9–5% komisyon), ve **Monitoring/Auth** (~$20/ay). Toplam **MVP aylık maliyet ~$100–150/ay** (₺3,500–5,250). Geliştirme süresi **17 hafta (~4 ay)** ve geliştirme maliyeti **~$12,000–20,000** (dışarıdan yazılımcı ile). Eğer kendin yazarsan maliyet sadece **vakit** — teknoloji yığını React + TypeScript + tRPC + Drizzle ORM + Hono + MySQL ile tam olarak senin ihtiyacını karşılıyor. Bu rehber, tüm bileşenleri, maliyetleri, karşılaştırmaları ve adım adım uygulama planını içeriyor.

---

## 1. Teknik Mimarinin Genel Görünümü

### 1.1 Sistem Akış Diyagramı

Platformunun çalışma mantığı basit ama güçlü: müşteri web arayüzüne giriş yapar → Amazon Seller Central hesabını bağlar (SP-API) → sistem otomatik olarak listing verilerini çeker → AI embedding katmanı listing'i ve rakip ürünleri vektör uzayına dönüştürür → semantic gap analizi yapar → optimize edilmiş listing önerisi (title, bullets, Q&A, A+ content) sunar → müşteri onaylar ve doğrudan Amazon'a gönderir.

Bu mimarinin gücü, **tek tıkla listing optimizasyonu** vaat etmesinde. Müşteri aylık abonelik karşılığında platforma giriyor, ASIN'ini yazıyor, sistem tüm analizi yapıyor ve hazır optimize edilmiş içerik üretiyor. Geleneksel ajans modelinde senin manuel olarak her listing için saatler harcaman gerekirken, SaaS modelinde **sistem otomatikleştiriyor** ve sen sadece platformu yönetiyorsun — bu, listing başı marjinal maliyeti **neredeyse sıfıra** indirir.

### 1.2 Bileşen Haritası

| Bileşen | Teknoloji Önerisi | Aylık Maliyet | Kurulum Maliyeti | Kritiklik |
|---------|------------------|--------------|-----------------|-----------|
| **VPS Hosting** | Hetzner CPX31 (8 vCPU / 32 GB) [^101^] | $33/ay | $0 | Kritik |
| **Web Uygulaması** | React 19 + TypeScript + Vite [^SKILL1^] | $0 | Geliştirme | Kritik |
| **Backend API** | Hono + tRPC 11 + Drizzle ORM [^SKILL2^] | $0 | Geliştirme | Kritik |
| **Veritabanı** | MySQL (Drizzle ORM) + pgvector [^SKILL2^] | $0 (VPS üzerinde) | $0 | Kritik |
| **Vector Database** | Qdrant self-hosted veya Pinecone [^107^] | $0–$25/ay | $0 | Yüksek |
| **AI Embedding** | OpenAI text-embedding-3-small [^97^] | $2–5/ay | $0 | Kritik |
| **Amazon SP-API** | Selling Partner API [^120^] | $0 | $0 | Kritik |
| **Ödeme Sistemi** | Stripe veya Paddle [^100^] | %2.9–5% komisyon | $0 | Kritik |
| **Domain + SSL** | Namecheap/Cloudflare | $15/ay | $50/yıl | Orta |
| **Monitoring** | Sentry + Grafana | $20/ay | $0 | Orta |
| **Email Servisi** | Resend/Postmark [^110^] | $10–50/ay | $0 | Orta |

**Toplam MVP Aylık Maliyet: ~$100–150/ay (₺3,500–5,250)**

---

## 2. Bileşen 1: VPS Hosting — Platformun Temeli

### 2.1 VPS Seçimi: Hetzner vs AWS vs DigitalOcean

SaaS platformun için VPS seçimi, **hem maliyet hem performans** açısından belirleyici bir karar. 2026 yılında pazarda üç ana oyuncu öne çıkıyor ve her birinin farklı bir güçlü yönü var [^101^].

**AWS**, 200+ yönetilen hizmeti ve HIPAA/FedRAMP gibi en kapsamlı compliance sertifikalarıyla kurumsal dünyanın gözdesi. Ancak aynı 8 vCPU / 32 GB yapılandırma AWS'de **~$240/ay** (m5.2xlarge) iken, Hetzner'da sadece **€30 (~$33)/ay** [^101^]. AWS'nin gizli maliyetleri — NAT Gateway ($30–$50/ay), Load Balancer ($20–$50/ay), CloudWatch, ve özellikle **egress ($0.09/GB)** — startup bütçelerini hızla tüketiyor. 50 TB/ay trafik için AWS **~$4,500** egress ücreti çıkarırken, Hetzner aynı trafiği **20 TB dahil, sonrası €1/TB** ile karşılıyor [^101^].

**Hetzner**, fiyat-performans lideri olarak öne çıkıyor. CPX31 (8 vCPU / 32 GB / 160 GB NVMe) sadece **€30/ay** (~$33). 20 TB egress dahil, AMD EPYC işlemciler, ve Almanya merkezli veri merkezleri ile GDPR uyumluluğu varsayılan olarak geliyor. Dezavantajı, AWS kadar geniş bir yönetilen hizmet kataloğunun olmaması — ancak bir listing optimizasyon SaaS'ı için ihtiyaç duyacağın temel hizmetlerin (compute, storage, network) hepsi mevcut.

**DigitalOcean**, geliştirici deneyimi ve tahmin edilebilir fiyatlandırma ile öne çıkıyor. App Platform (Heroku tarzı PaaS) ve Managed Kubernetes gibi hizmetler, teknik ekibi olmayan ekipler için cazip. 8 vCPU / 32 GB droplet **$168/ay** [^101^] — Hetzner'dan **5x daha pahalı** ama yönetilen veritabanı, load balancer gibi hizmetler dahil.

| Sağlayıcı | 8 vCPU / 32 GB | Egress (50 TB) | Object Storage (1 TB) | Toplam (~) | Öneri |
|-----------|---------------|---------------|---------------------|-----------|-------|
| **Hetzner** [^101^] | $33/ay | ~$30 (20TB dahil) | $5/ay | **~$68/ay** | **En İyi** |
| **DigitalOcean** [^101^] | $168/ay | ~$490 (1TB dahil) | $25/ay | **~$683/ay** | Orta |
| **AWS** [^101^] | $240/ay | ~$4,500 | $23/ay | **~$4,763/ay** | Gerektiğinde |

**Öneri:** MVP aşamasında **Hetzner CPX31** (€30/ay) ile başla. Kullanıcı sayısı 1000+ veya enterprise compliance gereksinimi ortaya çıktığında AWS'ye geçiş planla. Hybrid strateji (Hetzner'da compute + AWS'de S3/CloudFront) da düşünülebilir.

### 2.2 Sunucu Yapılandırması

Hetzner CPX31 üzerinde çalışacak platformun için önerilen yapılandırma şu şekilde:

- **OS:** Ubuntu 24.04 LTS (server edition)
- **Docker + Docker Compose:** Tüm servisleri containerize etmek için
- **Nginx (reverse proxy):** SSL termination, load balancing, static file serving
- **MySQL 8.0:** Drizzle ORM ile type-safe veritabanı işlemleri [^SKILL2^]
- **Qdrant (Docker container):** Vector database, self-hosted [^107^]
- **Node.js 20:** Backend runtime
- **PM2:** Node.js process manager (production)
- **Let's Encrypt:** Otomatik SSL sertifikası yenileme

```yaml
# docker-compose.yml örneği
version: '3.8'
services:
  app:
    build: .
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=mysql://user:pass@db:3306/amazon_optimizer
      - OPENAI_API_KEY=${OPENAI_API_KEY}
  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=secret
      - MYSQL_DATABASE=amazon_optimizer
    volumes: ["mysql_data:/var/lib/mysql"]
  qdrant:
    image: qdrant/qdrant:latest
    ports: ["6333:6333"]
    volumes: ["qdrant_data:/qdrant/storage"]
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf"]
```

---

## 3. Bileşen 2: Web Uygulaması ve Backend

### 3.1 Frontend: React 19 + TypeScript + Tailwind CSS + shadcn/ui

Platformunun kullanıcı arayüzü için **React 19 + TypeScript + Vite** kombinasyonu ideal bir seçim [^SKILL1^]. Bu stack, modern web uygulamaları için endüstri standardı haline geldi ve shadcn/ui ile birlikte **40+ hazır bileşen** (buton, kart, tablo, form, dialog, chart vb.) anında kullanılabilir durumda.

Kullanıcı deneyimi açısından platformun şu ana sayfalara ihtiyacı var: **Dashboard** (müşterinin listinglerinin performans özeti), **ASIN Analyzer** (listing yükleme ve analiz başlatma), **Optimization Report** (semantic gap analizi sonuçları ve öneriler), **Competitor Benchmark** (rakip karşılaştırması), **Q&A Manager** (soru-cevap optimizasyonu), ve **Settings** (hesap ayarları, abonelik yönetimi).

Vite ile production build altyapısı da hazır — tree-shaking, code splitting, asset compression, cache-busting hashes gibi optimizasyonlar otomatik olarak yapılıyor [^SKILL1^].

### 3.2 Backend: Hono + tRPC 11 + Drizzle ORM + MySQL

Backend için **Hono** (hafif ve hızlı web framework) + **tRPC 11** (end-to-end type-safe API) + **Drizzle ORM** (type-safe SQL query builder) + **MySQL** kombinasyonu, skill setimizin doğal bir uzantısı [^SKILL2^]. Bu kombinasyonun en büyük avantajı **type safety** — frontend ve backend arasında paylaşılan tipler sayesinde, API çağrılarında hata yapma olasılığı neredeyse sıfır.

**tRPC router'ları** şu şekilde yapılandırılabilir:

```typescript
// api/router.ts
export const appRouter = router({
  listing: listingRouter,      // Listing CRUD + analiz
  optimization: optimizeRouter, // AI optimizasyon motoru
  competitor: competitorRouter, // Rakip analizi
  qa: qaRouter,                // Q&A yönetimi
  user: userRouter,            // Kullanıcı yönetimi
  payment: paymentRouter,      // Abonelik ve ödemeler
  spapi: spapiRouter,          // Amazon SP-API entegrasyonu
});
```

Her router, Zod validasyonu ile input/output güvenliğini sağlıyor ve Drizzle ORM ile veritabanı işlemleri tip-güvenli hale geliyor [^SKILL2^]. Örneğin, listing analizi endpoint'i:

```typescript
// api/routers/optimization.ts
export const optimizeRouter = router({
  analyze: publicProcedure
    .input(z.object({ asin: z.string().length(10), marketplace: z.string() }))
    .mutation(async ({ input }) => {
      // 1. SP-API'den listing verisini çek
      const listing = await fetchListingFromSPAPI(input.asin);
      // 2. Embedding oluştur
      const embedding = await createEmbedding(listing);
      // 3. Semantic gap analizi yap
      const gaps = await analyzeSemanticGap(embedding);
      // 4. Optimizasyon önerileri üret
      return generateOptimizationReport(listing, gaps);
    }),
});
```

---

## 4. Bileşen 3: AI ve Embedding Katmanı

### 4.1 Embedding Stratejisi: API vs Self-Host Kararı

Listing optimizasyonunun kalbi **embedding katmanı** — yani metinleri vektör uzayına dönüştürme işlemi. Bu karar, platformunun **maliyet yapısını** doğrudan etkileyen en kritik teknik seçim. Üç opsiyon var: **API kullanmak** (OpenAI, Cohere), **CPU üzerinde self-host** (Ollama), ve **GPU üzerinde self-host** [^112^][^116^].

**OpenAI text-embedding-3-small API**, $0.02/1M token [^97^] fiyatıyla maliyet-performans lideri. Bir tipik Amazon listing'i (title + 5 bullets + description) ~800 token. 100 listing için 80K token = **$0.0016**. Aylık 10,000 listing analizi yapsan maliyet sadece **$0.16**. Bu maliyet pratik olarak yok denecek kadar düşük. Batch API ile %50 indirim alarak **$0.08/10K listing** seviyesine inebilirsin [^97^].

**Self-hosting**, embedding için LLM self-hosting kadar maliyetli değil çünkü embedding modelleri çok daha küçük. Ollama üzerinde `nomic-embed-text` veya `mxbai-embed-large` modeli, **CPU-only VPS**'te bile çalışıyor [^119^]. Ancak throughput düşük — CPU üzerinde tek bir 7B model ~1 token/saniye [^119^]. GPU (RTX 4060 Ti, ~$300 satın alma veya $400–700/ay kiralama) ile çok daha iyi performans alınır [^114^][^118^].

| Model | Maliyet (100K listing/ay) | Kurulum | Performans | Öneri |
|-------|--------------------------|---------|-----------|-------|
| **OpenAI 3-small API** [^97^] | **$2/ay** | Anında | Mükemmel | **En İyi (MVP)** |
| **Cohere embed API** [^103^] | $5/ay | Anında | Mükemmel | Alternatif |
| **Ollama (CPU)** [^119^] | $50/ay (VPS) | 2–4 saat | Yavaş | Veri gizliliği gerekirse |
| **Ollama (GPU - RTX 4060 Ti)** [^114^] | $400–700/ay | 4–8 saat | Hızlı | >1M listing/ay sonrası |

**Öneri:** MVP aşamasında **OpenAI text-embedding-3-small API** ile başla. Maliyet neredeyse sıfır, kurulum yok, ve en yüksek kaliteyi garanti ediyor. Aylık maliyet $10'u geçtiğinde (yaklaşık 500K listing), Ollama self-host'a geçiş planla.

### 4.2 Vector Database: Qdrant Self-Hosted

Embedding vektörlerini saklamak ve similarity search yapmak için **vector database** gerekli. 2026'nın en popüler seçenekleri: Pinecone (yönetilen), Qdrant (açık kaynak + cloud), Weaviate, Milvus, ve pgvector [^107^][^111^].

Pinecone, en kolay kurulumu sunuyor ama kullanım bazlı fiyatlandırma ile maliyeti öngörülemiyor — 10M vektör için **$29–$500+/ay** aralığında değişebiliyor [^107^]. Self-hosted **Qdrant** ise Docker container olarak VPS üzerinde **$0 ek maliyet** ile çalışıyor. Performans olarak Qdrant, 10M vektör altındaki iş yüklerinde Pinecone'a çok yakın latency (30–40ms p99) sunuyor [^107^].

**Qdrant self-hosted kurulumu:**

```bash
# Docker ile 30 saniyede kurulum
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

pgvector alternatif olarak mevcut MySQL/PostgreSQL veritabanına eklenebilir ama 5M+ vektörde performans düşüyor [^111^]. Qdrant, Rust-native implementasyonu ile daha yüksek concurrency ve daha düşük latency sunuyor.

---

## 5. Bileşen 4: Amazon SP-API Entegrasyonu

### 5.1 SP-API Nedir ve Nasıl Çalışır?

Amazon Selling Partner API (SP-API), üçüncü taraf geliştiricilere Amazon Seller Central verilerine programatik erişim sunan Amazon'un resmi API'sidir [^120^]. Listing optimizasyonu platformun için en kritik SP-API endpoint'leri şunlar:

- **`catalogItems` API:** Ürün detaylarını çekmek (title, description, images, attributes)
- **`listingsItems` API:** Listing içeriğini okumak ve güncellemek
- **`productPricing` API:** Fiyatlandırma ve rekabet analizi (getCompetitiveSummary — 20 ASIN'a kadar batch) [^120^]
- **`reports` API:** Satış raporları, inventory raporları
- **`notifications` API:** Fiyat değişikliği, inventory değişikliği bildirimleri

SP-API kullanımı **ücretsiz** — Amazon geliştirici hesabı açmak ve uygulamayı onaylatmak gerekiyor. Onay süreci genellikle **2–4 hafta** sürüyor ve Amazon'un güvenlik incelemesinden geçmek zorunlu.

### 5.2 OAuth Entegrasyonu

Müşterinin Amazon hesabını platformuna bağlamak için **OAuth 2.0** akışı kullanılıyor. Müşteri "Amazon ile Giriş Yap" dediğinde, Amazon'un yetkilendirme sayfasına yönlendiriliyor, izin veriyor, ve platform SP-API token'larını alıyor. Bu token'lar ile müşterinin listing verilerine okuma/yazma erişimi sağlanıyor.

```typescript
// OAuth akışı örneği
// 1. Kullanıcıyı Amazon'a yönlendir
const authUrl = `https://sellercentral.amazon.com/apps/authorize/confirm/amzn1.sp.solution.xxx?redirect_uri=${callbackUrl}`;

// 2. Callback'te authorization code al
// 3. Code ile access_token + refresh_token değişimi
// 4. refresh_token ile süresiz erişim (access_token her saat yenilenir)
```

**Önemli:** SP-API ile listing güncelleme (write) yetkisi almak için Amazon'dan **PII (Personally Identifiable Information) onayı** gerekebilir. Bu daha katı bir inceleme süreci ama optimizasyon platformun için kritik — müşterinin optimize edilmiş listing'ini doğrudan Amazon'a yazabilmek için bu yetki şart.

---

## 6. Bileşen 5: Ödeme ve Abonelik Sistemi

### 6.1 Stripe vs Paddle vs Lemon Squeezy

SaaS platformun için üç ana ödeme seçeneği var ve her birinin farklı bir değer önerisi mevcut [^100^][^102^].

**Stripe**, geliştirici deneyimi ve API kalitesi açısından altın standart. Abonelik yönetimi (Stripe Billing), fatura, vergi hesaplama (Stripe Tax), ve Connect (pazar yeri modeli) gibi tüm SaaS ihtiyaçlarını karşılıyor. Ancak gerçek maliyet yüzeyde göründüğünden yüksek: base fee **2.9% + $0.30**, Stripe Tax **~0.5%**, uluslararası kart **+1–1.5%**, ve cross-border **+1%** [^100^]. $100'lık bir işlem için toplam maliyet **~$5.20** (yani %5.2). Stripe'ı kullanmak için ABD veya AB'de bir şirket kurmak veya Stripe Atlas ($500) ile Delaware LLC açmak gerekiyor.

**Paddle**, "Merchant of Record" (MoR) modeliyle vergi yükümlülüğünü üzerine alıyor. **%5 + $0.50** flat fee ile 200+ ülkede VAT/sales tax yönetimi dahil [^100^]. Global satış yapan SaaS'lar için Stripe + ayrı vergi çözümünden daha ekonomik olabilir. Dezavantajı manuel onay süreci ve bazı "gri" nişlerde (AI araçlar gibi) reddedilebilme riski.

**Lemon Squeezy** (Stripe tarafından satın alındı), solopreneur'lar için tasarlanmış. **%5 + $0.50** fee, affiliate sistemi dahil, 10 dakikada ödeme almaya başlama [^100^]. En hızlı kurulum ama Stripe satın alması sonrası geliştirme hızı yavaşladı.

| Gateway | İşlem Ücreti | Vergi Yönetimi | Kurulum Süresi | En İyi Senaryo |
|---------|-------------|---------------|---------------|---------------|
| **Stripe** [^102^] | 2.9% + $0.30 (ABD) / ~3.4% + €0.25 (AB) | Ayrı: +0.5% | 1–2 gün | ABD/AB odaklı, teknik ekip var |
| **Paddle** [^100^] | %5 + $0.50 flat | Dahil (200+ ülke) | 3–7 gün | Global satış, vergi yükü olmasın isteyen |
| **Lemon Squeezy** [^100^] | %5 + $0.50 flat | Dahil | 10 dakika | Hızlı başlangıç, solo founder |

**Öneri:** MVP aşamasında **Paddle** ile başla. Vergi yönetimini üstlenmesi ve global kapsama alanı, Amazon satıcılarının dünya çapında dağıldığı göz önüne alındığında kritik avantaj. Türkiye'deki müşteriler için özel entegrasyon gerekebilir — bu durumda Stripe Atlas ile ABD LLC kurup Stripe kullanmak daha uygun olabilir.

### 6.2 Fiyatlandırma Modeli

Platformun için önerilen abonelik katmanları:

| Plan | Fiyat | Özellikler | Hedef Müşteri |
|------|-------|-----------|--------------|
| **Free** | $0 | 3 listing analizi/ay, temel rapor | Yeni satıcı, deneme |
| **Starter** | $49/ay | 20 listing/ay, full rapor, Q&A önerileri | 1–10 ASIN satıcı |
| **Pro** | $99/ay | 100 listing/ay, rakip analizi, A+ Content | 10–50 ASIN marka |
| **Enterprise** | $299/ay | Sınırsız, API erişimi, özel onboarding | 50+ ASIN, ajans |

Bu fiyatlandırma, mevcut Amazon seller araçlarıyla (Helium 10 $129/ay, Jungle Scout $49/ay, ZonGuru $49/ay) [^113^][^115^] rekabetçi konumda ve AI-özel optimizasyon değer önerisi ile **premium** konumlandırma sunuyor.

---

## 7. Bileşen 6: Veritabanı ve Veri Modeli

### 7.1 Drizzle ORM ile Veri Şeması

MySQL + Drizzle ORM kullanarak platformunun veri modeli şu şekilde yapılandırılabilir [^SKILL2^]:

```typescript
// db/schema.ts
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  subscriptionTier: mysqlEnum("tier", ["free", "starter", "pro", "enterprise"]).default("free"),
  stripeCustomerId: varchar("stripe_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const amazonAccounts = mysqlTable("amazon_accounts", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  sellerId: varchar("seller_id", { length: 50 }).notNull(),
  marketplace: varchar("marketplace", { length: 10 }).notNull(), // US, UK, DE...
  refreshToken: text("refresh_token").notNull(), // SP-API refresh token
  isActive: boolean("is_active").default(true),
});

export const listings = mysqlTable("listings", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).references(() => users.id),
  asin: varchar("asin", { length: 10 }).notNull(),
  title: text("title"),
  bullets: json("bullets"), // Array of bullet points
  description: text("description"),
  category: varchar("category", { length: 100 }),
  currentScore: decimal("current_score", { precision: 5, scale: 2 }), // 0-100
  embeddingVector: json("embedding_vector"), // Stored as JSON array
  lastAnalyzed: timestamp("last_analyzed"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const optimizationReports = mysqlTable("optimization_reports", {
  id: serial("id").primaryKey(),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }).references(() => listings.id),
  rufusCompatibilityScore: int("rufus_score"), // 0-100
  semanticGaps: json("semantic_gaps"), // Array of gap analysis
  optimizedTitle: text("optimized_title"),
  optimizedBullets: json("optimized_bullets"),
  optimizedQAs: json("optimized_qas"),
  competitorBenchmarks: json("competitor_benchmarks"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 7.2 Vector Storage (Qdrant)

Embedding vektörleri MySQL'de JSON olarak saklanabilir ama similarity search (cosine similarity) için özel bir vector DB daha performanslı. Qdrant'ta koleksiyon yapısı:

```python
# Qdrant koleksiyon yapılandırması
from qdrant_client import QdrantClient

client = QdrantClient("localhost", port=6333)

# Listing embeddings koleksiyonu
create_collection(
    collection_name="listing_embeddings",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
)

# Intent query embeddings koleksiyonu  
create_collection(
    collection_name="intent_embeddings",
    vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
)
```

---

## 8. Bileşen 7: Monitoring, Güvenlik ve DevOps

### 8.1 Monitoring Stack

Production ortamında **Sentry** (hata takibi) + **Grafana + Prometheus** (metrik ve dashboard) kombinasyonu yeterli. Sentry'nin ücretsiz tier'ı 5,000 hata/ay kapsıyor [^110^], startup aşamasında uzun süre yetecektir. Grafana ve Prometheus Docker container olarak VPS üzerinde çalışıyor.

**Monitör edilmesi gereken kritik metrikler:**
- API response time (p50, p95, p99)
- Embedding API maliyeti (günlük/aylık)
- SP-API rate limit kullanımı
- Kullanıcı kayıt → analiz tamamlama dönüşüm hunisi
- Abonelik churn rate

### 8.2 Güvenlik Gereksinimleri

- **HTTPS (Let's Encrypt):** Tüm trafik şifreli
- **JWT Authentication:** Kimi OAuth veya custom JWT session [^SKILL2^]
- **API Rate Limiting:** SP-API rate limit'leri (1 request/2 seconds) aşılmamalı
- **Input Validation:** Zod ile tüm tRPC input'ları validasyonu [^SKILL2^]
- **SQL Injection Koruması:** Drizzle ORM parametrik sorgular [^SKILL2^]
- **CORS:** Sadece kendi domain'inden API çağrılarına izin
- **Data Encryption:** SP-API token'ları environment variable'da, database'de encrypted

---

## 9. MVP Geliştirme: Zaman Çizelgesi ve Maliyet

### 9.1 4 Aylık Geliştirme Planı

MVP (Minimum Viable Product) kapsamında platformun temel özellikleri şunlar olmalı: kullanıcı kayıt/giriş, Amazon hesap bağlama (SP-API OAuth), ASIN ile listing çekme, embedding + semantic gap analizi, optimize edilmiş listing önerisi (title + bullets), ve rapor görüntüleme.

| Faz | Süre | Teslimat | Maliyet* |
|-----|------|---------|---------|
| **Faz 1: Tasarım & UX** | 2 hafta | Wireframe, UI mockup, kullanıcı akışları | $800 |
| **Faz 2: Backend API** | 4 hafta | tRPC router'ları, DB schema, auth, SP-API entegrasyonu | $3,200 |
| **Faz 3: Frontend UI** | 4 hafta | Dashboard, ASIN analyzer, rapor sayfaları | $3,200 |
| **Faz 4: AI Entegrasyonu** | 3 hafta | Embedding, cosine similarity, gap analizi, öneri motoru | $2,400 |
| **Faz 5: Test & Deploy** | 2 hafta | QA, güvenlik testi, production deploy, monitoring | $800 |
| **Faz 6: Ödeme Sistemi** | 2 hafta | Paddle/Stripe entegrasyonu, abonelik yönetimi | $1,600 |
| **TOPLAM** | **17 hafta (~4 ay)** | **Çalışan MVP** | **~$12,000** |

*$40/saat freelancer maliyeti baz alınmıştır. Kendi geliştirirsen maliyet $0 (sadece zaman).*

### 9.2 Kendi Geliştirme Yol Haritası (Ücretsiz)

Eğer kendin geliştireceksen, teknoloji yığının zaten **webapp-building + backend-building** skill'leri ile tam olarak hizalanıyor [^SKILL1^][^SKILL2^]. Adım adım plan:

**Hafta 1–2: Altyapı**
- Hetzner VPS kurulumu (Ubuntu 24.04, Docker)
- `webapp-building` init → `backend-building` graft
- MySQL + Qdrant Docker compose up
- Domain al + DNS ayarla + SSL (Let's Encrypt)

**Hafta 3–6: Backend**
- Drizzle ORM schema tanımla (`db/schema.ts`)
- tRPC router'ları oluştur (auth, listing, optimization)
- Amazon SP-API OAuth entegrasyonu
- Kimi OAuth auth flow (skill tarafından sağlanan) [^SKILL2^]

**Hafta 7–10: Frontend**
- shadcn/ui bileşenleri ile Dashboard sayfası
- ASIN Analyzer form + sonuç ekranı
- Optimization Report görselleştirme (chart, tablo)

**Hafta 11–13: AI Motor**
- OpenAI embedding API entegrasyonu
- Cosine similarity hesaplama
- Semantic gap analizi algoritması
- Optimizasyon öneri motoru

**Hafta 14–15: Ödeme & Polish**
- Paddle/Stripe entegrasyonu
- Abonelik katmanları (Free/Starter/Pro)
- Email bildirimleri (Resend)

**Hafta 16–17: Launch**
- QA ve bugfix
- Production deploy
- Beta kullanıcıları ile test

---

## 10. Aylık İşletme Maliyeti ve Kârlılık Projeksiyonu

### 10.1 Aylık Sabit Maliyetler

| Maliyet Kalemi | MVP (0–100 kullanıcı) | Büyüme (100–1000) | Ölçek (1000+) |
|---------------|---------------------|------------------|--------------|
| **VPS (Hetzner)** | $33/ay [^101^] | $66 (2x CPX31) | $132 (4x) |
| **AI Embedding API** | $2–5/ay [^97^] | $20–50/ay | $100–200/ay |
| **Vector DB (Qdrant)** | $0 (self-host) | $0 | $25 (Pinecone) |
| **Ödeme Gateway** | $0 (komisyon hariç) | $0 | $0 |
| **Domain + SSL** | $15/ay | $15/ay | $15/ay |
| **Monitoring** | $0 (Sentry free) | $20/ay | $50/ay |
| **Email (Resend)** | $0 (10K/ay free) | $10/ay | $30/ay |
| **TOPLAM** | **~$50–55/ay** | **~$111–151/ay** | **~$352–452/ay** |

### 10.2 Gelir Projeksiyonu ve Break-Even

| Metrik | MVP (Ay 1–6) | Büyüme (Ay 7–12) | Ölçek (Yıl 2) |
|-------|-------------|----------------|-------------|
| **Kullanıcı Sayısı** | 20–50 | 100–300 | 500–1000 |
| **Ücretli Kullanıcı (%)** | 15% | 20% | 25% |
| **Ort. Aylık Gelir/Kullanıcı** | $65 | $75 | $85 |
| **Aylık Gelir (MRR)** | $195–488 | $1,500–4,500 | $10,625–21,250 |
| **Aylık Maliyet** | $55 | $151 | $452 |
| **Brüt Kâr** | $140–433 | $1,349–4,349 | $10,173–20,798 |
| **Kâr Marjı** | **72–89%** | **90–97%** | **96–98%** |

**Break-even noktası sadece 1–2 ücretli kullanıcı** ($49/ay Starter plan). 50 ücretli kullanıcıya ulaştığında aylık net kâr **~$3,000+** ve yıllık **~$36,000+** — bu, tamamen pasif gelir çünkü platform otomatik çalışıyor.

---

## 11. Rakip Analizi ve Farklılaştırma

### 11.1 Mevcut Listing Optimizasyon Araçları

Pazarda Helium 10 ($129/ay) [^113^], Jungle Scout ($49/ay) [^113^], ZonGuru ($49/ay) [^113^], SellerSprite ($1 ilk ay) [^117^], ve Epinium (€99/ay) [^115^] gibi araçlar var. Ancak bu araçların hiçbiri **AEO (AI odaklı semantic optimizasyon)** sunmuyor — hepsi geleneksel keyword-based optimizasyon yapıyor.

Helium 10 Şubat 2026'da Rufus-optimizasyon şablonları ekledi [^115^] ama bu sadece format değişikliği — semantic gap analizi, embedding bazlı rakip karşılaştırması, ve "Rufus Compatibility Score" gibi kavramlar pazarda henüz yok.

Senin platformunun **tek ve güçlü farklılaştırıcısı** bu: **AI-native listing optimizasyon** — rakipler keyword stuffing'e odaklanırken, sen semantic meaning ve intent alignment'a odaklanıyorsun. Bu, Amazon'un COSMO ve Rufus sistemlerinin yükselişiyle birlikte **geleceğin optimizasyonu**.

### 11.2 Farklılaştırma Matrisi

| Özellik | Helium 10 | Jungle Scout | ZonGuru | **Senin Platformun** |
|---------|----------|-------------|---------|---------------------|
| Keyword Research | Evet | Evet | Evet | Temel |
| Listing Builder | Evet | Evet | Evet | **AI-özel** |
| Semantic Gap Analysis | Hayır | Hayır | Hayır | **Evet** |
| Rufus Compatibility Score | Hayır | Hayır | Hayır | **Evet** |
| Embedding-based Benchmark | Hayır | Hayır | Hayır | **Evet** |
| Q&A Optimizasyonu | Kısmi | Hayır | Hayır | **Evet** |
| SP-API Otomasyon | Sınırlı | Hayır | Hayır | **Tam** |
| Fiyat | $129/ay | $49/ay | $49/ay | **$49–99/ay** |

---

## 12. Özet ve Önerilen Yol Haritası

### 12.1 Başlangıç İçin İhtiyaç Listesi (Checklist)

**Hemen Bugün Başlayabileceklerin:**
- [ ] Hetzner CPX31 VPS kiralama (€30/ay)
- [ ] Domain satın alma (~$10/yıl)
- [ ] webapp-building + backend-building init
- [ ] MySQL + Qdrant Docker compose kurulumu
- [ ] Amazon Developer hesabı açma (SP-API için)

**İlk 2 Hafta İçinde Tamamlanacaklar:**
- [ ] Drizzle ORM schema tanımlama (users, listings, reports)
- [ ] tRPC auth router'ı (Kimi OAuth) [^SKILL2^]
- [ ] Amazon SP-API OAuth entegrasyonu
- [ ] Temel Dashboard UI (shadcn/ui)

**İlk Ay Sonunda:**
- [ ] ASIN ile listing çekme (SP-API catalogItems)
- [ ] OpenAI embedding API entegrasyonu
- [ ] Basit semantic gap analizi
- [ ] Optimize edilmiş title/bullet önerisi

**Beta Launch (Ay 2–3):**
- [ ] Paddle ödeme entegrasyonu
- [ ] Abonelik katmanları (Free/Starter/Pro)
- [ ] 5–10 beta kullanıcı ile test
- [ ] Hata düzeltme ve polish

**Public Launch (Ay 4+):**
- [ ] Marketing sitesi
- [ ] Amazon seller gruplarında tanıtım
- [ ] Fiverr/Upwork profiline SaaS ekle
- [ ] Retainer müşterilerini platforma taşı

### 12.2 En Kritik Kararlar

| Karar | Öneri | Neden |
|-------|-------|-------|
| **VPS** | Hetzner CPX31 | 5x daha ucuz, 20TB egress dahil |
| **AI Embedding** | OpenAI API (başlangıç) | $2/ay, en iyi kalite, kurumsuz |
| **Vector DB** | Qdrant self-host | $0 maliyet, iyi performans |
| **Ödeme** | Paddle | Vergi dahil, global kapsam |
| **Geliştirme** | Kendin yap | Skill setin hazır, maliyet $0 |
| **Stack** | React + tRPC + Drizzle + MySQL | Type-safe, modern, skill desteği var |

Bu planla, **toplam ilk yatırım ~$100/ay operasyonel maliyet + zaman** ile profesyonel bir Amazon listing optimizasyon SaaS platformu kurabilirsin. 50 ücretli kullanıcıya ulaştığında **aylık $3,000+ pasif gelir** ve %95+ kâr marjı elde edersin. En önemlisi, platform büyüdükçe listing başı marjinal maliyet **neredeyse sıfıra** iner — bu, ajans modelinde saatlik çalışarak asla ulaşamayacağın bir ölçek ekonomisi.
