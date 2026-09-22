CREATE TABLE "mb"."friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"status" text DEFAULT 'attente' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mb"."payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"method" text DEFAULT 'momo' NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'demande' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"reference" text DEFAULT '' NOT NULL,
	"processed_by" uuid,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mb"."push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text DEFAULT '' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "mb"."tournament_matches" ADD COLUMN "stage" text DEFAULT 'tableau' NOT NULL;--> statement-breakpoint
ALTER TABLE "mb"."tournament_matches" ADD COLUMN "groupe" integer;--> statement-breakpoint
ALTER TABLE "mb"."tournament_players" ADD COLUMN "groupe" integer;--> statement-breakpoint
ALTER TABLE "mb"."tournaments" ADD COLUMN "format" text DEFAULT 'direct' NOT NULL;--> statement-breakpoint
ALTER TABLE "mb"."tournaments" ADD COLUMN "group_size" integer DEFAULT 4 NOT NULL;--> statement-breakpoint
ALTER TABLE "mb"."tournaments" ADD COLUMN "qualifiers" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "mb"."friendships" ADD CONSTRAINT "friendships_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."friendships" ADD CONSTRAINT "friendships_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."payouts" ADD CONSTRAINT "payouts_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "mb"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."payouts" ADD CONSTRAINT "payouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."payouts" ADD CONSTRAINT "payouts_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "mb"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "friendships_paire_idx" ON "mb"."friendships" USING btree ("requester_id","addressee_id");--> statement-breakpoint
CREATE INDEX "friendships_addressee_idx" ON "mb"."friendships" USING btree ("addressee_id");--> statement-breakpoint
CREATE INDEX "payouts_venue_idx" ON "mb"."payouts" USING btree ("venue_id");--> statement-breakpoint
CREATE INDEX "payouts_user_idx" ON "mb"."payouts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "push_user_idx" ON "mb"."push_subscriptions" USING btree ("user_id");