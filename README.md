# KIX

Application lifestyle qui digitalise le billard, la vape et la nuit au Cameroun :
jetons de billard achetés depuis le téléphone, QR scanné par le gérant, boutique
de vapes et d'accessoires, billetterie de tournois et fidélité.

Ce dépôt contient l'application Next.js et les maquettes qui lui servent de
référence (`design/`).

## Démarrer

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de production
npm run lint
```

## Parcours

| Route | Écran |
| --- | --- |
| `/` | Accueil web : promesse produit, modules, accès app et espace gérant |
| `/app` | Accueil de l'app : solde KIX Pass, à la une, salles proches |
| `/app/recharge` | Achat de jetons + paiement Orange Money / MTN MoMo (simulé) |
| `/app/pass` | Portefeuille : QR du jeton, code de secours 4 chiffres, historique |
| `/app/shop` | Boutique vapes et matériel de billard, panier |
| `/app/salles` | Salles partenaires |
| `/app/events` · `/app/events/[slug]` | Événements et billetterie |
| `/app/rewards` | XP, conversion en jetons, classement, défis |
| `/gerant` | KIX Scan : scanner, code de secours, KPI du soir, derniers passages |

### La boucle jeton, de bout en bout

`/app/recharge` crédite des jetons → `/app/pass` affiche le QR (`kix://jeton/<code>`)
et son code de secours → `/gerant` débite ce code et l'écran client se met à jour.
L'état vit côté navigateur (`lib/store.ts`, `localStorage`) : pas de backend, mais
la mécanique complète est jouable.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript strict)
- **Tailwind CSS v4** — tokens KIX déclarés dans `app/globals.css` (`@theme`)
- **Space Grotesk** (titres) et **Outfit** (interface), auto-hébergées via `next/font/local`
- **qrcode** pour des QR réellement encodés
- PWA : `app/manifest.ts`, thème sombre, `start_url` sur `/app`

## Organisation

```
app/            routes (App Router) ; app/app/* = l'app mobile, app/gerant = la caisse
components/     ui/ (Button, Card, Chip), kix/ (QR, nav, cartes), icons.tsx
lib/            data.ts (contenu d'exemple), store.ts (état client), format.ts (FCFA)
design/         maquettes source + rendus PNG (voir design/README.md)
public/img/     photos Unsplash
```

## Direction artistique

Cyber-Urban Dark : fond `#0B0B0D`, cartes en verre, vert billard `#3DF08A`,
violet nuit `#9B6BFF`. Cible tactile 44 px, gouttière 20 px en mobile et 72 px en
desktop. Le mobile reste la référence : le web reprend les mêmes composants.

## Données d'exemple

Prix, salles, personnes et statistiques sont fictifs. Les valeurs entre crochets
sur l'accueil web (`[12]` salles, `[4 300]` jetons/mois) sont des placeholders à
remplacer. Le paiement Mobile Money est simulé côté client : il reste à brancher
sur les API Orange Money / MTN MoMo et leurs webhooks.
