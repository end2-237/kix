CREATE TABLE "mb"."product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"url" text NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mb"."product_variants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price" integer,
	"stock" integer DEFAULT 0 NOT NULL,
	"image" text,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mb"."order_items" ADD COLUMN "variant_id" uuid;--> statement-breakpoint
ALTER TABLE "mb"."order_items" ADD COLUMN "variant_label" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "mb"."product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "mb"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "mb"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "mb"."product_images" USING btree ("product_id","sort");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "mb"."product_variants" USING btree ("product_id","sort");--> statement-breakpoint
ALTER TABLE "mb"."order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "mb"."product_variants"("id") ON DELETE set null ON UPDATE no action;