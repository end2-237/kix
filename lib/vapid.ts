/**
 * VAPID : la signature qui identifie l'expéditeur d'un push.
 *
 * Aucune base de données ici, et pas de `server-only` : la conversion de
 * signature est la seule partie vraiment délicate du protocole, et elle doit
 * pouvoir être éprouvée depuis un script Node.
 */
import { createPrivateKey, createSign, generateKeyPairSync } from "node:crypto";

export const TTL = 60 * 60 * 12; // douze heures : au-delà, la notification a vieilli

export type Cles = { publique: string; privee: string };

/**
 * Une clé publique VAPID fait 65 octets — un point de courbe non compressé,
 * d'où le préfixe 0x04 et les 87 caractères en base64url. Une clé privée en
 * fait 32, soit 43 caractères.
 *
 * On sait donc reconnaître l'une de l'autre, et c'est indispensable : le
 * nom `NEXT_PUBLIC_VAPID_PUBLIC_KEY` désigne une variable **inlinée dans le
 * code envoyé au navigateur**. Y poser la clé privée la publie à tous les
 * visiteurs, sans le moindre message d'erreur — la signature continuerait
 * même de fonctionner, ce qui est le pire des cas.
 */
export const ressembleAUnePubliqueVapid = (v: string) => {
  const brut = v.trim();
  if (!brut) return false;
  const octets = Buffer.from(brut.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  return octets.length === 65 && octets[0] === 0x04;
};

export const ressembleAUnePriveeVapid = (v: string) =>
  Buffer.from(v.trim().replace(/-/g, "+").replace(/_/g, "/"), "base64").length === 32;

export function cles(): Cles | null {
  const publique = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const privee = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!publique || !privee) return null;

  // Refuser plutôt qu'envoyer : une clé privée déjà partie dans le navigateur
  // est une clé à changer, et continuer à s'en servir ne ferait que retarder
  // le moment où on s'en aperçoit.
  if (ressembleAUnePriveeVapid(publique)) {
    console.error(
      "[mb] NEXT_PUBLIC_VAPID_PUBLIC_KEY contient ce qui ressemble à une clé PRIVÉE (32 octets). " +
        "Cette variable est inlinée dans le navigateur : la clé est donc publiée. " +
        "Régénère une paire (npm run push:cles), mets la publique — 87 caractères, commençant par B — " +
        "dans NEXT_PUBLIC_VAPID_PUBLIC_KEY, et la privée dans VAPID_PRIVATE_KEY. Aucun envoi ne partira d'ici là.",
    );
    return null;
  }

  if (!ressembleAUnePubliqueVapid(publique)) {
    console.error(
      "[mb] NEXT_PUBLIC_VAPID_PUBLIC_KEY n'est pas une clé publique VAPID valide " +
        "(65 octets attendus, préfixe 0x04). Les notifications push resteront muettes.",
    );
    return null;
  }

  if (ressembleAUnePubliqueVapid(privee)) {
    console.error(
      "[mb] VAPID_PRIVATE_KEY contient une clé publique : les deux variables sont probablement inversées.",
    );
    return null;
  }

  return { publique, privee };
}

/** Le contact déclaré dans le jeton VAPID : un service de push peut écrire.
 *  Lu à chaque signature, et non une fois pour toutes au chargement : figé à
 *  l'import, il ne suivrait pas un changement d'environnement. */
const contact = () => process.env.VAPID_SUBJECT?.trim() || "mailto:contact@masterbreak.cm";

const b64url = (buf: Buffer | Uint8Array) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const deB64url = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

/**
 * Une signature ECDSA de Node arrive en DER ; JOSE la veut en r‖s brut.
 *
 * C'est le seul endroit délicat : DER encode deux entiers de longueur
 * variable, parfois précédés d'un zéro de signe. On les recale sur 32 octets.
 */
export function derVersRaw(der: Buffer): Buffer {
  if (der[0] !== 0x30) throw new Error("signature DER attendue");
  let i = 2;
  if (der[1] & 0x80) i += der[1] & 0x7f; // longueur sur plusieurs octets

  const lire = () => {
    if (der[i] !== 0x02) throw new Error("entier DER attendu");
    const taille = der[i + 1];
    let valeur = der.subarray(i + 2, i + 2 + taille);
    i += 2 + taille;
    // Un zéro de tête signale un entier positif : il ne fait pas partie du nombre.
    while (valeur.length > 32 && valeur[0] === 0) valeur = valeur.subarray(1);
    return Buffer.concat([Buffer.alloc(Math.max(0, 32 - valeur.length)), valeur]);
  };

  return Buffer.concat([lire(), lire()]);
}

/** La clé privée VAPID, donnée en base64url brut (32 octets) ou en PEM. */
function clePrivee(brut: string) {
  if (brut.includes("BEGIN")) return createPrivateKey(brut);

  // Une clé P-256 brute s'enveloppe en PKCS#8 par un préfixe fixe : le
  // format est constant, seuls les 32 octets de la clé changent.
  const prefixe = Buffer.from("308141020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420", "hex");
  const d = deB64url(brut);
  if (d.length !== 32) throw new Error("clé privée VAPID : 32 octets attendus");
  return createPrivateKey({ key: Buffer.concat([prefixe, d]), format: "der", type: "pkcs8" });
}

/** Le jeton VAPID pour un service de push donné. */
export function jeton(origine: string, { privee }: Cles): string {
  const entete = b64url(Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const corps = b64url(
    Buffer.from(
      JSON.stringify({
        aud: origine,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        sub: contact(),
      }),
    ),
  );
  const signature = createSign("SHA256").update(`${entete}.${corps}`).end().sign(clePrivee(privee));
  return `${entete}.${corps}.${b64url(derVersRaw(signature))}`;
}


/** Les clés sont-elles posées ? Sans elles, on n'envoie simplement rien. */
export const pushConfigure = () => cles() !== null;

/**
 * Une paire VAPID toute neuve, pour `npm run push:cles`.
 *
 * Le scalaire privé se trouve par son marqueur et non par un décalage depuis
 * la fin : un PKCS#8 de Node range la clé publique *après* la privée, si bien
 * que « les 32 derniers octets » sont la fin de la clé publique. Écrit ainsi,
 * la fonction rendait une paire dépareillée — le jeton se signait sans
 * erreur, et aucun service de push ne l'aurait accepté.
 */
export function nouvellesCles(): Cles {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const pub = publicKey.export({ format: "der", type: "spki" });
  const priv = privateKey.export({ format: "der", type: "pkcs8" });

  // 02 01 01 : version 1 de l'ECPrivateKey ; 04 20 : les 32 octets qui suivent.
  const marqueur = Buffer.from("020101 0420".replace(/ /g, ""), "hex");
  const debut = Buffer.from(priv).indexOf(marqueur);
  if (debut < 0) throw new Error("clé privée EC introuvable dans le PKCS#8");

  return {
    publique: b64url(pub.subarray(pub.length - 65)),
    privee: b64url(priv.subarray(debut + marqueur.length, debut + marqueur.length + 32)),
  };
}
