-- RLS des cours.
--
-- Le catalogue des cours est public — c'est une vitrine. Les inscriptions ne
-- le sont pas : elles nomment qui suit quoi et ce qu'il a payé.

alter table mb.courses enable row level security;--> statement-breakpoint
alter table mb.enrollments enable row level security;--> statement-breakpoint

drop policy if exists courses_read on mb.courses;--> statement-breakpoint
create policy courses_read on mb.courses for select using (active);--> statement-breakpoint

drop policy if exists enrollments_read_own on mb.enrollments;--> statement-breakpoint
create policy enrollments_read_own on mb.enrollments for select
  using (user_id = mb.current_user_id());--> statement-breakpoint

do $$
begin
  revoke all on mb.courses, mb.enrollments from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.courses, mb.enrollments to service_role;
  end if;

  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on mb.courses to anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on mb.courses to authenticated;
    grant select on mb.enrollments to authenticated;
  end if;
end;
$$;
