-- RLS des habilitations d'arbitrage.
--
-- Qui tient la feuille de match est une information publique : les joueurs
-- doivent pouvoir vérifier qui a saisi leur score. L'écriture reste au serveur.

alter table mb.match_officials enable row level security;--> statement-breakpoint

drop policy if exists match_officials_read on mb.match_officials;--> statement-breakpoint
create policy match_officials_read on mb.match_officials for select using (true);--> statement-breakpoint

do $$
begin
  revoke all on mb.match_officials from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.match_officials to service_role;
  end if;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on mb.match_officials to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on mb.match_officials to authenticated;
  end if;
end;
$$;
