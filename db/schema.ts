import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * Schéma MASTER BREAK. SQLite pour le développement ; les types sont volontairement
 * portables (texte, entiers, timestamps) pour la migration vers Postgres /
 * Supabase : seul le driver et le dialecte changeront.
 */

const id = () => text("id").primaryKey();
const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const venues = sqliteTable("venues", {
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
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const users = sqliteTable(
  "users",
  {
    id: id(),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    avatar: text("avatar"),
    // client | manager | admin
    role: text("role").notNull().default("client"),
    points: integer("points").notNull().default(0),
    venueId: text("venue_id").references(() => venues.id),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_phone_idx").on(t.phone)],
);

export const packs = sqliteTable("packs", {
  id: id(),
  tokens: integer("tokens").notNull(),
  price: integer("price").notNull(),
  bonus: integer("bonus").notNull().default(0),
  hint: text("hint").notNull().default(""),
  badge: text("badge"),
  sort: integer("sort").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const purchases = sqliteTable(
  "purchases",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    packId: text("pack_id").references(() => packs.id),
    venueId: text("venue_id").references(() => venues.id),
    tokens: integer("tokens").notNull(),
    amount: integer("amount").notNull(),
    // om | momo
    method: text("method").notNull(),
    // pending | paid | failed
    status: text("status").notNull().default("paid"),
    createdAt: createdAt(),
  },
  (t) => [index("purchases_user_idx").on(t.userId)],
);

export const tokens = sqliteTable(
  "tokens",
  {
    id: id(),
    code: text("code").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    venueId: text("venue_id").references(() => venues.id),
    purchaseId: text("purchase_id").references(() => purchases.id),
    // active | used
    status: text("status").notNull().default("active"),
    tableNumber: integer("table_number"),
    usedAt: integer("used_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [index("tokens_user_idx").on(t.userId), index("tokens_code_idx").on(t.code)],
);

export const products = sqliteTable("products", {
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
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const orders = sqliteTable(
  "orders",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    venueId: text("venue_id").references(() => venues.id),
    total: integer("total").notNull(),
    // om | momo
    method: text("method").notNull().default("momo"),
    // pickup | delivery
    fulfillment: text("fulfillment").notNull().default("pickup"),
    // pending | paid | ready | done | cancelled
    status: text("status").notNull().default("paid"),
    createdAt: createdAt(),
  },
  (t) => [index("orders_user_idx").on(t.userId)],
);

export const orderItems = sqliteTable("order_items", {
  id: id(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  qty: integer("qty").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
});

export const events = sqliteTable("events", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  day: text("day").notNull(),
  hours: text("hours").notNull().default(""),
  checkin: text("checkin").notNull().default(""),
  venueId: text("venue_id").references(() => venues.id),
  address: text("address").notNull().default(""),
  price: integer("price").notNull().default(0),
  image: text("image").notNull(),
  capacity: integer("capacity").notNull().default(100),
  attendees: integer("attendees").notNull().default(0),
  description: text("description").notNull().default(""),
  // liste séparée par des virgules
  tags: text("tags").notNull().default(""),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: createdAt(),
});

export const tickets = sqliteTable(
  "tickets",
  {
    id: id(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    code: text("code").notNull(),
    // valid | used
    status: text("status").notNull().default("valid"),
    usedAt: integer("used_at", { mode: "timestamp" }),
    createdAt: createdAt(),
  },
  (t) => [index("tickets_user_idx").on(t.userId)],
);

export const scans = sqliteTable(
  "scans",
  {
    id: id(),
    // token | ticket
    kind: text("kind").notNull(),
    refId: text("ref_id").notNull(),
    code: text("code").notNull(),
    userId: text("user_id").references(() => users.id),
    venueId: text("venue_id").references(() => venues.id),
    managerId: text("manager_id").references(() => users.id),
    // qr | code
    method: text("method").notNull().default("qr"),
    amount: integer("amount").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("scans_venue_idx").on(t.venueId)],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    // token | order | event | reward | system
    kind: text("kind").notNull().default("system"),
    href: text("href"),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("notifications_user_idx").on(t.userId)],
);

export type Venue = typeof venues.$inferSelect;
export type User = typeof users.$inferSelect;
export type Pack = typeof packs.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type Token = typeof tokens.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type EventRow = typeof events.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type Scan = typeof scans.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
