import { and, desc, eq } from "drizzle-orm";
import { db, notifications } from "@/db";
import { getCurrentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Ce que le service worker doit afficher.
 *
 * Le push arrive sans contenu : c'est ici que la notification est lue, avec
 * le cookie de session. Le service de push — APNs, FCM — ne voit donc jamais
 * ce qu'elle dit.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false }, { status: 401 });

  const derniere = (
    await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)))
      .orderBy(desc(notifications.createdAt))
      .limit(1)
  )[0];

  if (!derniere) return Response.json({ ok: false }, { status: 404 });

  return Response.json({
    ok: true,
    title: derniere.title,
    body: derniere.body,
    href: derniere.href ?? "/app/notifications",
    // L'étiquette regroupe : trois jetons crédités ne font qu'une bulle.
    tag: derniere.kind,
  });
}
