ALTER TABLE "mb"."push_subscriptions" ALTER COLUMN "p256dh" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "mb"."push_subscriptions" ALTER COLUMN "auth" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "mb"."push_subscriptions" ADD COLUMN "provider" text DEFAULT 'web' NOT NULL;