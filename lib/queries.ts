import "server-only";
import { and, count, desc, eq, gte, inArray, ne, sql, sum } from "drizzle-orm";
import {
  db,
  events,
  notifications,
  orderItems,
  orders,
  packs,
  products,
  purchases,
  reservations,
  scans,
  tickets,
  tokens,
  users,
  venues,
  venueTables,
  type EventRow,
  type Reservation,
  type Venue,
  type VenueTable,
} from "@/db";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

/* ---------------------------------------------------------------- catalogue */

export async function getVenues(): Promise<Venue[]> {
  return db.select().from(venues).where(eq(venues.active, true)).orderBy(venues.distanceKm);
}

export async function getVenue(slug: string) {
  const rows = await db.select().from(venues).where(eq(venues.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getPacks() {
  return db.select().from(packs).where(eq(packs.active, true)).orderBy(packs.sort);
}

export async function getProducts(category?: string) {
  const where = category
    ? and(eq(products.active, true), eq(products.category, category))
    : eq(products.active, true);
  return db.select().from(products).where(where).orderBy(products.category, products.name);
}

export async function getProduct(slug: string) {
  const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getEvents(): Promise<EventRow[]> {
  return db.select().from(events).where(eq(events.active, true)).orderBy(events.createdAt);
}

export async function getEvent(slug: string) {
  const rows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/* ------------------------------------------------------------------- client */

export async function getActiveTokens(userId: string) {
  return db
    .select()
    .from(tokens)
    .where(and(eq(tokens.userId, userId), eq(tokens.status, "active")))
    .orderBy(tokens.createdAt);
}

export async function getBalance(userId: string): Promise<number> {
  const rows = await db
    .select({ n: count() })
    .from(tokens)
    .where(and(eq(tokens.userId, userId), eq(tokens.status, "active")));
  return rows[0]?.n ?? 0;
}

export type ActivityEntry = {
  id: string;
  label: string;
  detail: string;
  delta: string;
  kind: "in" | "out" | "xp";
  at: Date;
};

/** Fil « activité récente » : recharges, jetons scannés, billets. */
export async function getActivity(userId: string, limit = 6): Promise<ActivityEntry[]> {
  const [buys, used, myTickets] = await Promise.all([
    db.select().from(purchases).where(eq(purchases.userId, userId)).orderBy(desc(purchases.createdAt)).limit(limit),
    db
      .select({ scan: scans, venue: venues })
      .from(scans)
      .leftJoin(venues, eq(scans.venueId, venues.id))
      .where(and(eq(scans.userId, userId), eq(scans.kind, "token")))
      .orderBy(desc(scans.createdAt))
      .limit(limit),
    db
      .select({ ticket: tickets, event: events })
      .from(tickets)
      .leftJoin(events, eq(tickets.eventId, events.id))
      .where(eq(tickets.userId, userId))
      .orderBy(desc(tickets.createdAt))
      .limit(limit),
  ]);

  const entries: ActivityEntry[] = [
    ...buys.map((p) => ({
      id: `p-${p.id}`,
      label: `Recharge ${p.tokens} jeton${p.tokens > 1 ? "s" : ""}`,
      detail: `${p.method === "om" ? "Orange Money" : "MTN MoMo"} · ${p.amount.toLocaleString("fr-FR")} F`,
      delta: `+${p.tokens}`,
      kind: "in" as const,
      at: p.createdAt,
    })),
    ...used.map(({ scan, venue }) => ({
      id: `s-${scan.id}`,
      label: "Jeton scanné",
      detail: `${venue?.name ?? "Salle partenaire"} · code ${scan.code}`,
      delta: "−1",
      kind: "out" as const,
      at: scan.createdAt,
    })),
    ...myTickets.map(({ ticket, event }) => ({
      id: `t-${ticket.id}`,
      label: `Billet · ${event?.title ?? "Événement"}`,
      detail: `${event?.day ?? ""} · code ${ticket.code}`,
      delta: "+1",
      kind: "xp" as const,
      at: ticket.createdAt,
    })),
  ];

  return entries.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

export async function getNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
}

export async function getUnreadCount(userId: string): Promise<number> {
  const rows = await db
    .select({ n: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return rows[0]?.n ?? 0;
}

export async function getOrders(userId: string) {
  const rows = await db
    .select({ order: orders, venue: venues })
    .from(orders)
    .leftJoin(venues, eq(orders.venueId, venues.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  if (rows.length === 0) return [];

  const items = await db
    .select({ item: orderItems, product: products })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      inArray(
        orderItems.orderId,
        rows.map((r) => r.order.id),
      ),
    );

  return rows.map(({ order, venue }) => ({
    ...order,
    venue,
    items: items.filter((i) => i.item.orderId === order.id),
  }));
}

export async function getTickets(userId: string) {
  return db
    .select({ ticket: tickets, event: events })
    .from(tickets)
    .innerJoin(events, eq(tickets.eventId, events.id))
    .where(eq(tickets.userId, userId))
    .orderBy(desc(tickets.createdAt));
}

export async function getLeaderboard(limit = 5) {
  return db
    .select({ id: users.id, name: users.name, avatar: users.avatar, points: users.points })
    .from(users)
    .where(eq(users.role, "client"))
    .orderBy(desc(users.points))
    .limit(limit);
}

export async function getRank(userId: string): Promise<number> {
  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.role, "client"))
    .orderBy(desc(users.points));
  return rows.findIndex((r) => r.id === userId) + 1;
}

/* ------------------------------------------------------------------- gérant */

export async function getVenueStats(venueId: string) {
  const since = startOfToday();
  const [today, tables, ticketsToday] = await Promise.all([
    db
      .select({ n: count(), total: sum(scans.amount) })
      .from(scans)
      .where(and(eq(scans.venueId, venueId), eq(scans.kind, "token"), gte(scans.createdAt, since))),
    db.select().from(venues).where(eq(venues.id, venueId)).limit(1),
    db
      .select({ n: count() })
      .from(scans)
      .where(and(eq(scans.venueId, venueId), eq(scans.kind, "ticket"), gte(scans.createdAt, since))),
  ]);

  const venue = tables[0];
  const debited = today[0]?.n ?? 0;
  const revenue = Number(today[0]?.total ?? 0);

  return {
    venue,
    debited,
    revenue,
    commission: Math.round(revenue * 0.1),
    tickets: ticketsToday[0]?.n ?? 0,
    tablesBusy: venue ? venue.tables - venue.freeTables : 0,
    tablesTotal: venue?.tables ?? 0,
  };
}

export async function getRecentScans(venueId: string | null, limit = 6) {
  const base = db
    .select({ scan: scans, user: users, venue: venues })
    .from(scans)
    .leftJoin(users, eq(scans.userId, users.id))
    .leftJoin(venues, eq(scans.venueId, venues.id))
    .orderBy(desc(scans.createdAt))
    .limit(limit);

  return venueId ? base.where(eq(scans.venueId, venueId)) : base;
}

/* -------------------------------------------------------------------- admin */

export async function getAdminStats() {
  const since = startOfToday();
  const month = daysAgo(30);

  const [tokenRevenueToday, tokenRevenueMonth, tokensSold, ordersMonth, ticketsSold, clientCount, activeTokens] =
    await Promise.all([
      db.select({ total: sum(scans.amount) }).from(scans).where(gte(scans.createdAt, since)),
      db.select({ total: sum(purchases.amount) }).from(purchases).where(gte(purchases.createdAt, month)),
      db.select({ n: count() }).from(tokens).where(gte(tokens.createdAt, month)),
      db.select({ n: count(), total: sum(orders.total) }).from(orders).where(gte(orders.createdAt, month)),
      db.select({ n: count() }).from(tickets),
      db.select({ n: count() }).from(users).where(eq(users.role, "client")),
      db.select({ n: count() }).from(tokens).where(eq(tokens.status, "active")),
    ]);

  return {
    revenueToday: Number(tokenRevenueToday[0]?.total ?? 0),
    revenueMonth: Number(tokenRevenueMonth[0]?.total ?? 0),
    tokensSold: tokensSold[0]?.n ?? 0,
    ordersCount: ordersMonth[0]?.n ?? 0,
    ordersTotal: Number(ordersMonth[0]?.total ?? 0),
    ticketsSold: ticketsSold[0]?.n ?? 0,
    clients: clientCount[0]?.n ?? 0,
    activeTokens: activeTokens[0]?.n ?? 0,
  };
}

/** Jetons débités et recette par salle, sur les 7 derniers jours. */
export async function getVenueBreakdown() {
  return db
    .select({
      id: venues.id,
      name: venues.name,
      city: venues.city,
      tables: venues.tables,
      tokenPrice: venues.tokenPrice,
      debited: count(scans.id),
      revenue: sql<number>`coalesce(sum(${scans.amount}), 0)`,
    })
    .from(venues)
    .leftJoin(scans, and(eq(scans.venueId, venues.id), gte(scans.createdAt, daysAgo(7))))
    .groupBy(venues.id)
    .orderBy(desc(sql`coalesce(sum(${scans.amount}), 0)`));
}

export async function getAllOrders() {
  const rows = await db
    .select({ order: orders, user: users, venue: venues })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .leftJoin(venues, eq(orders.venueId, venues.id))
    .orderBy(desc(orders.createdAt))
    .limit(50);
  return rows;
}

export async function getAllUsers() {
  return db.select().from(users).orderBy(users.role, desc(users.points));
}

export async function getAllPurchases(limit = 30) {
  return db
    .select({ purchase: purchases, user: users, venue: venues })
    .from(purchases)
    .innerJoin(users, eq(purchases.userId, users.id))
    .leftJoin(venues, eq(purchases.venueId, venues.id))
    .orderBy(desc(purchases.createdAt))
    .limit(limit);
}

export async function getAllProducts() {
  return db.select().from(products).orderBy(products.category, products.name);
}

export async function getAllVenues() {
  return db.select().from(venues).orderBy(venues.city, venues.name);
}

export async function getAllEvents() {
  return db
    .select({ event: events, venue: venues, sold: count(tickets.id) })
    .from(events)
    .leftJoin(venues, eq(events.venueId, venues.id))
    .leftJoin(tickets, eq(tickets.eventId, events.id))
    // Grouper par `events.id` suffit pour les colonnes d'`events` — Postgres
    // suit la dépendance fonctionnelle depuis une clé primaire. Elle ne
    // traverse pas la jointure : `venues` a besoin de sa propre clé, sans quoi
    // Postgres refuse la requête (42803). SQLite, lui, l'acceptait.
    .groupBy(events.id, venues.id)
    .orderBy(desc(events.createdAt));
}

export async function getManagers() {
  return db.select().from(users).where(ne(users.role, "client"));
}

/* ------------------------------------------------------------------ Venue OS */

/** Créneaux considérés comme « en cours » pour l'affichage du plan de salle. */
const LIVE_STATUSES = ["confirmed", "seated"];

export type FloorTable = {
  table: VenueTable;
  /** Réservation qui occupe la table maintenant, s'il y en a une. */
  now: { reservation: Reservation; client: string } | null;
  /** Prochaine réservation de la journée. */
  next: { reservation: Reservation; client: string } | null;
};

/**
 * Plan de salle : chaque table avec ce qui s'y passe maintenant et ce qui
 * arrive ensuite. Une seule requête sur les réservations du jour, recoupée en
 * mémoire — une salle a une dizaine de tables, pas mille.
 */
export async function getFloor(venueId: string): Promise<FloorTable[]> {
  const [tables, bookings] = await Promise.all([
    db
      .select()
      .from(venueTables)
      .where(and(eq(venueTables.venueId, venueId), eq(venueTables.active, true)))
      .orderBy(venueTables.sort, venueTables.label),
    db
      .select({ reservation: reservations, client: users.name })
      .from(reservations)
      .innerJoin(users, eq(reservations.userId, users.id))
      .where(
        and(
          eq(reservations.venueId, venueId),
          inArray(reservations.status, LIVE_STATUSES),
          gte(reservations.startsAt, startOfToday()),
        ),
      )
      .orderBy(reservations.startsAt),
  ]);

  const now = Date.now();
  return tables.map((table) => {
    const mine = bookings.filter((b) => b.reservation.tableId === table.id);
    const ends = (r: Reservation) => r.startsAt.getTime() + r.minutes * 60_000;
    return {
      table,
      now: mine.find((b) => b.reservation.startsAt.getTime() <= now && ends(b.reservation) > now) ?? null,
      next: mine.find((b) => b.reservation.startsAt.getTime() > now) ?? null,
    };
  });
}

/** Réservations à venir et passées d'un joueur. */
export async function getReservations(userId: string) {
  return db
    .select({ reservation: reservations, venue: venues, table: venueTables })
    .from(reservations)
    .innerJoin(venues, eq(reservations.venueId, venues.id))
    .leftJoin(venueTables, eq(reservations.tableId, venueTables.id))
    .where(and(eq(reservations.userId, userId), ne(reservations.status, "failed")))
    .orderBy(desc(reservations.startsAt))
    .limit(30);
}

/** Le cahier de réservations du gérant, pour la journée en cours. */
export async function getVenueReservations(venueId: string) {
  return db
    .select({ reservation: reservations, client: users, table: venueTables })
    .from(reservations)
    .innerJoin(users, eq(reservations.userId, users.id))
    .leftJoin(venueTables, eq(reservations.tableId, venueTables.id))
    .where(
      and(
        eq(reservations.venueId, venueId),
        gte(reservations.startsAt, startOfToday()),
        ne(reservations.status, "failed"),
        ne(reservations.status, "pending"),
      ),
    )
    .orderBy(reservations.startsAt);
}

export async function getVenueTables(venueId: string) {
  return db
    .select()
    .from(venueTables)
    .where(eq(venueTables.venueId, venueId))
    .orderBy(venueTables.sort, venueTables.label);
}

export type ShiftHour = { hour: number; revenue: number; scans: number };

/**
 * Le service, heure par heure : recette encaissée au comptoir et passages.
 * C'est la lecture dont un gérant a besoin en fin de soirée.
 */
export async function getShift(venueId: string): Promise<{
  hours: ShiftHour[];
  tokens: number;
  revenue: number;
  deposits: number;
  reserved: number;
  seated: number;
  noShow: number;
  occupancy: number;
  best: { name: string; scans: number } | null;
}> {
  const since = startOfToday();

  const [rows, deposit, bookings, tables, top] = await Promise.all([
    db
      .select({
        hour: sql<number>`extract(hour from ${scans.createdAt})`,
        revenue: sql<number>`coalesce(sum(${scans.amount}), 0)`,
        scans: count(scans.id),
      })
      .from(scans)
      .where(and(eq(scans.venueId, venueId), gte(scans.createdAt, since)))
      .groupBy(sql`extract(hour from ${scans.createdAt})`),
    db
      .select({ total: sql<number>`coalesce(sum(${reservations.deposit}), 0)` })
      .from(reservations)
      .where(
        and(
          eq(reservations.venueId, venueId),
          gte(reservations.startsAt, since),
          inArray(reservations.status, ["confirmed", "seated", "done", "no_show"]),
        ),
      ),
    db
      .select({ status: reservations.status, n: count(reservations.id), minutes: sql<number>`coalesce(sum(${reservations.minutes}), 0)` })
      .from(reservations)
      .where(and(eq(reservations.venueId, venueId), gte(reservations.startsAt, since)))
      .groupBy(reservations.status),
    db
      .select({ n: count(venueTables.id) })
      .from(venueTables)
      .where(and(eq(venueTables.venueId, venueId), eq(venueTables.active, true))),
    db
      .select({ name: users.name, scans: count(scans.id) })
      .from(scans)
      .innerJoin(users, eq(scans.userId, users.id))
      .where(and(eq(scans.venueId, venueId), gte(scans.createdAt, since)))
      .groupBy(users.name)
      .orderBy(desc(count(scans.id)))
      .limit(1),
  ]);

  const hours: ShiftHour[] = Array.from({ length: 24 }, (_, hour) => {
    const found = rows.find((r) => Number(r.hour) === hour);
    return { hour, revenue: Number(found?.revenue ?? 0), scans: Number(found?.scans ?? 0) };
  });

  const byStatus = (name: string) => Number(bookings.find((b) => b.status === name)?.n ?? 0);
  const bookedMinutes = bookings
    .filter((b) => ["confirmed", "seated", "done"].includes(b.status))
    .reduce((sum, b) => sum + Number(b.minutes), 0);

  // Une soirée, c'est douze heures de service : la base du taux d'occupation.
  const capacityMinutes = Math.max(1, Number(tables[0]?.n ?? 0)) * 12 * 60;

  return {
    hours,
    tokens: hours.reduce((sum, h) => sum + h.scans, 0),
    revenue: hours.reduce((sum, h) => sum + h.revenue, 0),
    deposits: Number(deposit[0]?.total ?? 0),
    reserved: byStatus("confirmed"),
    seated: byStatus("seated"),
    noShow: byStatus("no_show"),
    occupancy: Math.min(100, Math.round((bookedMinutes / capacityMinutes) * 100)),
    best: top[0] ? { name: top[0].name, scans: Number(top[0].scans) } : null,
  };
}
