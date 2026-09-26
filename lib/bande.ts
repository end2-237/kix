import "server-only";
export { PORTES, PORTES_OPTIONS } from "@/lib/groupes";
import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import {
  crewMembers,
  crews,
  db,
  invitations,
  matches,
  users,
  venues,
  type Crew,
} from "@/db";

/**
 * Les groupes de billard, et les invitations à se rejoindre.
 *
 * Une salle de billard, c'est d'abord une bande. L'application connaissait
 * des joueurs isolés et des amitiés deux à deux ; il lui manquait le
 * « nous » — le groupe du jeudi soir, avec son nom et sa photo.
 *
 * Et il lui manquait le geste le plus simple de tous : dire à ses amis qu'on
 * est à la table, et qu'ils devraient venir.
 */

export type GroupeVue = {
  crew: Crew;
  venue: { name: string; slug: string } | null;
  membres: number;
  estMembre: boolean;
  estChef: boolean;
  /** Une invitation en attente de réponse. */
  invite: boolean;
};

export async function getGroupes(userId: string): Promise<GroupeVue[]> {
  const rows = await db
    .select({
      crew: crews,
      venue: venues,
      membres: sql<number>`(select count(*) from mb.crew_members m
                             where m.crew_id = mb.crews.id and m.status = 'membre')`,
      mien: sql<number>`(select count(*) from mb.crew_members m
                          where m.crew_id = mb.crews.id and m.user_id = ${userId} and m.status = 'membre')`,
      invite: sql<number>`(select count(*) from mb.crew_members m
                            where m.crew_id = mb.crews.id and m.user_id = ${userId} and m.status = 'invite')`,
    })
    .from(crews)
    .leftJoin(venues, eq(venues.id, crews.venueId))
    .orderBy(desc(crews.createdAt));

  return rows.map((r) => ({
    crew: r.crew,
    venue: r.venue ? { name: r.venue.name, slug: r.venue.slug } : null,
    membres: Number(r.membres),
    estMembre: Number(r.mien) > 0,
    estChef: r.crew.ownerId === userId,
    invite: Number(r.invite) > 0,
  }));
}

export async function getGroupe(slug: string) {
  const rows = await db
    .select({ crew: crews, venue: venues })
    .from(crews)
    .leftJoin(venues, eq(venues.id, crews.venueId))
    .where(eq(crews.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

/** Les membres d'un groupe, le chef en tête, puis les invités en attente. */
export async function membresDuGroupe(crewId: string) {
  return db
    .select({ membre: crewMembers, user: users })
    .from(crewMembers)
    .innerJoin(users, eq(users.id, crewMembers.userId))
    .where(and(eq(crewMembers.crewId, crewId), ne(crewMembers.status, "parti")))
    .orderBy(
      sql`case when ${crewMembers.status} = 'invite' then 1 else 0 end`,
      sql`case when ${crewMembers.role} = 'chef' then 0 else 1 end`,
      desc(users.points),
    );
}

/** Les amis qu'on peut encore inviter dans un groupe donné. */
export async function amisInvitables(userId: string, crewId: string) {
  const { idsDesAmis } = await import("@/lib/joueurs");
  const amis = await idsDesAmis(userId);
  if (amis.length === 0) return [];

  const dedans = await db
    .select({ userId: crewMembers.userId })
    .from(crewMembers)
    .where(eq(crewMembers.crewId, crewId));
  const deja = new Set(dedans.map((d) => d.userId));

  const restants = amis.filter((id) => !deja.has(id));
  if (restants.length === 0) return [];

  return db
    .select({ id: users.id, name: users.name, avatar: users.avatar, code: users.code })
    .from(users)
    .where(inArray(users.id, restants))
    .orderBy(users.name);
}

/** Les demandes d'entrée qui attendent le chef. */
export async function demandesDuGroupe(crewId: string) {
  return db
    .select({ id: users.id, name: users.name, avatar: users.avatar, code: users.code, points: users.points })
    .from(crewMembers)
    .innerJoin(users, eq(users.id, crewMembers.userId))
    .where(and(eq(crewMembers.crewId, crewId), eq(crewMembers.status, "demande")))
    .orderBy(users.name);
}

/** Mes groupes, pour choisir au moment d'inviter. */
export async function mesGroupes(userId: string) {
  return db
    .select({ crew: crews, role: crewMembers.role })
    .from(crewMembers)
    .innerJoin(crews, eq(crews.id, crewMembers.crewId))
    .where(and(eq(crewMembers.userId, userId), eq(crewMembers.status, "membre")))
    .orderBy(desc(crews.createdAt));
}

/* -------------------------------------------------------- invitations */

/** Les invitations reçues, les plus récentes d'abord. */
export async function invitationsRecues(userId: string, limite = 12) {
  return db
    .select({ invitation: invitations, de: users, venue: venues, crew: crews })
    .from(invitations)
    .innerJoin(users, eq(users.id, invitations.fromId))
    .leftJoin(venues, eq(venues.id, invitations.venueId))
    .leftJoin(crews, eq(crews.id, invitations.crewId))
    .where(eq(invitations.toId, userId))
    .orderBy(desc(invitations.createdAt))
    .limit(limite);
}

/** Ce que j'ai envoyé, regroupé par envoi : qui vient, qui a décliné. */
export async function invitationsEnvoyees(userId: string, limite = 6) {
  const lignes = await db
    .select({ invitation: invitations, vers: users, venue: venues })
    .from(invitations)
    .innerJoin(users, eq(users.id, invitations.toId))
    .leftJoin(venues, eq(venues.id, invitations.venueId))
    .where(eq(invitations.fromId, userId))
    .orderBy(desc(invitations.createdAt));

  const envois = new Map<
    string,
    { batchId: string; quand: Date; message: string; venue: string | null; destinataires: { nom: string; status: string }[] }
  >();

  for (const l of lignes) {
    const existant = envois.get(l.invitation.batchId);
    const entree = existant ?? {
      batchId: l.invitation.batchId,
      quand: l.invitation.createdAt,
      message: l.invitation.message,
      venue: l.venue?.name ?? null,
      destinataires: [],
    };
    entree.destinataires.push({ nom: l.vers.name, status: l.invitation.status });
    envois.set(l.invitation.batchId, entree);
  }

  return [...envois.values()].slice(0, limite);
}

/** La salle où je joue en ce moment, pour préremplir l'invitation. */
export async function ouJeJoue(userId: string) {
  const rows = await db
    .select({ match: matches, venue: venues })
    .from(matches)
    .innerJoin(venues, eq(venues.id, matches.venueId))
    .where(
      and(
        eq(matches.status, "live"),
        sql`(${matches.playerAId} = ${userId} or ${matches.playerBId} = ${userId})`,
      ),
    )
    .orderBy(desc(matches.startedAt))
    .limit(1);
  return rows[0] ?? null;
}

/** Les noms de quelques comptes, pour composer un message d'invitation. */
export async function nomsDe(ids: string[]) {
  if (ids.length === 0) return new Map<string, string>();
  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, ids));
  return new Map(rows.map((r) => [r.id, r.name]));
}
