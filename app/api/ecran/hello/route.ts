import { annoncerEcran, purgerAppairages } from "@/lib/screens";

export const dynamic = "force-dynamic";

/**
 * Un téléviseur s'annonce.
 *
 * Il repart avec un jeton, qu'il garde, et un code, qu'il affiche. Tant que le
 * gérant ne l'a pas adopté, la ligne n'appartient à personne et ne montre rien
 * — l'appel est donc ouvert, comme l'est un écran qu'on vient de brancher.
 */
export async function POST() {
  // Les téléviseurs allumés un soir et jamais adoptés ne s'accumulent pas.
  await purgerAppairages().catch(() => 0);

  const { token, code } = await annoncerEcran();
  return Response.json({ token, code });
}
