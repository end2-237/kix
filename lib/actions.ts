"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, inArray, lt, ne, or, sql } from "drizzle-orm";
import type { Match, User } from "@/db";
import {
  db,
  courses,
  enrollments,
  crewMembers,
  crews,
  events,
  friendships,
  invitations,
  notifications,
  matchEvents,
  matchOfficials,
  matches,
  memberPlans,
  memberships,
  orderItems,
  orders,
  packs,
  payouts,
  products,
  purchases,
  reservations,
  scans,
  screens,
  streamPasses,
  streams,
  tickets,
  tokens,
  tournaments,
  tournamentMatches,
  tournamentPlayers,
  users,
  venues,
  venueTables,
} from "@/db";
import { COMMISSION_RATE, POINTS_PER_FREE_TOKEN, XP_PER_TOKEN } from "@/lib/constants";
import { freshCode, freshUserCode, notify, uid } from "@/lib/domain";
import { INVITE_TTL, looksLikePass, passUrl, signPass, verifyPass } from "@/lib/pass";
import { qrShape, type QrShape } from "@/lib/qr";
import { canScore, getMatch } from "@/lib/live";
import {
  canWatch,
  hlsUrl,
  newStreamKey,
  newStreamPath,
  watchTicket,
  whepUrl,
} from "@/lib/stream";
import { refreshPayment, startPayment, type PaymentKind } from "@/lib/payments/service";
import { DISCIPLINES as DISCIPLINES_LABELS } from "@/lib/tournois";
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
  await db.insert(users).values({
    id,
    name,
    code: await freshUserCode(),
    phone,
    passwordHash: await hashPassword(password),
    role: "client",
  });
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

export type StartResult =
  | { ok: true; reference: string; instruction?: string; amount: number }
  | { ok: false; error: string };

/**
 * Recharge du Master Pass. La ligne d'achat est créée en attente et rien n'est
 * crédité ici : les jetons n'apparaissent qu'à la confirmation de l'opérateur
 * (webhook PowerPay, ou interrogation depuis l'app).
 */
export async function startPackPurchase(
  packId: string,
  venueId: string,
  method: "om" | "momo",
  phone: string,
): Promise<StartResult> {
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
    status: "pending",
  });

  const started = await startPayment({
    kind: "pack",
    userId: user.id,
    amount: pack.price,
    method,
    phone,
    description: `Recharge ${credited} jetons`,
    targetId: purchaseId,
  });

  if (!started.ok) return started;

  await db.update(purchases).set({ reference: started.reference }).where(eq(purchases.id, purchaseId));
  return { ok: true, reference: started.reference, instruction: started.instruction, amount: pack.price };
}

export type PaymentState = {
  status: "pending" | "paid" | "failed" | "expired";
  failureReason: string | null;
  kind: PaymentKind;
  targetId: string | null;
};

/**
 * Interrogé par l'écran d'attente toutes les deux secondes. Le webhook reste la
 * source d'autorité ; ceci couvre le cas où il se perd ou arrive en retard.
 */
export async function pollPayment(reference: string): Promise<PaymentState | null> {
  const user = await requireUser();
  const payment = await refreshPayment(reference, user.id);
  if (!payment) return null;

  if (payment.status === "paid") {
    revalidatePath("/app");
    revalidatePath("/app/pass");
    revalidatePath("/app/commandes");
    revalidatePath("/app/billets");
    revalidatePath("/app/reservations");
    revalidatePath("/app/notifications");
    revalidatePath("/admin/commandes");
    revalidatePath("/gerant/salle");
  }

  return {
    status: payment.status,
    failureReason: payment.failureReason,
    kind: payment.kind,
    targetId: payment.targetId,
  };
}

export type ScanResult =
  | { ok: true; kind: "token"; client: string; venue: string; remaining: number; table: number | null }
  | { ok: true; kind: "ticket"; client: string; event: string }
  | { ok: false; error: string };

/**
 * Débit d'un jeton (ou validation d'un billet) depuis Master Scan.
 *
 * Deux entrées possibles : le laissez-passer signé du QR, qui expire au bout de
 * 90 secondes, ou le code à quatre chiffres tapé à la main quand le réseau du
 * client lâche. Dans les deux cas on finit sur le même code, et c'est le
 * passage du jeton en « utilisé » qui empêche de le rejouer.
 */
export async function scanCode(raw: string, method: "qr" | "code" = "code"): Promise<ScanResult> {
  const manager = await requireRole("manager", "admin");
  let code = raw.trim();

  if (looksLikePass(code)) {
    const check = verifyPass(code);
    if (!check.ok) {
      return {
        ok: false,
        error:
          check.reason === "expired"
            ? "QR périmé — demande au client de rafraîchir son Master Pass"
            : "QR invalide — ce n'est pas un Master Pass",
      };
    }
    code = check.claims.c;
    method = "qr";
  }

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
      // Ce que le client a réellement payé pour CE jeton, figé à l'achat. Le
      // tarif de la salle ne sert plus que de repli pour les jetons d'avant
      // cette colonne — et pour ceux offerts à la main, qui n'ont pas de prix.
      amount: token.unitPrice ?? venue?.tokenPrice ?? 0,
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

/**
 * Renouvelle les laissez-passer du Master Pass. L'écran appelle cette action à
 * chaque fin de cycle : le QR affiché n'est jamais valable plus de 90 secondes.
 */
export async function rotatePass(): Promise<{ id: string; code: string; shape: QrShape }[]> {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(tokens)
    .where(and(eq(tokens.userId, user.id), eq(tokens.status, "active")))
    .orderBy(tokens.createdAt);

  return rows.map((token) => ({
    id: token.id,
    code: token.code,
    shape: qrShape(passUrl({ k: "token", i: token.id, c: token.code, u: user.id })),
  }));
}

/* ---------------------------------------------------------------- boutique */

export type CheckoutItem = { slug: string; qty: number };
export type CheckoutResult =
  | { ok: true; reference: string; orderId: string; total: number; instruction?: string }
  | { ok: false; error: string };

/** La commande naît en attente ; le stock n'est décompté qu'au paiement. */
export async function checkout(
  items: CheckoutItem[],
  fulfillment: "pickup" | "delivery",
  method: "om" | "momo",
  phone: string,
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
      const ligne = product.price * item.qty;
      total += ligne;
      // Le vendeur et la commission sont figés ici, avec le prix : un article
      // repris par un autre vendeur, ou un taux revu l'an prochain, ne doivent
      // pas réécrire ce qu'on doit pour une vente d'aujourd'hui.
      return {
        id: uid(),
        productId: product.id,
        qty: item.qty,
        unitPrice: product.price,
        sellerId: product.sellerId,
        commission: product.sellerId ? Math.round(ligne * COMMISSION_RATE) : ligne,
      };
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
    status: "pending",
  });
  await db.insert(orderItems).values(lines.map((l) => ({ ...l, orderId })));

  const started = await startPayment({
    kind: "order",
    userId: user.id,
    amount: total,
    method,
    phone,
    description: `Commande ${lines.length} article${lines.length > 1 ? "s" : ""}`,
    targetId: orderId,
  });

  if (!started.ok) {
    revalidatePath("/app/commandes");
    return started;
  }

  await db.update(orders).set({ reference: started.reference }).where(eq(orders.id, orderId));
  revalidatePath("/app/commandes");
  return { ok: true, reference: started.reference, orderId, total, instruction: started.instruction };
}

/* ------------------------------------------------------------------ billets */

export type TicketResult =
  | { ok: true; free: true; code: string }
  | { ok: true; free: false; reference: string; instruction?: string; amount: number }
  | { ok: false; error: string };

