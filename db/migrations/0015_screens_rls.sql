-- RLS des écrans de salle.
--
-- Une ligne d'écran porte deux secrets : `token_hash`, qui vaut identité pour
-- le téléviseur, et `pairing_code`, qui vaut droit d'adoption tant qu'il n'a
-- pas servi. Ni l'un ni l'autre ne doit pouvoir être lu — un code lisible
-- laisserait n'importe quel compte adopter l'écran d'une autre salle avant
-- son gérant.
--
-- Aucun droit n'est donc accordé à `anon` ni à `authenticated` sur la table :
-- tout passe par l'application, qui vérifie le rôle et la salle.

alter table mb.screens enable row level security;--> statement-breakpoint

do $$
begin
  revoke all on mb.screens from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.screens to service_role;
  end if;
end;
$$;
