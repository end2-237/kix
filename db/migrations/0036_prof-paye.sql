ALTER TABLE "mb"."enrollments" ADD COLUMN "coach_id" uuid;--> statement-breakpoint
ALTER TABLE "mb"."enrollments" ADD COLUMN "commission" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "mb"."enrollments" ADD CONSTRAINT "enrollments_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "mb"."users"("id") ON DELETE set null ON UPDATE no action;