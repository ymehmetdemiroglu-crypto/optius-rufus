# Database Schema Document (SQLite)
# Project Optimus Rufus Agency Portal

This document outlines the SQLite schema used in Project Optimus Rufus. The database is loaded and initialized via `better-sqlite3` on startup.

---

## 1. Schema Definitions

### 1.1 Prospects Table
Tracks the client or lead details.
```sql
CREATE TABLE IF NOT EXISTS prospects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  firstName TEXT,
  lastName TEXT,
  company TEXT,
  apolloContactId TEXT,
  apolloSequenceId TEXT,
  status TEXT DEFAULT 'new',
  landingPageViews INTEGER DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 1.2 Listings Table
Stores scraped public Amazon listing specifications.
```sql
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prospectId INTEGER NOT NULL,
  asin TEXT NOT NULL,
  marketplace TEXT DEFAULT 'US',
  url TEXT,
  title TEXT,
  bullets TEXT, -- JSON representation of string[]
  description TEXT,
  brand TEXT,
  category TEXT,
  price REAL,
  rating REAL,
  reviewCount INTEGER,
  images TEXT, -- JSON representation of string[]
  aPlusText TEXT, -- Scraped text overlays from A+ modules
  rawScrapeData TEXT, -- JSON representation of raw scraper payload
  scrapedAt DATETIME,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prospectId) REFERENCES prospects(id)
);
```

### 1.3 Listing Analyses Table
Stores the results of the multi-agent optimization audits.
```sql
CREATE TABLE IF NOT EXISTS listing_analyses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listingId INTEGER NOT NULL,
  prospectId INTEGER NOT NULL,
  overallScore INTEGER,
  rufusScore INTEGER,
  cosmoScore INTEGER,
  semanticScore INTEGER,
  contentScore INTEGER,
  visualScore INTEGER,
  gaps TEXT, -- JSON representation of SemanticGap[]
  topIssues TEXT, -- JSON
  strengths TEXT, -- JSON
  opportunities TEXT, -- JSON
  aiAnalysisRaw TEXT,

  -- Personalized copywriting stages
  copyHeroHeadline TEXT,
  copyHeroSubheadline TEXT,
  copyAutopsyHeadline TEXT,
  copyAutopsyBody TEXT,
  copyBleedHeadline TEXT,
  copyBleedBody TEXT,
  copySimulatorIntro TEXT,
  copySimulatorScenarios TEXT, -- JSON representation of SimulatorScenario[]
  copyTransformHeadline TEXT,
  copyTransformBefore TEXT, -- JSON representation of TransformSnippet[]
  copyTransformAfter TEXT, -- JSON representation of TransformSnippet[]
  copyRoadmapHeadline TEXT,
  copyRoadmapBody TEXT,
  copySocialProofHeadline TEXT,
  copyCtaHeadline TEXT,
  copyCtaGuarantee TEXT,

  -- Advanced Optimization outputs
  copyFreeQAs TEXT, -- JSON representation of QAPair[]
  copyReviewSentiment TEXT, -- JSON
  copyCompetitorAudit TEXT, -- JSON representation of CompetitorBenchmark[]
  copyPpcKeywords TEXT, -- JSON
  copyCosmoBundling TEXT, -- JSON
  copyCosmoGraphData TEXT, -- JSON

  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (listingId) REFERENCES listings(id),
  FOREIGN KEY (prospectId) REFERENCES prospects(id)
);
```

### 1.4 Bookings Table
Manages audit consult scheduling.
```sql
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prospectId INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  revenue TEXT,
  notes TEXT,
  scheduledDate TEXT,
  status TEXT DEFAULT 'pending',
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prospectId) REFERENCES prospects(id)
);
```

### 1.5 Brand Settings Table (NEW)
Stores white-label styling variables (logo, colors) for agency PDF generation.
```sql
CREATE TABLE IF NOT EXISTS brand_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  companyName TEXT,
  logoUrl TEXT,
  logoBase64 TEXT, -- Base64 string for serverless deployment durability
  primaryColor TEXT DEFAULT '#b8860b',
  website TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 1.6 Rufus Queries & Runs Tables (NEW)
Tracks simulated conversational queries and corresponding share-of-voice metrics over time.
```sql
CREATE TABLE IF NOT EXISTS rufus_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prospectId INTEGER NOT NULL,
  queryText TEXT NOT NULL,
  category TEXT NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prospectId) REFERENCES prospects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rufus_query_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  queryId INTEGER NOT NULL,
  asinRankings TEXT NOT NULL, -- JSON string representation of { asin: string, rank: number, recommended: boolean, reason: string }[]
  sovPercent REAL NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (queryId) REFERENCES rufus_queries(id) ON DELETE CASCADE
);
```

### 1.7 Catalog Links Table (NEW)
Stores calculated cosine similarity catalog connections between client ASIN and competitor ASINs.
```sql
CREATE TABLE IF NOT EXISTS catalog_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prospectId INTEGER NOT NULL,
  sourceAsin TEXT NOT NULL,
  targetAsin TEXT NOT NULL,
  relationshipType TEXT NOT NULL, -- 'substitute', 'complementary', 'co_occurrence'
  strengthScore REAL DEFAULT 0.50,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prospectId) REFERENCES prospects(id) ON DELETE CASCADE
);
```
