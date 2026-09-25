CREATE TABLE "mb"."challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_id" uuid NOT NULL,
	"to_id" uuid NOT NULL,
	"venue_id" uuid,
	"lieu_par_id" uuid,
	"kind" text DEFAULT '8-ball' NOT NULL,
	"target" integer DEFAULT 1 NOT NULL,
	"message" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'propose' NOT NULL,
	"match_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mb"."challenges" ADD CONSTRAINT "challenges_from_id_users_id_fk" FOREIGN KEY ("from_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."challenges" ADD CONSTRAINT "challenges_to_id_users_id_fk" FOREIGN KEY ("to_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."challenges" ADD CONSTRAINT "challenges_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "mb"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."challenges" ADD CONSTRAINT "challenges_lieu_par_id_users_id_fk" FOREIGN KEY ("lieu_par_id") REFERENCES "mb"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."challenges" ADD CONSTRAINT "challenges_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "mb"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "challenges_to_idx" ON "mb"."challenges" USING btree ("to_id","status");--> statement-breakpoint
CREATE INDEX "challenges_from_idx" ON "mb"."challenges" USING btree ("from_id","status");