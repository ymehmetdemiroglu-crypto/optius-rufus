# Product Requirements Document (PRD)
# Amazon Listing Optimizer SaaS

**Version:** 1.0  
**Date:** 2026-05-25  
**Status:** MVP Ready  
**Author:** Solo Founder  

---

## 1. Executive Summary

Amazon Listing Optimizer, health/supplements ve beauty kategorisinde Amazon'da satış yapan private label markalar için AI-destekli bir listing optimizasyon SaaS platformudur. Platform, Amazon'un COSMO (Common Sense Knowledge Graph) ve Rufus (Conversational AI Shopping Assistant) sistemlerini analiz ederek, satıcıların listing'lerini bu AI sistemlere göre optimize etmelerine yardımcı olur. Geleneksel keyword-based SEO araçlarından farklı olarak, semantic meaning ve user intent alignment'a odaklanır.

**Tek Cümlelik Değer Önerisi:** *"Amazon'un AI'si senin ürününü neden önermiyor? 30 saniyede öğren, 5 dakikada düzelt."*

---

## 2. Problem Statement

### 2.1 Hedef Kitlenin Acı Noktaları

Amazon seller'lar, özellikle health/supplements ve beauty kategorisinde, aşağıdaki kritik sorunlarla karşı karşıya:

- **Düşük dönüşüm oranları:** Optimize edilmemiş listing'ler %2-5 dönüşüm oranına sahipken, AI-optimize edilmiş listing'ler %8-14'e çıkabiliyor
- **Amazon Rufus tarafından görünmeme:** Rufus, müşteri sorularına yanıt olarak ürün öneriyor; listing'i yeterince anlaşılır olmayan ürünler önerilmiyor
- **COSMO knowledge graph'e dahil olamama:** Amazon'un AI'si, ürünleri kullanım amacı, hedef kitle ve yeteneklerine göre ilişkilendiriyor; bu ilişkileri açıkça belirtmeyen listing'ler keşfedilemiyor
- **Rakiplerin gerisinde kalma:** Helium 10, Jungle Scout gibi araçlar hâlâ keyword-based optimizasyon sunuyor; AI-native optimizasyon pazarda neredeyse yok
- **Zaman ve uzmanlık eksikliği:** Profesyonel listing optimizasyonu saatler sürüyor ve AI sistemlerini anlamak teknik bilgi gerektiriyor

### 2.2 Mevcut Çözümlerin Yetersizlikleri

| Mevcut Araç | Fiyat | Sorunu | Eksiklik |
|------------|-------|--------|---------|
| Helium 10 | $129/ay | Keyword research, listing builder | AI semantic optimizasyon yok |
| Jungle Scout | $49/ay | Product research, keyword tracking | Rufus/COSMO uyum analizi yok |
| ZonGuru | $49/ay | Listing optimizer, Niche finder | Embedding-based analiz yok |
| Viral Launch | $69/ay | Keyword research, PPC | Intent-based optimizasyon yok |
| Epinium | €99/ay | AI listing + SEO | Amazon-specific AI değil, genel SEO |
| Profound | $499+/ay | AEO platform | Amazon-specific değil, genel AEO |

---

## 3. Solution Overview

### 3.1 Core Features (MVP)

| # | Özellik | Açıklama | Öncelik |
|---|---------|----------|---------|
| 1 | **ASIN Analyzer** | ASIN girildiğinde listing'i çekip skorlama | P0 |
| 2 | **Rufus Compatibility Score** | 0-100 skor ile listing'in Rufus uyumu | P0 |
| 3 | **Semantic Gap Analysis** | 24 boyutta gap analizi ve önceliklendirme | P0 |
| 4 | **Optimized Title Generator** | AI tarafından optimize edilmiş başlık önerisi | P0 |
| 5 | **5-Bullet Framework** | Intent-rich bullet point önerileri | P0 |
| 6 | **Q&A Optimization** | Rufus için optimize edilmiş Q&A önerileri | P1 |
| 7 | **Competitor Benchmark** | Rakip listing'leri ile karşılaştırma | P1 |
| 8 | **A+ Content Suggestions** | A+ Content modülü önerileri | P2 |
| 9 | **Apify / Rainforest API** | Listing verilerini scraping ile çekme | P0 |
| 10 | **Free ASIN Analyzer (Lead Magnet)** | Ücretsiz sınırlı analiz aracı | P1 |

### 3.2 Kullanıcı Hikayeleri (User Stories)

