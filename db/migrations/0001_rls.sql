-- Row Level Security du schéma `mb`.
--
-- Le Supabase du VPS est partagé entre plusieurs applications : chaque app vit
-- dans son schéma et n'expose rien de plus que nécessaire. Cette migration
-- protège la surface PostgREST (rôles `anon` / `authenticated`), pas les Server
-- Actions : celles-ci se connectent avec le rôle propriétaire, qui contourne
-- RLS, et gardent leur propre contrôle d'accès (lib/session.ts).
--
-- Le fichier est réexécutable : `drop policy if exists` avant chaque création,
-- grants dans un bloc conditionnel pour rester valide sur un Postgres nu (tests
-- locaux) où les rôles Supabase n'existent pas.

--> statement-breakpoint

-- Identité de l'appelant, lue dans le JWT transmis par PostgREST.
-- Équivalent de `auth.uid()`, sans dépendre du schéma `auth`.
create or replace function mb.jwt_sub() returns uuid
  language plpgsql stable
  set search_path = mb, public
as $$
declare raw text;
begin
  raw := nullif(current_setting('request.jwt.claim.sub', true), '');
  if raw is null then
    raw := nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub';
  end if;
  return nullif(raw, '')::uuid;
exception when others then
  return null;
end;
$$;
--> statement-breakpoint

-- Ligne `mb.users` correspondant au compte GoTrue courant.
create or replace function mb.current_user_id() returns uuid
  language sql stable security definer
  set search_path = mb, public
as $$
  select u.id from mb.users u where u.auth_id = mb.jwt_sub();
$$;
--> statement-breakpoint

create or replace function mb.current_role() returns text
  language sql stable security definer
  set search_path = mb, public
as $$
  select u.role from mb.users u where u.auth_id = mb.jwt_sub();
$$;
--> statement-breakpoint

-- Salle dont l'appelant est le gérant (null sinon).
create or replace function mb.current_venue_id() returns uuid
  language sql stable security definer
  set search_path = mb, public
as $$
  select u.venue_id from mb.users u
   where u.auth_id = mb.jwt_sub() and u.role in ('manager', 'admin');
$$;
--> statement-breakpoint

-- RLS active sur toutes les tables : sans politique, plus rien ne passe par
-- l'API. `force` n'est volontairement pas utilisé — le rôle propriétaire est
-- celui des Server Actions, et le lui appliquer casserait l'app si la connexion
-- se faisait un jour sans `bypassrls`.
do $$
declare t text;
begin
  foreach t in array array[
    'venues','users','packs','purchases','tokens','products','orders',
    'order_items','events','tickets','scans','notifications','sessions'
  ] loop
    execute format('alter table mb.%I enable row level security', t);
  end loop;
end;
$$;
--> statement-breakpoint

-- Catalogue public : lisible par tous, modifiable seulement côté serveur.
do $$
declare t text;
begin
  foreach t in array array['venues','packs','products','events'] loop
    execute format('drop policy if exists %I on mb.%I', t || '_read_active', t);
    execute format(
      'create policy %I on mb.%I for select using (active)',
      t || '_read_active', t
    );
  end loop;
end;
$$;
--> statement-breakpoint

-- Données personnelles : chacun ne voit que les siennes.
do $$
declare t text;
begin
  foreach t in array array['purchases','tokens','orders','tickets','notifications'] loop
    execute format('drop policy if exists %I on mb.%I', t || '_read_own', t);
    execute format(
      'create policy %I on mb.%I for select using (user_id = mb.current_user_id())',
      t || '_read_own', t
    );
  end loop;
end;
$$;
--> statement-breakpoint

drop policy if exists users_read_self on mb.users;--> statement-breakpoint
create policy users_read_self on mb.users for select
  using (auth_id = mb.jwt_sub() or mb.current_role() = 'admin');--> statement-breakpoint

-- Profil modifiable par son propriétaire ; le rôle, les points et la salle
-- restent hors de portée (colonnes verrouillées par le WITH CHECK).
drop policy if exists users_update_self on mb.users;--> statement-breakpoint
create policy users_update_self on mb.users for update
  using (auth_id = mb.jwt_sub())
  with check (
    auth_id = mb.jwt_sub()
    and role = (select u.role from mb.users u where u.auth_id = mb.jwt_sub())
    and points = (select u.points from mb.users u where u.auth_id = mb.jwt_sub())
    and venue_id is not distinct from (select u.venue_id from mb.users u where u.auth_id = mb.jwt_sub())
  );--> statement-breakpoint

-- Notifications : marquer comme lu, rien d'autre.
drop policy if exists notifications_update_own on mb.notifications;--> statement-breakpoint
create policy notifications_update_own on mb.notifications for update
  using (user_id = mb.current_user_id())
  with check (user_id = mb.current_user_id());--> statement-breakpoint

-- Lignes de commande : visibles via la commande parente.
drop policy if exists order_items_read_own on mb.order_items;--> statement-breakpoint
create policy order_items_read_own on mb.order_items for select
  using (exists (
    select 1 from mb.orders o
     where o.id = order_items.order_id and o.user_id = mb.current_user_id()
  ));--> statement-breakpoint

-- Passages : le joueur voit les siens, le gérant ceux de sa salle.
drop policy if exists scans_read on mb.scans;--> statement-breakpoint
create policy scans_read on mb.scans for select
  using (
    user_id = mb.current_user_id()
    or venue_id = mb.current_venue_id()
    or mb.current_role() = 'admin'
  );--> statement-breakpoint

-- Le gérant lit les jetons de sa salle pour valider un QR au comptoir.
drop policy if exists tokens_read_venue on mb.tokens;--> statement-breakpoint
create policy tokens_read_venue on mb.tokens for select
  using (venue_id = mb.current_venue_id());--> statement-breakpoint

-- mb.sessions n'a aucune politique : la table reste invisible depuis l'API.

--> statement-breakpoint

-- Droits. `anon` ne voit que le catalogue, `authenticated` y ajoute ses propres
-- lignes, `service_role` garde tout. Rien pour `public`.
do $$
begin
  execute 'revoke all on all tables in schema mb from public';
  execute 'revoke all on schema mb from public';

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant usage on schema mb to service_role;
    grant all on all tables in schema mb to service_role;
    grant all on all sequences in schema mb to service_role;
    grant execute on all functions in schema mb to service_role;
    alter default privileges in schema mb grant all on tables to service_role;
  end if;

  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant usage on schema mb to anon;
    grant select on mb.venues, mb.packs, mb.products, mb.events to anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant usage on schema mb to authenticated;
    grant select on mb.venues, mb.packs, mb.products, mb.events to authenticated;
    grant select on mb.purchases, mb.tokens, mb.orders, mb.order_items,
                   mb.tickets, mb.scans to authenticated;
    grant select, update on mb.users, mb.notifications to authenticated;
    grant execute on function mb.jwt_sub(), mb.current_user_id(),
                              mb.current_role(), mb.current_venue_id() to authenticated;
  end if;
end;
$$;
