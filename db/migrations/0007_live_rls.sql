-- RLS de Master Break Live.
--
-- Un score en direct est public par nature : c'est ce qu'on affiche sur l'écran
-- de la salle et ce que suivent les joueurs. Les deux tables sont donc en
-- lecture ouverte ; l'écriture reste au serveur, seul le gérant marque les
-- points depuis sa console.

alter table mb.matches enable row level security;--> statement-breakpoint
alter table mb.match_events enable row level security;--> statement-breakpoint

drop policy if exists matches_read on mb.matches;--> statement-breakpoint
create policy matches_read on mb.matches for select using (true);--> statement-breakpoint

drop policy if exists match_events_read on mb.match_events;--> statement-breakpoint
create policy match_events_read on mb.match_events for select using (true);--> statement-breakpoint

do $$
begin
  revoke all on mb.matches, mb.match_events from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.matches, mb.match_events to service_role;
  end if;

  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on mb.matches, mb.match_events to anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on mb.matches, mb.match_events to authenticated;
  end if;
end;
$$;
