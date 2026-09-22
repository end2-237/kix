CREATE TABLE "mb"."tournament_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"slot" integer NOT NULL,
	"player_a_id" uuid,
	"player_b_id" uuid,
	"winner_id" uuid,
	"score_a" integer DEFAULT 0 NOT NULL,
	"score_b" integer DEFAULT 0 NOT NULL,
	"race_to" integer DEFAULT 4 NOT NULL,
	"match_id" uuid,
	"status" text DEFAULT 'attente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mb"."tournament_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"nickname" text DEFAULT '' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"level" text DEFAULT 'intermediaire' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"seed" integer,
	"status" text DEFAULT 'candidat' NOT NULL,
	"fee" integer DEFAULT 0 NOT NULL,
	"payment" text DEFAULT 'impaye' NOT NULL,
	"reference" text,
	"reached_round" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_players_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "mb"."tournaments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"event_id" uuid,
	"venue_id" uuid,
	"organiser_id" uuid,
	"discipline" text DEFAULT '8-ball' NOT NULL,
	"size" integer DEFAULT 16 NOT NULL,
	"race_to" integer DEFAULT 4 NOT NULL,
	"entry_fee" integer DEFAULT 0 NOT NULL,
	"prize_pool" integer DEFAULT 0 NOT NULL,
	"prize_split" text DEFAULT '' NOT NULL,
	"rules" text DEFAULT '' NOT NULL,
	"image" text DEFAULT '/img/table-rack.jpg' NOT NULL,
	"status" text DEFAULT 'brouillon' NOT NULL,
	"starts_at" timestamp with time zone,
	"closes_at" timestamp with time zone,
	"winner_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "mb"."tournament_matches" ADD CONSTRAINT "tournament_matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "mb"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."tournament_matches" ADD CONSTRAINT "tournament_matches_player_a_id_tournament_players_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "mb"."tournament_players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."tournament_matches" ADD CONSTRAINT "tournament_matches_player_b_id_tournament_players_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "mb"."tournament_players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."tournament_matches" ADD CONSTRAINT "tournament_matches_winner_id_tournament_players_id_fk" FOREIGN KEY ("winner_id") REFERENCES "mb"."tournament_players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."tournament_matches" ADD CONSTRAINT "tournament_matches_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "mb"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."tournament_players" ADD CONSTRAINT "tournament_players_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "mb"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."tournament_players" ADD CONSTRAINT "tournament_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."tournaments" ADD CONSTRAINT "tournaments_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "mb"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."tournaments" ADD CONSTRAINT "tournaments_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "mb"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."tournaments" ADD CONSTRAINT "tournaments_organiser_id_users_id_fk" FOREIGN KEY ("organiser_id") REFERENCES "mb"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."tournaments" ADD CONSTRAINT "tournaments_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "mb"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tm_tournament_idx" ON "mb"."tournament_matches" USING btree ("tournament_id","round");--> statement-breakpoint
CREATE INDEX "tp_tournament_idx" ON "mb"."tournament_players" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "tp_user_idx" ON "mb"."tournament_players" USING btree ("user_id");