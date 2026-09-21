import { randomUUID } from "node:crypto";
import { hashPassword } from "../lib/password";
import { createDb } from "./client";
import {
  events,
  matchEvents,
  matches,
  notifications,
  orderItems,
  orders,
  packs,
  products,
  purchases,
  reservations,
  scans,
  sessions,
  streamPasses,
  streams,
  tickets,
  tokens,
  users,
  venues,
  venueTables,
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
for (const table of [notifications, streamPasses, streams, matchEvents, matches, scans, tickets, orderItems, orders, tokens, reservations, venueTables, purchases, events, products, packs, sessions, users, venues]) {
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
// Tous les comptes de démonstration partagent ce mot de passe, affiché sur la
// page de connexion. En production, chacun choisit le sien à l'inscription.
const DEMO_PASSWORD = process.env.MB_DEMO_PASSWORD ?? "masterbreak";
const passwordHash = await hashPassword(DEMO_PASSWORD);

const ariel = { id: uid(), passwordHash, name: "Ariel N.", phone: "677451208", avatar: "/img/p-ariel.jpg", role: "client", points: 1240, venueId: null };
const serge = { id: uid(), passwordHash, name: "Serge M.", phone: "699120345", avatar: "/img/p-gerant.jpg", role: "manager", points: 0, venueId: breakAkwa.id };
const admin = { id: uid(), passwordHash, name: "Direction MASTER BREAK", phone: "690000000", avatar: null, role: "admin", points: 0, venueId: null };
const others = [
  { id: uid(), passwordHash, name: "Blaise K.", phone: "670000001", avatar: "/img/p-champion.jpg", role: "client", points: 4020, venueId: null },
  { id: uid(), passwordHash, name: "Yannick T.", phone: "670000002", avatar: "/img/p-yannick.jpg", role: "client", points: 3180, venueId: null },
  { id: uid(), passwordHash, name: "Merline K.", phone: "670000003", avatar: null, role: "client", points: 2610, venueId: null },
  { id: uid(), passwordHash, name: "Duval N.", phone: "670000004", avatar: null, role: "client", points: 2280, venueId: null },
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

/* Venue OS : plan de salle et cahier de réservations ---------------------- */
const tableRows: (typeof venueTables.$inferInsert)[] = [];
for (const venue of venueRows) {
  for (let i = 1; i <= venue.tables; i++) {
    tableRows.push({
      id: uid(),
      venueId: venue.id,
      label: `T${String(i).padStart(2, "0")}`,
      kind: i === 1 ? "snooker" : "pool",
      hourlyRate: i === 1 ? 3000 : 2000,
      deposit: i === 1 ? 2000 : 1000,
      // Les premières tables sont prises, le reste est libre : une salle vivante.
      status: i <= venue.tables - venue.freeTables ? "occupied" : "free",
      seats: i === 1 ? 6 : 4,
      sort: i,
    });
  }
}
await db.insert(venueTables).values(tableRows);

const akwaTables = tableRows.filter((t) => t.venueId === breakAkwa.id);
const atHour = (h: number, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

await db.insert(reservations).values([
  {
    id: uid(),
    venueId: breakAkwa.id,
    tableId: akwaTables[1].id,
    userId: ariel.id,
    startsAt: atHour(20, 30),
    minutes: 90,
    players: 4,
    deposit: 1000,
    status: "confirmed",
    note: "Table près du bar si possible",
  },
  {
    id: uid(),
    venueId: breakAkwa.id,
    tableId: akwaTables[0].id,
    userId: others[0].id,
    startsAt: atHour(19, 0),
    minutes: 120,
    players: 2,
    deposit: 2000,
    status: "seated",
    seatedAt: atHour(19, 5),
  },
  {
    id: uid(),
    venueId: breakAkwa.id,
    tableId: akwaTables[2].id,
    userId: others[1].id,
    startsAt: atHour(17, 0),
    minutes: 60,
    players: 2,
    deposit: 1000,
    status: "done",
    seatedAt: atHour(17, 2),
    closedAt: atHour(18, 5),
  },
]);

/* Master Break Live : un match en cours, un programmé, deux joués ----------- */
const [blaise, yannick, merline] = others;
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

const liveMatch = {
  id: uid(),
  venueId: breakAkwa.id,
  tableId: akwaTables[0].id,
  kind: "8-ball",
  target: 5,
  playerAId: ariel.id,
  playerBId: blaise.id,
  scoreA: 3,
  scoreB: 2,
  turnId: blaise.id,
  status: "live",
  label: "Quart de finale",
  startsAt: minutesAgo(40),
  startedAt: minutesAgo(38),
  createdBy: serge.id,
  updatedAt: minutesAgo(1),
};

const nextMatch = {
  id: uid(),
  venueId: breakAkwa.id,
  tableId: akwaTables[1].id,
  kind: "9-ball",
  target: 7,
  playerAId: yannick.id,
  playerBId: merline.id,
  scoreA: 0,
  scoreB: 0,
  turnId: yannick.id,
  status: "scheduled",
  label: "Demi-finale",
  startsAt: atHour(21, 0),
  createdBy: serge.id,
};

const oldMatches = [
  {
    id: uid(),
    venueId: breakAkwa.id,
    kind: "8-ball",
    target: 5,
    playerAId: ariel.id,
    playerBId: blaise.id,
    scoreA: 5,
    scoreB: 3,
    status: "done",
    winnerId: ariel.id,
    label: "Amical",
    startedAt: hoursAgo(30),
    endedAt: hoursAgo(29),
    createdBy: serge.id,
  },
  {
    id: uid(),
    venueId: zenith.id,
    kind: "9-ball",
    target: 5,
    playerAId: blaise.id,
    playerBId: ariel.id,
    scoreA: 5,
    scoreB: 4,
    status: "done",
    winnerId: blaise.id,
    label: "Ligne Douala",
    startedAt: hoursAgo(54),
    endedAt: hoursAgo(53),
    createdBy: serge.id,
  },
];

await db.insert(matches).values([liveMatch, nextMatch, ...oldMatches]);

// La frise du match en cours : cinq manches et quelques faits de jeu.
const frise: (typeof matchEvents.$inferInsert)[] = [];
let seq = 0;
let sa = 0;
let sb = 0;
const push = (kind: string, playerId: string | null, detail: string, minutes: number) => {
  frise.push({
    id: uid(),
    matchId: liveMatch.id,
    playerId,
    byId: serge.id,
    kind,
    seq: ++seq,
    scoreA: sa,
    scoreB: sb,
    detail,
    createdAt: minutesAgo(minutes),
  });
};

push("start", null, "Coup d'envoi", 38);
push("break", ariel.id, "Casse gagnante", 37);
sa++; push("rack", ariel.id, "Manche remportée", 35);
push("foul", blaise.id, "Bille blanche empochée", 31);
sb++; push("rack", blaise.id, "Manche remportée", 28);
push("safety", ariel.id, "Sécurité longue", 24);
sa++; push("rack", ariel.id, "Manche remportée", 21);
sb++; push("rack", blaise.id, "Manche remportée", 14);
push("break", ariel.id, "Casse gagnante", 9);
sa++; push("rack", ariel.id, "Manche remportée", 6);
await db.insert(matchEvents).values(frise);

/* Master Break Live : la vidéo --------------------------------------------- */
// Assez de directs pour que la page de découverte ait sa densité de vitrine.
const kata = venueRows[2];
let streamSeq = 0;
// Les vignettes tournent sur les photos de tables : sans serveur média, c'est
// ce qui donne à la vitrine des images distinctes les unes des autres.
const posters = [
  "/img/table-blue.jpg",
  "/img/balls-glow.jpg",
  "/img/hall-neon.jpg",
  "/img/table-rack.jpg",
  "/img/balls-dark.jpg",
  "/img/hall-dark.jpg",
  "/img/player-cut.jpg",
  "/img/crowd-lights.jpg",
];

const makeStream = (v: {
  venueId: string;
  matchId?: string | null;
  title: string;
  level: string;
  access?: string;
  price?: number;
  status?: string;
  viewers?: number;
  discipline?: string;
  startedMinutesAgo?: number;
}) => {
  const seq = ++streamSeq;
  const status = v.status ?? "live";
  const viewers = v.viewers ?? 20 + seq * 13;
  return {
    id: uid(),
    venueId: v.venueId,
    matchId: v.matchId ?? null,
    title: v.title,
    level: v.level,
    access: v.access ?? "free",
    price: v.price ?? 0,
    discipline: v.discipline ?? "8-ball",
    poster: posters[seq % posters.length],
    path: `mb-live-${seq}`,
    streamKey: `demo-cle-${seq}`,
    status,
    startedAt: status === "idle" ? null : minutesAgo(v.startedMinutesAgo ?? 30 + seq * 7),
    endedAt: status === "ended" ? minutesAgo(5) : null,
    viewers: status === "live" ? viewers : 0,
    peakViewers: viewers + 11,
    createdBy: serge.id,
  };
};

const streamRows = [
  makeStream({ venueId: breakAkwa.id, matchId: liveMatch.id, title: "Table 1 · quart de finale", level: "production", viewers: 412, discipline: "8-ball", startedMinutesAgo: 38 }),
  makeStream({ venueId: breakAkwa.id, title: "Venue Cast · Le Break Akwa", level: "venue", viewers: 148, discipline: "ambiance", startedMinutesAgo: 180 }),
  makeStream({ venueId: zenith.id, title: "Zenith · table centrale", level: "venue", viewers: 96, discipline: "ambiance" }),
  makeStream({ venueId: kata.id, title: "Kata Club · soirée 9-ball", level: "phone", viewers: 61, discipline: "9-ball" }),
  makeStream({ venueId: breakAkwa.id, title: "Snooker · table 7", level: "phone", viewers: 34, discipline: "snooker" }),
  makeStream({ venueId: zenith.id, title: "Killer du vendredi", level: "phone", viewers: 27, discipline: "killer" }),
  makeStream({ venueId: breakAkwa.id, matchId: nextMatch.id, title: "Demi-finale · production", level: "production", access: "ppv", price: 500, status: "idle", discipline: "9-ball" }),
  makeStream({ venueId: zenith.id, title: "Open Douala · table 2", level: "production", access: "members", viewers: 203, discipline: "8-ball" }),
  makeStream({ venueId: kata.id, title: "Entraînement libre", level: "phone", viewers: 12, discipline: "8-ball" }),
  makeStream({ venueId: breakAkwa.id, title: "Master Break Open · finale 2025", level: "production", access: "free", status: "ended", discipline: "8-ball" }),
  makeStream({ venueId: zenith.id, title: "Nuit Néon · rediffusion", level: "production", access: "ppv", price: 300, status: "ended", discipline: "9-ball" }),
  makeStream({ venueId: kata.id, title: "Kata Cup · demi-finales", level: "production", access: "members", status: "ended", discipline: "snooker" }),
  makeStream({ venueId: breakAkwa.id, title: "Table 3 · défi du soir", level: "phone", viewers: 88, discipline: "8-ball" }),
  makeStream({ venueId: zenith.id, title: "Zenith · 9-ball nocturne", level: "phone", viewers: 74, discipline: "9-ball" }),
  makeStream({ venueId: kata.id, title: "Kata Club · Venue Cast", level: "venue", viewers: 52, discipline: "ambiance" }),
  makeStream({ venueId: breakAkwa.id, title: "Snooker · table 8", level: "phone", viewers: 41, discipline: "snooker" }),
  makeStream({ venueId: zenith.id, title: "Killer · table 4", level: "phone", viewers: 33, discipline: "killer" }),
  makeStream({ venueId: kata.id, title: "9-ball · table 2", level: "phone", viewers: 29, discipline: "9-ball" }),
];
await db.insert(streams).values(streamRows);

console.log(
  `base remplie : 3 salles, ${tableRows.length} tables, 7 comptes, 6 produits, 2 événements, 131 jetons, 124 passages, 3 réservations, 4 matchs, ${streamRows.length} directs`,
);
}

// En ligne de commande, l'entrée est `db/seed-cli.ts` : ce module-ci est importé
// aussi par le serveur (db/bootstrap.ts) et ne doit donc rien lire sur le disque.
