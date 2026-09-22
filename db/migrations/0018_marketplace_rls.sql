-- RLS de la place de marché.
--
-- `products` reste lisible par tous — c'est un catalogue. Mais `seller_id`
-- désigne une personne, et `order_items` porte ce qu'on doit à qui : ni l'un
-- ni l'autre ne s'ouvre à `anon`. Le vendeur passe par l'application, qui
-- vérifie que la ligne est bien la sienne.

alter table mb.order_items enable row level security;--> statement-breakpoint

do $$
begin
  revoke all on mb.order_items from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.order_items to service_role;
  end if;
end;
$$;
