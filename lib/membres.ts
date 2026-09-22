import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, memberPlans, memberships, users, type MemberPlan, type User } from "@/db";

/**
 * L'abonnement Master Break.
 *
 * Il ouvre les directs réservés aux abonnés et dispense du billet vidéo à
 * l'unité — c'est tout ce qu'il fait, et c'est tout ce qu'on en promet. Une
 * date de fin sur le compte suffit : pas de reconduction tacite, pas de
 * mandat chez l'opérateur, rien qui se prélève sans qu'on l'ait demandé. Au
 * Cameroun le paiement mobile se valide à chaque fois sur le téléphone ; un
 * abonnement qui se renouvelle tout seul n'y existe pas.
 */

/** Les avantages sont stockés en une ligne, séparés par « | ». */
export const avantages = (plan: MemberPlan) =>
  plan.perks.split("|").map((p) => p.trim()).filter(Boolean);

export const estMembre = (user: Pick<User, "memberUntil">) =>
  Boolean(user.memberUntil && user.memberUntil.getTime() > Date.now());

/** Combien de jours il reste, arrondis au jour entamé. */
export function joursRestants(user: Pick<User, "memberUntil">): number {
  if (!user.memberUntil) return 0;
  const reste = user.memberUntil.getTime() - Date.now();
  return reste > 0 ? Math.ceil(reste / 86_400_000) : 0;
}

export async function getPlans(toutes = false) {
  const q = db.select().from(memberPlans).orderBy(asc(memberPlans.sort), asc(memberPlans.price));
  return toutes ? q : q.where(eq(memberPlans.active, true));
}

export async function getPlan(id: string) {
  const rows = await db.select().from(memberPlans).where(eq(memberPlans.id, id)).limit(1);
  return rows[0] ?? null;
}

/** L'historique d'un abonné : ce qu'il a payé, et jusqu'à quand. */
export async function mesAbonnements(userId: string) {
  return db
    .select({ membership: memberships, plan: memberPlans })
    .from(memberships)
    .leftJoin(memberPlans, eq(memberPlans.id, memberships.planId))
    .where(eq(memberships.userId, userId))
    .orderBy(desc(memberships.createdAt));
}

/** Les abonnés en cours, pour l'administration. */
export async function getAbonnes() {
  return db
    .select({
      id: users.id,
      name: users.name,
      phone: users.phone,
      memberUntil: users.memberUntil,
      // L'échéance se juge sur l'horloge de la base : une seule montre, et le
      // rendu n'a pas à lire l'heure pendant qu'il s'exécute.
      actif: sql<boolean>`${users.memberUntil} > now()`,
      paye: sql<number>`(select coalesce(sum(m.price), 0) from mb.memberships m
                          where m.user_id = mb.users.id and m.status = 'paid')`,
      renouvellements: sql<number>`(select count(*) from mb.memberships m
                                     where m.user_id = mb.users.id and m.status = 'paid')`,
    })
    .from(users)
    .where(sql`${users.memberUntil} is not null`)
    .orderBy(desc(users.memberUntil));
}

/**
 * La nouvelle date de fin après un achat.
 *
 * Un abonnement qui court encore se prolonge, il ne se remplace pas : celui
 * qui se réabonne trois jours avant l'échéance ne doit pas perdre ces trois
 * jours. Un abonnement expiré repart d'aujourd'hui.
 */
export function prolonger(actuelle: Date | null, mois: number, maintenant = new Date()): Date {
  const depart = actuelle && actuelle.getTime() > maintenant.getTime() ? new Date(actuelle) : new Date(maintenant);
  const fin = new Date(depart);
  fin.setMonth(fin.getMonth() + mois);
  return fin;
}

/** Un achat déjà lancé et non réglé, pour ne pas en empiler deux. */
export async function enAttente(userId: string) {
  const rows = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "pending")))
    .orderBy(desc(memberships.createdAt))
    .limit(1);
  return rows[0] ?? null;
}
