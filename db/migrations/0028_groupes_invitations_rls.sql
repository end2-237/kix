-- RLS des groupes et des invitations.
--
-- Un groupe est visible : c'est une bande qui se donne un nom, et le nom est
-- fait pour être vu. Qui en fait partie l'est aussi — on rejoint un groupe
-- pour y être compté.
--
-- Une invitation, non : elle dit où quelqu'un se trouve ce soir. Seuls
-- l'expéditeur et le destinataire la lisent.

alter table mb.crews enable row level security;--> statement-breakpoint
alter table mb.crew_members enable row level security;--> statement-breakpoint
alter table mb.invitations enable row level security;--> statement-breakpoint

drop policy if exists crews_read on mb.crews;--> statement-breakpoint
create policy crews_read on mb.crews for select using (true);--> statement-breakpoint

drop policy if exists crew_members_read on mb.crew_members;--> statement-breakpoint
create policy crew_members_read on mb.crew_members for select
  using (status = 'membre' or user_id = mb.current_user_id());--> statement-breakpoint

drop policy if exists invitations_read_own on mb.invitations;--> statement-breakpoint
create policy invitations_read_own on mb.invitations for select
  using (from_id = mb.current_user_id() or to_id = mb.current_user_id());--> statement-breakpoint

do $$
begin
  revoke all on mb.crews, mb.crew_members, mb.invitations from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.crews, mb.crew_members, mb.invitations to service_role;
  end if;

  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on mb.crews to anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on mb.crews, mb.crew_members, mb.invitations to authenticated;
  end if;
end;
$$;