/** Billet gratuit : émis tout de suite. Billet payant : émis à la confirmation. */
export async function buyTicket(eventId: string, phone?: string, method: "om" | "momo" = "momo"): Promise<TicketResult> {
  const user = await requireUser();
  const event = (await db.select().from(events).where(eq(events.id, eventId)).limit(1))[0];
  if (!event) return { ok: false, error: "Événement introuvable" };
  if (event.attendees >= event.capacity) return { ok: false, error: "Complet" };

  const code = await freshCode();
  const ticketId = uid();

  if (event.price <= 0) {
    await db.insert(tickets).values({ id: ticketId, eventId, userId: user.id, code, status: "valid" });
    await db
      .update(events)
      .set({ attendees: sql`${events.attendees} + 1` })
      .where(eq(events.id, eventId));
    await notify(user.id, `Billet · ${event.title}`, `${event.day} · code ${code}`, "event", "/app/billets");

    revalidatePath(`/app/events/${event.slug}`);
    revalidatePath("/app/billets");
    return { ok: true, free: true, code };
  }

  if (!phone) return { ok: false, error: "Numéro Mobile Money requis" };

  await db.insert(tickets).values({ id: ticketId, eventId, userId: user.id, code, status: "pending" });

  const started = await startPayment({
    kind: "ticket",
    userId: user.id,
    amount: event.price,
    method,
    phone,
    description: `Billet ${event.title}`,
    targetId: ticketId,
  });

  if (!started.ok) return started;

  await db.update(tickets).set({ reference: started.reference }).where(eq(tickets.id, ticketId));
  return { ok: true, free: false, reference: started.reference, instruction: started.instruction, amount: event.price };
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

/** Un `<input type="datetime-local">` vide vaut `null`, pas « 1970 ». */
const date = (fd: FormData, key: string) => {
  const brut = String(fd.get(key) ?? "").trim();
  if (!brut) return null;
  const d = new Date(brut);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Une adresse lisible : accents ôtés, espaces en tirets, rien d'autre. */
const slugify = (texte: string) =>
  texte
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

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
  // Un vendeur tient ses articles ; l'administrateur tient ceux de la maison
  // et peut corriger n'importe lesquels.
  const auteur = await requireRole("admin", "seller");
  const id = str(formData, "id");

  if (auteur.role === "seller" && id) {
    const actuel = (await db.select().from(products).where(eq(products.id, id)).limit(1))[0];
    if (!actuel || actuel.sellerId !== auteur.id) redirect("/vendeur?refus=1");
  }

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

  // Le vendeur ne se choisit pas dans un formulaire : à la création, c'est
  // l'auteur ; à la modification, on n'y touche pas — un article ne change
  // pas de mains par un champ caché.
  if (id) await db.update(products).set(values).where(eq(products.id, id));
  else {
    await db.insert(products).values({
      id: uid(),
      ...values,
      sellerId: auteur.role === "seller" ? auteur.id : null,
    });
  }

  revalidatePath("/vendeur");
  revalidatePath("/admin/produits");
  revalidatePath("/app/shop");
}

export async function deleteProduct(formData: FormData) {
  const auteur = await requireRole("admin", "seller");
  const id = str(formData, "id");

  // Retirer un article le masque plutôt que de le supprimer : des commandes
  // passées y renvoient, et une ligne de vente sans produit est une ligne
  // qu'on ne sait plus expliquer.
  const ou =
    auteur.role === "seller"
      ? and(eq(products.id, id), eq(products.sellerId, auteur.id))
      : eq(products.id, id);

  await db.update(products).set({ active: false }).where(ou);
  revalidatePath("/vendeur");
  revalidatePath("/admin/produits");
  revalidatePath("/app/shop");
}

export async function savePack(formData: FormData) {
  await requireRole("admin");
  const id = str(formData, "id");
  const { JETONS_MIN_PACK } = await import("@/lib/tokens");
  const values = {
    // On ne vend que des packs : en dessous de trois jetons, il n'y a pas de
    // pack, il y a une partie à l'unité — et le modèle n'en veut pas.
    tokens: Math.max(JETONS_MIN_PACK, num(formData, "tokens")),
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
  // Un gérant tient l'agenda de sa salle : c'est lui qui sait quel soir la
  // finale se joue. Il n'écrit que chez lui — la salle est imposée plus bas,
  // et une modification ne prend que si l'événement est déjà le sien.
  const auteur = await requireRole("admin", "manager");
  const id = str(formData, "id");

  if (auteur.role === "manager") {
    if (!auteur.venueId) redirect("/gerant?refus=1");
    if (id) {
      const actuel = (await db.select().from(events).where(eq(events.id, id)).limit(1))[0];
      if (!actuel || actuel.venueId !== auteur.venueId) redirect("/gerant/evenements?refus=1");
    }
  }

  const values = {
    slug: str(formData, "slug") || str(formData, "title").toLowerCase().replace(/\s+/g, "-"),
    title: str(formData, "title"),
    subtitle: str(formData, "subtitle"),
    day: str(formData, "day"),
    hours: str(formData, "hours"),
    checkin: str(formData, "checkin"),
    // Un gérant ne choisit pas la salle : c'est la sienne.
    venueId: auteur.role === "manager" ? auteur.venueId : str(formData, "venueId") || null,
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
  revalidatePath("/gerant/evenements");
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

/* ----------------------------------------------------------------- Venue OS */

/**
 * Réservations qui mordent sur [début, fin[ et tiennent encore la table.
 *
 * La borne de fin se calcule en SQL (`starts_at + minutes`). Les dates sont
 * passées en ISO avec un cast explicite : dans un fragment brut, une `Date` JS
 * part telle quelle et Postgres refuse « Mon Sep 21 2026 … ».
 */
function overlaps(startsAt: Date, endsAt: Date) {
  return and(
    inArray(reservations.status, ["confirmed", "seated"]),
    lt(reservations.startsAt, endsAt),
    sql`${reservations.startsAt} + make_interval(mins => ${reservations.minutes}) > ${startsAt.toISOString()}::timestamptz`,
  );
}

export type ReservationResult =
  | { ok: true; reference: string; instruction?: string; deposit: number }
  | { ok: false; error: string };

/**
 * Retenue d'une table. La réservation naît en attente et la table n'est bloquée
 * qu'une fois l'acompte confirmé : sinon, il suffirait d'ouvrir l'écran de
 * paiement pour geler la salle un soir de match.
 */
export async function reserveTable(
  tableId: string,
  startsAtIso: string,
  minutes: number,
  players: number,
  phone: string,
  method: "om" | "momo",
  note = "",
): Promise<ReservationResult> {
  const user = await requireUser();

  const table = (await db.select().from(venueTables).where(eq(venueTables.id, tableId)).limit(1))[0];
  if (!table || !table.active) return { ok: false, error: "Table introuvable" };
  if (table.status === "closed") return { ok: false, error: "Cette table est fermée ce soir" };

  const startsAt = new Date(startsAtIso);
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "Créneau invalide" };
  if (startsAt.getTime() < Date.now() - 60_000) return { ok: false, error: "Ce créneau est déjà passé" };
  if (minutes < 30 || minutes > 360) return { ok: false, error: "Durée entre 30 minutes et 6 heures" };

  const endsAt = new Date(startsAt.getTime() + minutes * 60_000);
  const clash = await db
    .select({ id: reservations.id })
    .from(reservations)
    .where(and(eq(reservations.tableId, tableId), overlaps(startsAt, endsAt)))
    .limit(1);
  if (clash[0]) return { ok: false, error: "Ce créneau vient d'être pris" };

  const id = uid();
  await db.insert(reservations).values({
    id,
    venueId: table.venueId,
    tableId,
    userId: user.id,
    startsAt,
    minutes,
    players,
    deposit: table.deposit,
    note: note.slice(0, 200),
    status: "pending",
  });

  const started = await startPayment({
    kind: "reservation",
    userId: user.id,
    amount: table.deposit,
    method,
    phone,
    description: `Table ${table.label}`,
    targetId: id,
  });
  if (!started.ok) return started;

  await db.update(reservations).set({ reference: started.reference }).where(eq(reservations.id, id));
  revalidatePath("/app/reservations");
  return { ok: true, reference: started.reference, instruction: started.instruction, deposit: table.deposit };
}

/** Annulation par le joueur. L'acompte reste acquis à la salle, comme annoncé. */
export async function cancelReservation(id: string) {
  const user = await requireUser();
  const booking = (await db.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0];
  if (!booking || booking.userId !== user.id) return;
  if (!["pending", "confirmed"].includes(booking.status)) return;

  await db.update(reservations).set({ status: "cancelled" }).where(eq(reservations.id, id));
  if (booking.tableId) {
    await db.update(venueTables).set({ status: "free" }).where(eq(venueTables.id, booking.tableId));
  }
  revalidatePath("/app/reservations");
  revalidatePath("/gerant/salle");
}

/* ------------------------------------------------------- Venue OS · comptoir */

async function guardVenue(venueId: string) {
  const manager = await requireRole("manager", "admin");
  if (manager.role === "manager" && manager.venueId !== venueId) redirect("/gerant?refus=1");
  return manager;
}

/** Le client est arrivé : la table passe en service. */
export async function seatReservation(id: string) {
  const booking = (await db.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0];
  if (!booking) return;
  await guardVenue(booking.venueId);

  await db
    .update(reservations)
    .set({ status: "seated", seatedAt: new Date() })
    .where(eq(reservations.id, id));

  const table = booking.tableId
    ? (await db.select().from(venueTables).where(eq(venueTables.id, booking.tableId)).limit(1))[0]
    : null;
  if (table) {
    await db.update(venueTables).set({ status: "occupied" }).where(eq(venueTables.id, table.id));
  }

  await notify(
    booking.userId,
    "Bonne partie",
    `${table ? `Table ${table.label}` : "Ta table"} est installée — l'acompte est déduit de ta note.`,
    "reservation",
    "/app/reservations",
  );

  revalidatePath("/gerant/salle");
  revalidatePath("/app/reservations");
}

/** Fin de partie : la table se libère. */
export async function closeReservation(id: string, outcome: "done" | "no_show" = "done") {
  const booking = (await db.select().from(reservations).where(eq(reservations.id, id)).limit(1))[0];
  if (!booking) return;
  await guardVenue(booking.venueId);

  await db
    .update(reservations)
    .set({ status: outcome, closedAt: new Date() })
    .where(eq(reservations.id, id));
  if (booking.tableId) {
    await db.update(venueTables).set({ status: "free" }).where(eq(venueTables.id, booking.tableId));
  }

  revalidatePath("/gerant/salle");
  revalidatePath("/gerant/service");
  revalidatePath("/app/reservations");
}

/** Ouverture, fermeture ou occupation directe d'une table depuis le comptoir. */
export async function setTableStatus(tableId: string, status: "free" | "occupied" | "closed") {
  const table = (await db.select().from(venueTables).where(eq(venueTables.id, tableId)).limit(1))[0];
  if (!table) return;
  await guardVenue(table.venueId);

  await db.update(venueTables).set({ status }).where(eq(venueTables.id, tableId));

  // `venues.free_tables` reste la valeur lue par l'app et l'accueil web.
  const free = await db
    .select({ n: sql<number>`count(*)` })
    .from(venueTables)
    .where(and(eq(venueTables.venueId, table.venueId), eq(venueTables.status, "free"), eq(venueTables.active, true)));
  await db
    .update(venues)
    .set({ freeTables: Number(free[0]?.n ?? 0) })
    .where(eq(venues.id, table.venueId));

  revalidatePath("/gerant/salle");
  revalidatePath("/app/salles");
}

/* ---------------------------------------------------------- Venue OS · admin */

export async function saveTable(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  const values = {
    venueId: String(formData.get("venueId") ?? ""),
    label: String(formData.get("label") ?? "").trim(),
    kind: String(formData.get("kind") ?? "pool"),
    hourlyRate: Number(formData.get("hourlyRate") ?? 0),
    deposit: Number(formData.get("deposit") ?? 1000),
    seats: Number(formData.get("seats") ?? 4),
    sort: Number(formData.get("sort") ?? 0),
    active: formData.get("active") === "on",
  };
  if (!values.venueId || !values.label) return;

  if (id) await db.update(venueTables).set(values).where(eq(venueTables.id, id));
  else await db.insert(venueTables).values({ id: uid(), ...values });

  revalidatePath("/admin/tables");
  revalidatePath("/gerant/salle");
}

export async function deleteTable(formData: FormData) {
  await requireRole("admin");
  const id = String(formData.get("id") ?? "");
  if (id) await db.update(venueTables).set({ active: false }).where(eq(venueTables.id, id));
  revalidatePath("/admin/tables");
}

/* ------------------------------------------------------ Master Break Live */

const XP_MATCH_WIN = 120;
const XP_MATCH_PLAY = 30;

/**
 * Garde unique de la feuille de match : gérant ou arbitre de la salle, arbitre
 * habilité pour ce match ou son tournoi, joueur quand la salle ouvre
 * l'auto-arbitrage, direction partout. Voir `canScore` dans lib/live.ts.
 */
async function requireScorer(matchId: string): Promise<{ match: Match; by: User } | null> {
  const user = await requireUser();
  const match = (await db.select().from(matches).where(eq(matches.id, matchId)).limit(1))[0];
  if (!match) return null;

  const right = await canScore(user, match);
  if (!right.ok) return null;
  return { match, by: user };
}

/** Numéro d'ordre suivant dans la frise du match. */
async function nextSeq(matchId: string): Promise<number> {
  const row = (
    await db
      .select({ max: sql<number>`coalesce(max(${matchEvents.seq}), 0)` })
      .from(matchEvents)
      .where(eq(matchEvents.matchId, matchId))
  )[0];
  return Number(row?.max ?? 0) + 1;
}

export type MatchResult = { ok: true; id: string } | { ok: false; error: string };

/** Création d'une rencontre depuis la console du gérant. */
export async function createMatch(formData: FormData): Promise<MatchResult> {
  const manager = await requireRole("manager", "admin");
  const venueId = String(formData.get("venueId") ?? manager.venueId ?? "");
  if (!venueId) return { ok: false, error: "Aucune salle" };
  await guardVenue(venueId);

  const playerAId = String(formData.get("playerAId") ?? "");
  const playerBId = String(formData.get("playerBId") ?? "");
  if (!playerAId || !playerBId) return { ok: false, error: "Il faut deux joueurs" };
  if (playerAId === playerBId) return { ok: false, error: "Un joueur ne peut pas s'affronter lui-même" };

  // Une partie sèche est une course à une partie : le mode ne se stocke pas,
  // il se lit dans la cible. Une cible vide ne peut donc pas valoir zéro.
  const seche = String(formData.get("mode") ?? "") === "seche";
  const target = seche ? 1 : Math.min(21, Math.max(1, Number(formData.get("target") ?? 5)));
  const id = uid();

  await db.insert(matches).values({
    id,
    venueId,
    tableId: String(formData.get("tableId") ?? "") || null,
    kind: String(formData.get("kind") ?? "8-ball"),
    target,
    playerAId,
    playerBId,
    turnId: playerAId,
    label: String(formData.get("label") ?? "Amical").slice(0, 60) || "Amical",
    status: "scheduled",
    startsAt: new Date(),
    createdBy: manager.id,
  });

  revalidatePath("/gerant/live");
  revalidatePath("/app/live");
  return { ok: true, id };
}

/** Coup d'envoi. */
export async function startMatch(matchId: string) {
  const scorer = await requireScorer(matchId);
  if (!scorer || scorer.match.status !== "scheduled") return;
  const { match, by } = scorer;

  const now = new Date();
  await db
    .update(matches)
    .set({ status: "live", startedAt: now, updatedAt: now })
    .where(eq(matches.id, matchId));
  await db.insert(matchEvents).values({
    id: uid(),
    matchId,
    byId: by.id,
    kind: "start",
    seq: await nextSeq(matchId),
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    detail: "Coup d'envoi",
  });

  await prevenirLesAmis(match.playerAId, match.playerBId, matchId);

  revalidatePath("/gerant/live");
  revalidatePath("/app/live");
}

/**
 * Les amis des deux joueurs apprennent que la partie commence.
 *
 * C'est tout l'intérêt d'avoir une liste d'amis dans une application de
 * salle : savoir qu'un proche est à la table maintenant, pas le lendemain.
 * Un ami des deux n'est prévenu qu'une fois — deux notifications pour le même
 * match, c'est le genre de détail qui fait couper les notifications.
 */
async function prevenirLesAmis(aId: string, bId: string, matchId: string) {
  const { idsDesAmis } = await import("@/lib/joueurs");
  const [amisA, amisB, gens] = await Promise.all([
    idsDesAmis(aId),
    idsDesAmis(bId),
    db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, [aId, bId])),
  ]);

  const nom = (id: string) => gens.find((g) => g.id === id)?.name ?? "Un joueur";
  const aPrevenir = new Map<string, string>();
  for (const ami of amisA) if (ami !== bId) aPrevenir.set(ami, nom(aId));
  for (const ami of amisB) if (ami !== aId && !aPrevenir.has(ami)) aPrevenir.set(ami, nom(bId));

  for (const [qui, lequel] of aPrevenir) {
    await notify(
      qui,
      `${lequel} joue`,
      `${nom(aId)} contre ${nom(bId)} — la partie vient de commencer.`,
      "system",
      `/app/live/${matchId}`,
    );
  }
}

/**
 * Une manche marquée. C'est le geste central de la console : il met à jour le
 * score, pousse la frise et termine le match dès que la cible est atteinte.
 */
export async function scoreRack(matchId: string, playerId: string, delta: 1 | -1 = 1) {
  const scorer = await requireScorer(matchId);
  if (!scorer || scorer.match.status !== "live") return;
  const { match, by } = scorer;

  const isA = playerId === match.playerAId;
  if (!isA && playerId !== match.playerBId) return;

  const scoreA = Math.max(0, match.scoreA + (isA ? delta : 0));
  const scoreB = Math.max(0, match.scoreB + (isA ? 0 : delta));
  const now = new Date();
  const reached = scoreA >= match.target || scoreB >= match.target;

  await db
    .update(matches)
    .set({
      scoreA,
      scoreB,
      // La main passe à l'adversaire de celui qui vient de marquer.
      turnId: isA ? match.playerBId : match.playerAId,
      updatedAt: now,
    })
    .where(eq(matches.id, matchId));

  await db.insert(matchEvents).values({
    id: uid(),
    matchId,
    playerId,
    byId: by.id,
    kind: delta > 0 ? "rack" : "note",
    seq: await nextSeq(matchId),
    scoreA,
    scoreB,
    detail: delta > 0 ? "Partie remportée" : "Partie retirée",
  });

  if (reached && delta > 0) {
    await finishMatch(matchId, scoreA >= match.target ? match.playerAId : match.playerBId);
    return;
  }

  revalidatePath(`/app/live/${matchId}`);
  revalidatePath("/gerant/live");
  revalidatePath("/app/live");
}

/** Faute, casse gagnante, sécurité, empochage : la matière des statistiques. */
export async function logMatchEvent(matchId: string, playerId: string, kind: string, detail = "") {
  const scorer = await requireScorer(matchId);
  if (!scorer || scorer.match.status !== "live") return;
  const { match, by } = scorer;
  if (!["foul", "break", "safety", "pot", "note"].includes(kind)) return;
  if (playerId !== match.playerAId && playerId !== match.playerBId) return;

  await db.insert(matchEvents).values({
    id: uid(),
    matchId,
    playerId,
    byId: by.id,
    kind,
    seq: await nextSeq(matchId),
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    detail: detail.slice(0, 120),
  });

  // La main change sur une faute ou une sécurité.
  const passes = kind === "foul" || kind === "safety";
  await db
    .update(matches)
    .set({
      updatedAt: new Date(),
      ...(passes ? { turnId: playerId === match.playerAId ? match.playerBId : match.playerAId } : {}),
    })
    .where(eq(matches.id, matchId));

  revalidatePath(`/app/live/${matchId}`);
  revalidatePath("/gerant/live");
}

/** Fin de match : vainqueur, points Master et notifications aux deux joueurs. */
export async function finishMatch(matchId: string, winnerId?: string) {
  const scorer = await requireScorer(matchId);
  if (!scorer || scorer.match.status === "done") return;
  const { match, by } = scorer;

  const winner =
    winnerId ?? (match.scoreA === match.scoreB ? null : match.scoreA > match.scoreB ? match.playerAId : match.playerBId);
  const now = new Date();

  await db
    .update(matches)
    .set({ status: "done", winnerId: winner, endedAt: now, updatedAt: now, turnId: null })
    .where(eq(matches.id, matchId));

  await db.insert(matchEvents).values({
    id: uid(),
    matchId,
    byId: by.id,
    kind: "end",
    seq: await nextSeq(matchId),
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    detail: "Fin de match",
  });

  for (const playerId of [match.playerAId, match.playerBId]) {
    const won = playerId === winner;
    await db
      .update(users)
      .set({ points: sql`${users.points} + ${won ? XP_MATCH_WIN : XP_MATCH_PLAY}` })
      .where(eq(users.id, playerId));
    await notify(
      playerId,
      won ? "Match gagné" : "Match terminé",
      `${match.scoreA} – ${match.scoreB} · +${won ? XP_MATCH_WIN : XP_MATCH_PLAY} points Master`,
      "match",
      `/app/live/${matchId}`,
    );
  }

  revalidatePath(`/app/live/${matchId}`);
  revalidatePath("/gerant/live");
  revalidatePath("/app/live");
  revalidatePath("/app/rewards");
}

export async function cancelMatch(matchId: string) {
  const scorer = await requireScorer(matchId);
  if (!scorer || scorer.match.status === "done") return;
  const { match } = scorer;

  await db
    .update(matches)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(matches.id, match.id));

  revalidatePath("/gerant/live");
  revalidatePath("/app/live");
}

