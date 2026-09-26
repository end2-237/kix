ALTER TABLE "mb"."crews" ADD COLUMN "access" text DEFAULT 'ouvert' NOT NULL;--> statement-breakpoint
ALTER TABLE "mb"."crews" ADD COLUMN "lien" text DEFAULT '' NOT NULL;