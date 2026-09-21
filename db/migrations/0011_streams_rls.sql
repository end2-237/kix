-- RLS des directs.
--
-- La fiche d'un direct est publique — on doit pouvoir annoncer ce qui passe ce
-- soir — mais `stream_key` est le secret d'ingestion : il ne sort jamais par
-- l'API. D'où une vue qui l'omet, et aucun droit sur la table elle-même pour
-- `anon` et `authenticated`.

alter table mb.streams enable row level security;--> statement-breakpoint
alter table mb.stream_passes enable row level security;--> statement-breakpoint

drop policy if exists streams_read on mb.streams;--> statement-breakpoint
create policy streams_read on mb.streams for select using (true);--> statement-breakpoint

drop policy if exists stream_passes_read_own on mb.stream_passes;--> statement-breakpoint
create policy stream_passes_read_own on mb.stream_passes for select
  using (user_id = mb.current_user_id());--> statement-breakpoint

-- Tout sauf la clé d'ingestion.
create or replace view mb.public_streams as
  select id, venue_id, match_id, event_id, title, level, access, price, path,
         status, started_at, ended_at, viewers, peak_viewers, replay_url, created_at
    from mb.streams;--> statement-breakpoint

alter view mb.public_streams set (security_invoker = true);--> statement-breakpoint

do $$
begin
  revoke all on mb.streams, mb.stream_passes from public;
  revoke all on mb.public_streams from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.streams, mb.stream_passes to service_role;
    grant select on mb.public_streams to service_role;
  end if;

  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on mb.public_streams to anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on mb.public_streams to authenticated;
    grant select on mb.stream_passes to authenticated;
  end if;
end;
$$;