/* -------------------------------------------------- Arbitrage : qui marque */

/**
 * Habilite quelqu'un à tenir la feuille : sur un match précis, ou sur tout un
 * tournoi. Réservé au gérant de la salle et à la direction.
 */
export async function assignOfficial(matchId: string, userId: string, scope: "match" | "event" = "match") {
  const match = (await db.select().from(matches).where(eq(matches.id, matchId)).limit(1))[0];
  if (!match) return;
  await guardVenue(match.venueId);
  const by = await requireRole("manager", "admin");

  if (scope === "event" && !match.eventId) return;

  const already = (
    await db
      .select({ id: matchOfficials.id })
      .from(matchOfficials)
      .where(
        and(
          eq(matchOfficials.userId, userId),
          scope === "event" ? eq(matchOfficials.eventId, match.eventId!) : eq(matchOfficials.matchId, matchId),
        ),
      )
      .limit(1)
  )[0];
  if (already) return;

  await db.insert(matchOfficials).values({
    id: uid(),
    matchId: scope === "match" ? matchId : null,
    eventId: scope === "event" ? match.eventId : null,
    userId,
    role: "referee",
    createdBy: by.id,
  });

  await notify(
    userId,
    "Feuille de match confiée",
    scope === "event" ? "Tu arbitres ce tournoi." : "Tu arbitres cette rencontre.",
    "match",
    `/arbitre/${matchId}`,
  );

  revalidatePath(`/gerant/live`);
  revalidatePath(`/arbitre/${matchId}`);
}

export async function removeOfficial(officialId: string) {
  const row = (await db.select().from(matchOfficials).where(eq(matchOfficials.id, officialId)).limit(1))[0];
  if (!row) return;

  const match = row.matchId
    ? (await db.select().from(matches).where(eq(matches.id, row.matchId)).limit(1))[0]
    : (await db.select().from(matches).where(eq(matches.eventId, row.eventId!)).limit(1))[0];
  if (!match) return;

  await guardVenue(match.venueId);
  await db.delete(matchOfficials).where(eq(matchOfficials.id, officialId));
  revalidatePath("/gerant/live");
}

/**
 * Invitation d'arbitrage : un lien signé, valable deux heures, que le gérant
 * envoie à un bénévole. Le lien n'est pas une autorisation en soi — il inscrit
 * celui qui l'ouvre comme arbitre, ce qui laisse une trace révocable, au lieu
 * d'un droit anonyme qui circulerait de téléphone en téléphone.
 */
export async function createScoringInvite(matchId: string, scope: "match" | "event" = "match"): Promise<string> {
  const match = (await db.select().from(matches).where(eq(matches.id, matchId)).limit(1))[0];
  if (!match) return "";
  await guardVenue(match.venueId);

  return signPass(
    { k: "score", i: matchId, c: scope, u: match.venueId },
    INVITE_TTL,
  );
}

export type InviteCheck =
  | { ok: true; matchId: string; scope: "match" | "event"; a: string; b: string; venue: string; label: string }
  | { ok: false; error: string };

