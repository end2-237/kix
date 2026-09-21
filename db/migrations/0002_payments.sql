CREATE TABLE "mb"."payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"provider" text NOT NULL,
	"provider_ref" text,
	"kind" text NOT NULL,
	"target_id" uuid,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"method" text NOT NULL,
	"phone" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"failure_reason" text,
	"detail" jsonb,
	"paid_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "mb"."orders" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "mb"."purchases" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "mb"."orders" ADD COLUMN "reference" text;--> statement-breakpoint
ALTER TABLE "mb"."tickets" ADD COLUMN "reference" text;--> statement-breakpoint
ALTER TABLE "mb"."payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payments_user_idx" ON "mb"."payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "mb"."payments" USING btree ("status");--> statement-breakpoint
ALTER TABLE "mb"."orders" ADD CONSTRAINT "orders_reference_unique" UNIQUE("reference");--> statement-breakpoint
ALTER TABLE "mb"."tickets" ADD CONSTRAINT "tickets_reference_unique" UNIQUE("reference");