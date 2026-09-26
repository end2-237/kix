CREATE TABLE "mb"."follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" uuid NOT NULL,
	"host_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mb"."follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."follows" ADD CONSTRAINT "follows_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "mb"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "follows_unique" ON "mb"."follows" USING btree ("follower_id","host_id");--> statement-breakpoint
CREATE INDEX "follows_host_idx" ON "mb"."follows" USING btree ("host_id");