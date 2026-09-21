ALTER TABLE "mb"."tokens" ADD COLUMN "unit_price" integer;--> statement-breakpoint

-- Reprise de l'existant : les jetons déjà vendus portent la valeur de leur
-- achat. Le reste — jeu de démonstration, jetons offerts à la main — garde
-- `null`, et le scan retombera sur le tarif de la salle.
--
-- La division entière perd le reste : un pack à 1000 F pour trois jetons
-- donnerait 333 × 3 = 999 F. On rend le franc manquant aux premiers jetons,
-- sans quoi la recette d'une soirée s'écarte lentement de la caisse.
-- On divise par le nombre de jetons réellement rattachés, et non par le
-- `tokens` déclaré sur l'achat : si les deux divergent — reprise de données,
-- jeton offert après coup — c'est le compte réel qui fait foi, et la somme des
-- valeurs retombe toujours sur ce qui a été payé.
with compte as (
  select purchase_id, count(*)::int as total
    from mb.tokens
   where purchase_id is not null
   group by purchase_id
),
valeur as (
  select t.id,
         p.amount / c.total as base,
         case
           when row_number() over (partition by t.purchase_id order by t.created_at, t.id)
                <= p.amount % c.total
           then 1 else 0
         end as reste
    from mb.tokens t
    join mb.purchases p on p.id = t.purchase_id
    join compte c on c.purchase_id = t.purchase_id
   where c.total > 0
)
update mb.tokens t
   set unit_price = v.base + v.reste
  from valeur v
 where v.id = t.id;