/**
 * Lecture seule : ce que vaut une invitation, sans rien inscrire. La page peut
 * donc l'appeler pendant son rendu — accepter reste un geste explicite.
 */
export async function inspectScoringInvite(token: string): Promise<InviteCheck> {
  const check = verifyPass(token);
  if (!check.ok) {
    return {
      ok: false,
      error: check.reason === "expired" ? "Cette invitation a expiré." : "Invitation invalide.",
    };
  }
  if (check.claims.k !== "score") return { ok: false, error: "Invitation invalide." };

  const card = await getMatch(check.claims.i);
  if (!card) return { ok: false, error: "Match introuvable." };
  if (card.match.status === "done") return { ok: false, error: "Ce match est déjà terminé." };

  return {
    ok: true,
    matchId: card.match.id,
    scope: check.claims.c === "event" && card.match.eventId ? "event" : "match",
    a: card.a.name,
    b: card.b.name,
    venue: card.venue.name,
    label: card.match.label,
  };
}

export type InviteResult = { ok: true; matchId: string } | { ok: false; error: string };

/**
 * Acceptation de l'invitation : c'est ici qu'on inscrit l'arbitre. Appelée
 * depuis un formulaire, jamais pendant un rendu — une mutation ne doit pas
 * partir d'un simple chargement de page, ne serait-ce que pour qu'un
 * préchargement de lien n'enrôle personne au passage.
 */
export async function acceptScoringInvite(token: string): Promise<InviteResult> {
  const user = await requireUser();
  const check = verifyPass(token);
  if (!check.ok) {
    return {
      ok: false,
      error: check.reason === "expired" ? "Cette invitation a expiré." : "Invitation invalide.",
    };
  }
  if (check.claims.k !== "score") return { ok: false, error: "Invitation invalide." };

  const matchId = check.claims.i;
  const match = (await db.select().from(matches).where(eq(matches.id, matchId)).limit(1))[0];
  if (!match) return { ok: false, error: "Match introuvable." };
  if (match.status === "done") return { ok: false, error: "Ce match est déjà terminé." };

  const scope = check.claims.c === "event" && match.eventId ? "event" : "match";
  const already = (
    await db
      .select({ id: matchOfficials.id })
      .from(matchOfficials)
      .where(
        and(
          eq(matchOfficials.userId, user.id),
          scope === "event" ? eq(matchOfficials.eventId, match.eventId!) : eq(matchOfficials.matchId, matchId),
        ),
      )
      .limit(1)
  )[0];

  if (!already) {
    await db.insert(matchOfficials).values({
      id: uid(),
      matchId: scope === "match" ? matchId : null,
      eventId: scope === "event" ? match.eventId : null,
      userId: user.id,
      role: "referee",
      createdBy: match.createdBy,
    });
  }

  revalidatePath("/arbitre");
  return { ok: true, matchId };
}

/** La salle ouvre ou ferme l'auto-arbitrage par les joueurs. */
export async function setSelfScoring(venueId: string, allowed: boolean) {
  await guardVenue(venueId);
  await db.update(venues).set({ selfScoring: allowed }).where(eq(venues.id, venueId));
  revalidatePath("/gerant/live");
}

/* --------------------------------------------- Master Break Live · la vidéo */

export type StreamCreated = { ok: true; id: string } | { ok: false; error: string };

/** Ouvre un direct : chemin public, clé d'ingestion, niveau et accès. */
export async function createStream(formData: FormData): Promise<StreamCreated> {
  const manager = await requireRole("manager", "admin");
  const venueId = String(formData.get("venueId") ?? manager.venueId ?? "");
  if (!venueId) return { ok: false, error: "Aucune salle" };
  await guardVenue(venueId);

  const venue = (await db.select().from(venues).where(eq(venues.id, venueId)).limit(1))[0];
  if (!venue) return { ok: false, error: "Salle introuvable" };

  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 3) return { ok: false, error: "Donne un titre au direct" };

  const level = String(formData.get("level") ?? "phone");
  const access = String(formData.get("access") ?? "free");
  const price = access === "ppv" ? Math.max(100, Number(formData.get("price") ?? 500)) : 0;
  if (access === "ppv" && !price) return { ok: false, error: "Prix du billet vidéo manquant" };

  const id = uid();
  await db.insert(streams).values({
    id,
    venueId,
    matchId: String(formData.get("matchId") ?? "") || null,
    title: title.slice(0, 120),
    level,
    access,
    price,
    path: newStreamPath(venue.slug),
    streamKey: newStreamKey(),
    status: "idle",
    createdBy: manager.id,
  });

  revalidatePath("/gerant/direct");
  revalidatePath("/direct");
  return { ok: true, id };
}

/** Régénère la clé : le geste qu'on fait quand une clé a fuité. */
export async function rotateStreamKey(streamId: string) {
  const stream = (await db.select().from(streams).where(eq(streams.id, streamId)).limit(1))[0];
  if (!stream) return;
  await guardVenue(stream.venueId);

  await db
    .update(streams)
    .set({ streamKey: newStreamKey(), updatedAt: new Date() })
    .where(eq(streams.id, streamId));
  revalidatePath("/gerant/direct");
}

/** Arrêt manuel, quand la source n'a pas prévenu. */
export async function endStream(streamId: string) {
  const stream = (await db.select().from(streams).where(eq(streams.id, streamId)).limit(1))[0];
  if (!stream) return;
  await guardVenue(stream.venueId);

  await db
    .update(streams)
    .set({ status: "ended", endedAt: new Date(), viewers: 0, updatedAt: new Date() })
    .where(eq(streams.id, streamId));
  revalidatePath("/gerant/direct");
  revalidatePath("/direct");
}

export async function deleteStream(streamId: string) {
  const stream = (await db.select().from(streams).where(eq(streams.id, streamId)).limit(1))[0];
  if (!stream) return;
  await guardVenue(stream.venueId);
  await db.delete(streams).where(eq(streams.id, streamId));
  revalidatePath("/gerant/direct");
}

export type WatchTicket =
  | { ok: true; hls: string; whep: string; access: string }
  | { ok: false; reason: "members" | "ppv" | "gone"; price: number };

/**
 * Billet de lecture. La page le redemande quand il approche de l'expiration :
 * c'est ce qui permet de couper un direct payant en cours de route.
 */
export async function requestWatchTicket(streamId: string): Promise<WatchTicket> {
  const user = await requireUser();
  const stream = (await db.select().from(streams).where(eq(streams.id, streamId)).limit(1))[0];
  if (!stream) return { ok: false, reason: "gone", price: 0 };

  const access = await canWatch(user, stream);
  if (!access.ok) return { ok: false, reason: access.reason, price: access.price };

  const ticket = watchTicket(stream.id, user.id);
  return { ok: true, hls: hlsUrl(stream, ticket), whep: whepUrl(stream, ticket), access: access.as };
}

export type VideoTicketResult =
  | { ok: true; reference: string; instruction?: string; amount: number }
  | { ok: false; error: string };

/** Achat d'un billet vidéo : même chemin de paiement que le reste. */
export async function buyStreamPass(
  streamId: string,
  phone: string,
  method: "om" | "momo" = "momo",
): Promise<VideoTicketResult> {
  const user = await requireUser();
  const stream = (await db.select().from(streams).where(eq(streams.id, streamId)).limit(1))[0];
  if (!stream) return { ok: false, error: "Direct introuvable" };
  if (stream.access !== "ppv") return { ok: false, error: "Ce direct n'est pas payant" };

  const existing = (
    await db
      .select()
      .from(streamPasses)
      .where(and(eq(streamPasses.streamId, streamId), eq(streamPasses.userId, user.id)))
      .limit(1)
  )[0];
  if (existing?.status === "paid") return { ok: false, error: "Tu as déjà ton billet" };

  const passId = existing?.id ?? uid();
  if (existing) {
    await db.update(streamPasses).set({ status: "pending", amount: stream.price }).where(eq(streamPasses.id, passId));
  } else {
    await db.insert(streamPasses).values({
      id: passId,
      streamId,
      userId: user.id,
      amount: stream.price,
      status: "pending",
    });
  }

  const started = await startPayment({
    kind: "stream",
    userId: user.id,
    amount: stream.price,
    method,
    phone,
    description: "Direct Master Break",
    targetId: passId,
  });
  if (!started.ok) return started;

  await db.update(streamPasses).set({ reference: started.reference }).where(eq(streamPasses.id, passId));
  return { ok: true, reference: started.reference, instruction: started.instruction, amount: stream.price };
}

/* --------------------------------------------------------- écrans de salle */

/**
 * Le gérant adopte un écran.
 *
 * Le code vient d'un QR scanné ou d'une saisie à la main : `codeDepuisQr`
 * accepte les deux, y compris l'URL entière que porte le QR.
 */
export async function adoptScreen(_prev: unknown, formData: FormData) {
  const manager = await requireRole("manager", "admin");
  if (!manager.venueId) return { ok: false as const, error: "Aucune salle rattachée à ce compte." };

  const { adopterEcran, codeDepuisQr } = await import("@/lib/screens");
  const code = codeDepuisQr(str(formData, "code"));
  const nom = str(formData, "name");

  const adopte = await adopterEcran(code, manager.venueId, nom);
  if (!adopte.ok) return { ok: false as const, error: adopte.error };

  revalidatePath("/gerant/ecrans");
  return { ok: true as const, name: adopte.screen.name };
}

/** Ce qu'un écran doit montrer. `streamId` vide le met en veille. */
export async function setScreenStream(screenId: string, streamId: string | null) {
  const manager = await requireRole("manager", "admin");
  if (!manager.venueId) redirect("/gerant?refus=1");

  // La salle est vérifiée des deux côtés : on ne pilote pas l'écran d'autrui,
  // et on n'y envoie pas le direct d'une autre salle.
  if (streamId) {
    const stream = (await db.select().from(streams).where(eq(streams.id, streamId)).limit(1))[0];
    if (!stream || stream.venueId !== manager.venueId) redirect("/gerant/ecrans?refus=1");
  }

  await db
    .update(screens)
    .set({ streamId })
    .where(and(eq(screens.id, screenId), eq(screens.venueId, manager.venueId)));

  revalidatePath("/gerant/ecrans");
  return { ok: true as const };
}

export async function renameScreen(screenId: string, name: string) {
  const manager = await requireRole("manager", "admin");
  if (!manager.venueId) redirect("/gerant?refus=1");

  await db
    .update(screens)
    .set({ name: name.trim().slice(0, 40) || "Écran" })
    .where(and(eq(screens.id, screenId), eq(screens.venueId, manager.venueId)));

  revalidatePath("/gerant/ecrans");
  return { ok: true as const };
}

/**
 * Retirer un écran.
 *
 * On supprime la ligne plutôt que de la détacher : son jeton meurt avec elle,
 * et un téléviseur revendu ne revient pas dans la salle par surprise. Il
 * redemandera un code s'il est rebranché.
 */
