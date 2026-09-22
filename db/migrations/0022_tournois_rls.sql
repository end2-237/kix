-- RLS des tournois.
--
-- L'affiche est publique : un tournoi qu'on ne peut pas lire ne se remplit
-- pas. Le tableau aussi — c'est tout l'intérêt de le publier.
--
-- Les candidatures, non : elles portent un téléphone et un niveau déclaré.
-- Un joueur voit la sienne, personne d'autre. L'organisateur passe par
-- l'application, qui vérifie que le tournoi est bien le sien.

alter table mb.tournaments enable row level security;--> statement-breakpoint
alter table mb.tournament_players enable row level security;--> statement-breakpoint
alter table mb.tournament_matches enable row level security;--> statement-breakpoint

drop policy if exists tournaments_read on mb.tournaments;--> statement-breakpoint
create policy tournaments_read on mb.tournaments for select
  using (status <> 'brouillon');--> statement-breakpoint

drop policy if exists tournament_matches_read on mb.tournament_matches;--> statement-breakpoint
create policy tournament_matches_read on mb.tournament_matches for select using (true);--> statement-breakpoint

drop policy if exists tournament_players_read_own on mb.tournament_players;--> statement-breakpoint
create policy tournament_players_read_own on mb.tournament_players for select
  using (user_id = mb.current_user_id());--> statement-breakpoint

do $$
begin
  revoke all on mb.tournaments, mb.tournament_players, mb.tournament_matches from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.tournaments, mb.tournament_players, mb.tournament_matches to service_role;
  end if;

  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on mb.tournaments, mb.tournament_matches to anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on mb.tournaments, mb.tournament_matches to authenticated;
    grant select on mb.tournament_players to authenticated;
  end if;
end;
$$;
