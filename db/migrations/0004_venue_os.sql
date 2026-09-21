CREATE TABLE "mb"."reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"table_id" uuid,
	"user_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"minutes" integer DEFAULT 60 NOT NULL,
	"players" integer DEFAULT 2 NOT NULL,
	"deposit" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"reference" text,
	"seated_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "mb"."venue_tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"label" text NOT NULL,
	"kind" text DEFAULT 'pool' NOT NULL,
	"hourly_rate" integer DEFAULT 0 NOT NULL,
	"deposit" integer DEFAULT 1000 NOT NULL,
	"status" text DEFAULT 'free' NOT NULL,
	"seats" integer DEFAULT 4 NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mb"."reservations" ADD CONSTRAINT "reservations_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "mb"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."reservations" ADD CONSTRAINT "reservations_table_id_venue_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "mb"."venue_tables"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."reservations" ADD CONSTRAINT "reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."venue_tables" ADD CONSTRAINT "venue_tables_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "mb"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reservations_venue_idx" ON "mb"."reservations" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "reservations_user_idx" ON "mb"."reservations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reservations_starts_idx" ON "mb"."reservations" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "venue_tables_venue_idx" ON "mb"."venue_tables" USING btree ("venue_id");