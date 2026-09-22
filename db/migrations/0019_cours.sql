CREATE TABLE "mb"."courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"coach_id" uuid,
	"coach_name" text DEFAULT '' NOT NULL,
	"venue_id" uuid,
	"level" text DEFAULT 'debutant' NOT NULL,
	"format" text DEFAULT 'forfait' NOT NULL,
	"sessions" integer DEFAULT 1 NOT NULL,
	"schedule" text DEFAULT '' NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"image" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"capacity" integer DEFAULT 10 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "mb"."enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "mb"."courses" ADD CONSTRAINT "courses_coach_id_users_id_fk" FOREIGN KEY ("coach_id") REFERENCES "mb"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."courses" ADD CONSTRAINT "courses_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "mb"."venues"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."enrollments" ADD CONSTRAINT "enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "mb"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."enrollments" ADD CONSTRAINT "enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mb"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrollments_course_idx" ON "mb"."enrollments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "enrollments_user_idx" ON "mb"."enrollments" USING btree ("user_id");