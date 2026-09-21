-- RLS de `mb.payments`, dans la continuité de 0001_rls.sql : chacun ne voit que
-- ses propres paiements, personne n'en écrit depuis l'API (seuls le serveur et
-- le webhook, qui passent par le rôle propriétaire, créent et confirment).

alter table mb.payments enable row level security;--> statement-breakpoint

drop policy if exists payments_read_own on mb.payments;--> statement-breakpoint
create policy payments_read_own on mb.payments for select
  using (user_id = mb.current_user_id());--> statement-breakpoint

do $$
begin
  revoke all on mb.payments from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.payments to service_role;
  end if;

  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on mb.payments to authenticated;
  end if;
end;
$$;
