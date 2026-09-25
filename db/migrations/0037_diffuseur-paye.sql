ALTER TABLE "mb"."stream_passes" ADD COLUMN "host_id" uuid;--> statement-breakpoint
ALTER TABLE "mb"."stream_passes" ADD COLUMN "commission" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "mb"."stream_passes" ADD CONSTRAINT "stream_passes_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "mb"."users"("id") ON DELETE set null ON UPDATE no action;