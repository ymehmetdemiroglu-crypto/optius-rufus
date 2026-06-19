ALTER TABLE "brand_settings" ADD COLUMN "sequence_enterprise" text;--> statement-breakpoint
ALTER TABLE "brand_settings" ADD COLUMN "sequence_growth" text;--> statement-breakpoint
ALTER TABLE "brand_settings" ADD COLUMN "sequence_starter" text;--> statement-breakpoint
ALTER TABLE "prospects" ADD COLUMN "outreach_emails" jsonb;