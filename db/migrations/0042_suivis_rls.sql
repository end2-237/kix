-- RLS des abonnements à un diffuseur.
--
-- Qui suit qui n'est pas un secret — le nombre d'abonnés s'affiche sur la
-- fiche du diffuseur — mais rien n'est ouvert à `anon` pour autant : la liste
-- se lit par l'application, qui sait qui la demande.

alter table mb.follows enable row level security;--> statement-breakpoint

do $$
begin
  revoke all on mb.follows from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.follows to service_role;
  end if;
end;
$$;
