import { deposerImage } from "@/lib/storage";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Dépôt d'une image de fiche.
 *
 * Réservé à ceux qui tiennent un catalogue. Un client n'a rien à téléverser :
 * lui ouvrir cette porte offrirait un hébergement d'images gratuit à qui
 * s'inscrit.
 */
export async function POST(request: Request) {
  await requireRole("admin", "manager", "seller");

  const form = await request.formData().catch(() => null);
  const fichier = form?.get("fichier");
  if (!(fichier instanceof File)) {
    return Response.json({ ok: false, error: "Aucun fichier reçu." }, { status: 400 });
  }

  const dossier = String(form?.get("dossier") ?? "divers");
  const depot = await deposerImage(fichier, dossier);

  return Response.json(depot, { status: depot.ok ? 200 : 400 });
}
