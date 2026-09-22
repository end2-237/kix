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

## Si le stockage n'est pas configuré

Rien ne casse : le champ texte reste utilisable, et les chemins existants
(`/img/hall-dark.jpg`) continuent de fonctionner. Le téléversement répond
simplement « le stockage n'est pas configuré sur ce serveur ».

## La clé de service

Elle ne vit que dans l'environnement. Elle n'est jamais écrite dans le dépôt,
jamais renvoyée au navigateur : tout dépôt passe par le serveur, qui vérifie
d'abord le rôle de qui l'envoie.
