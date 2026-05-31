import { db } from "./client.js";

export function initSchema() {
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
      rawScrapeData TEXT,
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
  `);
}

initSchema();