**US-001:** *Bir health supplement satıcısı olarak, ASIN'imi girerek listing'imin Amazon AI sistemleriyle ne kadar uyumlu olduğunu görmek istiyorum, böylece hangi alanları iyileştirmem gerektiğini anlayabilirim.*

**US-002:** *Bir beauty marka sahibi olarak, rakiplerimin listing'leri ile kendi listing'imi karşılaştırarak nerede geride kaldığımı öğrenmek istiyorum.*

**US-003:** *Bir solo Amazon satıcısı olarak, optimize edilmiş title ve bullet point önerileri alarak listing'imi hızla güncellemek istiyorum.*

**US-004:** *Bir satıcı olarak, Rufus'un sık sorulan sorularına cevap verecek şekilde Q&A bölümümü optimize etmek istiyorum.*

**US-005:** *Bir kullanıcı olarak, aylık analiz limitimi takip ederek planımı yönetmek istiyorum.*

---

## 4. Functional Requirements

### 4.1 Kullanıcı Yönetimi

| ID | Gereksinim | Detay | Öncelik |
|----|-----------|-------|---------|
| FR-001 | Kullanıcı kaydı (e-posta + şifre) | Kimi OAuth 2.0 entegrasyonu | P0 |
| FR-002 | Kullanıcı girişi | JWT session yönetimi | P0 |
| FR-003 | Şifre sıfırlama | E-posta ile token gönderimi | P1 |
| FR-004 | Kullanıcı profili yönetimi | İsim, avatar, şirket bilgisi | P1 |
| FR-005 | Abonelik planı yönetimi | Upgrade/downgrade/cancel | P0 |

### 4.2 Listing Analizi

| ID | Gereksinim | Detay | Öncelik |
|----|-----------|-------|---------|
| FR-010 | ASIN ile listing çekme | Apify / Rainforest API scraping | P0 |
| FR-011 | Rufus Compatibility Score | 0-100 skorlama algoritması | P0 |
| FR-012 | Semantic Gap Analysis | 24 boyutta gap hesaplama | P0 |
| FR-013 | Optimized title önerisi | AI-generated başlık önerisi | P0 |
| FR-014 | Optimized bullet points | 5 adet intent-rich bullet önerisi | P0 |
| FR-015 | Competitor benchmark | Top 5 rakip ile karşılaştırma | P1 |
| FR-016 | Q&A optimization | 10-15 Q&A çifti önerisi | P1 |
| FR-017 | A+ Content suggestions | Modül bazlı içerik önerileri | P2 |
| FR-018 | Analiz raporu PDF export | Detaylı rapor indirme | P1 |

### 4.4 Abonelik ve Ödeme

| ID | Gereksinim | Detay | Öncelik |
|----|-----------|-------|---------|
| FR-019 | Ücretsiz plan (3 analiz/ay) | Sınırlı özellikler | P0 |
| FR-020 | Starter plan ($49/ay) | 20 analiz/ay | P0 |
| FR-021 | Pro plan ($99/ay) | 100 analiz/ay + competitor | P0 |
| FR-022 | Enterprise plan ($299/ay) | Sınırsız + API erişimi | P2 |
| FR-023 | Paddle entegrasyonu | Ödeme, fatura, abonelik yönetimi | P0 |
| FR-024 | Usage tracking ve limit kontrolü | Aylık limit aşımı engelleme | P0 |

---

## 5. Non-Functional Requirements

### 5.1 Performans

| ID | Gereksinim | Hedef Metrik |
|----|-----------|-------------|
| NFR-001 | ASIN analiz süresi | < 5 saniye (ortalama) |
| NFR-002 | API response time (p95) | < 200ms |
| NFR-003 | Sayfa yüklenme süresi | < 2 saniye (Lighthouse) |
| NFR-004 | Eşzamanlı kullanıcı desteği | 100+ (MVP) |
| NFR-005 | Embedding API maliyeti | <$0.001/listing |

### 5.2 Güvenlik

| ID | Gereksinim | Detay |
|----|-----------|-------|
| NFR-006 | HTTPS zorunlu | Let's Encrypt SSL |
| NFR-008 | JWT token yönetimi | 24 saat expiration, secure httpOnly cookie |
| NFR-009 | Rate limiting | 100 req/ip/dakika |
| NFR-010 | Input validation | Zod ile tüm tRPC input'ları |
| NFR-011 | CORS kısıtlaması | Sadece kendi domain |
| NFR-012 | SQL injection koruması | Drizzle ORM parametrik sorgular |

