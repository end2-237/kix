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

Il faut un Postgres — le Supabase auto-hébergé, ou n'importe quelle instance
locale. Copier `.env.example` en `.env.local` et renseigner `DATABASE_URL`.

```bash
npm install
cp .env.example .env.local   # puis renseigner DATABASE_URL
npm run db:migrate           # crée le schéma `mb` et applique les migrations
npm run db:seed              # jeu de données de démonstration
npm run dev                  # http://localhost:3000
```

Autres scripts : `npm run build`, `npm run lint`, `npm run db:reset`
(supprime le schéma `mb` puis rejoue migrations et seed), `npm run db:generate`
(nouvelle migration après une modification de `db/schema.ts`).

## Comptes de démonstration

Connexion par numéro de téléphone et mot de passe sur `/connexion`, création de
compte sur `/inscription`. Les comptes du jeu de démonstration partagent le mot
de passe `masterbreak` (`MB_DEMO_PASSWORD` pour en changer au seed).

| Compte | Numéro | Rôle | Accès |
| --- | --- | --- | --- |
| Ariel N. | 6 77 45 12 08 | client | `/app` — jetons, shop, billets, fidélité |
| Serge M. | 6 99 12 03 45 | gérant | `/gerant` — Master Scan, caisse du Break Akwa |
| Direction Master Break | 6 90 00 00 00 | admin | `/admin` — catalogue, salles, revenus |

### Comment fonctionne la session

Les mots de passe sont hachés en **scrypt** (`node:crypto`, aucune dépendance
native) au format `scrypt$<sel>$<empreinte>`. À la connexion, un jeton aléatoire
de 32 octets part dans un cookie `mb_session` httpOnly ; la base ne garde que son
empreinte SHA-256, donc une fuite de `mb.sessions` ne permet pas de se
connecter. La déconnexion supprime la ligne côté serveur, et les sessions
expirées sont purgées au démarrage.

Les gardes vivent dans les layouts (`requireUser`, `requireRole`) : le refus est
une redirection HTTP, pas un saut côté client une fois la page envoyée. Un numéro
inconnu et un mot de passe faux renvoient le même message, vérifié sur une
empreinte factice pour que les deux prennent le même temps.

## Parcours

**Public** — `/` accueil web (héros, sections pleine page, coachs, tables) ·
`/connexion` · `/inscription`.

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
- **Drizzle ORM + Postgres** via `postgres-js` — schéma `mb` dans
  `db/schema.ts`, migrations SQL dans `db/migrations/`, aucune compilation
  native à l'installation
- **Tailwind CSS v4** — jetons de design dans `app/globals.css`, thème sombre et
  **thème clair** au commutateur (mémorisé, sans flash au chargement)
- **Geist** auto-hébergée (`next/font/local`), `qrcode` pour des QR réellement
  encodés, PWA (`app/manifest.ts`)

## Organisation

```
app/            routes ; app/app/* = client, app/gerant = caisse, app/admin = back-office
components/     ui/ (boutons, cartes, snackbar, thème), mb/, shop/, admin/, site/
db/             schema.ts, migrations/, seed.ts, client.ts, env.ts, reset.ts
lib/            queries.ts (lectures), actions.ts (mutations), auth.ts, password.ts, session.ts, cart.ts
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

Variables (voir `.env.example`) :

| Variable | Rôle |
| --- | --- |
| `DATABASE_URL` | URL Postgres du Supabase auto-hébergé (pooler 6543 ou direct 5432) |
| `DATABASE_POOL` | taille du pool, 10 par défaut |
| `MB_SKIP_SEED` | `1` pour ne jamais charger le jeu de démonstration |
| `MB_DEMO_PASSWORD` | mot de passe des comptes de démonstration au seed |

La base vit désormais hors du conteneur : plus de volume à monter, le
redéploiement ne perd plus rien.

Aucune dépendance native à compiler : ni Python ni node-gyp ne sont nécessaires
dans l'image de build. Le `.npmrc` du dépôt pose `omit=peer` pour cela : npm
installe sinon les peer dependencies optionnelles, dont le `better-sqlite3` de
drizzle-orm, qui exige une chaîne de compilation. Toutes les dépendances
réellement utilisées sont déclarées dans `package.json`.

## Supabase auto-hébergé — le schéma `mb`

Le Supabase du VPS héberge plusieurs applications. Master Break n'écrit jamais
dans `public` : **tout vit dans le schéma `mb`** (`mb.users`, `mb.tokens`,
`mb.scans`…). Le driver pose `search_path = mb, public`, et `drizzle.config.ts`
filtre sur `mb` pour que `db:generate` ignore les tables des autres apps.

| Migration | Contenu |
| --- | --- |
| `db/migrations/0000_schema_mb.sql` | création du schéma `mb` et de ses 13 tables |
| `db/migrations/0001_rls.sql` | Row Level Security, politiques et droits |

Mise à jour d'une instance existante :

```bash
DATABASE_URL="postgres://…" npm run db:migrate
```

Les migrations sont journalisées dans `mb.__drizzle_migrations` : rejouer la
commande ne réapplique rien. `0001_rls.sql` est écrit pour être réexécutable
(`drop policy if exists` avant chaque création).

### Sécurité des données

`0001_rls.sql` active RLS sur les treize tables et pose les politiques :

- **catalogue** (`venues`, `packs`, `products`, `events`) : lisible par `anon` et
  `authenticated` quand la ligne est active, écriture réservée au serveur ;
- **données personnelles** (`purchases`, `tokens`, `orders`, `order_items`,
  `tickets`, `notifications`) : chacun ne voit que ses lignes ;
- **`users`** : chacun lit et modifie son profil, mais le `WITH CHECK` verrouille
  `role`, `points` et `venue_id` — impossible de se promouvoir ou de se créditer ;
- **`scans` et `tokens`** : le gérant voit ceux de sa salle, pour valider un QR ;
- **`sessions`** : aucune politique, aucun droit — invisible depuis l'API.

L'identité vient du JWT (`mb.jwt_sub()`, équivalent d'`auth.uid()` sans dépendre
du schéma `auth`) et se relie à `mb.users.auth_id`. Ces politiques protègent la
surface PostgREST ; les Server Actions se connectent avec le rôle propriétaire et
gardent leur propre contrôle d'accès (`lib/session.ts`).

### Ce qui reste à brancher

Supabase Auth (GoTrue) pourra remplacer l'authentification maison : la colonne
`mb.users.auth_id` est le pont, et `passwordHash` devient nul pour les comptes
migrés. Le panier (`lib/cart.ts`) vit encore dans le navigateur.

## Données d'exemple

Prix, salles, personnes et statistiques sont fictifs, y compris les valeurs entre
crochets de l'accueil web. Le paiement Mobile Money est simulé côté serveur : il
reste à brancher les API Orange Money / MTN MoMo et leurs webhooks.
