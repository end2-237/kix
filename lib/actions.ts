"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  db,
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
} from "@/db";
import { POINTS_PER_FREE_TOKEN, XP_PER_TOKEN } from "@/lib/constants";
import {
  createSession,
  destroySession,
  hashPassword,
  isValidPhone,
  normalizePhone,
  SESSION_MAX_AGE,
  verifyPassword,
} from "@/lib/auth";
import { getCurrentUser, homeFor, requireRole, requireUser, SESSION_COOKIE } from "@/lib/session";

const uid = () => randomUUID();

async function freshCode(): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const clash = await db
      .select({ id: tokens.id })
      .from(tokens)
      .where(and(eq(tokens.code, code), eq(tokens.status, "active")))
      .limit(1);
    if (!clash[0]) return code;
  }
  return String(Date.now()).slice(-4);
}

async function notify(userId: string, title: string, body: string, kind: string, href?: string) {
  await db.insert(notifications).values({ id: uid(), userId, title, body, kind, href, read: false });
}

/* ------------------------------------------------------------------ session */

/**
 * React réinitialise les champs d'un formulaire après une action : on renvoie
 * donc ce qui a été saisi (jamais le mot de passe) pour le réafficher.
 */
export type AuthState = {
  error: string;
  field?: "phone" | "password" | "name";
  values?: { name?: string; phone?: string };
} | null;

/** Empreinte factice : on la vérifie quand le numéro est inconnu, pour que la
 * réponse prenne le même temps qu'un mot de passe erroné (pas d'énumération). */
const DECOY_HASH =
  "scrypt$0000000000000000000000000000000000000000000000000000000000000000$" + "0".repeat(128);

async function openSession(userId: string, role: string) {
  const token = await createSession(userId, (await headers()).get("user-agent"));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(homeFor(role));
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const typed = String(formData.get("phone") ?? "");
  const phone = normalizePhone(typed);
  const password = String(formData.get("password") ?? "");
  const values = { phone: typed };

  if (!isValidPhone(phone)) return { error: "Numéro camerounais attendu, par exemple 6 77 45 12 08.", field: "phone", values };
  if (!password) return { error: "Entre ton mot de passe.", field: "password", values };

  const found = (await db.select().from(users).where(eq(users.phone, phone)).limit(1))[0];
  const ok = await verifyPassword(password, found?.passwordHash ?? DECOY_HASH);
  if (!found || !ok) return { error: "Numéro ou mot de passe incorrect.", field: "password", values };

  await openSession(found.id, found.role);
  return null;
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const typed = String(formData.get("phone") ?? "");
  const phone = normalizePhone(typed);
  const password = String(formData.get("password") ?? "");
  const values = { name, phone: typed };

  if (name.length < 2) return { error: "Dis-nous comment t'appeler.", field: "name", values };
  if (!isValidPhone(phone)) return { error: "Numéro camerounais attendu, par exemple 6 77 45 12 08.", field: "phone", values };
  if (password.length < 6) return { error: "Six caractères au minimum pour le mot de passe.", field: "password", values };

  const taken = (await db.select({ id: users.id }).from(users).where(eq(users.phone, phone)).limit(1))[0];
  if (taken) return { error: "Ce numéro a déjà un compte. Connecte-toi.", field: "phone", values };

  const id = uid();
  await db.insert(users).values({ id, name, phone, passwordHash: await hashPassword(password), role: "client" });
  await notify(
    id,
    "Bienvenue chez MASTER BREAK",
    "Recharge ton Pass et présente ton QR au comptoir pour lancer ta première partie.",
    "compte",
    "/app/recharge",
  );

  await openSession(id, "client");
  return null;
}

