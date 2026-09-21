CREATE TABLE "mb"."match_officials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid,
	"event_id" uuid,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'referee' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mb"."match_events" ADD COLUMN "by_id" uuid;--> statement-breakpoint
ALTER TABLE "mb"."venues" ADD COLUMN "self_scoring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mb"."match_officials" ADD CONSTRAINT "match_officials_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "mb"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."match_officials" ADD CONSTRAINT "match_officials_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "mb"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."match_officials" ADD CONSTRAINT "match_officials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."match_officials" ADD CONSTRAINT "match_officials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_officials_match_idx" ON "mb"."match_officials" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "match_officials_event_idx" ON "mb"."match_officials" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "match_officials_user_idx" ON "mb"."match_officials" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "mb"."match_events" ADD CONSTRAINT "match_events_by_id_users_id_fk" FOREIGN KEY ("by_id") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;