### 5.3 Kullanılabilirlik

| ID | Gereksinim | Detay |
|----|-----------|-------|
| NFR-013 | Responsive design | Desktop, tablet, mobile uyumlu |
| NFR-014 | Dark/Light mode | Sistem tercihine göre |
| NFR-015 | Türkçe ve İngilizce | i18n desteği (MVP'de İngilizce) |
| NFR-016 | Accessibility | WCAG 2.1 AA seviyesi |

---

## 6. Teknoloji Yığını

| Katman | Teknoloji | Sebep |
|--------|----------|-------|
| **Frontend** | React 19 + TypeScript + Vite | Modern, hızlı, type-safe |
| **Styling** | Tailwind CSS + shadcn/ui | Hızlı geliştirme, 40+ hazır bileşen |
| **Backend** | Hono + tRPC 11 | Hafif, type-safe API |
| **ORM** | Drizzle ORM | Type-safe SQL, PostgreSQL uyumlu |
| **Database** | PostgreSQL 16 | Güvenilir, VPS'te çalışır |
| **Vector DB** | Qdrant (self-hosted) | $0 maliyet, iyi performans |
| **AI/ML** | OpenAI text-embedding-3-small | $0.02/1M token, en iyi kalite |
| **Auth** | Kimi OAuth 2.0 | Hazır entegrasyon |
| **Payments** | Paddle | Vergi dahil, global kapsam |
| **Hosting** | Hetzner CPX31 | $33/ay, 5x daha ucuz AWS'den |
| **Container** | Docker + Docker Compose | Kolay deploy, izole servisler |
| **Reverse Proxy** | Nginx | SSL, load balancing, static files |
| **Monitoring** | Sentry + Grafana | Hata takibi, metrik görselleştirme |

---

## 7. Başarı Metrikleri (KPIs)

| Metrik | Hedef (MVP Launch) | Hedef (6 Ay) | Hedef (12 Ay) |
|--------|-------------------|-------------|--------------|
| Kayıtlı kullanıcı | 100 | 1,000 | 5,000 |
| Ücretli kullanıcı | 20 | 200 | 1,000 |
| MRR | $1,000 | $15,000 | $75,000 |
| Churn Rate | <%10 | <%8 | <%5 |
| NPS Score | >40 | >50 | >60 |
| ASIN analiz/gün | 50 | 500 | 3,000 |
| Rufus Score ortalama iyileşmesi | +15 puan | +20 puan | +25 puan |

---

## 8. Riskler ve Azaltma Stratejileri

| Risk | Olasılık | Etki | Azaltma |
|------|---------|------|---------|
| Scraping API değişiklikleri | Orta | Yüksek | Abstraction layer + fallback |
| OpenAI API fiyat artışı | Düşük | Orta | Self-host embedding planı |
| Rakip çoğalması (Helium 10 vb.) | Yüksek | Orta | AI-native farklılaştırma |
| Scraping rate limit | Orta | Yüksek | Proxy rotation + cache |
| API rate limit aşımı | Orta | Orta | Queue + retry mekanizması |
| Veri gizliliği endişeleri | Düşük | Yüksek | Açık gizlilik politikası, GDPR uyumlu |

---

## 9. Yol Haritası

### Phase 1: MVP (Ay 1-2)
- Kullanıcı kayıt/giriş (Kimi OAuth)
- Apify / Rainforest API entegrasyonu
- ASIN Analyzer temel sürümü
- Rufus Compatibility Score
- Semantic Gap Analysis (12 boyut)
- Optimized title + bullets
- Starter/Pro abonelik planları (Paddle)

### Phase 2: Growth (Ay 3-4)
- Competitor benchmark
- Q&A optimization
- Semantic Gap Analysis (24 boyut)
- Free ASIN Analyzer (lead magnet)
- PDF rapor export
- Product Hunt launch

### Phase 3: Scale (Ay 5-6)
- A+ Content suggestions
- API erişimi (Enterprise plan)
- Çoklu marketplace desteği
- Affiliate/referral programı
- G2/Capterra profil optimizasyonu

### Phase 4: Maturity (Ay 7-12)
- AI model fine-tuning (kategori spesifik)
- Self-host embedding seçeneği
- White-label seçeneği (ajanslar için)
- Chrome extension
- Mobile app (PWA)
