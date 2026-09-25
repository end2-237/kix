import { ScreenHeader } from "@/components/mb/AppHeader";
import { Defis, type DefiVue } from "@/components/joueur/Defis";
import { Card } from "@/components/ui/Card";
import { mesDefis } from "@/lib/defis";
import { getBalance, getVenues } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes défis" };

/**
 * Les défis, reçus et lancés.
 *
 * Une rencontre naissait uniquement du comptoir. Ici, deux joueurs s'accordent
 * sur une salle et le match existe — le jeton du défieur est engagé à
 * l'acceptation, et la feuille s'ouvre comme pour n'importe quelle partie.
 */
export default async function MesDefis() {
  const moi = await requireUser();
  const [defis, salles, jetons] = await Promise.all([mesDefis(moi.id), getVenues(), getBalance(moi.id)]);

  const vues: DefiVue[] = defis.map(({ defi, adversaire, salle, aMoiDeRepondre }) => ({
    id: defi.id,
    statut: defi.status,
    adversaire: { id: adversaire.id, name: adversaire.name, avatar: adversaire.avatar },
    salle: salle ? { id: salle.id, name: salle.name } : null,
    target: defi.target,
    message: defi.message,
    aMoiDeRepondre,
    jeLance: defi.fromId === moi.id,
    matchId: defi.matchId,
  }));

  return (
    <>
      <ScreenHeader
        title="Mes défis"
        subtitle="Propose une salle, il accepte, et la partie compte."
        back="/app/rewards"
      />

      <Card shape="panel" className="flex items-baseline justify-between gap-3 p-4">
        <span className="text-[12.5px] text-muted">Jetons en poche</span>
        <span className="text-[19px] font-bold tracking-[-0.02em] text-gold-text">{jetons}</span>
      </Card>

      <Defis defis={vues} salles={salles.map((v) => ({ id: v.id, name: v.name }))} />
    </>
  );
}