export async function removeScreen(screenId: string) {
  const manager = await requireRole("manager", "admin");
  if (!manager.venueId) redirect("/gerant?refus=1");

  await db.delete(screens).where(and(eq(screens.id, screenId), eq(screens.venueId, manager.venueId)));
  revalidatePath("/gerant/ecrans");
  return { ok: true as const };
}

/* ------------------------------------------------------- cours de billard */

/**
 * S'inscrire à un cours.
 *
 * Le prix est figé sur l'inscription au moment où elle naît : un tarif révisé
 * en cours de trimestre ne doit pas réécrire ce qu'un élève déjà inscrit a
 * payé. Les places sont recomptées à la confirmation du paiement, pas ici —
 * le cours peut se remplir pendant que l'élève valide sur son téléphone.
 */
export async function startEnrollment(
  courseId: string,
  method: "om" | "momo",
  phone: string,
): Promise<StartResult> {
  const user = await requireUser();
  const cours = (await db.select().from(courses).where(eq(courses.id, courseId)).limit(1))[0];
  if (!cours || !cours.active) return { ok: false, error: "Ce cours n'est plus proposé." };

  const deja = (
    await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .where(and(eq(enrollments.courseId, courseId), eq(enrollments.userId, user.id), eq(enrollments.status, "paid")))
      .limit(1)
  )[0];
  if (deja) return { ok: false, error: "Tu es déjà inscrit à ce cours." };

  const pris = (
    await db
      .select({ n: sql<number>`count(*)` })
      .from(enrollments)
      .where(and(eq(enrollments.courseId, courseId), eq(enrollments.status, "paid")))
  )[0];
  if (Number(pris?.n ?? 0) >= cours.capacity) return { ok: false, error: "Ce cours est complet." };

  const id = uid();
  await db.insert(enrollments).values({
    id,
    courseId,
    userId: user.id,
    price: cours.price,
    status: "pending",
  });

  const started = await startPayment({
    kind: "course",
    userId: user.id,
    amount: cours.price,
    method,
    phone,
    description: `Cours ${cours.title}`,
    targetId: id,
  });
  if (!started.ok) return started;

  await db.update(enrollments).set({ reference: started.reference }).where(eq(enrollments.id, id));
  revalidatePath("/app/cours");
  return { ok: true, reference: started.reference, instruction: started.instruction, amount: cours.price };
}

/** Créer ou modifier un cours. Réservé à l'administration et aux coachs. */
export async function saveCourse(formData: FormData) {
  const auteur = await requireRole("admin", "seller");
  const id = str(formData, "id");

  if (auteur.role === "seller" && id) {
    const actuel = (await db.select().from(courses).where(eq(courses.id, id)).limit(1))[0];
    if (!actuel || actuel.coachId !== auteur.id) redirect("/vendeur?refus=1");
  }

  const sessions = Math.max(1, num(formData, "sessions"));
  const values = {
    slug: str(formData, "slug") || str(formData, "title").toLowerCase().replace(/\s+/g, "-"),
    title: str(formData, "title"),
    coachName: str(formData, "coachName") || auteur.name,
    venueId: str(formData, "venueId") || null,
    level: str(formData, "level") || "debutant",
    format: str(formData, "format") || "forfait",
    sessions,
    schedule: str(formData, "schedule"),
    price: num(formData, "price"),
    image: str(formData, "image") || "/img/coach-1.jpg",
    description: str(formData, "description"),
    capacity: Math.max(1, num(formData, "capacity")),
    featured: bool(formData, "featured"),
    active: bool(formData, "active"),
  };

  // Le coach ne se choisit pas dans un formulaire, comme le vendeur d'un
  // article : à la création c'est l'auteur, à la modification on n'y touche pas.
  if (id) await db.update(courses).set(values).where(eq(courses.id, id));
  else {
    await db.insert(courses).values({
      id: uid(),
      ...values,
      coachId: auteur.role === "seller" ? auteur.id : null,
    });
  }

  revalidatePath("/app/cours");
  revalidatePath("/app/shop");
  revalidatePath("/admin/cours");
  revalidatePath("/vendeur/cours");
}

/* --------------------------------------------------------------- tournois */

/**
 * Créer ou modifier un tournoi. Réservé à l'administration et aux gérants.
 *
 * Un tournoi vit en double : le tableau des joueurs d'un côté, un événement
 * jumeau de l'autre. C'est l'événement que le public achète — la billetterie,
 * le scan à l'entrée et la recette existent déjà pour lui, et les refaire pour
 * les tournois aurait fait deux caisses au lieu d'une.
 */
export async function saveTournament(formData: FormData) {
  const auteur = await requireRole("admin", "manager");
  const id = str(formData, "id");
  const venueId = str(formData, "venueId") || auteur.venueId || "";
  if (auteur.role === "manager") {
    if (!auteur.venueId) redirect("/gerant?refus=1");
    if (venueId !== auteur.venueId) redirect("/gerant?refus=1");
    if (id) {
      const actuel = (await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1))[0];
      if (!actuel || actuel.venueId !== auteur.venueId) redirect("/gerant?refus=1");
    }
  }

  const title = str(formData, "title");
  const slug = str(formData, "slug") || slugify(title);
  const startsAt = date(formData, "startsAt");
  const closesAt = date(formData, "closesAt");
  const image = str(formData, "image") || "/img/table-rack.jpg";

  const values = {
    slug,
    title,
    venueId: venueId || null,
    discipline: str(formData, "discipline") || "8-ball",
    format: str(formData, "format") === "poules" ? "poules" : "direct",
    groupSize: Math.min(8, Math.max(3, num(formData, "groupSize") || 4)),
    qualifiers: Math.max(1, num(formData, "qualifiers") || 2),
    size: Math.max(2, num(formData, "size") || 16),
    // Sèche = une partie gagnante. Le tournoi entier suit la même règle, du
    // premier tour à la finale : on ne rallonge pas une sèche en demi-finale.
    raceTo: str(formData, "mode") === "seche" ? 1 : Math.max(2, num(formData, "raceTo") || 4),
    entryFee: Math.max(0, num(formData, "entryFee")),
    prizePool: Math.max(0, num(formData, "prizePool")),
    prizeSplit: str(formData, "prizeSplit"),
    rules: str(formData, "rules"),
    image,
    startsAt,
    closesAt,
  };

  const tournoiId = id || uid();
  if (id) await db.update(tournaments).set(values).where(eq(tournaments.id, id));
  else {
    await db.insert(tournaments).values({
      ...values,
      id: tournoiId,
      organiserId: auteur.id,
      status: "brouillon",
    });
  }

  await syncTwinEvent(tournoiId, formData);

  revalidatePath("/app/tournois");
  revalidatePath(`/app/tournois/${slug}`);
  revalidatePath("/admin/tournois");
  revalidatePath("/gerant/tournois");
  revalidatePath("/app/events");
}

/** Le jumeau côté public : c'est par lui que les spectateurs entrent. */
async function syncTwinEvent(tournamentId: string, formData: FormData) {
  const t = (await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1))[0];
  if (!t) return;

  const prix = Math.max(0, num(formData, "ticketPrice"));
  const places = Math.max(1, num(formData, "ticketCapacity") || 100);
  const jour = t.startsAt
    ? t.startsAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    : "Date à confirmer";
  const heures = str(formData, "hours");

  const commun = {
    title: t.title,
    subtitle: `Tournoi ${DISCIPLINES_LABELS[t.discipline] ?? t.discipline} · ${t.size} joueurs`,
    day: jour,
    hours: heures,
    venueId: t.venueId,
    price: prix,
    image: t.image,
    capacity: places,
    description: t.rules,
    tags: "tournoi",
    // Le public ne doit voir la billetterie qu'une fois le tournoi annoncé :
    // un brouillon ne se vend pas.
    active: t.status !== "brouillon" && t.status !== "annule",
  };

  if (t.eventId) {
    await db.update(events).set(commun).where(eq(events.id, t.eventId));
    return;
  }

  const eventId = uid();
  await db.insert(events).values({ ...commun, id: eventId, slug: `${t.slug}-spectateurs` });
  await db.update(tournaments).set({ eventId }).where(eq(tournaments.id, tournamentId));
}

/** Ouvrir les candidatures, les clore, annuler. */
export async function setTournamentStatus(id: string, status: string) {
  const auteur = await requireRole("admin", "manager");
  const t = (await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1))[0];
  if (!t) return { ok: false as const, error: "Tournoi introuvable." };
  if (auteur.role === "manager" && t.venueId !== auteur.venueId) redirect("/gerant?refus=1");

  const permis = ["brouillon", "inscriptions", "complet", "annule"];
  if (!permis.includes(status)) return { ok: false as const, error: "État impossible depuis ici." };
  if (t.status === "encours" || t.status === "termine") {
    return { ok: false as const, error: "Le tableau est lancé : on ne revient plus aux inscriptions." };
  }

  await db.update(tournaments).set({ status }).where(eq(tournaments.id, id));

  // La billetterie spectateurs suit l'état du tournoi.
  if (t.eventId) {
    await db
      .update(events)
      .set({ active: status !== "brouillon" && status !== "annule" })
      .where(eq(events.id, t.eventId));
  }

  revalidatePath("/app/tournois");
  revalidatePath(`/app/tournois/${t.slug}`);
  revalidatePath("/admin/tournois");
  revalidatePath("/gerant/tournois");
  revalidatePath("/app/events");
  return { ok: true as const };
}

export type CandidatureState = { error: string; ok?: false } | { ok: true; error?: never } | null;

/**
 * Le formulaire du candidat.
 *
 * Un spectateur achète un billet ; un joueur, lui, se présente : surnom porté
 * au tableau, niveau annoncé, numéro auquel on le joint le soir du tirage.
 * La candidature n'est pas une inscription — l'organisateur accepte ou refuse.
 */
