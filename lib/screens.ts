import "server-only";
import { createHash, randomBytes, randomInt } from "node:crypto";
import { and, eq, gt, isNull, lt, or } from "drizzle-orm";
import { db, screens, streams, type Screen, type Stream } from "@/db";
import { signPass, verifyPass, TICKET_TTL } from "@/lib/pass";
import { qrShape } from "@/lib/qr";

/**
 * Les écrans d'une salle.
 *
 * Un navigateur ne peut pas parcourir le réseau local : le dashboard ne
 * « découvre » donc aucun téléviseur. Ce sont les écrans qui s'annoncent — ils
 * ouvrent une page, affichent un code, et le gérant les adopte. Ce modèle a
 * trois avantages sur un balayage réseau, en plus d'être le seul possible :
 * il traverse les réseaux, il donne une présence vraie (la connexion est
 * ouverte ou non, là où un ping ment), et il faut voir l'écran pour l'adopter.
 */

const empreinte = (jeton: string) => createHash("sha256").update(jeton).digest("hex");

/** Un écran sans signe de vie depuis ce délai est déclaré hors ligne. */
export const PRESENCE_MS = 45_000;

/** Le code d'appairage ne vaut qu'un quart d'heure. */
const APPAIRAGE_MS = 15 * 60_000;

/**
 * Alphabet du code d'appairage : ni O/0, ni I/1, ni 5/S.
 * Le code est recopié à la main, souvent de loin et dans une salle sombre.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRTUVWXYZ2346789";

const nouveauCode = () =>
  Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

/** Les codes se ressemblent à l'œil : on compare sur une forme normalisée. */
export const normaliserCode = (brut: string) =>
  brut
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .replace(/O/g, "0")
    .replace(/I/g, "1")
    .slice(0, 6);

/* --------------------------------------------------------------- appairage */

/**
 * Ce que le téléviseur affiche : un QR, et le code en clair dessous.
 *
 * Le QR porte l'URL complète du dashboard avec le code en paramètre. Scanné
 * avec l'appareil photo du téléphone, il ouvre la page d'adoption déjà
 * remplie ; scanné depuis le dashboard, notre lecteur en extrait le code. On
 * ne recopie rien — sauf si la caméra refuse, d'où le code en clair.
 */
export function invitationEcran(code: string) {
  const base = process.env.MB_PUBLIC_URL?.trim().replace(/\/+$/, "") ?? "";
  const lien = `${base}/gerant/ecrans?code=${code}`;
  return { code, lien, qr: qrShape(lien) };
}

/** Le code porté par un QR, qu'il contienne l'URL entière ou le code seul. */
export function codeDepuisQr(brut: string): string {
  const texte = brut.trim();
  try {
    const url = new URL(texte);
    const dans = url.searchParams.get("code");
    if (dans) return normaliserCode(dans);
  } catch {
    /* ce n'est pas une URL : c'est peut-être le code seul */
  }
  return normaliserCode(texte);
}

/**
 * Un téléviseur qui s'annonce. Il repart avec un jeton, qu'il garde, et un
 * code, qu'il affiche. La ligne n'appartient encore à personne.
 */
export async function annoncerEcran(): Promise<{ token: string; code: string }> {
  const token = randomBytes(24).toString("base64url");

  // Une collision sur six caractères est improbable, pas impossible : la
  // contrainte d'unicité la rattraperait par une erreur 500 au mauvais moment.
  for (let essai = 0; essai < 5; essai++) {
    const code = nouveauCode();
    const libre = await db.select({ id: screens.id }).from(screens).where(eq(screens.pairingCode, code)).limit(1);
    if (libre.length > 0) continue;

    await db.insert(screens).values({
      tokenHash: empreinte(token),
      pairingCode: code,
      pairingExpiresAt: new Date(Date.now() + APPAIRAGE_MS),
      lastSeenAt: new Date(),
    });
    return { token, code };
  }
  throw new Error("impossible de tirer un code d'appairage libre");
}

/**
 * Le gérant adopte l'écran.
 *
 * On n'accepte qu'une ligne encore libre : un code déjà servi ne permet pas de
 * reprendre l'écran d'une autre salle. Le code est effacé dans la foulée.
 */
