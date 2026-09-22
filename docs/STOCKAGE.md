# Les images des fiches

Les photos de salles, de produits et d'événements ne sont plus des chemins
vers `public/img` livrés avec le code : elles se téléversent depuis les
formulaires, et c'est leur adresse publique qui part en base.

Sans cela, ajouter une salle supposait un déploiement — et tout le monde
finissait par réutiliser les six mêmes photos du dépôt.

## Ce qu'il faut renseigner

Trois variables, dans l'environnement de l'application :

```
SUPABASE_URL=https://ton-supabase.exemple.com
SUPABASE_SERVICE_ROLE_KEY=…
SUPABASE_BUCKET=mb-public        # facultatif, « mb-public » par défaut
```

**`SUPABASE_URL` doit exister au moment de la construction**, pas seulement à
l'exécution. `next/image` refuse un domaine distant qu'on ne lui a pas annoncé,
et cette déclaration se fige dans le build : renseignée après coup, les images
téléversées ne s'afficheraient nulle part.

Dans Coolify, ces variables doivent donc être posées sur la ressource **avant**
de lancer le déploiement.

## Ce que fait l'application

- Le seau est créé au premier dépôt, public en lecture. Les images de fiches
  sont montrées à tout le monde : les servir derrière une URL signée qui expire
  obligerait à re-signer à chaque rendu, pour protéger une photo que la salle
  affiche elle-même sur sa vitrine.
- Le nom du fichier est tiré au sort, jamais repris de l'original : un nom
  d'origine peut contenir n'importe quoi, et deux gérants qui envoient tous
  deux « photo.jpg » écraseraient l'image l'un de l'autre.
- Les dépôts sont rangés par famille : `salles/`, `produits/`, `evenements/`.
- Formats acceptés : JPEG, PNG, WebP, AVIF, GIF. Cinq mégaoctets au plus.
  Le contrôle est fait **côté serveur** — un contrôle de navigateur se
  contourne.
- Seuls l'administration, les gérants et les vendeurs peuvent téléverser.
  Ouvrir cette porte à tout compte reviendrait à offrir un hébergement
  d'images gratuit à qui s'inscrit.

## Coller une adresse plutôt que téléverser

Le champ image a deux entrées, également valables : la vignette ouvre le
sélecteur de fichiers, et le champ texte à côté accepte l'adresse d'une image
qui existe déjà ailleurs. C'est ce champ texte qui part en base dans les deux
cas — le téléversement ne fait que le remplir.

Une adresse étrangère est servie **telle quelle**, sans passer par
l'optimiseur de Next : celui-ci n'accepte que les hôtes déclarés dans
`next.config.ts`, et lui en ouvrir un de plus ferait de `/_next/image` un
relais d'images public pour n'importe qui. Nos propres images, elles, restent
optimisées — un forfait mobile ne se dépense pas en photos pleine taille.
C'est le rôle de `<Photo>` (`components/ui/Photo.tsx`), à utiliser partout où
l'adresse vient de la base.

## Si le stockage n'est pas configuré

Rien ne casse : le champ texte reste utilisable, et les chemins existants
(`/img/hall-dark.jpg`) continuent de fonctionner. Le téléversement répond
simplement « le stockage n'est pas configuré sur ce serveur ».

## Quand un dépôt échoue

Le message dit quoi vérifier plutôt que de recracher la réponse brute :

- **« L'adresse … répond une page web, pas un Supabase Storage »** —
  `SUPABASE_URL` pointe sur un site, pas sur un Supabase. C'est le cas quand
  on y a mis par mégarde le domaine de l'application elle-même. L'adresse
  attendue est celle de l'API Supabase, celle qui répond à
  `GET /storage/v1/bucket`.
- **« la clé de service est absente ou périmée »** (401 / 403) —
  `SUPABASE_SERVICE_ROLE_KEY` est vide, tronquée, ou vient d'un autre projet.
- **« le seau … n'existe pas et n'a pas pu être créé »** (404) — la clé n'a
  pas le droit de créer un seau ; crée-le à la main, public en lecture.

Un doute sur l'adresse ? Depuis le serveur :

```
curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  "$SUPABASE_URL/storage/v1/bucket"
```

Un `200 application/json` est bon signe. Un `text/html`, quel que soit le
code, veut dire que l'adresse mène à un site web.

## La clé de service

Elle ne vit que dans l'environnement. Elle n'est jamais écrite dans le dépôt,
jamais renvoyée au navigateur : tout dépôt passe par le serveur, qui vérifie
d'abord le rôle de qui l'envoie.