export async function postuler(_prev: CandidatureState, formData: FormData): Promise<CandidatureState> {
  const user = await requireUser();
  const tournamentId = str(formData, "tournamentId");
  const t = (await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1))[0];
  if (!t) return { error: "Tournoi introuvable." };
  if (t.status !== "inscriptions") return { error: "Les candidatures ne sont pas ouvertes." };

  const deja = (
    await db
      .select({ id: tournamentPlayers.id, status: tournamentPlayers.status })
      .from(tournamentPlayers)
      .where(and(eq(tournamentPlayers.tournamentId, tournamentId), eq(tournamentPlayers.userId, user.id)))
      .limit(1)
  )[0];
  if (deja && deja.status !== "retire") return { error: "Ta candidature est déjà déposée." };

  const nickname = str(formData, "nickname").slice(0, 40);
  // Le champ est prérempli au format lisible — « 6 77 45 12 08 ». On le remet
  // en chiffres AVANT de le valider, sinon le formulaire refuse son propre
  // contenu par défaut.
  const phone = normalizePhone(str(formData, "phone") || user.phone);
  if (!isValidPhone(phone)) return { error: "Numéro invalide : 9 chiffres, commençant par 6." };

  const level = str(formData, "level") || "intermediaire";
  const note = str(formData, "note").slice(0, 400);

  // Le droit d'inscription est figé ici : une dotation revue plus tard ne
  // rattrape pas ceux qui se sont engagés au tarif annoncé.
  const champs = {
    nickname: nickname || user.name,
    phone,
    level,
    note,
    fee: t.entryFee,
    status: "candidat",
    payment: "impaye",
  };

  if (deja) await db.update(tournamentPlayers).set(champs).where(eq(tournamentPlayers.id, deja.id));
  else {
    await db.insert(tournamentPlayers).values({ ...champs, id: uid(), tournamentId, userId: user.id });
  }

  if (t.organiserId) {
    await notify(
      t.organiserId,
      `Candidature · ${t.title}`,
      `${champs.nickname} se présente au tableau.`,
      "event",
      "/gerant/tournois",
    );
  }

  revalidatePath(`/app/tournois/${t.slug}`);
  revalidatePath("/gerant/tournois");
  revalidatePath("/admin/tournois");
  return { ok: true };
}

/** Le joueur se retire — tant que le tableau n'est pas tiré. */
export async function retirerCandidature(tournamentId: string) {
  const user = await requireUser();
  const t = (await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1))[0];
  if (!t) return { ok: false as const, error: "Tournoi introuvable." };
  if (t.status === "encours" || t.status === "termine") {
    return { ok: false as const, error: "Le tableau est tiré : on ne se retire plus." };
  }

  await db
    .update(tournamentPlayers)
    .set({ status: "retire" })
    .where(and(eq(tournamentPlayers.tournamentId, tournamentId), eq(tournamentPlayers.userId, user.id)));

  revalidatePath(`/app/tournois/${t.slug}`);
  revalidatePath("/gerant/tournois");
  return { ok: true as const };
}

/** L'organisateur retient ou écarte un candidat. */
export async function deciderCandidat(playerId: string, decision: "accepte" | "refuse") {
  const auteur = await requireRole("admin", "manager");
  const ligne = (
    await db.select().from(tournamentPlayers).where(eq(tournamentPlayers.id, playerId)).limit(1)
  )[0];
  if (!ligne) return { ok: false as const, error: "Candidature introuvable." };

  const t = (await db.select().from(tournaments).where(eq(tournaments.id, ligne.tournamentId)).limit(1))[0];
  if (!t) return { ok: false as const, error: "Tournoi introuvable." };
  if (auteur.role === "manager" && t.venueId !== auteur.venueId) redirect("/gerant?refus=1");
  if (t.status === "encours" || t.status === "termine") {
    return { ok: false as const, error: "Le tableau est tiré : la liste est close." };
  }

  await db.update(tournamentPlayers).set({ status: decision }).where(eq(tournamentPlayers.id, playerId));

  await notify(
    ligne.userId,
    decision === "accepte" ? `Retenu · ${t.title}` : `Non retenu · ${t.title}`,
    decision === "accepte"
      ? t.entryFee > 0
        ? `Règle ton droit d'inscription de ${t.entryFee.toLocaleString("fr-FR")} F pour prendre ta place au tableau.`
        : "Ta place au tableau est retenue."
      : "Le tableau est complet pour cette édition. Retente à la prochaine.",
    "event",
    `/app/tournois/${t.slug}`,
  );

  revalidatePath(`/app/tournois/${t.slug}`);
  revalidatePath("/gerant/tournois");
  revalidatePath("/admin/tournois");
  return { ok: true as const };
}

/** Le droit d'inscription, par le même chemin de paiement que le reste. */
export async function payerInscription(
  tournamentId: string,
  method: "om" | "momo",
  phone: string,
): Promise<StartResult> {
  const user = await requireUser();
  const t = (await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1))[0];
  if (!t) return { ok: false, error: "Tournoi introuvable." };

  const ligne = (
    await db
      .select()
      .from(tournamentPlayers)
      .where(and(eq(tournamentPlayers.tournamentId, tournamentId), eq(tournamentPlayers.userId, user.id)))
      .limit(1)
  )[0];
  if (!ligne) return { ok: false, error: "Dépose d'abord ta candidature." };
  if (ligne.status !== "accepte") return { ok: false, error: "L'organisateur n'a pas encore retenu ta candidature." };
  if (ligne.payment === "paye") return { ok: false, error: "Ton inscription est déjà réglée." };
  if (ligne.fee <= 0) return { ok: false, error: "Ce tournoi est gratuit pour les joueurs." };

  const started = await startPayment({
    kind: "tournoi",
    userId: user.id,
    amount: ligne.fee,
    method,
    phone,
    description: `Tournoi ${t.title}`,
    targetId: ligne.id,
  });
  if (!started.ok) return started;

  await db
    .update(tournamentPlayers)
    .set({ reference: started.reference })
    .where(eq(tournamentPlayers.id, ligne.id));
  revalidatePath(`/app/tournois/${t.slug}`);
  return { ok: true, reference: started.reference, instruction: started.instruction, amount: ligne.fee };
}

/** Le tirage : les candidatures deviennent un tableau. */
export async function lancerTableau(tournamentId: string) {
  const auteur = await requireRole("admin", "manager");
  const t = (await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1))[0];
  if (!t) return { ok: false as const, error: "Tournoi introuvable." };
  if (auteur.role === "manager" && t.venueId !== auteur.venueId) redirect("/gerant?refus=1");

  const { tirerLeTableau, tirerLesPoules } = await import("@/lib/tournaments");
  const res =
    t.format === "poules" ? await tirerLesPoules(tournamentId) : await tirerLeTableau(tournamentId);
  if (!res.ok) return res;

  const joueurs = await db
    .select()
    .from(tournamentPlayers)
    .where(and(eq(tournamentPlayers.tournamentId, tournamentId), eq(tournamentPlayers.status, "accepte")));

  for (const j of joueurs) {
    if (j.seed === null) continue;
    const place =
      t.format === "poules" && j.groupe
        ? `Tu es dans la poule ${String.fromCharCode(64 + j.groupe)}, tête de série n°${j.seed}.`
        : `Tu entres en tête de série n°${j.seed}.`;
    await notify(j.userId, `Tirage · ${t.title}`, `${place} Le programme est en ligne.`, "event", `/app/tournois/${t.slug}`);
  }

  revalidatePath(`/app/tournois/${t.slug}`);
  revalidatePath("/gerant/tournois");
  revalidatePath("/admin/tournois");
  return res;
}


/** Les poules jouées, on ouvre le tableau entre les qualifiés. */
export async function ouvrirLeTableauFinal(tournamentId: string) {
  const auteur = await requireRole("admin", "manager");
  const t = (await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1))[0];
  if (!t) return { ok: false as const, error: "Tournoi introuvable." };
  if (auteur.role === "manager" && t.venueId !== auteur.venueId) redirect("/gerant?refus=1");

  const { ouvrirLeTableau } = await import("@/lib/tournaments");
  const res = await ouvrirLeTableau(tournamentId);
  if (!res.ok) return res;

  const qualifies = await db
    .select()
    .from(tournamentMatches)
    .where(and(eq(tournamentMatches.tournamentId, tournamentId), eq(tournamentMatches.stage, "tableau")));

  const ids = [...new Set(qualifies.flatMap((d) => [d.playerAId, d.playerBId]).filter(Boolean))] as string[];
  if (ids.length) {
    const joueurs = await db.select().from(tournamentPlayers).where(inArray(tournamentPlayers.id, ids));
    for (const j of joueurs) {
      await notify(
        j.userId,
        `Qualifié · ${t.title}`,
        "Tu sors de ta poule. Le tableau final est en ligne.",
        "reward",
        `/app/tournois/${t.slug}`,
      );
    }
  }

  revalidatePath(`/app/tournois/${t.slug}`);
  revalidatePath("/gerant/tournois");
  revalidatePath("/admin/tournois");
  return res;
}

/** Le résultat d'un duel, saisi par l'organisateur. */
export async function noterDuel(duelId: string, scoreA: number, scoreB: number) {
  const auteur = await requireRole("admin", "manager");
  const duel = (
    await db.select().from(tournamentMatches).where(eq(tournamentMatches.id, duelId)).limit(1)
  )[0];
  if (!duel) return { ok: false as const, error: "Duel introuvable." };

  const t = (await db.select().from(tournaments).where(eq(tournaments.id, duel.tournamentId)).limit(1))[0];
  if (!t) return { ok: false as const, error: "Tournoi introuvable." };
  if (auteur.role === "manager" && t.venueId !== auteur.venueId) redirect("/gerant?refus=1");

  const { noterResultat, getTournamentById } = await import("@/lib/tournaments");
  const res = await noterResultat(duelId, scoreA, scoreB);
  if (!res.ok) return res;

  // Le tournoi a pu se refermer sur ce résultat : on prévient le champion.
  const apres = await getTournamentById(duel.tournamentId);
  if (apres?.status === "termine" && apres.winnerId) {
    await notify(
      apres.winnerId,
      `Titre · ${apres.title}`,
      "Tu remportes le tournoi. Les points de classement sont crédités.",
      "reward",
      `/app/tournois/${apres.slug}`,
    );
  }

  revalidatePath(`/app/tournois/${t.slug}`);
  revalidatePath("/gerant/tournois");
  revalidatePath("/admin/tournois");
  revalidatePath("/app/classement");
  return res;
}

/* ----------------------------------------------------------- abonnements */

/**
 * Souscrire à l'abonnement Master Break.
 *
 * Le prix et la durée sont figés sur la souscription : un tarif révisé
 * pendant que le client valide sur son téléphone ne doit pas changer ce qu'il
 * a accepté. Rien ne se reconduit tout seul — au Cameroun le paiement mobile
 * se valide à chaque fois, et un abonnement qui se prélève sans qu'on le
 * demande n'y a pas sa place.
 */
export async function souscrire(
  planId: string,
  method: "om" | "momo",
  phone: string,
): Promise<StartResult> {
  const user = await requireUser();
  const plan = (await db.select().from(memberPlans).where(eq(memberPlans.id, planId)).limit(1))[0];
  if (!plan || !plan.active) return { ok: false, error: "Cette formule n'est plus proposée." };

  // Une souscription laissée en attente est reprise plutôt que doublée : le
  // client qui recommence après un échec ne doit pas s'en retrouver deux.
  const encours = (
    await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, user.id), eq(memberships.status, "pending")))
      .orderBy(sql`${memberships.createdAt} desc`)
      .limit(1)
  )[0];

  const id = encours?.id ?? uid();
  const champs = { planId: plan.id, months: plan.months, price: plan.price, status: "pending" };
  if (encours) await db.update(memberships).set(champs).where(eq(memberships.id, id));
  else await db.insert(memberships).values({ id, userId: user.id, ...champs });

  const started = await startPayment({
    kind: "abonnement",
    userId: user.id,
    amount: plan.price,
    method,
    phone,
    description: `Abonnement ${plan.name}`,
    targetId: id,
  });
  if (!started.ok) return started;

  await db.update(memberships).set({ reference: started.reference }).where(eq(memberships.id, id));
  revalidatePath("/app/abonnement");
  return { ok: true, reference: started.reference, instruction: started.instruction, amount: plan.price };
}

