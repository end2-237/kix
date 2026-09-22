-- RLS des abonnements.
--
-- Les formules sont un tarif public : les cacher empêcherait de les vendre.
-- Les abonnements, eux, disent qui paie quoi et jusqu'à quand — chacun ne
-- voit que le sien, et l'administration passe par l'application.

alter table mb.member_plans enable row level security;--> statement-breakpoint
alter table mb.memberships enable row level security;--> statement-breakpoint

drop policy if exists member_plans_read on mb.member_plans;--> statement-breakpoint
create policy member_plans_read on mb.member_plans for select using (active);--> statement-breakpoint

drop policy if exists memberships_read_own on mb.memberships;--> statement-breakpoint
create policy memberships_read_own on mb.memberships for select
  using (user_id = mb.current_user_id());--> statement-breakpoint

do $$
begin
  revoke all on mb.member_plans, mb.memberships from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.member_plans, mb.memberships to service_role;
  end if;

  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on mb.member_plans to anon;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on mb.member_plans, mb.memberships to authenticated;
  end if;
end;
$$;
