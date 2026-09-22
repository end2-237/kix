import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolveSession } from "@/lib/auth";
import type { User } from "@/db";

export const SESSION_COOKIE = "mb_session";

/** L'utilisateur du cookie de session, ou `null` si personne n'est connecté. */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  return resolveSession(jar.get(SESSION_COOKIE)?.value);
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  return user;
}

/** Garde de rôle pour /gerant et /admin. */
export async function requireRole(...roles: User["role"][]): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/connexion");
  if (!roles.includes(user.role)) redirect("/connexion?refus=1");
  return user;
}

/** Page d'accueil selon le rôle, après connexion. */
export function homeFor(role: string): string {
  return role === "admin" ? "/admin" : role === "manager" ? "/gerant" : role === "seller" ? "/vendeur" : "/app";
}