/** Créer ou modifier une formule d'abonnement. Administration seule. */
export async function savePlan(formData: FormData) {
  await requireRole("admin");
  const id = str(formData, "id");
  const name = str(formData, "name");

  const values = {
    slug: str(formData, "slug") || slugify(name),
    name,
    months: Math.max(1, num(formData, "months") || 1),
    price: Math.max(0, num(formData, "price")),
    perks: str(formData, "perks"),
    hint: str(formData, "hint"),
    badge: str(formData, "badge") || null,
    sort: num(formData, "sort"),
    active: bool(formData, "active"),
  };

  if (id) await db.update(memberPlans).set(values).where(eq(memberPlans.id, id));
  else await db.insert(memberPlans).values({ id: uid(), ...values });

  revalidatePath("/app/abonnement");
  revalidatePath("/admin/abonnements");
}

/* ---------------------------------------------------------------- amis */

/**
 * Demander quelqu'un en ami.
 *
 * Un seul lien par paire, quel que soit le sens : si l'autre m'a déjà
 * demandé, ma demande vaut acceptation. C'est ce que tout le monde attend, et
 * cela évite deux lignes qui se contredisent.
 */
export async function demanderAmi(autreId: string) {
  const moi = await requireUser();
  if (autreId === moi.id) return { ok: false as const, error: "On ne se demande pas soi-même." };

  const autre = (await db.select().from(users).where(eq(users.id, autreId)).limit(1))[0];
  if (!autre || autre.role !== "client") return { ok: false as const, error: "Joueur introuvable." };

  const existant = (
    await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, moi.id), eq(friendships.addresseeId, autreId)),
          and(eq(friendships.requesterId, autreId), eq(friendships.addresseeId, moi.id)),
        ),
      )
      .limit(1)
  )[0];

  if (existant?.status === "acceptee") return { ok: false as const, error: "Vous êtes déjà amis." };
  if (existant?.status === "bloquee") return { ok: false as const, error: "Demande impossible." };

  // L'autre m'avait demandé : ma demande vaut réponse.
  if (existant && existant.addresseeId === moi.id) {
    await db.update(friendships).set({ status: "acceptee" }).where(eq(friendships.id, existant.id));
    await notify(autreId, `${moi.name} t'a ajouté`, "Vous êtes amis sur Master Break.", "system", "/app/amis");
    revalidatePath("/app/amis");
    revalidatePath(`/app/joueurs/${autreId}`);
    return { ok: true as const, etat: "amis" as const };
  }

  if (existant) {
    await db.update(friendships).set({ status: "attente" }).where(eq(friendships.id, existant.id));
  } else {
    await db.insert(friendships).values({
      id: uid(),
      requesterId: moi.id,
      addresseeId: autreId,
      status: "attente",
    });
  }

  await notify(autreId, "Demande d'ami", `${moi.name} veut t'ajouter.`, "system", "/app/amis");
  revalidatePath("/app/amis");
  revalidatePath(`/app/joueurs/${autreId}`);
  return { ok: true as const, etat: "envoyee" as const };
}

/** Accepter, refuser, ou retirer un lien. */
export async function repondreAmi(lienId: string, reponse: "acceptee" | "refusee" | "retirer") {
  const moi = await requireUser();
  const lien = (await db.select().from(friendships).where(eq(friendships.id, lienId)).limit(1))[0];
  if (!lien) return { ok: false as const, error: "Demande introuvable." };
  if (lien.requesterId !== moi.id && lien.addresseeId !== moi.id) {
    return { ok: false as const, error: "Ce lien ne te concerne pas." };
  }

  // Seul le destinataire accepte : sinon on s'ajouterait soi-même comme ami.
  if (reponse === "acceptee" && lien.addresseeId !== moi.id) {
    return { ok: false as const, error: "À l'autre d'accepter." };
  }

  if (reponse === "retirer") await db.delete(friendships).where(eq(friendships.id, lienId));
  else await db.update(friendships).set({ status: reponse }).where(eq(friendships.id, lienId));

  if (reponse === "acceptee") {
    await notify(
      lien.requesterId,
      `${moi.name} a accepté`,
      "Vous êtes amis : tu sauras quand il joue.",
      "system",
      "/app/amis",
    );
  }

  revalidatePath("/app/amis");
  revalidatePath(`/app/joueurs/${lien.requesterId === moi.id ? lien.addresseeId : lien.requesterId}`);
  return { ok: true as const };
}

/** Chercher un joueur par son nom, pour l'ajouter en ami. */
export async function chercherDesJoueurs(terme: string) {
  const moi = await requireUser();
  const { chercherJoueurs } = await import("@/lib/joueurs");
  return chercherJoueurs(terme, moi.id);
}

/* ------------------------------------------------------------- retraits */

export type RetraitResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Demander un versement.
 *
 * Le montant est vérifié côté serveur contre le solde réellement disponible :
 * un formulaire se bricole, et une demande supérieure à la recette de la
 * salle passerait sinon en caisse. Une demande en attente bloque son montant
 * — sans quoi on la déposerait deux fois avant que l'administration ne
 * regarde.
 */
export async function demanderRetrait(formData: FormData): Promise<RetraitResult> {
  const auteur = await requireRole("admin", "manager", "seller");
  const montant = Math.max(0, num(formData, "amount"));
  const method = str(formData, "method") || "momo";
  const phone = normalizePhone(str(formData, "phone") || auteur.phone);
  const note = str(formData, "note").slice(0, 300);

  if (method === "momo" || method === "om") {
    if (!isValidPhone(phone)) return { ok: false, error: "Numéro invalide : 9 chiffres, commençant par 6." };
  }

  const { RETRAIT_MINIMUM, getRecetteSalle, getSoldeRetirableVendeur } = await import("@/lib/caisse");
  if (montant < RETRAIT_MINIMUM) {
    return { ok: false, error: `Le minimum est de ${RETRAIT_MINIMUM.toLocaleString("fr-FR")} F.` };
  }

  // Un vendeur retire sur son propre solde ; un gérant, sur celui de sa salle.
  const pourSalle = auteur.role !== "seller";
  const venueId = pourSalle ? str(formData, "venueId") || auteur.venueId || "" : "";
  if (pourSalle && !venueId) return { ok: false, error: "Aucune salle rattachée à ce compte." };
  if (pourSalle && auteur.role === "manager" && venueId !== auteur.venueId) redirect("/gerant?refus=1");

  const disponible = pourSalle
    ? (await getRecetteSalle(venueId)).disponible
    : (await getSoldeRetirableVendeur(auteur.id)).disponible;

  if (montant > disponible) {
    return {
      ok: false,
      error: `Tu ne peux retirer que ${disponible.toLocaleString("fr-FR")} F pour l'instant.`,
    };
  }

  const id = uid();
  await db.insert(payouts).values({
    id,
    venueId: pourSalle ? venueId : null,
    userId: auteur.id,
    amount: montant,
    method,
    phone,
    note,
    status: "demande",
  });

  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  for (const a of admins) {
    await notify(
      a.id,
      "Demande de retrait",
      `${auteur.name} demande ${montant.toLocaleString("fr-FR")} F.`,
      "system",
      "/admin/retraits",
    );
  }

  revalidatePath("/gerant/caisse");
  revalidatePath("/vendeur");
  revalidatePath("/admin/retraits");
  return { ok: true, id };
}

/** L'administration verse, ou refuse. */
export async function traiterRetrait(payoutId: string, decision: "paye" | "refuse", reference = "") {
  const admin = await requireRole("admin");
  const ligne = (await db.select().from(payouts).where(eq(payouts.id, payoutId)).limit(1))[0];
  if (!ligne) return { ok: false as const, error: "Demande introuvable." };
  if (ligne.status !== "demande") return { ok: false as const, error: "Cette demande est déjà traitée." };

  await db
    .update(payouts)
    .set({
      status: decision,
      reference: reference.trim().slice(0, 80),
      processedBy: admin.id,
      paidAt: decision === "paye" ? new Date() : null,
    })
    .where(eq(payouts.id, payoutId));

  await notify(
    ligne.userId,
    decision === "paye" ? "Retrait versé" : "Retrait refusé",
    decision === "paye"
      ? `${ligne.amount.toLocaleString("fr-FR")} F envoyés sur ${displayPhoneServeur(ligne.phone)}.${reference ? ` Réf. ${reference.trim()}.` : ""}`
      : "Rapproche-toi de l'administration pour en connaître la raison.",
    decision === "paye" ? "reward" : "system",
    ligne.venueId ? "/gerant/caisse" : "/vendeur",
  );

  revalidatePath("/admin/retraits");
  revalidatePath("/gerant/caisse");
  revalidatePath("/vendeur");
  return { ok: true as const };
}

/** Le numéro tel qu'on l'écrit dans un message : lisible, jamais tronqué. */
const displayPhoneServeur = (brut: string) => {
  const d = normalizePhone(brut);
  return isValidPhone(d) ? `${d[0]} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}` : brut;
};

/* ---------------------------------------------------- groupes de billard */

/** Créer un groupe. Le fondateur en est le chef, et son premier membre. */
export async function creerGroupe(formData: FormData) {
  const moi = await requireUser();
  const name = str(formData, "name").slice(0, 50);
  if (name.length < 2) return { ok: false as const, error: "Donne un nom à ton groupe." };

  // Le nom se répète volontiers — « Les Requins » existe dans trois quartiers.
  // On suffixe l'adresse plutôt que de refuser.
  const base = slugify(name) || "groupe";
  let slug = base;
  for (let i = 2; i < 40; i++) {
    const pris = (await db.select({ id: crews.id }).from(crews).where(eq(crews.slug, slug)).limit(1))[0];
    if (!pris) break;
    slug = `${base}-${i}`;
  }

  const id = uid();
  await db.insert(crews).values({
    id,
    slug,
    name,
    image: str(formData, "image"),
    devise: str(formData, "devise").slice(0, 120),
    ownerId: moi.id,
    venueId: str(formData, "venueId") || null,
  });
  await db.insert(crewMembers).values({ id: uid(), crewId: id, userId: moi.id, role: "chef", status: "membre" });

  revalidatePath("/app/groupes");
  return { ok: true as const, slug };
}

