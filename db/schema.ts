import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgSchema,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Schéma `mb` — Master Break.
 *
 * Le Supabase du VPS héberge plusieurs applications : chacune vit dans son
 * propre schéma, jamais dans `public`. Toutes les tables ci-dessous sont donc
 * préfixées `mb.` et les politiques RLS sont définies dans la migration
 * dédiée (db/migrations/*_rls.sql).
 */
export const mb = pgSchema("mb");

const id = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const venues = mb.table("venues", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  area: text("area").notNull(),
  city: text("city").notNull(),
  address: text("address").notNull().default(""),
  tables: integer("tables").notNull().default(6),
  freeTables: integer("free_tables").notNull().default(0),
  tokenPrice: integer("token_price").notNull().default(400),
  distanceKm: real("distance_km").notNull().default(0),
  image: text("image").notNull().default("/img/hall-dark.jpg"),
  /** La salle autorise les joueurs à tenir eux-mêmes la feuille de match. */
  selfScoring: boolean("self_scoring").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const users = mb.table(
  "users",
  {
    id: id(),
    /** Compte GoTrue correspondant (auth.users.id) quand Supabase Auth gère la connexion. */
    authId: uuid("auth_id").unique(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    /** scrypt, format `scrypt$<sel>$<empreinte>` — nul si la connexion passe par GoTrue. */
    passwordHash: text("password_hash"),
    avatar: text("avatar"),
    // client | manager | admin
    role: text("role").notNull().default("client"),
    points: integer("points").notNull().default(0),
    venueId: uuid("venue_id").references(() => venues.id),
    /** Fin de l'abonnement Master Break : donne accès aux directs « membres ». */
    memberUntil: timestamp("member_until", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_phone_idx").on(t.phone)],
);

export const packs = mb.table("packs", {
  id: id(),
  tokens: integer("tokens").notNull(),
  price: integer("price").notNull(),
  bonus: integer("bonus").notNull().default(0),
  hint: text("hint").notNull().default(""),
  badge: text("badge"),
  sort: integer("sort").notNull().default(0),
  active: boolean("active").notNull().default(true),
});

export const purchases = mb.table(
  "purchases",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    packId: uuid("pack_id").references(() => packs.id),
    venueId: uuid("venue_id").references(() => venues.id),
    tokens: integer("tokens").notNull(),
    amount: integer("amount").notNull(),
    // om | momo
    method: text("method").notNull(),
    // pending | paid | failed | expired
    status: text("status").notNull().default("pending"),
    /** Référence du paiement (mb.payments.reference) — unique, sert à l'idempotence. */
    reference: text("reference").unique(),
    createdAt: createdAt(),
  },
  (t) => [index("purchases_user_idx").on(t.userId)],
);

export const tokens = mb.table(
  "tokens",
  {
    id: id(),
    code: text("code").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    venueId: uuid("venue_id").references(() => venues.id),
    purchaseId: uuid("purchase_id").references(() => purchases.id),
    /**
     * Ce que ce jeton a réellement coûté, en francs, figé à l'achat.
     *
     * Un pack à 1000 F pour trois jetons en vaut 333, pas le tarif unitaire
     * affiché par la salle. Le scan enregistrait ce dernier : la recette du
     * gérant gonflait d'un tiers à chaque partie. On fige la valeur ici plutôt
     * que de la recalculer au scan — un pack dont le prix change demain ne doit
     * pas réécrire les recettes d'hier.
     *
     * Nul pour les jetons d'avant cette colonne : le scan retombe alors sur le
     * tarif de la salle, faute de mieux.
     */
    unitPrice: integer("unit_price"),
    // active | used
    status: text("status").notNull().default("active"),
    tableNumber: integer("table_number"),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("tokens_user_idx").on(t.userId), index("tokens_code_idx").on(t.code)],
);

export const products = mb.table("products", {
  id: id(),
  /**
   * Le vendeur. Nul pour les articles de Master Break.
   *
   * Sans lui, la boutique n'était pas une place de marché mais un magasin :
   * seul l'administrateur pouvait créer un article, et personne n'en était
   * propriétaire.
   */
  sellerId: uuid("seller_id").references(() => users.id, { onDelete: "set null" }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  detail: text("detail").notNull().default(""),
  description: text("description").notNull().default(""),
  price: integer("price").notNull(),
  image: text("image").notNull(),
  // vapes | billard
  category: text("category").notNull().default("vapes"),
  badgeLabel: text("badge_label"),
  badgeTone: text("badge_tone"),
  stock: integer("stock").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const orders = mb.table(
  "orders",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    venueId: uuid("venue_id").references(() => venues.id),
    total: integer("total").notNull(),
    method: text("method").notNull().default("momo"),
    // pickup | delivery
    fulfillment: text("fulfillment").notNull().default("pickup"),
    // pending | paid | ready | done | cancelled | failed
    status: text("status").notNull().default("pending"),
    /** Référence du paiement (mb.payments.reference). */
    reference: text("reference").unique(),
    createdAt: createdAt(),
  },
  (t) => [index("orders_user_idx").on(t.userId)],
);

export const orderItems = mb.table("order_items", {
  id: id(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id),
  qty: integer("qty").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  /**
   * À qui revient cette ligne, et ce que la plateforme y prend — figés au
   * moment de la vente.
   *
   * Un article revendu à un autre vendeur, ou un taux de commission revu
   * l'an prochain, ne doivent pas réécrire ce qu'on doit pour une vente
   * d'hier. C'est la même règle que le prix unitaire juste au-dessus, et que
   * les jetons : ce qui est dû se fige à l'instant de la transaction.
   */
  sellerId: uuid("seller_id").references(() => users.id, { onDelete: "set null" }),
  /** Part de la plateforme sur cette ligne, en francs. */
  commission: integer("commission").notNull().default(0),
});

/**
 * Les cours de billard.
 *
 * Un cours n'est pas un produit : il a un coach, un niveau, un nombre de
 * séances et un créneau. Le ranger dans `products` aurait demandé cinq
 * colonnes nulles pour tout le reste du catalogue, et une case « c'est un
 * cours » à interpréter partout.
 */
export const courses = mb.table("courses", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  /** Le coach, s'il a un compte : c'est lui qu'on paie. */
  coachId: uuid("coach_id").references(() => users.id, { onDelete: "set null" }),
  /** Son nom affiché, même sans compte — un intervenant de passage en a un. */
  coachName: text("coach_name").notNull().default(""),
  venueId: uuid("venue_id").references(() => venues.id, { onDelete: "set null" }),
  // debutant | intermediaire | confirme
  level: text("level").notNull().default("debutant"),
  // seance | forfait | abonnement
  format: text("format").notNull().default("forfait"),
  /** Nombre de séances du forfait ; 1 pour une séance seule. */
  sessions: integer("sessions").notNull().default(1),
  /** Quand ça se passe, en clair : « Samedi · 10h → 12h ». */
  schedule: text("schedule").notNull().default(""),
  price: integer("price").notNull().default(0),
  image: text("image").notNull(),
  description: text("description").notNull().default(""),
  capacity: integer("capacity").notNull().default(10),
  /** Mis en avant en bannière dans la boutique. */
  featured: boolean("featured").notNull().default(false),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

/**
 * Une inscription à un cours.
 *
 * `price` est figé ici : un tarif révisé en cours de trimestre ne doit pas
 * réécrire ce qu'un élève déjà inscrit a payé. Même règle que les jetons et
 * les lignes de vente.
 */
export const enrollments = mb.table(
  "enrollments",
  {
    id: id(),
    courseId: uuid("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    /** Ce que l'élève a payé, figé à l'inscription. */
    price: integer("price").notNull().default(0),
    // pending | paid | failed | cancelled
    status: text("status").notNull().default("pending"),
    reference: text("reference").unique(),
    createdAt: createdAt(),
  },
  (t) => [index("enrollments_course_idx").on(t.courseId), index("enrollments_user_idx").on(t.userId)],
);

export const events = mb.table("events", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  day: text("day").notNull(),
  hours: text("hours").notNull().default(""),
  checkin: text("checkin").notNull().default(""),
  venueId: uuid("venue_id").references(() => venues.id),
  address: text("address").notNull().default(""),
  price: integer("price").notNull().default(0),
  image: text("image").notNull(),
  capacity: integer("capacity").notNull().default(100),
  attendees: integer("attendees").notNull().default(0),
  description: text("description").notNull().default(""),
  tags: text("tags").notNull().default(""),
  active: boolean("active").notNull().default(true),
  createdAt: createdAt(),
});

export const tickets = mb.table(
  "tickets",
  {
    id: id(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    code: text("code").notNull(),
    // pending | valid | used | failed
    status: text("status").notNull().default("valid"),
    /** Référence du paiement (mb.payments.reference) — nulle pour un billet gratuit. */
    reference: text("reference").unique(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("tickets_user_idx").on(t.userId)],
);

/**
 * Tables de billard, une ligne par table réelle.
 *
 * Le compteur `free_tables` de `venues` restait déclaratif : ici chaque table a
 * son état, sa réservation en cours et son tarif horaire, ce qui permet au
 * gérant de tenir son service et au joueur de voir ce qui est libre.
 */
export const venueTables = mb.table(
  "venue_tables",
  {
    id: id(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    /** Numéro affiché sur la table, tel que la salle l'appelle. */
    label: text("label").notNull(),
    // pool | snooker | billard francais
    kind: text("kind").notNull().default("pool"),
    /** Tarif horaire en francs, 0 quand la table se joue au jeton. */
    hourlyRate: integer("hourly_rate").notNull().default(0),
    /** Acompte demandé pour retenir la table. */
    deposit: integer("deposit").notNull().default(1000),
    // free | occupied | reserved | closed
    status: text("status").notNull().default("free"),
    seats: integer("seats").notNull().default(4),
    sort: integer("sort").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [index("venue_tables_venue_idx").on(t.venueId)],
);

/**
 * Réservations de table.
 *
 * L'acompte suit exactement le chemin des autres paiements : la réservation
 * naît en attente, la table n'est retenue qu'une fois l'acompte confirmé.
 */
export const reservations = mb.table(
  "reservations",
  {
    id: id(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    tableId: uuid("table_id").references(() => venueTables.id, { onDelete: "set null" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    /** Durée réservée, en minutes. */
    minutes: integer("minutes").notNull().default(60),
    players: integer("players").notNull().default(2),
    deposit: integer("deposit").notNull().default(0),
    // pending | confirmed | seated | done | cancelled | no_show | failed
    status: text("status").notNull().default("pending"),
    note: text("note").notNull().default(""),
    /** Référence du paiement de l'acompte (mb.payments.reference). */
    reference: text("reference").unique(),
    seatedAt: timestamp("seated_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [
    index("reservations_venue_idx").on(t.venueId),
    index("reservations_user_idx").on(t.userId),
    index("reservations_starts_idx").on(t.startsAt),
  ],
);

/**
 * Matchs — le cœur de Master Break Live.
 *
 * Un match vit sur une table d'une salle, oppose deux joueurs et se court en
 * « race to N ». Le score porté ici est la vérité affichée partout ; le détail
 * de la partie vit dans `match_events`, qui permet de rejouer la rencontre coup
 * par coup et d'en tirer les statistiques sans les dupliquer.
 */
export const matches = mb.table(
  "matches",
  {
    id: id(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    tableId: uuid("table_id").references(() => venueTables.id, { onDelete: "set null" }),
    /** Rattachement à un tournoi, quand la rencontre en fait partie. */
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
    // 8-ball | 9-ball | snooker | killer
    kind: text("kind").notNull().default("8-ball"),
    /** Race to N : le premier à N manches gagne. */
    target: integer("target").notNull().default(5),
    playerAId: uuid("player_a_id")
      .notNull()
      .references(() => users.id),
    playerBId: uuid("player_b_id")
      .notNull()
      .references(() => users.id),
    scoreA: integer("score_a").notNull().default(0),
    scoreB: integer("score_b").notNull().default(0),
    /** Joueur à la table, pour l'affichage en direct. */
    turnId: uuid("turn_id").references(() => users.id),
    // scheduled | live | done | cancelled
    status: text("status").notNull().default("scheduled"),
    winnerId: uuid("winner_id").references(() => users.id),
    /** Mise du défi, en francs — 0 pour un match amical. */
    stake: integer("stake").notNull().default(0),
    label: text("label").notNull().default("Amical"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id),
    /** Change à chaque écriture : c'est ce que le flux en direct surveille. */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [
    index("matches_venue_idx").on(t.venueId),
    index("matches_status_idx").on(t.status),
    index("matches_players_idx").on(t.playerAId, t.playerBId),
  ],
);

/**
 * Le déroulé d'un match, coup par coup : c'est à la fois la frise affichée en
 * direct et la source des statistiques. On y garde le score après chaque
 * événement pour pouvoir rejouer la rencontre sans tout recalculer.
 */
export const matchEvents = mb.table(
  "match_events",
  {
    id: id(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: uuid("player_id").references(() => users.id),
    /** Qui a saisi : gérant, arbitre ou joueur. La frise doit rester opposable. */
    byId: uuid("by_id").references(() => users.id),
    // start | rack | foul | break | safety | pot | note | end
    kind: text("kind").notNull(),
    seq: integer("seq").notNull().default(0),
    scoreA: integer("score_a").notNull().default(0),
    scoreB: integer("score_b").notNull().default(0),
    detail: text("detail").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("match_events_match_idx").on(t.matchId, t.seq)],
);

/**
 * Master Break Live — les directs vidéo.
 *
 * Deux axes indépendants, parce qu'ils ne décrivent pas la même chose :
 *
 *  · `level` — comment c'est produit. `phone` : un téléphone posé sur un
 *    trépied, diffusé depuis le navigateur, zéro matériel. `venue` : la caméra
 *    fixe de la salle, qui tourne toute la soirée (Venue Cast). `production` :
 *    un tournoi multi-caméra monté sous OBS, avec habillage.
 *  · `access` — qui a le droit de regarder. `free`, `members` (abonnés), ou
 *    `ppv` (payant à l'unité).
 *
 * `path` est public : c'est le chemin MediaMTX. `stream_key` est le secret
 * d'ingestion, qui ne quitte jamais la console du diffuseur.
 */
export const streams = mb.table(
  "streams",
  {
    id: id(),
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    matchId: uuid("match_id").references(() => matches.id, { onDelete: "set null" }),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    // phone | venue | production
    level: text("level").notNull().default("phone"),
    // free | members | ppv
    access: text("access").notNull().default("free"),
    /** Rubrique de la vitrine : 8-ball, 9-ball, snooker, killer, ambiance… */
    discipline: text("discipline").notNull().default("8-ball"),
    /** Vignette du direct ; à défaut, la photo de la salle. */
    poster: text("poster"),
    /** Prix du billet vidéo, en francs, quand l'accès est `ppv`. */
    price: integer("price").notNull().default(0),
    /** Chemin MediaMTX, public : /live/<path>. */
    path: text("path").notNull().unique(),
    /** Secret d'ingestion RTMP / WHIP. */
    streamKey: text("stream_key").notNull().unique(),
    // idle | live | ended
    status: text("status").notNull().default("idle"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    viewers: integer("viewers").notNull().default(0),
    peakViewers: integer("peak_viewers").notNull().default(0),
    /** Rediffusion, quand l'enregistrement est activé sur le serveur média. */
    replayUrl: text("replay_url"),
    createdBy: uuid("created_by").references(() => users.id),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [
    index("streams_venue_idx").on(t.venueId),
    index("streams_status_idx").on(t.status),
    index("streams_match_idx").on(t.matchId),
  ],
);

/** Billet vidéo : qui a payé pour voir quel direct. */
export const streamPasses = mb.table(
  "stream_passes",
  {
    id: id(),
    streamId: uuid("stream_id")
      .notNull()
      .references(() => streams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull().default(0),
    /** Référence du paiement (mb.payments.reference). */
    reference: text("reference").unique(),
    // pending | paid | failed
    status: text("status").notNull().default("pending"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("stream_passes_unique").on(t.streamId, t.userId)],
);

/**
 * Qui a le droit de tenir la feuille de match.
 *
 * Une ligne par habilitation, portée soit par un match précis, soit par un
 * tournoi entier — un arbitre de tournoi marque toutes ses rencontres sans
 * qu'on lui en assigne chacune. Le gérant et l'arbitre de salle n'ont pas
 * besoin de ligne : leur rattachement à la salle suffit.
 */
export const matchOfficials = mb.table(
  "match_officials",
  {
    id: id(),
    matchId: uuid("match_id").references(() => matches.id, { onDelete: "cascade" }),
    eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // referee | scorer
    role: text("role").notNull().default("referee"),
    /** Qui a délivré l'habilitation. */
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: createdAt(),
  },
  (t) => [
    index("match_officials_match_idx").on(t.matchId),
    index("match_officials_event_idx").on(t.eventId),
    index("match_officials_user_idx").on(t.userId),
  ],
);

/**
 * Paiements Mobile Money.
 *
 * Une ligne par tentative, quelle que soit la chose payée : `kind` + `targetId`
 * désignent la recharge, la commande ou le billet correspondant. `reference` est
 * ce que l'on transmet à PowerPay et ce que son webhook nous renvoie — unique,
 * c'est la clé d'idempotence : deux notifications pour le même paiement ne
 * créditent qu'une fois.
 */
export const payments = mb.table(
  "payments",
  {
    id: id(),
    reference: text("reference").notNull().unique(),
    // powerpay | simulated
    provider: text("provider").notNull(),
    /** Identifiant de la transaction chez l'opérateur. */
    providerRef: text("provider_ref"),
    // pack | order | ticket
    kind: text("kind").notNull(),
    targetId: uuid("target_id"),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    amount: integer("amount").notNull(),
    // om | momo
    method: text("method").notNull(),
    phone: text("phone").notNull(),
    // pending | paid | failed | expired
    status: text("status").notNull().default("pending"),
    failureReason: text("failure_reason"),
    /** Dernière charge utile reçue de l'opérateur, telle quelle. */
    detail: jsonb("detail"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("payments_user_idx").on(t.userId), index("payments_status_idx").on(t.status)],
);

export const scans = mb.table(
  "scans",
  {
    id: id(),
    // token | ticket
    kind: text("kind").notNull(),
    refId: uuid("ref_id").notNull(),
    code: text("code").notNull(),
    userId: uuid("user_id").references(() => users.id),
    venueId: uuid("venue_id").references(() => venues.id),
    managerId: uuid("manager_id").references(() => users.id),
    // qr | code
    method: text("method").notNull().default("qr"),
    amount: integer("amount").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("scans_venue_idx").on(t.venueId), index("scans_created_idx").on(t.createdAt)],
);

export const notifications = mb.table(
  "notifications",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    // token | order | event | reward | system
    kind: text("kind").notNull().default("system"),
    href: text("href"),
    read: boolean("read").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

/** Sessions de l'authentification maison (remplacées par GoTrue si Supabase Auth prend la main). */
export const sessions = mb.table(
  "sessions",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Empreinte SHA-256 du jeton de session : le jeton clair ne vit que dans le cookie. */
    tokenHash: text("token_hash").notNull().unique(),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/**
 * Les écrans d'une salle.
 *
 * Un navigateur ne peut pas parcourir le réseau local — c'est un interdit
 * volontaire, sans quoi n'importe quel site cartographierait le wifi de qui le
 * visite. Le dashboard ne peut donc pas « découvrir » les téléviseurs : ce sont
 * eux qui s'annoncent. Un écran ouvre /ecran, affiche un code, et le gérant
 * l'adopte depuis son tableau de bord.
 *
 * Tant qu'il n'est pas adopté, `venue_id` est nul : la ligne n'appartient à
 * personne et ne montre rien.
 */
export const screens = mb.table(
  "screens",
  {
    id: id(),
    /** Nul tant que l'écran n'a pas été adopté par une salle. */
    venueId: uuid("venue_id").references(() => venues.id, { onDelete: "cascade" }),
    /** Le nom que lui donne le gérant : « Bar gauche », « Fond de salle ». */
    name: text("name").notNull().default(""),
    /** Ce que l'écran doit montrer ; nul = veille. */
    streamId: uuid("stream_id").references(() => streams.id, { onDelete: "set null" }),
    /**
     * Code d'appairage affiché sur le téléviseur, à recopier dans le dashboard.
     * Effacé une fois l'écran adopté : il ne sert qu'une fois.
     */
    pairingCode: text("pairing_code").unique(),
    /** Le code expire : un téléviseur oublié allumé ne reste pas adoptable. */
    pairingExpiresAt: timestamp("pairing_expires_at", { withTimezone: true }),
    /** Empreinte SHA-256 du jeton que l'écran garde ; le jeton clair ne vit que sur l'écran. */
    tokenHash: text("token_hash").notNull().unique(),
    /** Dernier signe de vie : c'est lui qui décide de « en ligne », pas un ping. */
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("screens_venue_idx").on(t.venueId)],
);

export type Screen = typeof screens.$inferSelect;
export type Venue = typeof venues.$inferSelect;
export type User = typeof users.$inferSelect;
export type Pack = typeof packs.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type VenueTable = typeof venueTables.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type MatchEvent = typeof matchEvents.$inferSelect;
export type MatchOfficial = typeof matchOfficials.$inferSelect;
export type Stream = typeof streams.$inferSelect;
export type StreamPass = typeof streamPasses.$inferSelect;
export type Token = typeof tokens.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Scan = typeof scans.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Session = typeof sessions.$inferSelect;
