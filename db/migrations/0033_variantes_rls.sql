-- RLS des déclinaisons et de la galerie.
--
-- Les deux tables prolongent `products`, qui est un catalogue public : une
-- saveur et une photo se lisent comme un prix. On ouvre donc la lecture aux
-- mêmes rôles, et rien d'autre — l'écriture passe par l'application, qui
-- vérifie que l'article appartient bien à celui qui le modifie.

alter table mb.product_images enable row level security;--> statement-breakpoint
alter table mb.product_variants enable row level security;--> statement-breakpoint

do $$
begin
  revoke all on mb.product_images, mb.product_variants from public;

  execute 'create policy "galerie lisible" on mb.product_images for select using (true)';
  execute 'create policy "declinaisons lisibles" on mb.product_variants for select using (true)';

  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on mb.product_images, mb.product_variants to anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on mb.product_images, mb.product_variants to authenticated;
  end if;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.product_images, mb.product_variants to service_role;
  end if;
end;
$$;
