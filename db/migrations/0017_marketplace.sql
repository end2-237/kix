ALTER TABLE "mb"."order_items" ADD COLUMN "seller_id" uuid;--> statement-breakpoint
ALTER TABLE "mb"."order_items" ADD COLUMN "commission" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "mb"."products" ADD COLUMN "seller_id" uuid;--> statement-breakpoint
ALTER TABLE "mb"."order_items" ADD CONSTRAINT "order_items_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "mb"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mb"."products" ADD CONSTRAINT "products_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "mb"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Reprise : les lignes déjà vendues portent la commission au taux en vigueur.
-- Elles restent sans vendeur — c'étaient des articles de la maison, et rien
-- n'est dû à personne.
update mb.order_items set commission = round(unit_price * qty * 0.1) where commission = 0;
