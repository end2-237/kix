CREATE TABLE "mb"."stream_passes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"reference" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stream_passes_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "mb"."streams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"match_id" uuid,
	"event_id" uuid,
	"title" text NOT NULL,
	"level" text DEFAULT 'phone' NOT NULL,
	"access" text DEFAULT 'free' NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"path" text NOT NULL,
	"stream_key" text NOT NULL,
	"status" text DEFAULT 'idle' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"viewers" integer DEFAULT 0 NOT NULL,
	"peak_viewers" integer DEFAULT 0 NOT NULL,
	"replay_url" text,
	"created_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "streams_path_unique" UNIQUE("path"),
	CONSTRAINT "streams_stream_key_unique" UNIQUE("stream_key")
);
--> statement-breakpoint
ALTER TABLE "mb"."users" ADD COLUMN "member_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "mb"."stream_passes" ADD CONSTRAINT "stream_passes_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "mb"."streams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."stream_passes" ADD CONSTRAINT "stream_passes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."streams" ADD CONSTRAINT "streams_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "mb"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."streams" ADD CONSTRAINT "streams_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "mb"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."streams" ADD CONSTRAINT "streams_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "mb"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."streams" ADD CONSTRAINT "streams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stream_passes_unique" ON "mb"."stream_passes" USING btree ("stream_id","user_id");--> statement-breakpoint
CREATE INDEX "streams_venue_idx" ON "mb"."streams" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "streams_status_idx" ON "mb"."streams" USING btree ("status");--> statement-breakpoint
CREATE INDEX "streams_match_idx" ON "mb"."streams" USING btree ("match_id");