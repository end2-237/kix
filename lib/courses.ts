import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db, courses, enrollments, users, venues, type Course } from "@/db";

/**
 * Les cours de billard.
 *
 * Un cours se vend comme un billet — place limitée, paiement mobile — mais
 * se présente comme une offre : un coach, un niveau, un nombre de séances.
 */

export const NIVEAUX: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  confirme: "Confirmé",
};

export const FORMATS: Record<string, string> = {
  seance: "Séance à l'unité",
  forfait: "Forfait",
  abonnement: "Abonnement mensuel",
};

/** Ce qu'un cours coûte par séance — la comparaison que fait l'élève. */
export const prixParSeance = (cours: Pick<Course, "price" | "sessions">) =>
  cours.sessions > 0 ? Math.round(cours.price / cours.sessions) : cours.price;

const placesPrises = sql<number>`(select count(*) from mb.enrollments e
                                   where e.course_id = mb.courses.id and e.status = 'paid')`;

export async function getCourses(seulementEnAvant = false) {
  const ou = seulementEnAvant
    ? and(eq(courses.active, true), eq(courses.featured, true))
    : eq(courses.active, true);

  return db
    .select({ course: courses, venue: venues, inscrits: placesPrises })
    .from(courses)
    .leftJoin(venues, eq(venues.id, courses.venueId))
    .where(ou)
    .orderBy(desc(courses.featured), asc(courses.price));
}

export async function getCourse(slug: string) {
  const rows = await db
    .select({ course: courses, venue: venues, inscrits: placesPrises })
    .from(courses)
    .leftJoin(venues, eq(venues.id, courses.venueId))
    .where(eq(courses.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

/** Les cours auxquels un élève est inscrit, ou en attente de paiement. */
export async function getMesCours(userId: string) {
  return db
    .select({ enrollment: enrollments, course: courses, venue: venues })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .leftJoin(venues, eq(venues.id, courses.venueId))
    .where(eq(enrollments.userId, userId))
    .orderBy(desc(enrollments.createdAt));
}

/** Côté coach ou administration : qui suit ce cours. */
export async function getEleves(courseId: string) {
  return db
    .select({ enrollment: enrollments, eleve: users })
    .from(enrollments)
    .innerJoin(users, eq(users.id, enrollments.userId))
    .where(eq(enrollments.courseId, courseId))
    .orderBy(desc(enrollments.createdAt));
}

/** Tout le catalogue, actifs compris, pour l'administration. */
export async function getAllCourses() {
  return db
    .select({ course: courses, venue: venues, inscrits: placesPrises })
    .from(courses)
    .leftJoin(venues, eq(venues.id, courses.venueId))
    .orderBy(desc(courses.createdAt));
}
