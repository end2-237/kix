-- RLS de Venue OS, dans la continuité de 0001_rls.sql.
--   · le plan de salle est public : un joueur doit voir ce qui est libre ;
--   · une réservation n'est visible que de son auteur et du gérant de la salle.

alter table mb.venue_tables enable row level security;--> statement-breakpoint
alter table mb.reservations enable row level security;--> statement-breakpoint

drop policy if exists venue_tables_read on mb.venue_tables;--> statement-breakpoint
create policy venue_tables_read on mb.venue_tables for select using (active);--> statement-breakpoint

drop policy if exists reservations_read on mb.reservations;--> statement-breakpoint
create policy reservations_read on mb.reservations for select
  using (
    user_id = mb.current_user_id()
    or venue_id = mb.current_venue_id()
    or mb.current_role() = 'admin'
  );--> statement-breakpoint

do $$
begin
  revoke all on mb.venue_tables, mb.reservations from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.venue_tables, mb.reservations to service_role;
  end if;

  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on mb.venue_tables to anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on mb.venue_tables, mb.reservations to authenticated;
  end if;
end;
$$;
