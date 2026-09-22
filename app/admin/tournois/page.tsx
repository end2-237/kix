import { PageHead } from "@/components/admin/AdminUI";
import { FormulaireTournoi, ListeTournois, type LigneTournoi } from "@/components/tournoi/Organisation";
import { getTournaments } from "@/lib/tournaments";
import { getAllVenues } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tournois" };

export default async function AdminTournois() {
  await requireRole("admin");
  const [toutes, salles] = await Promise.all([getTournaments(true), getAllVenues()]);

  const lieux = [{ value: "", label: "Aucune salle" }, ...salles.map((v) => ({ value: v.id, label: v.name }))];
  const lignes: LigneTournoi[] = toutes.map((l) => ({
    ...l,
    acceptes: Number(l.acceptes),
    candidats: Number(l.candidats),
  }));

  return (
    <>
      <PageHead
        title="Tournois"
        subtitle="Les tableaux de toutes les salles, des candidatures à la finale."
      />
      <FormulaireTournoi salles={lieux} base="/admin/tournois" />
      <ListeTournois lignes={lignes} base="/admin/tournois" />
    </>
  );
}
