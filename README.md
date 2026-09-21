# Master Break

> L'écosystème de l'excellence billard — Cameroun.

Plateforme web et mobile qui numérise le billard, la nuit et la culture urbaine :
jetons achetés depuis le téléphone et validés par QR en salle, boutique
d'équipement, billetterie de tournois, fidélité et classement.

Le dépôt contient l'application Next.js, sa base de données et les maquettes
d'origine (`design/`, réalisées sous l'ancien nom du projet).

## Identité

Or `#D9B450` sur vert billard `#071A13`, typographie Geist, monogramme dans
`public/brand/`. Deux familles de formes : blocs rectangulaires pour la donnée,
pastilles pour l'action.

## Démarrer

```bash
npm install
npm run db:migrate   # crée data/masterbreak.db
npm run db:seed      # jeu de données de démonstration
npm run dev          # http://localhost:3000
```

Autres scripts : `npm run build`, `npm run lint`, `npm run db:reset`
(recrée la base à zéro), `npm run db:generate` (nouvelle migration après une
modification de `db/schema.ts`).

## Comptes de démonstration

L'authentification est volontairement réduite à un cookie (`/connexion`) : pas de
mot de passe tant que Supabase Auth n'est pas branché.

| Compte | Rôle | Accès |
| --- | --- | --- |
| Ariel N. | client | `/app` — jetons, shop, billets, fidélité |
| Serge M. | gérant | `/gerant` — Master Scan, caisse du Break Akwa |
| Direction Master Break | admin | `/admin` — catalogue, salles, revenus |

## Parcours

**Public** — `/` accueil web (héros, sections pleine page, coachs, tables).

**Client** — `/app` accueil · `/app/recharge` achat de jetons (Orange Money /
MTN MoMo) · `/app/pass` QR + code de secours · `/app/shop` boutique ·
`/app/shop/[slug]` fiche produit · `/app/panier` panier et paiement ·
`/app/commandes` · `/app/events` et `/app/events/[slug]` billetterie ·
`/app/billets` · `/app/notifications` · `/app/rewards` · `/app/salles`.

**Gérant** — `/gerant` : scanner, code de secours à 4 chiffres, jetons débités du
jour, recette, derniers passages, commission Master Break.

**Admin** — `/admin` tableau de bord, puis `salles`, `packs`, `produits`,
`commandes`, `evenements`, `jetons`, `utilisateurs` (création, édition, retrait,
changement de rôle et de statut).

### La boucle jeton, de bout en bout

Une recharge crée une ligne `purchases` et autant de `tokens` ; le Master Pass
affiche le QR (`mb://jeton/<code>`) et son code de secours ; Master Scan débite le
jeton, écrit un `scan`, crédite les points du client et lui envoie une
notification. Le solde client, la recette du gérant et le tableau de bord admin
bougent dans la même seconde.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript strict), Server Components et
  Server Actions pour toutes les mutations
- **Drizzle ORM + SQLite** via `@libsql/client` — binaires précompilés, aucune
  compilation à l'installation ; schéma dans `db/schema.ts`, migrations SQL dans
  `db/migrations/`
- **Tailwind CSS v4** — jetons de design dans `app/globals.css`, thème sombre et
  **thème clair** au commutateur (mémorisé, sans flash au chargement)
- **Geist** auto-hébergée (`next/font/local`), `qrcode` pour des QR réellement
  encodés, PWA (`app/manifest.ts`)

## Organisation

```
app/            routes ; app/app/* = client, app/gerant = caisse, app/admin = back-office
components/     ui/ (boutons, cartes, snackbar, thème), mb/, shop/, admin/, site/
db/             schema.ts, migrations/, seed.ts, client.ts
lib/            queries.ts (lectures), actions.ts (mutations), session.ts, cart.ts, format.ts
design/         maquettes d'origine (voir design/README.md)
```

## Direction artistique

Fond quasi noir, vert billard, violet nuit, et deux familles de formes assumées :
des blocs bien rectangulaires pour la donnée (tableaux, blocs de chiffres,
champs) et des pastilles bien rondes pour l'action (boutons, chips, avatars).
Typographie Geist, titres très serrés (-0.03em). Cible tactile 44 px minimum.

## Déploiement

Le conteneur se suffit à lui-même : au démarrage, `instrumentation.ts` applique
les migrations puis charge le jeu de démonstration **si la base est vide**. Aucune
commande à lancer après le déploiement.

Variables utiles :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | chemin du fichier SQLite (`/app/data/masterbreak.db` par défaut) ou URL `libsql://` (Turso) |
| `MB_SKIP_SEED` | `1` pour ne jamais charger le jeu de démonstration |

**Persistance** : monter un volume sur `/app/data`, sinon la base repart de zéro
à chaque redéploiement (le conteneur est immuable). Sur Coolify : Storages →
ajouter un volume persistant, destination `/app/data`.

Aucune dépendance native à compiler : ni Python ni node-gyp ne sont nécessaires
dans l'image de build. Le `.npmrc` du dépôt pose `omit=peer` pour cela : npm
installe sinon les peer dependencies optionnelles, dont le `better-sqlite3` de
drizzle-orm, qui exige une chaîne de compilation. Toutes les dépendances
réellement utilisées sont déclarées dans `package.json`.

## Migration vers Supabase

Le schéma est écrit en types portables. Pour passer à Postgres :

1. `db/client.ts` : remplacer `@libsql/client` par `postgres-js`
   (`drizzle-orm/postgres-js`) et pointer `DATABASE_URL` sur Supabase.
2. `db/schema.ts` : `sqliteTable` → `pgTable`, `integer(... { mode: "timestamp" })`
   → `timestamp`, `integer(... { mode: "boolean" })` → `boolean`.
3. `npm run db:generate` puis appliquer la migration.
4. Remplacer `lib/session.ts` par Supabase Auth (OTP SMS) et déplacer le panier
   (`lib/cart.ts`, aujourd'hui dans le navigateur) en table si besoin.

Les lectures (`lib/queries.ts`) et les mutations (`lib/actions.ts`) sont déjà
écrites en `await` sur un driver asynchrone : rien à réécrire côté application.

## Données d'exemple

Prix, salles, personnes et statistiques sont fictifs, y compris les valeurs entre
crochets de l'accueil web. Le paiement Mobile Money est simulé côté serveur : il
reste à brancher les API Orange Money / MTN MoMo et leurs webhooks.
