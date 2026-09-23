import { deposerImage } from "@/lib/storage";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Les deux seuls dossiers qu'un joueur peut remplir.
 *
 * Ouvrir le dépôt à tout le monde sans restriction offrirait un hébergement
 * d'images gratuit à qui s'inscrit. Mais un joueur a bien deux images à lui :
 * sa photo de profil et celle de sa bande. Il ne peut pas en choisir d'autres,
 * ni inventer un nom de dossier.
 */
const DOSSIERS_DU_JOUEUR = new Set(["avatars", "groupes"]);

/**
 * Dépôt d'une image.
 *
 * Ceux qui tiennent un catalogue déposent où ils veulent ; un joueur, dans son
 * profil et dans sa bande. Le dossier est vérifié ici, jamais côté navigateur :
 * c'est un champ de formulaire comme un autre, donc modifiable.
 */
export async function POST(request: Request) {
  const auteur = await requireUser();
  const catalogue = auteur.role === "admin" || auteur.role === "manager" || auteur.role === "seller";

  const form = await request.formData().catch(() => null);
  const fichier = form?.get("fichier");
  if (!(fichier instanceof File)) {
    return Response.json({ ok: false, error: "Aucun fichier reçu." }, { status: 400 });
  }

  const dossier = String(form?.get("dossier") ?? "divers");
  if (!catalogue && !DOSSIERS_DU_JOUEUR.has(dossier)) {
    return Response.json({ ok: false, error: "Dépôt réservé à ta photo et à celle de ta bande." }, { status: 403 });
  }
  const depot = await deposerImage(fichier, dossier);

  return Response.json(depot, { status: depot.ok ? 200 : 400 });
}
