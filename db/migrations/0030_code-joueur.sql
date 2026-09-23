-- Le code à six chiffres de chaque joueur.
--
-- Drizzle proposait d'ajouter la colonne en NOT NULL d'un trait : cela
-- échouerait sur une base déjà peuplée. On l'ajoute donc vide, on la remplit,
-- et seulement ensuite on la rend obligatoire.
--
-- Le tirage boucle jusqu'à trouver un code libre. À six chiffres il y a neuf
-- cent mille possibilités : une collision est rare, mais une base qui grandit
-- finit toujours par en rencontrer une.

alter table mb.users add column if not exists code text;--> statement-breakpoint

do $$
declare
  ligne record;
  essai text;
begin
  for ligne in select id from mb.users where code is null loop
    loop
      essai := lpad((100000 + floor(random() * 900000))::int::text, 6, '0');
      exit when not exists (select 1 from mb.users where code = essai);
    end loop;
    update mb.users set code = essai where id = ligne.id;
  end loop;
end;
$$;--> statement-breakpoint

alter table mb.users alter column code set not null;--> statement-breakpoint
create unique index if not exists users_code_idx on mb.users using btree (code);
