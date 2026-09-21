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
`/app/billets` · `/app/notifications` · `/app/rewards` · `/app/salles` et
`/app/salles/[slug]` plan de salle en direct et réservation ·
`/app/reservations` · `/app/live` et `/app/live/[id]` scores en direct et mode
plein écran.

**Arbitre** — `/arbitre` les feuilles confiées · `/arbitre/[id]` la feuille de
match · `/arbitre/invitation/[token]` acceptation d'une invitation.

**Gérant** — `/gerant` scanner (QR signé, code de secours à 4 chiffres, jetons
débités du jour, recette, derniers passages) · `/gerant/salle` plan de salle et
cahier des réservations · `/gerant/service` recette heure par heure, occupation,
total à verser · `/gerant/live` création des matchs et attribution des feuilles.

**Admin** — `/admin` tableau de bord, puis `salles`, `packs`, `produits`,
`commandes`, `evenements`, `jetons`, `utilisateurs` (création, édition, retrait,
changement de rôle et de statut).

### La boucle jeton, de bout en bout

Une recharge crée une ligne `purchases` **en attente** ; rien n'est crédité tant
que l'opérateur n'a pas confirmé. À la confirmation, les `tokens` apparaissent ;
le Master Pass affiche un QR signé et son code de secours ; Master Scan vérifie
la signature, débite le jeton, écrit un `scan`, crédite les points du client et
lui envoie une notification. Le solde client, la recette du gérant et le tableau
de bord admin bougent dans la même seconde.

## Paiements — pawaPay

Recharges, commandes et billets passent par le même chemin : une ligne
`mb.payments` par tentative, `kind` + `target_id` désignant ce qui est payé.

