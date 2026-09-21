import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { db, sessions, users, type User } from "@/db";

export * from "@/lib/password";

const SESSION_DAYS = 30;
export const SESSION_MAX_AGE = SESSION_DAYS * 86_400;

/**
 * Sessions maison : un jeton aléatoire de 32 octets part dans un cookie
 * httpOnly, seule son empreinte SHA-256 est stockée. Une fuite de la table
 * `mb.sessions` ne permet donc pas de se connecter.
 */
const digest = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string, userAgent?: string | null): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sessions).values({
    userId,
    tokenHash: digest(token),
    userAgent: userAgent?.slice(0, 200) ?? null,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
  });
  return token;
}

export async function resolveSession(token: string | undefined): Promise<User | null> {
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, digest(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
}

export async function destroySession(token: string | undefined): Promise<void> {
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.tokenHash, digest(token)));
}

/** Purge des sessions expirées, au démarrage du serveur. */
export async function purgeExpiredSessions(): Promise<void> {
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
