import { db } from "./client.js";
import { initMigrations } from "./migrations/runner.js";

export function initSchema() {
  // Base tables (idempotent CREATE TABLE IF NOT EXISTS)
  db.exec(`
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
      packageType TEXT DEFAULT 'package_2',
      pricePoint REAL DEFAULT 1500,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prospectId INTEGER NOT NULL,
      asin TEXT NOT NULL,
      marketplace TEXT DEFAULT 'US',
      url TEXT,
      title TEXT,
      bullets TEXT,
      description TEXT,
      brand TEXT,
      category TEXT,
      price REAL,
      rating REAL,
      reviewCount INTEGER,
      images TEXT,
      aPlusText TEXT,
      rawScrapeData TEXT,
      embeddingVector TEXT,
      scrapedAt DATETIME,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (prospectId) REFERENCES prospects(id)
    );

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
      gaps TEXT,
      topIssues TEXT,
      strengths TEXT,
      opportunities TEXT,
      aiAnalysisRaw TEXT,

      copyPersonalizedHook TEXT,
      copyProblemNarrative TEXT,
      copySolutionPitch TEXT,
      copyUrgencyCTA TEXT,

      copyHeroHeadline TEXT,
      copyHeroSubheadline TEXT,

      copyAutopsyHeadline TEXT,
      copyAutopsyBody TEXT,

      copyBleedHeadline TEXT,
      copyBleedBody TEXT,

      copySimulatorIntro TEXT,
      copySimulatorScenarios TEXT,

      copyTransformHeadline TEXT,
      copyTransformBefore TEXT,
      copyTransformAfter TEXT,

      copyRoadmapHeadline TEXT,
      copyRoadmapBody TEXT,

      copySocialProofHeadline TEXT,

      copyCtaHeadline TEXT,
      copyCtaGuarantee TEXT,

      copyFreeQAs TEXT,
      copyReviewSentiment TEXT,
      copyCompetitorAudit TEXT,
      copyPpcKeywords TEXT,
      copyCosmoBundling TEXT,
      copyCosmoGraphData TEXT,
      packageType TEXT DEFAULT 'package_2',
      pricePoint REAL DEFAULT 1500,

      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (listingId) REFERENCES listings(id),
      FOREIGN KEY (prospectId) REFERENCES prospects(id)
    );

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

    CREATE TABLE IF NOT EXISTS prospect_activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prospectId INTEGER NOT NULL,
      eventType TEXT NOT NULL,
      eventData TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (prospectId) REFERENCES prospects(id)
    );

    CREATE TABLE IF NOT EXISTS brand_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      companyName TEXT,
      logoUrl TEXT,
      logoBase64 TEXT,
      primaryColor TEXT DEFAULT '#b8860b',
      website TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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
      asinRankings TEXT NOT NULL,
      sovPercent REAL NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (queryId) REFERENCES rufus_queries(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS catalog_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prospectId INTEGER NOT NULL,
      sourceAsin TEXT NOT NULL,
      targetAsin TEXT NOT NULL,
      relationshipType TEXT NOT NULL,
      strengthScore REAL DEFAULT 0.50,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (prospectId) REFERENCES prospects(id) ON DELETE CASCADE
    );
  `);

  // Run numbered SQL migrations for additive schema changes (indexes, new tables)
  initMigrations();
}

initSchema();
