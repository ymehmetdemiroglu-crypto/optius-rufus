CREATE TABLE "bookings" (
	"id" serial PRIMARY KEY NOT NULL,
	"prospect_id" integer NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"revenue" text,
	"notes" text,
	"scheduled_date" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "brand_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" text,
	"logo_url" text,
	"logo_base64" text,
	"primary_color" text DEFAULT '#b8860b',
	"website" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "catalog_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"prospect_id" integer NOT NULL,
	"source_asin" text NOT NULL,
	"target_asin" text NOT NULL,
	"relationship_type" text NOT NULL,
	"strength_score" real DEFAULT 0.5,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"queue" text NOT NULL,
	"name" text NOT NULL,
	"data_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"opts_json" jsonb DEFAULT '{}'::jsonb,
	"progress" integer DEFAULT 0,
	"delay" integer DEFAULT 0,
	"timestamp" bigint NOT NULL,
	"attempts" integer DEFAULT 0,
	"max_attempts" integer DEFAULT 3,
	"processed_on" bigint,
	"finished_on" bigint,
	"return_value_json" jsonb,
	"failed_reason" text,
	"stacktrace_json" jsonb DEFAULT '[]'::jsonb,
	"status" text DEFAULT 'pending',
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "listing_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"prospect_id" integer NOT NULL,
	"overall_score" integer,
	"rufus_score" integer,
	"cosmo_score" integer,
	"semantic_score" integer,
	"content_score" integer,
	"visual_score" integer,
	"gaps" jsonb,
	"top_issues" jsonb,
	"strengths" jsonb,
	"opportunities" jsonb,
	"ai_analysis_raw" text,
	"copy_personalized_hook" text,
	"copy_problem_narrative" text,
	"copy_solution_pitch" text,
	"copy_urgency_cta" text,
	"copy_hero_headline" text,
	"copy_hero_subheadline" text,
	"copy_autopsy_headline" text,
	"copy_autopsy_body" text,
	"copy_bleed_headline" text,
	"copy_bleed_body" text,
	"copy_simulator_intro" text,
	"copy_simulator_scenarios" jsonb,
	"copy_transform_headline" text,
	"copy_transform_before" jsonb,
	"copy_transform_after" jsonb,
	"copy_roadmap_headline" text,
	"copy_roadmap_body" text,
	"copy_social_proof_headline" text,
	"copy_cta_headline" text,
	"copy_cta_guarantee" text,
	"copy_free_q_as" text,
	"copy_review_sentiment" text,
	"copy_competitor_audit" text,
	"copy_ppc_keywords" text,
	"copy_cosmo_bundling" text,
	"copy_cosmo_graph_data" text,
	"package_type" text DEFAULT 'package_2',
	"price_point" real DEFAULT 1500,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"prospect_id" integer NOT NULL,
	"asin" text NOT NULL,
	"marketplace" text DEFAULT 'US',
	"url" text,
	"title" text,
	"bullets" jsonb,
	"description" text,
	"brand" text,
	"category" text,
	"price" real,
	"rating" real,
	"review_count" integer,
	"images" jsonb,
	"a_plus_text" text,
	"raw_scrape_data" jsonb,
	"embedding_vector" text,
	"scraped_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pipeline_job_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" integer NOT NULL,
	"stage_name" text NOT NULL,
	"status" text DEFAULT 'pending',
	"output_json" jsonb,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pipeline_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"prospect_id" integer NOT NULL,
	"listing_id" integer,
	"package_type" text DEFAULT 'package_2',
	"status" text DEFAULT 'pending',
	"current_stage" text,
	"stages_json" jsonb,
	"token_usage" integer DEFAULT 0,
	"error_log" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prospect_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"prospect_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "prospects" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"company" text,
	"asin" text,
	"expected_revenue" text,
	"apollo_contact_id" text,
	"apollo_sequence_id" text,
	"status" text DEFAULT 'new',
	"landing_page_views" integer DEFAULT 0,
	"package_type" text DEFAULT 'package_2',
	"price_point" real DEFAULT 1500,
	"replied_at" timestamp with time zone,
	"apollo_reply_data" jsonb,
	"job_title" text,
	"linkedin_url" text,
	"website_url" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "prospects_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "rufus_queries" (
	"id" serial PRIMARY KEY NOT NULL,
	"prospect_id" integer NOT NULL,
	"query_text" text NOT NULL,
	"category" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rufus_query_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"query_id" integer NOT NULL,
	"asin_rankings" jsonb NOT NULL,
	"sov_percent" real NOT NULL,
	"cosmo_readiness_score" integer,
	"qa_coverage_ratio" integer,
	"rufus_answered_rate" integer,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"prospect_id" integer NOT NULL,
	"job_id" integer,
	"service" text NOT NULL,
	"prompt_tokens" integer DEFAULT 0,
	"completion_tokens" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"cost_cents" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "catalog_links" ADD CONSTRAINT "catalog_links_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_analyses" ADD CONSTRAINT "listing_analyses_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing_analyses" ADD CONSTRAINT "listing_analyses_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listings" ADD CONSTRAINT "listings_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_job_stages" ADD CONSTRAINT "pipeline_job_stages_job_id_pipeline_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."pipeline_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_jobs" ADD CONSTRAINT "pipeline_jobs_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pipeline_jobs" ADD CONSTRAINT "pipeline_jobs_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_activities" ADD CONSTRAINT "prospect_activities_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rufus_queries" ADD CONSTRAINT "rufus_queries_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rufus_query_runs" ADD CONSTRAINT "rufus_query_runs_query_id_rufus_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."rufus_queries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_prospect_id_prospects_id_fk" FOREIGN KEY ("prospect_id") REFERENCES "public"."prospects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_job_id_pipeline_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."pipeline_jobs"("id") ON DELETE set null ON UPDATE no action;