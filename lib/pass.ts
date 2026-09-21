import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Laissez-passer signés du Master Pass.
 *
 * Le QR ne contient plus le code du jeton : il porte une charge utile signée qui
 * expire au bout de quelques secondes. Photographier l'écran d'un joueur ne sert
 * donc plus à rien, et un QR rejoué après coup est refusé au comptoir. Le code à
 * quatre chiffres reste la porte de secours quand le réseau lâche.
 */

const PREFIX = "mb1";
/** Durée de vie d'un QR de jeton, alignée sur le rythme de rotation de l'écran. */
export const PASS_TTL = 90;

/**
 * Un billet se montre à l'entrée, parfois sans réseau : sa validité couvre la
 * soirée. Le rejeu reste impossible, le billet passant en « utilisé » au scan.
 */
export const TICKET_TTL = 12 * 3600;

/** Une invitation d'arbitrage couvre une rencontre, pas une soirée entière. */
export const INVITE_TTL = 2 * 3600;

/**
 * Sans `MB_QR_SECRET`, on tire une clé au démarrage : les laissez-passer ne
 * survivent pas à un redémarrage, ce qui est sans conséquence vu leur durée de
 * vie — et vaut mieux qu'un secret par défaut connu de tous.
 */
let fallback: Buffer | null = null;
function secret(): Buffer {
  const configured = process.env.MB_QR_SECRET?.trim();
  if (configured) return Buffer.from(configured, "utf8");
  if (!fallback) {
    fallback = randomBytes(32);
    if (process.env.NODE_ENV === "production") {
      console.warn("[mb] MB_QR_SECRET absent : clé éphémère, les QR seront invalidés à chaque redémarrage");
    }
  }
  return fallback;
}

export type PassClaims = {
  /** token | ticket | score (invitation d'arbitrage) */
  k: "token" | "ticket" | "score";
  /** identifiant de la ligne */
  i: string;
  /** code de secours, pour les journaux et l'affichage au comptoir */
  c: string;
  /** propriétaire */
  u: string;
  /** expiration, en secondes epoch */
  e: number;
};

const b64 = (buf: Buffer) => buf.toString("base64url");
const sign = (payload: string) => b64(createHmac("sha256", secret()).update(payload).digest()).slice(0, 43);

export function signPass(claims: Omit<PassClaims, "e">, ttl = PASS_TTL): string {
  const payload = b64(Buffer.from(JSON.stringify({ ...claims, e: Math.floor(Date.now() / 1000) + ttl })));
  return `${PREFIX}.${payload}.${sign(payload)}`;
}

/** Valeur encodée dans le QR. */
export const passUrl = (claims: Omit<PassClaims, "e">, ttl = PASS_TTL) => `mb://pass/${signPass(claims, ttl)}`;

export type PassCheck =
  | { ok: true; claims: PassClaims }
  | { ok: false; reason: "format" | "signature" | "expired" };

export function verifyPass(raw: string): PassCheck {
  const value = raw.trim().replace(/^mb:\/\/pass\//, "");
  const parts = value.split(".");
  if (parts.length !== 3 || parts[0] !== PREFIX) return { ok: false, reason: "format" };

  const [, payload, given] = parts;
  const expected = sign(payload);
  if (given.length !== expected.length) return { ok: false, reason: "signature" };
  if (!timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return { ok: false, reason: "signature" };

  let claims: PassClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, reason: "format" };
  }

  if (!claims?.i || !claims?.u || !claims?.e) return { ok: false, reason: "format" };
  if (claims.e * 1000 < Date.now()) return { ok: false, reason: "expired" };

  return { ok: true, claims };
}

/** Reconnaît un laissez-passer sans le vérifier, pour aiguiller la lecture. */
export const looksLikePass = (raw: string) => /^(mb:\/\/pass\/)?mb1\./.test(raw.trim());
