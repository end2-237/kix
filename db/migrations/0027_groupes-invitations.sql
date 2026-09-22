CREATE TABLE "mb"."crew_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crew_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'membre' NOT NULL,
	"status" text DEFAULT 'membre' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mb"."crews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"image" text DEFAULT '' NOT NULL,
	"devise" text DEFAULT '' NOT NULL,
	"owner_id" uuid NOT NULL,
	"venue_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crews_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "mb"."invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" uuid NOT NULL,
	"from_id" uuid NOT NULL,
	"to_id" uuid NOT NULL,
	"venue_id" uuid,
	"match_id" uuid,
	"crew_id" uuid,
	"message" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'envoyee' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mb"."crew_members" ADD CONSTRAINT "crew_members_crew_id_crews_id_fk" FOREIGN KEY ("crew_id") REFERENCES "mb"."crews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."crew_members" ADD CONSTRAINT "crew_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."crews" ADD CONSTRAINT "crews_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."crews" ADD CONSTRAINT "crews_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "mb"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."invitations" ADD CONSTRAINT "invitations_from_id_users_id_fk" FOREIGN KEY ("from_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."invitations" ADD CONSTRAINT "invitations_to_id_users_id_fk" FOREIGN KEY ("to_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."invitations" ADD CONSTRAINT "invitations_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "mb"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."invitations" ADD CONSTRAINT "invitations_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "mb"."matches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."invitations" ADD CONSTRAINT "invitations_crew_id_crews_id_fk" FOREIGN KEY ("crew_id") REFERENCES "mb"."crews"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "crew_members_paire_idx" ON "mb"."crew_members" USING btree ("crew_id","user_id");--> statement-breakpoint
CREATE INDEX "crew_members_user_idx" ON "mb"."crew_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "invitations_to_idx" ON "mb"."invitations" USING btree ("to_id");--> statement-breakpoint
CREATE INDEX "invitations_batch_idx" ON "mb"."invitations" USING btree ("batch_id");