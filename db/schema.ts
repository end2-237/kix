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
});

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

export type Venue = typeof venues.$inferSelect;
export type User = typeof users.$inferSelect;
export type Pack = typeof packs.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type VenueTable = typeof venueTables.$inferSelect;
export type Reservation = typeof reservations.$inferSelect;
export type Token = typeof tokens.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Scan = typeof scans.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Session = typeof sessions.$inferSelect;
