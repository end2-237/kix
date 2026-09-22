-- RLS des amis, des abonnements push et des retraits.
--
-- Rien de tout cela n'est public. Un lien d'amitié dit qui fréquente qui, un
-- abonnement push identifie un navigateur, un retrait dit combien une salle
-- a gagné : chacun ne voit que ce qui le concerne, et l'administration passe
-- par l'application.

alter table mb.friendships enable row level security;--> statement-breakpoint
alter table mb.push_subscriptions enable row level security;--> statement-breakpoint
alter table mb.payouts enable row level security;--> statement-breakpoint

drop policy if exists friendships_read_own on mb.friendships;--> statement-breakpoint
create policy friendships_read_own on mb.friendships for select
  using (requester_id = mb.current_user_id() or addressee_id = mb.current_user_id());--> statement-breakpoint

drop policy if exists push_read_own on mb.push_subscriptions;--> statement-breakpoint
create policy push_read_own on mb.push_subscriptions for select
  using (user_id = mb.current_user_id());--> statement-breakpoint

drop policy if exists payouts_read_own on mb.payouts;--> statement-breakpoint
create policy payouts_read_own on mb.payouts for select
  using (user_id = mb.current_user_id());--> statement-breakpoint

do $$
begin
  revoke all on mb.friendships, mb.push_subscriptions, mb.payouts from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.friendships, mb.push_subscriptions, mb.payouts to service_role;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on mb.friendships, mb.push_subscriptions, mb.payouts to authenticated;
  end if;
end;
$$;
