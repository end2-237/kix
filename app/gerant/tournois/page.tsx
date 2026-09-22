import { FormulaireTournoi, ListeTournois, type LigneTournoi } from "@/components/tournoi/Organisation";
import { Card } from "@/components/ui/Card";
import { getTournaments } from "@/lib/tournaments";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Les tournois" };

/**
 * Les tournois de la salle.
 *
 * Un gérant organise chez lui : sa salle est déduite de son compte, et la
 * liste ne montre que ses tableaux. C'est la même console que
 * l'administration — seul le périmètre diffère.
 */
export default async function GerantTournois() {
  const manager = await requireRole("manager", "admin");
  if (!manager.venueId) {
    return (
      <Card shape="panel" className="flex flex-col gap-2 p-6">
        <h1 className="text-xl">Aucune salle rattachée</h1>
        <p className="text-[13px] text-muted">Rattache ce compte à une salle pour organiser un tournoi.</p>
      </Card>
    );
  }

  const toutes = await getTournaments(true);
  const lignes: LigneTournoi[] = toutes
    .filter((l) => l.tournament.venueId === manager.venueId)
    .map((l) => ({ ...l, acceptes: Number(l.acceptes), candidats: Number(l.candidats) }));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl lg:text-[26px]">Les tournois</h1>
        <p className="text-[13px] text-muted">
          Ouvre un tableau, retiens tes joueurs, saisis les scores. Le public y prend sa place comme pour une
          soirée.
        </p>
      </header>

      <FormulaireTournoi base="/gerant/tournois" />
      <ListeTournois lignes={lignes} base="/gerant/tournois" />
    </div>
  );
}
