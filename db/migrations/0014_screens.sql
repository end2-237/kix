CREATE TABLE "mb"."screens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid,
	"name" text DEFAULT '' NOT NULL,
	"stream_id" uuid,
	"pairing_code" text,
	"pairing_expires_at" timestamp with time zone,
	"token_hash" text NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "screens_pairing_code_unique" UNIQUE("pairing_code"),
	CONSTRAINT "screens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "mb"."screens" ADD CONSTRAINT "screens_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "mb"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."screens" ADD CONSTRAINT "screens_stream_id_streams_id_fk" FOREIGN KEY ("stream_id") REFERENCES "mb"."streams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "screens_venue_idx" ON "mb"."screens" USING btree ("venue_id");