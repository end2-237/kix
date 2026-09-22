CREATE TABLE "mb"."member_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"months" integer DEFAULT 1 NOT NULL,
	"price" integer NOT NULL,
	"perks" text DEFAULT '' NOT NULL,
	"hint" text DEFAULT '' NOT NULL,
	"badge" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "member_plans_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "mb"."memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid,
	"months" integer DEFAULT 1 NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reference" text,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "mb"."memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."memberships" ADD CONSTRAINT "memberships_plan_id_member_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "mb"."member_plans"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "mb"."memberships" USING btree ("user_id");