export async function adopterEcran(
  code: string,
  venueId: string,
  nom: string,
): Promise<{ ok: true; screen: Screen } | { ok: false; error: string }> {
  const propre = normaliserCode(code);
  if (propre.length !== 6) return { ok: false, error: "Le code fait six caractères." };

  const ligne = (
    await db
      .select()
      .from(screens)
      .where(and(eq(screens.pairingCode, propre), isNull(screens.venueId), gt(screens.pairingExpiresAt, new Date())))
      .limit(1)
  )[0];

  if (!ligne) return { ok: false, error: "Code inconnu ou périmé. Recharge la page de l'écran." };

  const adopte = (
    await db
      .update(screens)
      .set({
        venueId,
        name: nom.trim().slice(0, 40) || "Écran",
        pairingCode: null,
        pairingExpiresAt: null,
      })
      .where(and(eq(screens.id, ligne.id), isNull(screens.venueId)))
      .returning()
  )[0];

  // La condition est répétée dans le `where` : deux gérants qui tapent le même
  // code au même instant, et seul le premier l'emporte.
  if (!adopte) return { ok: false, error: "Cet écran vient d'être adopté ailleurs." };
  return { ok: true, screen: adopte };
}

/* ------------------------------------------------------------------ lecture */

export type EtatEcran =
  | { ok: false; reason: "inconnu" }
  | { ok: true; screen: Screen; stream: Stream | null };

/** Qui est cet écran, et que doit-il montrer ? Rafraîchit sa présence. */
export async function lireEcran(token: string): Promise<EtatEcran> {
  if (!token) return { ok: false, reason: "inconnu" };

  const ligne = (await db.select().from(screens).where(eq(screens.tokenHash, empreinte(token))).limit(1))[0];
  if (!ligne) return { ok: false, reason: "inconnu" };

  const stream = ligne.streamId
    ? (await db.select().from(streams).where(eq(streams.id, ligne.streamId)).limit(1))[0] ?? null
    : null;

  // Un direct rattaché à une autre salle ne s'affiche pas, même si la ligne
  // le désigne encore : une salle revendue ne doit pas continuer à diffuser.
  const permis = stream && stream.venueId === ligne.venueId ? stream : null;
  return { ok: true, screen: ligne, stream: permis };
}

export async function toucherEcran(id: string) {
  await db.update(screens).set({ lastSeenAt: new Date() }).where(eq(screens.id, id));
}

export const enLigne = (screen: Pick<Screen, "lastSeenAt">) =>
  Boolean(screen.lastSeenAt && Date.now() - screen.lastSeenAt.getTime() < PRESENCE_MS);

/* ------------------------------------------------------------------ billets */

/**
 * Billet de lecture d'un écran.
 *
 * Un téléviseur n'a pas de compte : il ne peut pas porter le billet d'un
 * spectateur. Il porte le sien, marqué `screen`, et le crochet média ne
 * l'accepte que pour un direct de la salle qui l'a adopté. Un écran ne peut
 * donc pas servir à regarder gratuitement le direct payant d'une autre salle.
 */
export const billetEcran = (streamId: string, screenId: string) =>
  signPass({ k: "score", i: streamId, c: "screen", u: screenId }, TICKET_TTL);

export type BilletEcran = { ok: true; streamId: string; screenId: string } | { ok: false; reason: string };

export function lireBilletEcran(brut: string): BilletEcran {
  const check = verifyPass(brut);
  if (!check.ok) return { ok: false, reason: check.reason === "expired" ? "billet expiré" : "billet invalide" };
  if (check.claims.c !== "screen") return { ok: false, reason: "billet invalide" };
  return { ok: true, streamId: check.claims.i, screenId: check.claims.u };
}

/* ------------------------------------------------------------- côté gérant */

export async function getVenueScreens(venueId: string) {
  return db
    .select()
    .from(screens)
    .where(eq(screens.venueId, venueId))
    .orderBy(screens.name);
}

/** Purge les annonces jamais adoptées : un téléviseur allumé un soir ne traîne pas. */
export async function purgerAppairages() {
  const perimes = await db
    .delete(screens)
    .where(and(isNull(screens.venueId), or(isNull(screens.pairingExpiresAt), lt(screens.pairingExpiresAt, new Date()))))
    .returning({ id: screens.id });
  return perimes.length;
}
