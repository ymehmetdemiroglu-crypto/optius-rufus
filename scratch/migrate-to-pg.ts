import "dotenv/config";
import Database from "better-sqlite3";
import path from "path";
import { db } from "../api/db/drizzle.js";
import * as schema from "../api/db/schema.js";

async function run() {
  console.log("🚀 Starting data migration from SQLite (data/optimus.db) to PostgreSQL...");

  const sqlitePath = path.resolve("data/optimus.db");
  const sqliteDb = new Database(sqlitePath);

  try {
    // 1. Migrate prospects
    console.log("Migrating table: prospects...");
    const prospects = sqliteDb.prepare("SELECT * FROM prospects").all() as any[];
    console.log(`Found ${prospects.length} prospects in SQLite.`);
    
    let prospectsMigrated = 0;
    for (const p of prospects) {
      try {
        await db.insert(schema.prospects).values({
          id: p.id,
          slug: p.slug,
          email: p.email,
          firstName: p.firstName,
          lastName: p.lastName,
          company: p.company,
          apolloContactId: p.apolloContactId,
          apolloSequenceId: p.apolloSequenceId,
          status: p.status,
          landingPageViews: p.landingPageViews,
          packageType: p.packageType,
          pricePoint: p.pricePoint,
          expectedRevenue: p.expectedRevenue,
          asin: p.asin,
          repliedAt: p.repliedAt ? new Date(p.repliedAt) : null,
          apolloReplyData: p.apolloReplyData ? JSON.parse(p.apolloReplyData) : null,
          jobTitle: p.jobTitle,
          linkedinUrl: p.linkedinUrl,
          websiteUrl: p.websiteUrl,
          outreachEmails: p.outreachEmails ? JSON.parse(p.outreachEmails) : null,
          createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
        });
        prospectsMigrated++;
      } catch (err) {
        console.error(`Failed to migrate prospect ID ${p.id}:`, (err as Error).message);
      }
    }
    console.log(`Successfully migrated ${prospectsMigrated}/${prospects.length} prospects.`);

    // 2. Migrate listings
    console.log("\nMigrating table: listings...");
    const listings = sqliteDb.prepare("SELECT * FROM listings").all() as any[];
    console.log(`Found ${listings.length} listings in SQLite.`);
    
    let listingsMigrated = 0;
    for (const l of listings) {
      try {
        await db.insert(schema.listings).values({
          id: l.id,
          prospectId: l.prospectId,
          asin: l.asin,
          marketplace: l.marketplace || "US",
          url: l.url,
          title: l.title,
          bullets: l.bullets ? JSON.parse(l.bullets) : null,
          description: l.description,
          brand: l.brand,
          category: l.category,
          price: l.price,
          rating: l.rating,
          reviewCount: l.reviewCount,
          images: l.images ? JSON.parse(l.images) : null,
          aPlusText: l.aPlusText,
          rawScrapeData: l.rawScrapeData ? JSON.parse(l.rawScrapeData) : null,
          embeddingVector: l.embeddingVector,
          scrapedAt: l.scrapedAt ? new Date(l.scrapedAt) : null,
          createdAt: l.createdAt ? new Date(l.createdAt) : new Date(),
        });
        listingsMigrated++;
      } catch (err) {
        console.error(`Failed to migrate listing ID ${l.id}:`, (err as Error).message);
      }
    }
    console.log(`Successfully migrated ${listingsMigrated}/${listings.length} listings.`);

    // 3. Migrate listing_analyses
    console.log("\nMigrating table: listing_analyses...");
    const analyses = sqliteDb.prepare("SELECT * FROM listing_analyses").all() as any[];
    console.log(`Found ${analyses.length} listing analyses in SQLite.`);
    
    let analysesMigrated = 0;
    for (const a of analyses) {
      try {
        await db.insert(schema.listingAnalyses).values({
          id: a.id,
          listingId: a.listingId,
          prospectId: a.prospectId,
          overallScore: a.overallScore,
          rufusScore: a.rufusScore,
          cosmoScore: a.cosmoScore,
          semanticScore: a.semanticScore,
          contentScore: a.contentScore,
          visualScore: a.visualScore,
          gaps: a.gaps ? JSON.parse(a.gaps) : null,
          topIssues: a.topIssues ? JSON.parse(a.topIssues) : null,
          strengths: a.strengths ? JSON.parse(a.strengths) : null,
          opportunities: a.opportunities ? JSON.parse(a.opportunities) : null,
          aiAnalysisRaw: a.aiAnalysisRaw,
          copyPersonalizedHook: a.copyPersonalizedHook,
          copyProblemNarrative: a.copyProblemNarrative,
          copySolutionPitch: a.copySolutionPitch,
          copyUrgencyCTA: a.copyUrgencyCTA,
          copyHeroHeadline: a.copyHeroHeadline,
          copyHeroSubheadline: a.copyHeroSubheadline,
          copyAutopsyHeadline: a.copyAutopsyHeadline,
          copyAutopsyBody: a.copyAutopsyBody,
          copyBleedHeadline: a.copyBleedHeadline,
          copyBleedBody: a.copyBleedBody,
          copySimulatorIntro: a.copySimulatorIntro,
          copySimulatorScenarios: a.copySimulatorScenarios ? JSON.parse(a.copySimulatorScenarios) : null,
          copyTransformHeadline: a.copyTransformHeadline,
          copyTransformBefore: a.copyTransformBefore,
          copyTransformAfter: a.copyTransformAfter,
          copyRoadmapHeadline: a.copyRoadmapHeadline,
          copyRoadmapBody: a.copyRoadmapBody,
          copySocialProofHeadline: a.copySocialProofHeadline,
          copyCtaHeadline: a.copyCtaHeadline,
          copyCtaGuarantee: a.copyCtaGuarantee,
          copyFreeQAs: a.copyFreeQAs ? JSON.parse(a.copyFreeQAs) : null,
          copyReviewSentiment: a.copyReviewSentiment ? JSON.parse(a.copyReviewSentiment) : null,
          copyCompetitorAudit: a.copyCompetitorAudit ? JSON.parse(a.copyCompetitorAudit) : null,
          copyPpcKeywords: a.copyPpcKeywords ? JSON.parse(a.copyPpcKeywords) : null,
          copyCosmoBundling: a.copyCosmoBundling ? JSON.parse(a.copyCosmoBundling) : null,
          copyCosmoGraphData: a.copyCosmoGraphData ? JSON.parse(a.copyCosmoGraphData) : null,
          packageType: a.packageType,
          pricePoint: a.pricePoint,
          createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
        });
        analysesMigrated++;
      } catch (err) {
        console.error(`Failed to migrate analysis ID ${a.id}:`, (err as Error).message);
      }
    }
    console.log(`Successfully migrated ${analysesMigrated}/${analyses.length} listing analyses.`);

    // 4. Migrate bookings
    console.log("\nMigrating table: bookings...");
    const bookings = sqliteDb.prepare("SELECT * FROM bookings").all() as any[];
    console.log(`Found ${bookings.length} bookings in SQLite.`);
    
    let bookingsMigrated = 0;
    for (const b of bookings) {
      try {
        await db.insert(schema.bookings).values({
          id: b.id,
          prospectId: b.prospectId,
          name: b.name,
          email: b.email,
          company: b.company,
          revenue: b.revenue,
          notes: b.notes,
          scheduledDate: b.scheduledDate,
          status: b.status,
          createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
        });
        bookingsMigrated++;
      } catch (err) {
        console.error(`Failed to migrate booking ID ${b.id}:`, (err as Error).message);
      }
    }
    console.log(`Successfully migrated ${bookingsMigrated}/${bookings.length} bookings.`);

    // 5. Migrate prospect_activities
    console.log("\nMigrating table: prospect_activities...");
    const activities = sqliteDb.prepare("SELECT * FROM prospect_activities").all() as any[];
    console.log(`Found ${activities.length} prospect activities in SQLite.`);
    
    let activitiesMigrated = 0;
    for (const act of activities) {
      try {
        await db.insert(schema.prospectActivities).values({
          id: act.id,
          prospectId: act.prospectId,
          eventType: act.eventType,
          eventData: act.eventData ? JSON.parse(act.eventData) : null,
          createdAt: act.createdAt ? new Date(act.createdAt) : new Date(),
        });
        activitiesMigrated++;
      } catch (err) {
        console.error(`Failed to migrate activity ID ${act.id}:`, (err as Error).message);
      }
    }
    console.log(`Successfully migrated ${activitiesMigrated}/${activities.length} prospect activities.`);

    // 6. Migrate catalog_links
    console.log("\nMigrating table: catalog_links...");
    const catalogLinks = sqliteDb.prepare("SELECT * FROM catalog_links").all() as any[];
    console.log(`Found ${catalogLinks.length} catalog links in SQLite.`);
    
    let catalogLinksMigrated = 0;
    for (const cl of catalogLinks) {
      try {
        await db.insert(schema.catalogLinks).values({
          id: cl.id,
          prospectId: cl.prospectId,
          sourceAsin: cl.sourceAsin,
          targetAsin: cl.targetAsin,
          relationshipType: cl.relationshipType,
          strengthScore: cl.strengthScore,
          createdAt: cl.createdAt ? new Date(cl.createdAt) : new Date(),
        });
        catalogLinksMigrated++;
      } catch (err) {
        console.error(`Failed to migrate catalog link ID ${cl.id}:`, (err as Error).message);
      }
    }
    console.log(`Successfully migrated ${catalogLinksMigrated}/${catalogLinks.length} catalog links.`);

    // 7. Migrate rufus_queries and rufus_query_runs
    console.log("\nMigrating table: rufus_queries...");
    const rufusQueries = sqliteDb.prepare("SELECT * FROM rufus_queries").all() as any[];
    console.log(`Found ${rufusQueries.length} rufus queries in SQLite.`);
    
    let queriesMigrated = 0;
    for (const rq of rufusQueries) {
      try {
        await db.insert(schema.rufusQueries).values({
          id: rq.id,
          prospectId: rq.prospectId,
          queryText: rq.queryText,
          category: rq.category,
          createdAt: rq.createdAt ? new Date(rq.createdAt) : new Date(),
        });
        queriesMigrated++;
      } catch (err) {
        console.error(`Failed to migrate rufus query ID ${rq.id}:`, (err as Error).message);
      }
    }
    console.log(`Successfully migrated ${queriesMigrated}/${rufusQueries.length} rufus queries.`);

    console.log("\nMigrating table: rufus_query_runs...");
    const rufusQueryRuns = sqliteDb.prepare("SELECT * FROM rufus_query_runs").all() as any[];
    console.log(`Found ${rufusQueryRuns.length} rufus query runs in SQLite.`);
    
    let queryRunsMigrated = 0;
    for (const rqr of rufusQueryRuns) {
      try {
        await db.insert(schema.rufusQueryRuns).values({
          id: rqr.id,
          queryId: rqr.queryId,
          asinRankings: rqr.asinRankings ? JSON.parse(rqr.asinRankings) : null,
          sovPercent: rqr.sovPercent,
          cosmoReadinessScore: rqr.cosmoReadinessScore,
          qaCoverageRatio: rqr.qaCoverageRatio,
          rufusAnsweredRate: rqr.rufusAnsweredRate,
          createdAt: rqr.createdAt ? new Date(rqr.createdAt) : new Date(),
        });
        queryRunsMigrated++;
      } catch (err) {
        console.error(`Failed to migrate rufus query run ID ${rqr.id}:`, (err as Error).message);
      }
    }
    console.log(`Successfully migrated ${queryRunsMigrated}/${rufusQueryRuns.length} rufus query runs.`);

    console.log("\n🎉 ALL MIGRATIONS COMPLETED SUCCESSFULLY! 🎉");

  } catch (err) {
    console.error("\n❌ Migration failed with critical error:", (err as Error).message);
  } finally {
    sqliteDb.close();
  }
}

run();
