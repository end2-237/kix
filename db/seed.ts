import { repartirPrix } from "@/lib/tokens";
import { duelsDePoule, getBracket, noterResultat, tirerLeTableau, tirerLesPoules } from "@/lib/tournoi-moteur";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { hashPassword } from "../lib/password";
import { createDb } from "./client";
import {
  courses,
  crewMembers,
  crews,
  events,
  friendships,
  matchEvents,
  matches,
  memberPlans,
  memberships,
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
  tournaments,
  tournamentPlayers,
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

const code6 = (() => { const pris = new Set<string>(); return () => { let c = ""; do { c = String(Math.floor(100000 + Math.random() * 900000)); } while (pris.has(c)); pris.add(c); return c; }; })();

const ariel = { id: uid(), code: code6(), passwordHash, name: "Ariel N.", phone: "677451208", avatar: "/img/p-ariel.jpg", role: "client", points: 1240, venueId: null };
const serge = { id: uid(), code: code6(), passwordHash, name: "Serge M.", phone: "699120345", avatar: "/img/p-gerant.jpg", role: "manager", points: 0, venueId: breakAkwa.id };
const admin = { id: uid(), code: code6(), passwordHash, name: "Direction MASTER BREAK", phone: "690000000", avatar: null, role: "admin", points: 0, venueId: null };
const vendeur = { id: uid(), code: code6(), passwordHash, name: "Vapote Douala", phone: "678900011", avatar: null, role: "seller", points: 0, venueId: null };
const others = [
  { id: uid(), code: code6(), passwordHash, name: "Blaise K.", phone: "670000001", avatar: "/img/p-champion.jpg", role: "client", points: 4020, venueId: null },
  { id: uid(), code: code6(), passwordHash, name: "Yannick T.", phone: "670000002", avatar: "/img/p-yannick.jpg", role: "client", points: 3180, venueId: null },
  { id: uid(), code: code6(), passwordHash, name: "Merline K.", phone: "670000003", avatar: null, role: "client", points: 2610, venueId: null },
  { id: uid(), code: code6(), passwordHash, name: "Duval N.", phone: "670000004", avatar: null, role: "client", points: 2280, venueId: null },
];

// Le vivier des tournois : un tableau de douze ne se remplit pas avec cinq
// comptes, et un classement à cinq lignes ne ressemble à rien.
const vivier = [
  { name: "Franck E.", points: 2050 },
  { name: "Aline M.", points: 1880 },
  { name: "Cédric B.", points: 1720 },
  { name: "Nadège T.", points: 1490 },
  { name: "Roland S.", points: 1310 },
  { name: "Patrick O.", points: 980 },
  { name: "Estelle W.", points: 760 },
  { name: "Ulrich D.", points: 540 },
  { name: "Gaël P.", points: 430 },
  { name: "Sandrine K.", points: 320 },
  { name: "Boris A.", points: 180 },
].map((j, i) => ({
  id: uid(),
  code: code6(),
  passwordHash,
  name: j.name,
  phone: `6700001${String(i + 10).padStart(2, "0")}`,
  avatar: null,
  role: "client",
  points: j.points,
  venueId: null,
}));

const comptes: (typeof users.$inferInsert)[] = [ariel, serge, admin, vendeur, ...others, ...vivier];
await db.insert(users).values(comptes);
const clients = [ariel, ...others];

/* jetons d'Ariel ---------------------------------------------------------- */
const taken = new Set<string>();
const purchase = {
  id: uid(),
  userId: ariel.id,
  packId: packRows[1].id,
  venueId: breakAkwa.id,
  tokens: 7,
  amount: 2100,
  method: "momo",
  status: "paid",
  createdAt: hoursAgo(20),
};
await db.insert(purchases).values(purchase);

await db.insert(tokens)
  .values(
    // La longueur suit l'achat : un jeu de démonstration où les deux divergent
    // fait mentir la recette du gérant avant même la première vraie vente.
    repartirPrix(purchase.amount, purchase.tokens).map((unitPrice) => ({
      id: uid(),
      code: code(taken),
      userId: ariel.id,
      venueId: breakAkwa.id,
      purchaseId: purchase.id,
      unitPrice,
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
const productRows: (typeof products.$inferInsert)[] = [
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
// Les deux premiers articles sont vendus par « Vapote Douala » : la place de
// marché n'a de sens que si au moins une ligne appartient à quelqu'un.
productRows[0].sellerId = vendeur.id;
productRows[1].sellerId = vendeur.id;
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
// Chaque ligne porte son vendeur et la commission retenue, figés à la vente :
// un taux révisé plus tard ne doit pas réécrire ce qui a déjà été dû.
await db.insert(orderItems).values([
  { id: uid(), orderId: order.id, productId: productRows[0].id!, sellerId: vendeur.id, qty: 1, unitPrice: 7000, commission: 700 },
  { id: uid(), orderId: order.id, productId: productRows[1].id!, sellerId: vendeur.id, qty: 1, unitPrice: 22000, commission: 2200 },
]);

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
    // Deux affiches insérées d'un même coup portent la même horodate à la
    // milliseconde près : l'ordre de la liste changeait alors d'un semis à
    // l'autre. On les date à la main.
    createdAt: hoursAgo(72),
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
    createdAt: hoursAgo(48),
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

/* cours de billard ---------------------------------------------------------
   Trois offres qui couvrent les trois formats : une séance d'essai, un
   forfait, un abonnement. Deux en bannière, pour que la boutique ait de quoi
   montrer sans être saturée. */

const courseRows: (typeof courses.$inferInsert)[] = [
  {
    id: uid(),
    slug: "premiere-queue",
    title: "Première queue",
    coachName: "Ariel N.",
    venueId: breakAkwa.id,
    level: "debutant",
    format: "seance",
    sessions: 1,
    schedule: "Mercredi · 18h → 19h30",
    price: 3000,
    image: "/img/coach-1.jpg",
    description:
      "La position, la passe, le premier effet. Une heure et demie pour cesser de pousser la bille et commencer à la jouer.",
    capacity: 6,
    featured: true,
  },
  {
    id: uid(),
    slug: "casse-controlee",
    title: "La casse contrôlée",
    coachName: "Yannick T.",
    venueId: zenith.id,
    level: "intermediaire",
    format: "forfait",
    sessions: 4,
    schedule: "Samedi · 10h → 12h",
    price: 18000,
    image: "/img/coach-2.jpg",
    description:
      "Quatre samedis sur la casse, le placement de la blanche et la lecture de table. Pour qui gagne déjà, mais sans savoir pourquoi.",
    capacity: 8,
    featured: true,
  },
  {
    id: uid(),
    slug: "atelier-competition",
    title: "Atelier compétition",
    coachName: "Serge M.",
    venueId: breakAkwa.id,
    level: "confirme",
    format: "abonnement",
    sessions: 8,
    schedule: "Mardi et jeudi · 19h → 21h",
    price: 40000,
    image: "/img/p-champion.jpg",
    description: "Préparation aux tournois : gestion du temps, sécurités, tactique de fin de rack.",
    capacity: 5,
    featured: false,
  },
];
await db.insert(courses).values(courseRows);

/* tournois ------------------------------------------------------------------
   Trois états, parce que ce sont les trois écrans qu'on veut pouvoir montrer :
   un tableau ouvert aux candidatures, un tableau en cours — à douze joueurs,
   donc avec des exemptions — et un tableau refermé sur son champion.

   Les tableaux ne sont pas écrits à la main : on dépose des candidatures, puis
   on appelle le vrai tirage et les vrais résultats. Ce que la démonstration
   montre est donc exactement ce que l'application produit. */

const tousLesJoueurs = [...clients, ...vivier];

/** Un tournoi, son événement jumeau, et ses candidatures. */
async function semerTournoi(opts: {
  slug: string;
  title: string;
  venueId: string;
  discipline: string;
  format?: string;
  groupSize?: number;
  qualifiers?: number;
  size: number;
  raceTo: number;
  entryFee: number;
  prizePool: number;
  prizeSplit: string;
  rules: string;
  image: string;
  status: string;
  jours: number;
  joueurs: { user: (typeof tousLesJoueurs)[number]; nickname: string; level: string; status: string }[];
  ticketPrice: number;
}) {
  const debut = new Date(Date.now() + opts.jours * 86_400_000);
  const eventId = uid();
  const tournamentId = uid();

  await db.insert(events).values({
    id: eventId,
    slug: `${opts.slug}-spectateurs`,
    title: opts.title,
    subtitle: `Tournoi ${opts.discipline} · ${opts.size} joueurs`,
    day: debut.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
    hours: "17:00 → 23:00",
    checkin: "check-in dès 16:30",
    venueId: opts.venueId,
    price: opts.ticketPrice,
    image: opts.image,
    capacity: 120,
    attendees: 0,
    description: opts.rules,
    tags: "tournoi",
    active: opts.status !== "brouillon",
  });

  await db.insert(tournaments).values({
    id: tournamentId,
    slug: opts.slug,
    title: opts.title,
    eventId,
    venueId: opts.venueId,
    organiserId: serge.id,
    discipline: opts.discipline,
    format: opts.format ?? "direct",
    groupSize: opts.groupSize ?? 4,
    qualifiers: opts.qualifiers ?? 2,
    size: opts.size,
    raceTo: opts.raceTo,
    entryFee: opts.entryFee,
    prizePool: opts.prizePool,
    prizeSplit: opts.prizeSplit,
    rules: opts.rules,
    image: opts.image,
    status: opts.status,
    startsAt: debut,
    closesAt: new Date(debut.getTime() - 2 * 86_400_000),
  });

  await db.insert(tournamentPlayers).values(
    opts.joueurs.map((j) => ({
      id: uid(),
      tournamentId,
      userId: j.user.id,
      nickname: j.nickname,
      phone: j.user.phone,
      level: j.level,
      note: "",
      status: j.status,
      fee: opts.entryFee,
      // Un candidat n'a rien réglé : le droit se paie une fois la place tenue.
      payment: j.status === "accepte" && opts.entryFee > 0 ? "paye" : "impaye",
    })),
  );

  return tournamentId;
}

const surnoms = [
  "La Craie", "Le Métronome", "Cobra", "Main Froide", "Le Tacticien", "Tonnerre",
  "Le Patient", "Effet Rétro", "Le Chirurgien", "Bande Arrière", "Le Comptable", "Éclair",
];
const nomDeTable = (i: number) => surnoms[i % surnoms.length];

// 1. Candidatures ouvertes : sept dossiers, quatre déjà retenus.
await semerTournoi({
  slug: "master-break-open-akwa",
  title: "Master Break Open · Akwa",
  venueId: breakAkwa.id,
  discipline: "8-ball",
  size: 16,
  raceTo: 4,
  entryFee: 2000,
  prizePool: 150_000,
  prizeSplit: "60 % au vainqueur, 25 % au finaliste, 15 % partagés entre les demi-finalistes",
  rules:
    "8-ball, rayés ou pleins : chaque partie se gagne à la noire. Casse alternée, bille en main sur faute. Course à 4 parties jusqu'aux quarts, 5 en demi-finale, 6 en finale. Retard de plus de dix minutes : duel perdu.",
  image: "/img/crowd-lights.jpg",
  status: "inscriptions",
  jours: 12,
  ticketPrice: 1500,
  joueurs: tousLesJoueurs.slice(0, 7).map((user, i) => ({
    user,
    nickname: nomDeTable(i),
    level: i < 2 ? "confirme" : i < 5 ? "intermediaire" : "debutant",
    status: i < 4 ? "accepte" : "candidat",
  })),
});

// 2. En cours, à douze joueurs : quatre têtes de série passent le premier tour
//    sans jouer, ce qui est exactement le cas qu'un tableau de seize doit
//    savoir tenir.
const enCours = await semerTournoi({
  slug: "nuit-du-9-ball-zenith",
  title: "Nuit du 9-ball · Zenith",
  venueId: zenith.id,
  discipline: "9-ball",
  size: 16,
  raceTo: 5,
  entryFee: 3000,
  prizePool: 220_000,
  prizeSplit: "50 % au vainqueur, 30 % au finaliste, 20 % partagés entre les demi-finalistes",
  rules:
    "9-ball, casse gagnante conservée. Course à 5 parties au premier tour, 6 en demi-finale, 7 en finale. Le 9 sur la casse compte pour une partie.",
  image: "/img/table-rack.jpg",
  status: "complet",
  jours: -1,
  ticketPrice: 2000,
  joueurs: tousLesJoueurs.slice(0, 12).map((user, i) => ({
    user,
    nickname: nomDeTable(i),
    level: i < 4 ? "confirme" : "intermediaire",
    status: "accepte",
  })),
});

await tirerLeTableau(db, enCours);

// Le premier tour se joue en entier ; les quarts restent à saisir, pour que la
// console de l'organisateur ait quelque chose à montrer.
for (const duel of await getBracket(db, enCours)) {
  if (duel.round !== 1 || duel.status !== "attente") continue;
  await noterResultat(db, duel.id, duel.raceTo, duel.raceTo - 2);
}

// 3. Terminé : un champion, des points distribués, un palmarès qui existe.
const fini = await semerTournoi({
  slug: "challenge-de-la-rentree-kata",
  title: "Challenge de la rentrée · Kata Club",
  venueId: kata.id,
  discipline: "8-ball",
  size: 8,
  // Parties sèches, du premier tour à la finale : le tournoi du quartier, tel
  // qu'il se joue vraiment — une partie, la noire, et le suivant sur la table.
  raceTo: 1,
  entryFee: 0,
  prizePool: 60_000,
  prizeSplit: "70 % au vainqueur, 30 % au finaliste",
  rules:
    "8-ball en parties sèches, tableau de huit. Rayés ou pleins : le premier qui met la noire passe au tour suivant. Entrée gratuite pour les joueurs, table offerte par la salle.",
  image: "/img/hall-dark.jpg",
  status: "complet",
  jours: -21,
  ticketPrice: 0,
  joueurs: tousLesJoueurs.slice(1, 9).map((user, i) => ({
    user,
    nickname: nomDeTable(i + 4),
    level: "intermediaire",
    status: "accepte",
  })),
});

await tirerLeTableau(db, fini);

// On déroule le tableau jusqu'à la finale : à chaque tour, la tête de série la
// mieux classée l'emporte. Un favori qui gagne, c'est le résultat le moins
// surprenant — et le plus lisible sur une démonstration.
for (let tour = 1; tour <= 3; tour++) {
  for (const duel of await getBracket(db, fini)) {
    if (duel.round !== tour || duel.status !== "attente") continue;
    if (!duel.playerAId || !duel.playerBId) continue;
    // En sèche le perdant reste à zéro ; en course il tient la distance en
    // finale et se fait sortir plus nettement avant.
    const perdant = duel.raceTo <= 1 ? 0 : tour === 3 ? duel.raceTo - 1 : 1;
    await noterResultat(db, duel.id, duel.raceTo, perdant);
  }
}

/* abonnements ---------------------------------------------------------------
   Trois durées, parce que c'est ainsi qu'on achète un abonnement quand on
   paie par téléphone : à l'essai, au trimestre, à l'année. Le prix au mois
   baisse avec la durée — c'est ce qui donne une raison de s'engager. */

const planRows: (typeof memberPlans.$inferInsert)[] = [
  {
    id: uid(),
    slug: "membre-1-mois",
    name: "Master Break · 1 mois",
    months: 1,
    price: 2500,
    perks: "Tous les directs réservés aux abonnés | Les directs payants sans billet à l'unité | Les rediffusions des soirées",
    hint: "Sans reconduction automatique.",
    sort: 1,
  },
  {
    id: uid(),
    slug: "membre-3-mois",
    name: "Master Break · 3 mois",
    months: 3,
    price: 6000,
    perks: "Tous les directs réservés aux abonnés | Les directs payants sans billet à l'unité | Les rediffusions des soirées",
    hint: "Un mois offert par rapport au tarif mensuel.",
    badge: "Populaire",
    sort: 2,
  },
  {
    id: uid(),
    slug: "membre-1-an",
    name: "Master Break · 1 an",
    months: 12,
    price: 20_000,
    perks: "Tous les directs réservés aux abonnés | Les directs payants sans billet à l'unité | Les rediffusions des soirées | Le tarif gelé pour l'année",
    hint: "Le meilleur prix au mois.",
    badge: "Meilleur prix",
    sort: 3,
  },
];
await db.insert(memberPlans).values(planRows);

// Un abonné en cours : sans lui, ni le mur « abonnés » des directs ni la
// console d'administration n'ont rien à montrer.
{
  const debut = new Date();
  const fin = new Date(debut);
  fin.setMonth(fin.getMonth() + 3);
  await db.insert(memberships).values({
    id: uid(),
    userId: ariel.id,
    planId: planRows[1].id,
    months: 3,
    price: planRows[1].price,
    status: "paid",
    startsAt: debut,
    endsAt: fin,
  });
  await db.update(users).set({ memberUntil: fin }).where(eq(users.id, ariel.id));
}

// 4. À poules : seize joueurs, quatre poules de quatre, deux qualifiés par
//    poule. Les poules sont jouées, le tableau final reste à ouvrir — c'est
//    l'écran que l'organisateur voit le soir même.
const aPoules = await semerTournoi({
  slug: "coupe-des-salles-akwa",
  title: "Coupe des salles · Akwa",
  venueId: breakAkwa.id,
  discipline: "8-ball",
  format: "poules",
  groupSize: 4,
  qualifiers: 2,
  size: 16,
  raceTo: 4,
  entryFee: 1500,
  prizePool: 180_000,
  prizeSplit: "55 % au vainqueur, 25 % au finaliste, 20 % partagés entre les demi-finalistes",
  rules:
    "Poules de quatre, tous contre tous, course à 4 parties. Les deux premiers de chaque poule passent en quarts. Classement aux victoires, puis à la différence de parties, puis à la confrontation directe.",
  image: "/img/crowd-pink.jpg",
  status: "complet",
  jours: 2,
  ticketPrice: 1000,
  joueurs: tousLesJoueurs.slice(0, 16).map((user, i) => ({
    user,
    nickname: nomDeTable(i + 2),
    level: i < 5 ? "confirme" : i < 12 ? "intermediaire" : "debutant",
    status: "accepte",
  })),
});

await tirerLesPoules(db, aPoules);

// Toutes les poules se jouent : la tête de série la mieux classée l'emporte,
// ce qui donne un classement lisible sans être uniforme.
for (const duel of await duelsDePoule(db, aPoules)) {
  if (duel.status === "termine" || !duel.playerAId || !duel.playerBId) continue;
  const [a, b] = await Promise.all([
    db.select().from(tournamentPlayers).where(eq(tournamentPlayers.id, duel.playerAId)).limit(1),
    db.select().from(tournamentPlayers).where(eq(tournamentPlayers.id, duel.playerBId)).limit(1),
  ]);
  const gagneA = (a[0]?.seed ?? 99) < (b[0]?.seed ?? 99);
  await noterResultat(db, duel.id, gagneA ? duel.raceTo : 2, gagneA ? 2 : duel.raceTo);
}

/* groupes de billard --------------------------------------------------------
   Deux bandes, pour que la page ne s'ouvre pas sur un écran vide : celle
   d'Ariel, et une autre où il n'est pas — on doit voir les deux cas. */

const bandes = [
  {
    id: uid(),
    slug: "les-requins-akwa",
    name: "Les Requins d'Akwa",
    devise: "On ne pousse pas la bille, on la joue.",
    ownerId: ariel.id,
    venueId: breakAkwa.id,
    membres: [ariel, ...others.slice(0, 2), ...vivier.slice(0, 2)],
  },
  {
    id: uid(),
    slug: "nuit-blanche-zenith",
    name: "Nuit Blanche",
    devise: "La dernière table éteinte.",
    ownerId: others[1].id,
    venueId: zenith.id,
    membres: [others[1], ...vivier.slice(3, 6)],
  },
];

for (const bande of bandes) {
  await db.insert(crews).values({
    id: bande.id,
    slug: bande.slug,
    name: bande.name,
    image: "",
    devise: bande.devise,
    ownerId: bande.ownerId,
    venueId: bande.venueId,
  });
  await db.insert(crewMembers).values(
    bande.membres.map((m) => ({
      id: uid(),
      crewId: bande.id,
      userId: m.id,
      role: m.id === bande.ownerId ? "chef" : "membre",
      status: "membre",
    })),
  );
}

/* amitiés -------------------------------------------------------------------
   Sans elles, ni la liste d'amis ni les invitations n'ont rien à montrer, et
   la notification « ton ami joue » ne part jamais. */

const liens = [
  [ariel, others[0], "acceptee"],
  [ariel, others[1], "acceptee"],
  [ariel, vivier[0], "acceptee"],
  [others[2], ariel, "attente"],
] as const;

await db.insert(friendships).values(
  liens.map(([a, b, status]) => ({ id: uid(), requesterId: a.id, addresseeId: b.id, status })),
);

console.log(
  `base remplie : 3 salles, ${tableRows.length} tables, 19 comptes, 6 produits, 2 événements, 131 jetons, 124 passages, 3 réservations, 4 matchs, ${streamRows.length} directs, ${courseRows.length} cours, 4 tournois, ${planRows.length} formules d'abonnement, ${bandes.length} groupes`,
);
}

// En ligne de commande, l'entrée est `db/seed-cli.ts` : ce module-ci est importé
// aussi par le serveur (db/bootstrap.ts) et ne doit donc rien lire sur le disque.
