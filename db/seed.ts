import { randomUUID } from "node:crypto";
import { createDb } from "./client";
import {
  events,
  notifications,
  orderItems,
  orders,
  packs,
  products,
  purchases,
  scans,
  tickets,
  tokens,
  users,
  venues,
} from "./schema";

const db = createDb();

/**
 * Jeu de données de démarrage. Tout est fictif : prix, salles, personnes.
 * `npm run db:seed` remet la base à cet état.
 */

const uid = () => randomUUID();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);

function code(taken: Set<string>) {
  let c = "";
  do {
    c = String(Math.floor(1000 + Math.random() * 9000));
  } while (taken.has(c));
  taken.add(c);
  return c;
}

// on vide dans l'ordre des dépendances
export async function seed() {
for (const table of [notifications, scans, tickets, orderItems, orders, tokens, purchases, events, products, packs, users, venues]) {
  await db.delete(table);
}

/* salles ------------------------------------------------------------------ */
const venueRows = [
  {
    id: uid(),
    slug: "break-akwa",
    name: "Le Break Akwa",
    area: "Akwa",
    city: "Douala",
    address: "Rue Joss, Akwa · Douala",
    tables: 8,
    freeTables: 2,
    tokenPrice: 400,
    distanceKm: 1.2,
    image: "/img/hall-dark.jpg",
  },
  {
    id: uid(),
    slug: "zenith",
    name: "Zenith Pool Bar",
    area: "Bonapriso",
    city: "Douala",
    address: "Rue Alfred Saker · Douala",
    tables: 6,
    freeTables: 4,
    tokenPrice: 500,
    distanceKm: 3.4,
    image: "/img/hall-neon.jpg",
  },
  {
    id: uid(),
    slug: "kata",
    name: "Le Kata Club",
    area: "Bonamoussadi",
    city: "Douala",
    address: "Carrefour Kotto · Douala",
    tables: 5,
    freeTables: 3,
    tokenPrice: 400,
    distanceKm: 5.1,
    image: "/img/table-blue.jpg",
  },
];
await db.insert(venues).values(venueRows);
const [breakAkwa, zenith] = venueRows;

/* packs ------------------------------------------------------------------- */
const packRows = [
  { id: uid(), tokens: 1, price: 400, bonus: 0, hint: "Une partie, c'est tout", badge: null, sort: 1 },
  { id: uid(), tokens: 3, price: 1000, bonus: 0, hint: "Soit 333 F la partie", badge: "Le plus pris", sort: 2 },
  { id: uid(), tokens: 10, price: 3000, bonus: 2, hint: "Soit 250 F la partie", badge: null, sort: 3 },
];
await db.insert(packs).values(packRows);

/* comptes ----------------------------------------------------------------- */
const ariel = { id: uid(), name: "Ariel N.", phone: "677451208", avatar: "/img/p-ariel.jpg", role: "client", points: 1240, venueId: null };
const serge = { id: uid(), name: "Serge M.", phone: "699120345", avatar: "/img/p-gerant.jpg", role: "manager", points: 0, venueId: breakAkwa.id };
const admin = { id: uid(), name: "Direction MASTER BREAK", phone: "690000000", avatar: null, role: "admin", points: 0, venueId: null };
const others = [
  { id: uid(), name: "Blaise K.", phone: "670000001", avatar: "/img/p-champion.jpg", role: "client", points: 4020, venueId: null },
  { id: uid(), name: "Yannick T.", phone: "670000002", avatar: "/img/p-yannick.jpg", role: "client", points: 3180, venueId: null },
  { id: uid(), name: "Merline K.", phone: "670000003", avatar: null, role: "client", points: 2610, venueId: null },
  { id: uid(), name: "Duval N.", phone: "670000004", avatar: null, role: "client", points: 2280, venueId: null },
];
await db.insert(users).values([ariel, serge, admin, ...others]);
const clients = [ariel, ...others];

/* jetons d'Ariel ---------------------------------------------------------- */
const taken = new Set<string>();
const purchase = {
  id: uid(),
  userId: ariel.id,
  packId: packRows[1].id,
  venueId: breakAkwa.id,
  tokens: 3,
  amount: 1000,
  method: "momo",
  status: "paid",
  createdAt: hoursAgo(20),
};
await db.insert(purchases).values(purchase);

await db.insert(tokens)
  .values(
    Array.from({ length: 7 }, () => ({
      id: uid(),
      code: code(taken),
      userId: ariel.id,
      venueId: breakAkwa.id,
      purchaseId: purchase.id,
      status: "active",
      createdAt: hoursAgo(20),
    })),
  )
  ;

/* historique de la soirée : jetons consommés + passages -------------------- */
const usedTokens: (typeof tokens.$inferInsert)[] = [];
const scanRows: (typeof scans.$inferInsert)[] = [];
for (let i = 0; i < 124; i++) {
  const client = clients[i % clients.length];
  const venue = i % 5 === 0 ? zenith : breakAkwa;
  const at = hoursAgo(Math.random() * 6);
  const tokenId = uid();
  const tokenCode = code(taken);
  usedTokens.push({
    id: tokenId,
    code: tokenCode,
    userId: client.id,
    venueId: venue.id,
    status: "used",
    tableNumber: 1 + (i % 8),
    usedAt: at,
    createdAt: hoursAgo(7),
  });
  scanRows.push({
    id: uid(),
    kind: "token",
    refId: tokenId,
    code: tokenCode,
    userId: client.id,
    venueId: venue.id,
    managerId: serge.id,
    method: i % 9 === 0 ? "code" : "qr",
    amount: venue.tokenPrice,
    createdAt: at,
  });
}
await db.insert(tokens).values(usedTokens);
await db.insert(scans).values(scanRows);

/* boutique ---------------------------------------------------------------- */
const productRows = [
  {
    id: uid(),
    slug: "puff-neon-6000",
    name: "Puff Neon 6000 taffes",
    detail: "Mangue glacée · 5 %",
    description:
      "Puff jetable 6000 taffes, batterie 650 mAh rechargeable en USB-C. Saveur mangue glacée, taux de sel de nicotine à 5 %. Livrée chargée, prête à tirer.",
    price: 7000,
    image: "/img/puffs.jpg",
    category: "vapes",
    badgeLabel: "Top vente",
    badgeTone: "jade",
    stock: 48,
  },
  {
    id: uid(),
    slug: "pod-1000",
    name: "Pod rechargeable 1000 mAh",
    detail: "Kit complet + 2 cartouches",
    description:
      "Kit pod rechargeable avec deux cartouches de 2 ml, tirage indirect, charge USB-C en 45 minutes. Idéal pour passer du jetable au rechargeable.",
    price: 22000,
    image: "/img/vape-pod.jpg",
    category: "vapes",
    badgeLabel: null,
    badgeTone: null,
    stock: 12,
  },
  {
    id: uid(),
    slug: "carte-mb-10",
    name: "Carte MASTER BREAK · 10 jetons",
    detail: "Offerte par QR, valable 6 mois",
    description:
      "Dix jetons de billard offerts par QR code, valables six mois dans toutes les salles partenaires. Le cadeau qui se joue le soir même.",
    price: 3000,
    image: "/img/balls-glow.jpg",
    category: "vapes",
    badgeLabel: "Carte cadeau",
    badgeTone: "gold",
    stock: 99,
  },
  {
    id: uid(),
    slug: "queue-rack",
    name: "Queue 2 pièces + rack",
    detail: "Érable · 145 cm · 10 mm",
    description:
      "Queue deux pièces en érable, 145 cm, procédé 10 mm, livrée avec son rack triangle. Le compromis solide entre la queue de maison et la queue de compétition.",
    price: 45000,
    image: "/img/table-rack.jpg",
    category: "billard",
    badgeLabel: null,
    badgeTone: null,
    stock: 6,
  },
  {
    id: uid(),
    slug: "billes-tournoi",
    name: "Set de billes tournoi",
    detail: "Résine · 57,2 mm",
    description:
      "Jeu complet de billes en résine phénolique, 57,2 mm, équilibrage tournoi. Le même set que celui utilisé sur les tables du MASTER BREAK Open.",
    price: 28000,
    image: "/img/balls-dark.jpg",
    category: "billard",
    badgeLabel: null,
    badgeTone: null,
    stock: 9,
  },
  {
    id: uid(),
    slug: "craie-gant",
    name: "Kit craie + gant",
    detail: "12 craies · gant 3 doigts",
    description:
      "Boîte de douze craies bleues et gant trois doigts en lycra. De quoi tenir une saison de parties sans jamais chercher une craie.",
    price: 8000,
    image: "/img/table-blue.jpg",
    category: "billard",
    badgeLabel: null,
    badgeTone: null,
    stock: 24,
  },
];
await db.insert(products).values(productRows);

/* une commande déjà passée ------------------------------------------------ */
const order = {
  id: uid(),
  userId: ariel.id,
  venueId: breakAkwa.id,
  total: 29000,
  method: "momo",
  fulfillment: "pickup",
  status: "ready",
  createdAt: hoursAgo(26),
};
await db.insert(orders).values(order);
await db.insert(orderItems)
  .values([
    { id: uid(), orderId: order.id, productId: productRows[0].id, qty: 1, unitPrice: 7000 },
    { id: uid(), orderId: order.id, productId: productRows[1].id, qty: 1, unitPrice: 22000 },
  ])
  ;

/* événements -------------------------------------------------------------- */
const eventRows = [
  {
    id: uid(),
    slug: "mb-open-douala",
    title: "Master Break Open Douala",
    subtitle: "8-Ball Championship",
    day: "Samedi 03 octobre",
    hours: "18:00 → 23:30",
    checkin: "check-in dès 17:30",
    venueId: breakAkwa.id,
    address: "Rue Joss, Akwa · Douala",
    price: 3000,
    image: "/img/crowd-lights.jpg",
    capacity: 152,
    attendees: 128,
    description:
      "Poules de 4 puis tableau à élimination directe sur 8 tables. Jetons de partie offerts aux qualifiés, grillades et sono jusqu'à minuit.",
    tags: "Tournoi 8-ball,32 joueurs",
  },
  {
    id: uid(),
    slug: "nuit-neon",
    title: "Nuit Néon x Le Break",
    subtitle: "Soirée vape & billard",
    day: "Ce soir",
    hours: "21:00 → 02:00",
    checkin: "entrée libre avant 22:00",
    venueId: breakAkwa.id,
    address: "Rue Joss, Akwa · Douala",
    price: 2000,
    image: "/img/crowd-pink.jpg",
    capacity: 200,
    attendees: 64,
    description:
      "Tables ouvertes toute la nuit, stand vape sur place et tarif jeton réduit entre 21h et 23h.",
    tags: "Soirée,DJ set",
  },
];
await db.insert(events).values(eventRows);

await db.insert(tickets)
  .values({
    id: uid(),
    eventId: eventRows[1].id,
    userId: ariel.id,
    code: code(taken),
    status: "valid",
    createdAt: hoursAgo(30),
  })
  ;

/* notifications ----------------------------------------------------------- */
await db.insert(notifications)
  .values([
    {
      id: uid(),
      userId: ariel.id,
      title: "Ta commande est prête",
      body: "Puff Neon + pod rechargeable t'attendent au comptoir du Break Akwa.",
      kind: "order",
      href: "/app/commandes",
      read: false,
      createdAt: hoursAgo(2),
    },
    {
      id: uid(),
      userId: ariel.id,
      title: "Jeton débité · table 3",
      body: "Il te reste 7 jetons dans ton Master Pass.",
      kind: "token",
      href: "/app/pass",
      read: false,
      createdAt: hoursAgo(11),
    },
    {
      id: uid(),
      userId: ariel.id,
      title: "Master Break Open Douala samedi",
      body: "Il reste 24 places sur 152. Les inscrits reçoivent un jeton offert.",
      kind: "event",
      href: "/app/events/mb-open-douala",
      read: true,
      createdAt: hoursAgo(28),
    },
    {
      id: uid(),
      userId: ariel.id,
      title: "+120 XP · série de 5 soirs",
      body: "Encore 760 XP avant le niveau 5, Roi de la 8.",
      kind: "reward",
      href: "/app/rewards",
      read: true,
      createdAt: hoursAgo(30),
    },
  ])
  ;

console.log("base remplie : 3 salles, 7 comptes, 6 produits, 2 événements, 131 jetons, 124 passages");
}

// exécution directe : `npm run db:seed`
if (process.argv[1]?.includes("seed")) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
