import { timingSafeEqual } from "node:crypto";
import { db, streams, users } from "@/db";
import { eq } from "drizzle-orm";
import { canWatch, getStreamByPath, readTicket } from "@/lib/stream";

export const dynamic = "force-dynamic";

/**
 * Crochet d'authentification de MediaMTX.
 *
 * Le serveur média ne décide rien : à chaque connexion — diffuseur ou
 * spectateur — il nous demande ici si elle est autorisée, et attend un 200.
 * L'autorisation de regarder vit donc au même endroit que le reste des droits
 * de l'application (`canWatch`), et non dupliquée dans un fichier de config.
 *
 * https://github.com/bluenviron/mediamtx#authentication
 */
type Hook = {
  user?: string;
  password?: string;
  ip?: string;
  action?: string;
  path?: string;
  protocol?: string;
  id?: string;
  query?: string;
};

const deny = (reason: string) => Response.json({ error: reason }, { status: 401 });
const allow = () => new Response(null, { status: 200 });

/** Comparaison en temps constant, longueurs différentes comprises. */
function sameSecret(given: string, expected: string): boolean {
  if (!expected) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  let hook: Hook;
  try {
    hook = await request.json();
  } catch {
    return deny("corps illisible");
  }

  const path = (hook.path ?? "").replace(/^\/+/, "");
  const query = new URLSearchParams(hook.query ?? "");

  // L'API et les métriques de MediaMTX ne passent pas par l'application.
  if (hook.action && !["publish", "read", "playback"].includes(hook.action)) return deny("action refusée");
  if (!path) return deny("chemin absent");

  const stream = await getStreamByPath(path);
  if (!stream) return deny("direct inconnu");

  /* ------------------------------------------------------------- diffusion */
  if (hook.action === "publish") {
    // OBS met les identifiants dans la clé de flux, d'où les trois endroits
    // possibles ; on est permissif sur le transport, strict sur la valeur.
    const given = hook.password || query.get("key") || query.get("pass") || hook.user || "";
    if (!sameSecret(given, stream.streamKey)) return deny("clé de diffusion invalide");

    await db
      .update(streams)
      .set({ status: "live", startedAt: stream.startedAt ?? new Date(), endedAt: null, updatedAt: new Date() })
      .where(eq(streams.id, stream.id));
    return allow();
  }

  /* -------------------------------------------------------------- lecture */
  if (stream.access === "free") return allow();

  const ticket = query.get("mb");
  if (!ticket) return deny("billet requis");

  const check = readTicket(ticket);
  if (!check.ok) return deny(check.reason);
  if (check.streamId !== stream.id) return deny("billet émis pour un autre direct");

  const viewer = (await db.select().from(users).where(eq(users.id, check.userId)).limit(1))[0];
  if (!viewer) return deny("spectateur inconnu");

  // On rejoue la règle au lieu de se fier au billet : un accès retiré entre
  // l'émission et la lecture doit fermer la porte tout de suite.
  const access = await canWatch(viewer, stream);
  if (!access.ok) return deny(access.reason === "ppv" ? "billet vidéo non payé" : "réservé aux abonnés");

  return allow();
}