/** Modifier le nom, la photo, la devise ou la salle. Le chef seulement. */
export async function modifierGroupe(formData: FormData) {
  const moi = await requireUser();
  const id = str(formData, "id");
  const groupe = (await db.select().from(crews).where(eq(crews.id, id)).limit(1))[0];
  if (!groupe) return { ok: false as const, error: "Groupe introuvable." };
  if (groupe.ownerId !== moi.id) return { ok: false as const, error: "Seul le chef peut modifier le groupe." };

  await db
    .update(crews)
    .set({
      name: str(formData, "name").slice(0, 50) || groupe.name,
      image: str(formData, "image"),
      devise: str(formData, "devise").slice(0, 120),
      venueId: str(formData, "venueId") || null,
    })
    .where(eq(crews.id, id));

  revalidatePath("/app/groupes");
  revalidatePath(`/app/groupes/${groupe.slug}`);
  return { ok: true as const };
}

/** Rejoindre un groupe, ou le quitter. */
export async function rejoindreGroupe(crewId: string, partir = false) {
  const moi = await requireUser();
  const groupe = (await db.select().from(crews).where(eq(crews.id, crewId)).limit(1))[0];
  if (!groupe) return { ok: false as const, error: "Groupe introuvable." };

  if (partir) {
    if (groupe.ownerId === moi.id) {
      return { ok: false as const, error: "Le chef ne quitte pas son groupe : passe la main d'abord." };
    }
    await db
      .delete(crewMembers)
      .where(and(eq(crewMembers.crewId, crewId), eq(crewMembers.userId, moi.id)));
  } else {
    const deja = (
      await db
        .select()
        .from(crewMembers)
        .where(and(eq(crewMembers.crewId, crewId), eq(crewMembers.userId, moi.id)))
        .limit(1)
    )[0];
    if (deja) await db.update(crewMembers).set({ status: "membre" }).where(eq(crewMembers.id, deja.id));
    else await db.insert(crewMembers).values({ id: uid(), crewId, userId: moi.id, status: "membre" });

    if (groupe.ownerId !== moi.id) {
      await notify(
        groupe.ownerId,
        `${moi.name} rejoint ${groupe.name}`,
        "Un joueur de plus dans la bande.",
        "system",
        `/app/groupes/${groupe.slug}`,
      );
    }
  }

  revalidatePath("/app/groupes");
  revalidatePath(`/app/groupes/${groupe.slug}`);
  return { ok: true as const };
}

/* ------------------------------------------------------- « rejoins-moi » */

/**
 * Inviter des amis à venir jouer.
 *
 * Une ligne par destinataire, même quand l'invitation part à tout un groupe :
 * chacun répond pour soi, et l'expéditeur voit qui vient. Les lignes d'un
 * même envoi partagent un `batchId`, pour n'afficher qu'un envoi de son côté.
 *
 * On n'invite que ses amis et les membres de ses groupes. Sans cette règle,
 * l'invitation deviendrait le moyen d'écrire à n'importe qui — et il n'en
 * faut pas plus pour transformer une application de salle en boîte à spam.
 */
export async function inviterAJouer(formData: FormData) {
  const moi = await requireUser();
  const message = str(formData, "message").slice(0, 200);
  const venueId = str(formData, "venueId") || null;
  const crewId = str(formData, "crewId") || null;
  const matchId = str(formData, "matchId") || null;

  const demandes = formData.getAll("amis").map(String).filter(Boolean);
  const { idsDesAmis } = await import("@/lib/joueurs");
  const amis = new Set(await idsDesAmis(moi.id));

  // Tout un groupe d'un coup : ses membres s'ajoutent aux destinataires.
  if (crewId) {
    const membres = await db
      .select({ userId: crewMembers.userId })
      .from(crewMembers)
      .where(and(eq(crewMembers.crewId, crewId), eq(crewMembers.status, "membre")));
    for (const m of membres) if (m.userId !== moi.id) amis.add(m.userId);
    if (demandes.length === 0) for (const m of membres) if (m.userId !== moi.id) demandes.push(m.userId);
  }

  const destinataires = [...new Set(demandes)].filter((id) => id !== moi.id && amis.has(id));
  if (destinataires.length === 0) {
    return { ok: false as const, error: "Choisis au moins un ami — ou rejoins un groupe." };
  }

  const salle = venueId
    ? (await db.select().from(venues).where(eq(venues.id, venueId)).limit(1))[0]
    : undefined;
  const groupe = crewId ? (await db.select().from(crews).where(eq(crews.id, crewId)).limit(1))[0] : undefined;

  const batchId = uid();
  await db.insert(invitations).values(
    destinataires.map((toId) => ({
      id: uid(),
      batchId,
      fromId: moi.id,
      toId,
      venueId,
      matchId,
      crewId,
      message,
      status: "envoyee",
    })),
  );

  // Le titre dit qui invite et où : c'est tout ce qu'on lit d'une bulle.
  const titre = groupe
    ? `${groupe.name} : rejoins-nous`
    : destinataires.length > 1
      ? `${moi.name} vous invite`
      : `${moi.name} t'invite`;
  const ou = salle ? ` au ${salle.name}` : "";
  const corps = message || (matchId ? `On est à la table${ou}. Viens.` : `Rejoins-nous${ou}.`);

  for (const toId of destinataires) {
    await notify(toId, titre, corps, "system", "/app/amis");
  }

  revalidatePath("/app/amis");
  return { ok: true as const, envoyees: destinataires.length };
}

/** Répondre à une invitation. */
export async function repondreInvitation(invitationId: string, reponse: "acceptee" | "refusee") {
  const moi = await requireUser();
  const ligne = (await db.select().from(invitations).where(eq(invitations.id, invitationId)).limit(1))[0];
  if (!ligne) return { ok: false as const, error: "Invitation introuvable." };
  if (ligne.toId !== moi.id) return { ok: false as const, error: "Cette invitation n'est pas pour toi." };

  await db.update(invitations).set({ status: reponse }).where(eq(invitations.id, invitationId));

  if (reponse === "acceptee") {
    await notify(
      ligne.fromId,
      `${moi.name} arrive`,
      "Il a accepté ton invitation.",
      "system",
      "/app/amis",
    );
  }

  revalidatePath("/app/amis");
  return { ok: true as const };
}

/** Dissoudre un groupe. Le chef seulement, et la bande est prévenue. */
export async function supprimerGroupe(crewId: string) {
  const moi = await requireUser();
  const groupe = (await db.select().from(crews).where(eq(crews.id, crewId)).limit(1))[0];
  if (!groupe) return { ok: false as const, error: "Groupe introuvable." };
  if (groupe.ownerId !== moi.id) return { ok: false as const, error: "Seul le chef peut dissoudre le groupe." };

  // Prévenir avant d'effacer : après la suppression, on ne sait plus qui
  // était dedans, et les gens verraient un groupe disparaître sans un mot.
  const membres = await db
    .select({ userId: crewMembers.userId })
    .from(crewMembers)
    .where(and(eq(crewMembers.crewId, crewId), ne(crewMembers.userId, moi.id)));

  for (const m of membres) {
    await notify(m.userId, `${groupe.name} est dissous`, `${moi.name} a fermé le groupe.`, "system", "/app/groupes");
  }

  await db.delete(crews).where(eq(crews.id, crewId));

  revalidatePath("/app/groupes");
  return { ok: true as const };
}

/**
 * Inviter dans un groupe.
 *
 * Trois façons de désigner les gens, parce que ce sont les trois qu'on a en
 * tête : tout le monde, tout le monde sauf untel, ou une poignée choisie.
 * La liste « tous mes amis » se recompose sur le serveur à chaque envoi —
 * calculée dans le navigateur, elle vieillirait entre l'ouverture de la page
 * et le clic.
 */
export async function inviterAuGroupe(formData: FormData) {
  const moi = await requireUser();
  const crewId = str(formData, "crewId");
  const mode = str(formData, "mode") || "tous";

  const groupe = (await db.select().from(crews).where(eq(crews.id, crewId)).limit(1))[0];
  if (!groupe) return { ok: false as const, error: "Groupe introuvable." };

  const suisMembre = (
    await db
      .select({ id: crewMembers.id })
      .from(crewMembers)
      .where(and(eq(crewMembers.crewId, crewId), eq(crewMembers.userId, moi.id), eq(crewMembers.status, "membre")))
      .limit(1)
  )[0];
  if (!suisMembre) return { ok: false as const, error: "Il faut être du groupe pour y inviter." };

  const { idsDesAmis } = await import("@/lib/joueurs");
  const amis = await idsDesAmis(moi.id);
  const coches = formData.getAll("ids").map(String).filter(Boolean);

  // On n'invite que ses amis : le groupe ne doit pas devenir un moyen
  // d'atteindre des inconnus.
  const vises =
    mode === "tous"
      ? amis
      : mode === "sauf"
        ? amis.filter((id) => !coches.includes(id))
        : coches.filter((id) => amis.includes(id));

  const dedans = await db
    .select({ userId: crewMembers.userId })
    .from(crewMembers)
    .where(eq(crewMembers.crewId, crewId));
  const deja = new Set(dedans.map((d) => d.userId));

  const nouveaux = [...new Set(vises)].filter((id) => id !== moi.id && !deja.has(id));
  if (nouveaux.length === 0) {
    return {
      ok: false as const,
      error: amis.length === 0 ? "Ajoute d'abord des amis." : "Ils sont déjà tous dans le groupe.",
    };
  }

  await db.insert(crewMembers).values(
    nouveaux.map((userId) => ({ id: uid(), crewId, userId, role: "membre", status: "invite" })),
  );

  for (const userId of nouveaux) {
    await notify(
      userId,
      `${moi.name} t'invite dans ${groupe.name}`,
      groupe.devise || "Une bande de plus pour tes soirées.",
      "system",
      `/app/groupes/${groupe.slug}`,
    );
  }

  revalidatePath("/app/groupes");
  revalidatePath(`/app/groupes/${groupe.slug}`);
  return { ok: true as const, invites: nouveaux.length };
}

/** Accepter ou décliner une invitation de groupe. */
export async function repondreGroupe(crewId: string, reponse: "acceptee" | "refusee") {
  const moi = await requireUser();
  const ligne = (
    await db
      .select()
      .from(crewMembers)
      .where(and(eq(crewMembers.crewId, crewId), eq(crewMembers.userId, moi.id)))
      .limit(1)
  )[0];
  if (!ligne || ligne.status !== "invite") return { ok: false as const, error: "Aucune invitation en cours." };

  if (reponse === "refusee") await db.delete(crewMembers).where(eq(crewMembers.id, ligne.id));
  else {
    await db.update(crewMembers).set({ status: "membre" }).where(eq(crewMembers.id, ligne.id));
    const groupe = (await db.select().from(crews).where(eq(crews.id, crewId)).limit(1))[0];
    if (groupe) {
      await notify(
        groupe.ownerId,
        `${moi.name} rejoint ${groupe.name}`,
        "Un joueur de plus dans la bande.",
        "system",
        `/app/groupes/${groupe.slug}`,
      );
    }
  }

  revalidatePath("/app/groupes");
  return { ok: true as const };
}
