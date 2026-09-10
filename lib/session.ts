import "server-only";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, users, type User } from "@/db";

export const SESSION_COOKIE = "kix_user";

/**
 * Session de démonstration : un cookie porte l'id de l'utilisateur, sans mot de
 * passe. À remplacer par Supabase Auth (OTP par SMS) lors de la migration.
 */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const id = jar.get(SESSION_COOKIE)?.value;

  if (id) {
    const found = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (found[0]) return found[0];
  }

  // Sans cookie, on ouvre l'app sur le compte client de démo.
  const fallback = await db.select().from(users).where(eq(users.role, "client")).limit(1);
  return fallback[0] ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}

/** Garde de rôle pour /gerant et /admin. */
export async function requireRole(...roles: User["role"][]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/connexion?refus=1");
  return user;
}

export async function listAccounts(): Promise<User[]> {
  return db.select().from(users).orderBy(users.role, users.name);
}