export async function signOut() {
  const jar = await cookies();
  await destroySession(jar.get(SESSION_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
  redirect("/connexion");
}

/* ------------------------------------------------------------------- jetons */

export type PurchaseResult = { ok: true; credited: number; balance: number } | { ok: false; error: string };

/** Achat d'un pack : crée la recharge puis les jetons, comme le fera le webhook. */
export async function purchasePack(packId: string, venueId: string, method: "om" | "momo"): Promise<PurchaseResult> {
  const user = await requireUser();
  const pack = (await db.select().from(packs).where(eq(packs.id, packId)).limit(1))[0];
  if (!pack) return { ok: false, error: "Pack introuvable" };

  const credited = pack.tokens + pack.bonus;
  const purchaseId = uid();

  await db.insert(purchases).values({
    id: purchaseId,
    userId: user.id,
    packId: pack.id,
    venueId,
    tokens: credited,
    amount: pack.price,
    method,
    status: "paid",
  });

  for (let i = 0; i < credited; i++) {
    await db.insert(tokens).values({
      id: uid(),
      code: await freshCode(),
      userId: user.id,
      venueId,
      purchaseId,
      status: "active",
    });
  }

  await notify(
    user.id,
    `${credited} jetons crédités`,
    `Paiement de ${pack.price.toLocaleString("fr-FR")} F par ${method === "om" ? "Orange Money" : "MTN MoMo"}.`,
    "token",
    "/app/pass",
  );

  const balance = await db
    .select({ n: sql<number>`count(*)` })
    .from(tokens)
    .where(and(eq(tokens.userId, user.id), eq(tokens.status, "active")));

  revalidatePath("/app");
  revalidatePath("/app/pass");
  revalidatePath("/app/notifications");
  return { ok: true, credited, balance: Number(balance[0]?.n ?? 0) };
}

export type ScanResult =
  | { ok: true; kind: "token"; client: string; venue: string; remaining: number; table: number | null }
  | { ok: true; kind: "ticket"; client: string; event: string }
  | { ok: false; error: string };

/** Débit d'un jeton (ou validation d'un billet) depuis Master Scan. */
export async function scanCode(raw: string, method: "qr" | "code" = "code"): Promise<ScanResult> {
  const manager = await requireRole("manager", "admin");
  const code = raw.trim();
  if (!/^\d{4}$/.test(code)) return { ok: false, error: "Code à 4 chiffres attendu" };

  const token = (
    await db
      .select()
      .from(tokens)
      .where(and(eq(tokens.code, code), eq(tokens.status, "active")))
      .limit(1)
  )[0];

  if (token) {
    const venueId = manager.venueId ?? token.venueId;
    const venue = venueId ? (await db.select().from(venues).where(eq(venues.id, venueId)).limit(1))[0] : null;
    const client = (await db.select().from(users).where(eq(users.id, token.userId)).limit(1))[0];

    await db.update(tokens).set({ status: "used", usedAt: new Date(), venueId }).where(eq(tokens.id, token.id));
    await db.insert(scans).values({
      id: uid(),
      kind: "token",
      refId: token.id,
      code,
      userId: token.userId,
      venueId,
      managerId: manager.id,
      method,
      amount: venue?.tokenPrice ?? 400,
    });
    await db
      .update(users)
      .set({ points: sql`${users.points} + ${XP_PER_TOKEN}` })
      .where(eq(users.id, token.userId));
    await notify(
      token.userId,
      "Jeton débité",
      `${venue?.name ?? "Salle partenaire"} · +${XP_PER_TOKEN} XP`,
      "token",
      "/app/pass",
    );

    const rest = await db
      .select({ n: sql<number>`count(*)` })
      .from(tokens)
      .where(and(eq(tokens.userId, token.userId), eq(tokens.status, "active")));

    revalidatePath("/gerant");
    revalidatePath("/app");
    revalidatePath("/app/pass");
    revalidatePath("/admin");
    return {
      ok: true,
      kind: "token",
      client: client?.name ?? "Client MASTER BREAK",
      venue: venue?.name ?? "Salle partenaire",
      remaining: Number(rest[0]?.n ?? 0),
      table: token.tableNumber,
    };
  }

  const ticket = (
    await db
      .select({ ticket: tickets, event: events, user: users })
      .from(tickets)
      .innerJoin(events, eq(tickets.eventId, events.id))
      .innerJoin(users, eq(tickets.userId, users.id))
      .where(and(eq(tickets.code, code), eq(tickets.status, "valid")))
      .limit(1)
  )[0];

  if (ticket) {
    await db.update(tickets).set({ status: "used", usedAt: new Date() }).where(eq(tickets.id, ticket.ticket.id));
    await db.insert(scans).values({
      id: uid(),
      kind: "ticket",
      refId: ticket.ticket.id,
      code,
      userId: ticket.user.id,
      venueId: manager.venueId ?? ticket.event.venueId,
      managerId: manager.id,
      method,
      amount: 0,
    });
    revalidatePath("/gerant");
    revalidatePath("/admin");
    return { ok: true, kind: "ticket", client: ticket.user.name, event: ticket.event.title };
  }

  return { ok: false, error: `Code ${code} inconnu ou déjà utilisé` };
}

/* ---------------------------------------------------------------- boutique */

export type CheckoutItem = { slug: string; qty: number };
export type CheckoutResult = { ok: true; orderId: string; total: number } | { ok: false; error: string };

export async function checkout(
  items: CheckoutItem[],
  fulfillment: "pickup" | "delivery",
  method: "om" | "momo",
  venueId?: string,
): Promise<CheckoutResult> {
  const user = await requireUser();
  if (items.length === 0) return { ok: false, error: "Panier vide" };

  const rows = await db
    .select()
    .from(products)
    .where(
      inArray(
        products.slug,
        items.map((i) => i.slug),
      ),
    );

  let total = fulfillment === "delivery" ? 1000 : 0;
  const lines = items
    .map((item) => {
      const product = rows.find((p) => p.slug === item.slug);
      if (!product) return null;
      total += product.price * item.qty;
      return { id: uid(), productId: product.id, qty: item.qty, unitPrice: product.price };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  if (lines.length === 0) return { ok: false, error: "Produits introuvables" };

  const orderId = uid();
  await db.insert(orders).values({
    id: orderId,
    userId: user.id,
    venueId: venueId ?? null,
    total,
    method,
    fulfillment,
    status: "paid",
  });
  await db.insert(orderItems).values(lines.map((l) => ({ ...l, orderId })));
  for (const line of lines) {
    await db
      .update(products)
      .set({ stock: sql`greatest(0, ${products.stock} - ${line.qty})` })
      .where(eq(products.id, line.productId));
  }

  await notify(
    user.id,
    "Commande confirmée",
    `${lines.length} article${lines.length > 1 ? "s" : ""} · ${total.toLocaleString("fr-FR")} F · ${
      fulfillment === "pickup" ? "retrait en salle" : "livraison Douala"
    }.`,
    "order",
    "/app/commandes",
  );

  revalidatePath("/app/commandes");
  revalidatePath("/app/shop");
  revalidatePath("/admin/commandes");
  return { ok: true, orderId, total };
}

/* ------------------------------------------------------------------ billets */

export type TicketResult = { ok: true; code: string } | { ok: false; error: string };

export async function buyTicket(eventId: string): Promise<TicketResult> {
  const user = await requireUser();
  const event = (await db.select().from(events).where(eq(events.id, eventId)).limit(1))[0];
  if (!event) return { ok: false, error: "Événement introuvable" };
  if (event.attendees >= event.capacity) return { ok: false, error: "Complet" };

  const code = await freshCode();
  await db.insert(tickets).values({ id: uid(), eventId, userId: user.id, code, status: "valid" });
  await db
    .update(events)
    .set({ attendees: sql`${events.attendees} + 1` })
    .where(eq(events.id, eventId));
  await notify(user.id, `Billet · ${event.title}`, `${event.day} · code ${code}`, "event", "/app/billets");

  revalidatePath(`/app/events/${event.slug}`);
  revalidatePath("/app/billets");
  return { ok: true, code };
}

/* ------------------------------------------------------------------ rewards */

export type ConvertResult = { ok: true; points: number } | { ok: false; error: string };

export async function convertPoints(): Promise<ConvertResult> {
  const user = await requireUser();
  if (user.points < POINTS_PER_FREE_TOKEN) return { ok: false, error: "Il te faut 500 points" };

  await db
    .update(users)
    .set({ points: user.points - POINTS_PER_FREE_TOKEN })
    .where(eq(users.id, user.id));
  await db.insert(tokens).values({
    id: uid(),
    code: await freshCode(),
    userId: user.id,
    venueId: null,
    status: "active",
  });
  await notify(user.id, "Jeton offert", "500 points convertis en 1 jeton de partie.", "reward", "/app/pass");

  revalidatePath("/app/rewards");
  revalidatePath("/app/pass");
  revalidatePath("/app");
  return { ok: true, points: user.points - POINTS_PER_FREE_TOKEN };
}

export async function markNotificationsRead() {
  const user = await getCurrentUser();
  if (!user) return;
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));
  revalidatePath("/app/notifications");
  revalidatePath("/app");
}

/* -------------------------------------------------------------------- admin */

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const num = (fd: FormData, key: string) => Number(fd.get(key) ?? 0) || 0;
const bool = (fd: FormData, key: string) => fd.get(key) === "on" || fd.get(key) === "true";

export async function saveVenue(formData: FormData) {
  await requireRole("admin");
  const id = str(formData, "id");
  const values = {
    slug: str(formData, "slug") || str(formData, "name").toLowerCase().replace(/\s+/g, "-"),
    name: str(formData, "name"),
    area: str(formData, "area"),
    city: str(formData, "city"),
    address: str(formData, "address"),
    tables: num(formData, "tables"),
    freeTables: num(formData, "freeTables"),
    tokenPrice: num(formData, "tokenPrice"),
    distanceKm: num(formData, "distanceKm"),
    image: str(formData, "image") || "/img/hall-dark.jpg",
    active: bool(formData, "active"),
  };

  if (id) await db.update(venues).set(values).where(eq(venues.id, id));
  else await db.insert(venues).values({ id: uid(), ...values });

  revalidatePath("/admin/salles");
  revalidatePath("/app/salles");
  revalidatePath("/");
}

export async function deleteVenue(formData: FormData) {
  await requireRole("admin");
  await db.update(venues).set({ active: false }).where(eq(venues.id, str(formData, "id")));
  revalidatePath("/admin/salles");
}

export async function saveProduct(formData: FormData) {
  await requireRole("admin");
  const id = str(formData, "id");
  const values = {
    slug: str(formData, "slug") || str(formData, "name").toLowerCase().replace(/\s+/g, "-"),
    name: str(formData, "name"),
    detail: str(formData, "detail"),
    description: str(formData, "description"),
    price: num(formData, "price"),
    image: str(formData, "image") || "/img/puffs.jpg",
    category: str(formData, "category") || "vapes",
    badgeLabel: str(formData, "badgeLabel") || null,
    badgeTone: str(formData, "badgeTone") || null,
    stock: num(formData, "stock"),
    active: bool(formData, "active"),
  };

  if (id) await db.update(products).set(values).where(eq(products.id, id));
  else await db.insert(products).values({ id: uid(), ...values });

  revalidatePath("/admin/produits");
  revalidatePath("/app/shop");
}

export async function deleteProduct(formData: FormData) {
  await requireRole("admin");
  await db.update(products).set({ active: false }).where(eq(products.id, str(formData, "id")));
  revalidatePath("/admin/produits");
  revalidatePath("/app/shop");
}

export async function savePack(formData: FormData) {
  await requireRole("admin");
  const id = str(formData, "id");
  const values = {
    tokens: num(formData, "tokens"),
    price: num(formData, "price"),
    bonus: num(formData, "bonus"),
    hint: str(formData, "hint"),
    badge: str(formData, "badge") || null,
    sort: num(formData, "sort"),
    active: bool(formData, "active"),
  };

  if (id) await db.update(packs).set(values).where(eq(packs.id, id));
  else await db.insert(packs).values({ id: uid(), ...values });

  revalidatePath("/admin/packs");
  revalidatePath("/app/recharge");
}

export async function deletePack(formData: FormData) {
  await requireRole("admin");
  await db.update(packs).set({ active: false }).where(eq(packs.id, str(formData, "id")));
  revalidatePath("/admin/packs");
}

export async function saveEvent(formData: FormData) {
  await requireRole("admin");
  const id = str(formData, "id");
  const values = {
    slug: str(formData, "slug") || str(formData, "title").toLowerCase().replace(/\s+/g, "-"),
    title: str(formData, "title"),
    subtitle: str(formData, "subtitle"),
    day: str(formData, "day"),
    hours: str(formData, "hours"),
    checkin: str(formData, "checkin"),
    venueId: str(formData, "venueId") || null,
    address: str(formData, "address"),
    price: num(formData, "price"),
    image: str(formData, "image") || "/img/crowd-lights.jpg",
    capacity: num(formData, "capacity"),
    description: str(formData, "description"),
    tags: str(formData, "tags"),
    active: bool(formData, "active"),
  };

  if (id) await db.update(events).set(values).where(eq(events.id, id));
  else await db.insert(events).values({ id: uid(), ...values, attendees: 0 });

  revalidatePath("/admin/evenements");
  revalidatePath("/app/events");
  revalidatePath("/");
}

export async function deleteEvent(formData: FormData) {
  await requireRole("admin");
  await db.update(events).set({ active: false }).where(eq(events.id, str(formData, "id")));
  revalidatePath("/admin/evenements");
  revalidatePath("/app/events");
  revalidatePath("/");
}

export async function setUserRole(formData: FormData) {
  await requireRole("admin");
  const role = str(formData, "role");
  const venueId = str(formData, "venueId") || null;
  await db
    .update(users)
    .set({ role, venueId: role === "manager" ? venueId : null })
    .where(eq(users.id, str(formData, "id")));
  revalidatePath("/admin/utilisateurs");
}

export async function setOrderStatus(formData: FormData) {
  await requireRole("admin", "manager");
  await db
    .update(orders)
    .set({ status: str(formData, "status") })
    .where(eq(orders.id, str(formData, "id")));
  revalidatePath("/admin/commandes");
  revalidatePath("/app/commandes");
}