1. L'app crée la ligne métier **en attente** et pousse une demande de débit ;
2. le client valide sur son téléphone (#150*50# pour Orange Money, *126# pour MoMo) ;
3. pawaPay notifie `/api/webhooks/pawapay`, et l'écran d'attente interroge aussi
   le serveur toutes les deux secondes — si la notification se perd, le client
   n'est pas bloqué pour autant ;
4. à la confirmation seulement : jetons crédités, stock décompté, billet émis.

La référence d'un paiement **est** le `depositId` pawaPay (un UUID v4) : leur
endpoint est idempotent, et le nôtre aussi — `settlePayment` verrouille la ligne
et ne rejoue jamais un paiement déjà réglé. Une notification répétée ne crédite
donc rien deux fois. C'est vérifié par les tests.

**Sur la notification, rien n'est cru sur parole.** La route n'en retient que
l'identifiant du dépôt, puis redemande le statut réel à pawaPay avec notre jeton
d'API : une notification forgée ne peut rien créditer. Le `Content-Digest`, quand
il est présent, est vérifié en plus.

Sans `PAWAPAY_API_TOKEN`, l'app utilise un encaisseur de démonstration : même
parcours, même écran d'attente, même webhook signé, aucun argent qui bouge. Deux
numéros de test s'y comportent différemment — `…000` échoue (solde insuffisant),
`…999` reste en attente (client qui ne valide jamais).

Reste à faire côté pawaPay : renseigner l'URL de callback dans leur tableau de
bord et vérifier les codes opérateurs camerounais (`ORANGE_CMR`,
`MTN_MOMO_CMR`), tous deux pilotés par l'environnement.

## Venue OS — la salle

Chaque table de billard est une ligne en base : type, places, tarif horaire et
acompte. Le compteur « tables libres » n'est plus déclaratif, il se recalcule à
chaque geste du comptoir.

**Le joueur** ouvre `/app/salles/<salle>`, voit l'état des tables en direct et en
retient une : heure, durée, nombre de joueurs, mot pour la salle. L'acompte passe
par le même chemin de paiement que le reste — la table n'est bloquée qu'une fois
l'acompte confirmé, sinon il suffirait d'ouvrir l'écran de paiement pour geler la
salle un soir de match. Deux personnes qui visent le même créneau : la seconde
est refusée, à la réservation comme à la confirmation.

**Le gérant** tient son service sur `/gerant/salle` : plan de salle, cahier du
soir, et les trois gestes qui comptent — installer, terminer, noter une absence.
Les clients arrivent en avance, donc la réservation attendue s'installe sans
attendre l'heure dite. `/gerant/service` donne la recette heure par heure, les
acomptes encaissés, le taux d'occupation et le total à verser.

**La direction** ouvre et ferme les tables depuis `/admin/tables`, et change un
acompte sans toucher au code.

## Les matchs et le score en direct

`mb.matches` porte le score qui fait foi, `mb.match_events` le déroulé coup par
coup — manches, casses gagnantes, fautes, sécurités. Les statistiques ne sont
jamais stockées en double : elles se dérivent de la frise, donc corriger un
événement corrige les chiffres.

Le score part en direct par **SSE** (`/api/live`, `/api/live/[id]`). Le serveur
ne pousse que si la signature de l'état a changé : un score figé ne consomme
rien. `EventSource` se reconnaît tout seul après une coupure — ce qui compte
dans une salle.

Côté joueur, `/app/live` liste ce qui se joue, `/app/live/[id]` donne le
tableau d'affichage, les statistiques comparées, la frise et le face-à-face.
Un **mode plein écran** bascule la même page en affichage de salle, lisible de
loin, pour le téléviseur au-dessus des tables.

### Qui tient la feuille de match

Une seule fonction décide, `canScore`, avec quatre portes d'entrée :

| Porte | Pour qui | Portée |
| --- | --- | --- |
| Rattachement à la salle | gérant, arbitre de salle | tous les matchs de la salle, tous les soirs |
| Habilitation sur un match | arbitre désigné par le gérant | cette rencontre |
| Habilitation sur un tournoi | arbitre de compétition | toutes les rencontres du tournoi |
| Auto-arbitrage | les deux joueurs | si la salle l'a ouvert (`venues.self_scoring`) |

La direction passe partout ; un match terminé ne se marque plus, quel que soit
le titre.

Le gérant confie une feuille de deux façons : en désignant un compte, ou en
envoyant un **lien d'invitation signé** valable deux heures. Le lien n'est pas
un droit anonyme qui circulerait de téléphone en téléphone : il propose au
compte connecté de prendre la feuille, et c'est son geste qui l'inscrit — le
gérant voit alors qui arbitre et peut le retirer. Chaque point saisi est
horodaté au nom de celui qui l'a saisi (`match_events.by_id`), pour que la
feuille reste opposable.

## Master Pass — le QR est signé

Le QR ne porte plus le code du jeton, mais un laissez-passer signé
(`mb://pass/mb1.<charge>.<signature>`, HMAC-SHA256) qui **expire au bout de 90
secondes**. L'écran le renouvelle à chaque fin de cycle. Photographier l'écran
d'un joueur ne sert donc plus à rien, et un QR rejoué est refusé au comptoir —
le jeton étant de toute façon passé à « utilisé ». Le code à quatre chiffres
reste la porte de secours quand le réseau lâche. Les billets suivent la même
mécanique, avec une validité couvrant la soirée.

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
lib/            queries.ts (lectures), actions.ts (mutations), auth.ts, session.ts, pass.ts
lib/payments/   pawapay.ts, simulated.ts, service.ts (états, idempotence, livraison)
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
| `PAWAPAY_API_TOKEN` | jeton d'API pawaPay ; absent, l'encaisseur de démonstration prend la main |
| `PAWAPAY_ENV` | `sandbox` (défaut) ou `production` |
| `MB_QR_SECRET` | clé de signature des laissez-passer du Master Pass |
| `MB_PUBLIC_URL` | URL publique, pour les liens sortants |

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
| `db/migrations/0002_payments.sql` | table `mb.payments`, références et statuts en attente |
| `db/migrations/0003_payments_rls.sql` | RLS de `mb.payments` |
| `db/migrations/0004_venue_os.sql` | `mb.venue_tables` et `mb.reservations` |
| `db/migrations/0005_venue_os_rls.sql` | RLS de Venue OS |
| `db/migrations/0006_live.sql` | `mb.matches` et `mb.match_events` |
| `db/migrations/0007_live_rls.sql` | RLS des matchs (scores publics) |
| `db/migrations/0008_officials.sql` | `mb.match_officials`, traçabilité des saisies |
| `db/migrations/0009_officials_rls.sql` | RLS des habilitations d'arbitrage |

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
- **`venue_tables`** : le plan de salle est public, un joueur doit voir ce qui
  est libre ; **`reservations`** : l'auteur et le gérant de la salle ;
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
crochets de l'accueil web. Tant que les clés pawaPay ne sont pas renseignées,
aucun argent ne bouge : le parcours, lui, est le vrai.
