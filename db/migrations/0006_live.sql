CREATE TABLE "mb"."match_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"player_id" uuid,
	"kind" text NOT NULL,
	"seq" integer DEFAULT 0 NOT NULL,
	"score_a" integer DEFAULT 0 NOT NULL,
	"score_b" integer DEFAULT 0 NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mb"."matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"table_id" uuid,
	"event_id" uuid,
	"kind" text DEFAULT '8-ball' NOT NULL,
	"target" integer DEFAULT 5 NOT NULL,
	"player_a_id" uuid NOT NULL,
	"player_b_id" uuid NOT NULL,
	"score_a" integer DEFAULT 0 NOT NULL,
	"score_b" integer DEFAULT 0 NOT NULL,
	"turn_id" uuid,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"winner_id" uuid,
	"stake" integer DEFAULT 0 NOT NULL,
	"label" text DEFAULT 'Amical' NOT NULL,
	"starts_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mb"."match_events" ADD CONSTRAINT "match_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "mb"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."match_events" ADD CONSTRAINT "match_events_player_id_users_id_fk" FOREIGN KEY ("player_id") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."matches" ADD CONSTRAINT "matches_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "mb"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."matches" ADD CONSTRAINT "matches_table_id_venue_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "mb"."venue_tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."matches" ADD CONSTRAINT "matches_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "mb"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."matches" ADD CONSTRAINT "matches_player_a_id_users_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."matches" ADD CONSTRAINT "matches_player_b_id_users_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."matches" ADD CONSTRAINT "matches_turn_id_users_id_fk" FOREIGN KEY ("turn_id") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."matches" ADD CONSTRAINT "matches_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."matches" ADD CONSTRAINT "matches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_events_match_idx" ON "mb"."match_events" USING btree ("match_id","seq");--> statement-breakpoint
CREATE INDEX "matches_venue_idx" ON "mb"."matches" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "mb"."matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "matches_players_idx" ON "mb"."matches" USING btree ("player_a_id","player_b_id");