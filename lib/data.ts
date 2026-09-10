// Contenu d'exemple. Prix, salles et personnes sont à remplacer par les vraies
// données avant mise en production.

export type Venue = {
  id: string;
  name: string;
  area: string;
  city: string;
  distanceKm: number;
  tables: number;
  freeTables: number;
  tokenPrice: number;
  image: string;
  tag?: { label: string; tone: "green" | "violet" };
};

export type Pack = {
  id: string;
  tokens: number;
  price: number;
  hint: string;
  badge?: string;
  bonus?: string;
};

export type Product = {
  id: string;
  name: string;
  detail: string;
  price: number;
  image: string;
  category: "vapes" | "billard";
  badge?: { label: string; tone: "green" | "violet" };
};

export type KixEvent = {
  slug: string;
  title: string;
  subtitle: string;
  day: string;
  hours: string;
  checkin: string;
  venueId: string;
  address: string;
  price: number;
  image: string;
  tags: string[];
  organizer: { name: string; role: string; avatar: string; detail: string };
  attendees: number;
  capacity: number;
  description: string;
};

export type Player = {
  rank: number;
  name: string;
  points: number;
  avatar?: string;
  initials?: string;
  isYou?: boolean;
};

export const venues: Venue[] = [
  {
    id: "break-akwa",
    name: "Le Break Akwa",
    area: "Akwa",
    city: "Douala",
    distanceKm: 1.2,
    tables: 8,
    freeTables: 6,
    tokenPrice: 400,
    image: "/img/hall-dark.jpg",
    tag: { label: "6 tables libres", tone: "green" },
  },
  {
    id: "zenith",
    name: "Zenith Pool Bar",
    area: "Bonapriso",
    city: "Douala",
    distanceKm: 3.4,
    tables: 6,
    freeTables: 2,
    tokenPrice: 500,
    image: "/img/hall-neon.jpg",
    tag: { label: "Soirée néon", tone: "violet" },
  },
  {
    id: "kata",
    name: "Le Kata Club",
    area: "Bonamoussadi",
    city: "Douala",
    distanceKm: 5.1,
    tables: 5,
    freeTables: 4,
    tokenPrice: 400,
    image: "/img/table-blue.jpg",
  },
];

export const packs: Pack[] = [
  { id: "p1", tokens: 1, price: 400, hint: "Une partie, c'est tout" },
  { id: "p3", tokens: 3, price: 1000, hint: "Soit 333 F la partie", badge: "Le plus pris" },
  { id: "p10", tokens: 10, price: 3000, hint: "Soit 250 F la partie", bonus: "+ 2 jetons offerts" },
];

export const products: Product[] = [
  {
    id: "puff-neon",
    name: "Puff Neon 6000 taffes",
    detail: "Mangue glacée · 5 %",
    price: 7000,
    image: "/img/puffs.jpg",
    category: "vapes",
    badge: { label: "Top vente", tone: "violet" },
  },
  {
    id: "pod-1000",
    name: "Pod rechargeable 1000 mAh",
    detail: "Kit complet + 2 cartouches",
    price: 22000,
    image: "/img/vape-pod.jpg",
    category: "vapes",
  },
  {
    id: "carte-kix",
    name: "Carte KIX · 10 jetons",
    detail: "Offerte par QR, valable 6 mois",
    price: 3000,
    image: "/img/balls-glow.jpg",
    category: "vapes",
    badge: { label: "Carte cadeau", tone: "green" },
  },
  {
    id: "queue-rack",
    name: "Queue 2 pièces + rack",
    detail: "Érable · 145 cm · 10 mm",
    price: 45000,
    image: "/img/table-rack.jpg",
    category: "billard",
  },
  {
    id: "billes",
    name: "Set de billes tournoi",
    detail: "Résine · 57,2 mm",
    price: 28000,
    image: "/img/balls-dark.jpg",
    category: "billard",
  },
  {
    id: "craie-gant",
    name: "Kit craie + gant",
    detail: "12 craies · gant 3 doigts",
    price: 8000,
    image: "/img/table-blue.jpg",
    category: "billard",
  },
];

export const events: KixEvent[] = [
  {
    slug: "kix-open-douala",
    title: "KIX Open Douala",
    subtitle: "8-Ball Championship",
    day: "Samedi 03 octobre",
    hours: "18:00 → 23:30",
    checkin: "check-in dès 17:30",
    venueId: "break-akwa",
    address: "Rue Joss, Akwa · Douala",
    price: 3000,
    image: "/img/crowd-green.jpg",
    tags: ["Tournoi 8-ball", "32 joueurs"],
    organizer: {
      name: "Serge M.",
      role: "organisateur",
      avatar: "/img/p-gerant.jpg",
      detail: "14 tournois organisés",
    },
    attendees: 128,
    capacity: 152,
    description:
      "Poules de 4 puis tableau à élimination directe sur 8 tables. Jetons de partie offerts aux qualifiés, grillades et sono jusqu'à minuit.",
  },
  {
    slug: "nuit-neon",
    title: "Nuit Néon x Le Break",
    subtitle: "Soirée vape & billard",
    day: "Ce soir",
    hours: "21:00 → 02:00",
    checkin: "entrée libre avant 22:00",
    venueId: "break-akwa",
    address: "Rue Joss, Akwa · Douala",
    price: 2000,
    image: "/img/crowd-pink.jpg",
    tags: ["Soirée", "DJ set"],
    organizer: {
      name: "Le Break Akwa",
      role: "salle partenaire",
      avatar: "/img/hall-dark.jpg",
      detail: "Soirée tous les vendredis",
    },
    attendees: 64,
    capacity: 200,
    description:
      "Tables ouvertes toute la nuit, stand vape sur place et tarif jeton réduit entre 21h et 23h.",
  },
];

export const leaderboard: Player[] = [
  { rank: 1, name: "Blaise K.", points: 4020, avatar: "/img/p-champion.jpg" },
  { rank: 2, name: "Yannick T.", points: 3180, avatar: "/img/p-yannick.jpg" },
  { rank: 3, name: "Serge M.", points: 2940, avatar: "/img/p-gerant.jpg" },
  { rank: 4, name: "Merline K.", points: 2610, initials: "MK" },
  { rank: 5, name: "Duval N.", points: 2280, initials: "DN" },
];

export const you = {
  name: "Ariel N.",
  avatar: "/img/p-ariel.jpg",
  rank: 12,
  level: 4,
  levelName: "Requin de table",
  nextLevelName: "Roi de la 8",
  levelTarget: 2000,
};

export const venueById = (id: string) => venues.find((v) => v.id === id) ?? venues[0];
export const productById = (id: string) => products.find((p) => p.id === id);
export const eventBySlug = (slug: string) => events.find((e) => e.slug === slug);
