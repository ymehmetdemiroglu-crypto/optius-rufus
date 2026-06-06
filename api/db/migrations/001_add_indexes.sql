-- Migration 001: Add secondary indexes for foreign keys and common query patterns
-- This dramatically improves lookup performance for prospect-scoped queries

CREATE INDEX IF NOT EXISTS idx_prospects_slug ON prospects(slug);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(status);
CREATE INDEX IF NOT EXISTS idx_prospects_createdAt ON prospects(createdAt);

CREATE INDEX IF NOT EXISTS idx_listings_prospectId ON listings(prospectId);
CREATE INDEX IF NOT EXISTS idx_listings_asin ON listings(asin);
CREATE INDEX IF NOT EXISTS idx_listings_createdAt ON listings(createdAt);

CREATE INDEX IF NOT EXISTS idx_analyses_listingId ON listing_analyses(listingId);
CREATE INDEX IF NOT EXISTS idx_analyses_prospectId ON listing_analyses(prospectId);
CREATE INDEX IF NOT EXISTS idx_analyses_createdAt ON listing_analyses(createdAt);

CREATE INDEX IF NOT EXISTS idx_bookings_prospectId ON bookings(prospectId);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

CREATE INDEX IF NOT EXISTS idx_activities_prospectId ON prospect_activities(prospectId);
CREATE INDEX IF NOT EXISTS idx_activities_eventType ON prospect_activities(eventType);
CREATE INDEX IF NOT EXISTS idx_activities_createdAt ON prospect_activities(createdAt);

CREATE INDEX IF NOT EXISTS idx_rufus_queries_prospectId ON rufus_queries(prospectId);
CREATE INDEX IF NOT EXISTS idx_catalog_links_prospectId ON catalog_links(prospectId);
