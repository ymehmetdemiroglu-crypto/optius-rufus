CREATE INDEX "idx_bookings_prospectId" ON "bookings" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "idx_bookings_status" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_catalog_links_prospectId" ON "catalog_links" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "idx_analyses_listingId" ON "listing_analyses" USING btree ("listing_id");--> statement-breakpoint
CREATE INDEX "idx_analyses_prospectId" ON "listing_analyses" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "idx_analyses_createdAt" ON "listing_analyses" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_listings_prospectId" ON "listings" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "idx_listings_asin" ON "listings" USING btree ("asin");--> statement-breakpoint
CREATE INDEX "idx_listings_createdAt" ON "listings" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_activities_prospectId" ON "prospect_activities" USING btree ("prospect_id");--> statement-breakpoint
CREATE INDEX "idx_activities_eventType" ON "prospect_activities" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_activities_createdAt" ON "prospect_activities" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_prospects_slug" ON "prospects" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_prospects_status" ON "prospects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_prospects_createdAt" ON "prospects" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_rufus_queries_prospectId" ON "rufus_queries" USING btree ("prospect_id");