-- RLS des défis.
--
-- Un défi ne regarde que ses deux joueurs : il porte une adresse de
-- rendez-vous et un message. Rien ne s'ouvre à `anon`, et l'application vérifie
-- de son côté que celui qui répond est bien l'un des deux.

alter table mb.challenges enable row level security;--> statement-breakpoint

do $$
begin
  revoke all on mb.challenges from public;

  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on mb.challenges to service_role;
  end if;
end;
$$;
