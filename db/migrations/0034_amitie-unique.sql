-- Une amitié, une seule ligne — quel que soit le sens.
--
-- `friendships_paire_idx` n'interdisait que le doublon dans le même sens :
-- A→B et B→A pouvaient coexister si les deux joueurs se demandaient en même
-- temps, chacun ne voyant pas encore la ligne de l'autre. Le profil lisait
-- alors « une » des deux lignes, sans ordre garanti, et pouvait proposer
-- « Ajouter en ami » à quelqu'un avec qui on était déjà ami.
--
-- On garde la ligne la plus avancée de chaque paire — une amitié acceptée
-- l'emporte sur une demande en attente, qui l'emporte sur un refus — puis on
-- rend la paire unique dans les deux sens.

with classees as (
  select
    id,
    row_number() over (
      partition by least(requester_id, addressee_id), greatest(requester_id, addressee_id)
      order by
        case status
          when 'acceptee' then 0
          when 'attente' then 1
          when 'bloquee' then 2
          else 3
        end,
        created_at
    ) as rang
  from mb.friendships
)
delete from mb.friendships
 where id in (select id from classees where rang > 1);--> statement-breakpoint

create unique index if not exists friendships_paire_sans_sens_idx
  on mb.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
