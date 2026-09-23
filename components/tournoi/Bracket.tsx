import { Card } from "@/components/ui/Card";
import { nomDuTour } from "@/lib/bracket";
import { cn } from "@/lib/cn";
import { jeuCourt } from "@/lib/regles";

export type Place = { nom: string; seed: number | null } | undefined;

export type DuelView = {
  id: string;
  round: number;
  slot: number;
  a: Place;
  b: Place;
  aId: string | null;
  bId: string | null;
  scoreA: number;
  scoreB: number;
  winnerId: string | null;
  raceTo: number;
  status: string;
};

/**
 * L'arbre du tournoi, comme sur une affiche de Ligue des champions.
 *
 * Chaque tour est une colonne ; les colonnes se lisent de gauche à droite
 * jusqu'à la finale. Les duels d'un tour sont répartis sur toute la hauteur
 * (`justify-around`) : le duel du tour suivant se retrouve naturellement à
 * mi-chemin de ses deux nourriciers, ce qui dessine l'arbre sans un seul
 * calcul de position.
 *
 * Sur téléphone, l'arbre défile horizontalement : le réduire à la largeur de
 * l'écran le rendrait illisible bien avant de le rendre pratique.
 */
export function Bracket({ duels, tours }: { duels: DuelView[]; tours: number }) {
  if (duels.length === 0) return null;

  const colonnes: DuelView[][] = [];
  for (let round = 1; round <= tours; round++) {
    colonnes.push(duels.filter((d) => d.round === round).sort((x, y) => x.slot - y.slot));
  }

  return (
    <div className="-mx-5 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
      <div className="flex min-w-max items-stretch gap-4 lg:gap-6">
        {colonnes.map((colonne, i) => (
          <div key={i} className="flex w-[15.5rem] shrink-0 flex-col gap-2 lg:w-[17rem]">
            <span className="label-caps px-1 text-[10px]">{nomDuTour(i + 1, tours)}</span>
            <div className="flex grow flex-col justify-around gap-3">
              {colonne.map((duel) => (
                <DuelCard key={duel.id} duel={duel} dernier={i === colonnes.length - 1} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DuelCard({ duel, dernier }: { duel: DuelView; dernier: boolean }) {
  const joue = duel.status === "termine";
  const exempt = duel.status === "exempt";

  return (
    <div className="relative">
      <Card
        shape="card"
        tone={dernier ? "gold" : "glass"}
        className={cn("flex flex-col divide-y divide-line/70 overflow-hidden", exempt && "opacity-70")}
      >
        <Cote
          place={duel.a}
          score={duel.scoreA}
          gagnant={joue && duel.winnerId === duel.aId}
          joue={joue}
        />
        <Cote
          place={duel.b}
          score={duel.scoreB}
          gagnant={joue && duel.winnerId === duel.bId}
          joue={joue}
          exempt={exempt}
        />
      </Card>

      <span className="absolute -bottom-2.5 left-2.5 text-[9.5px] text-faint">
        {exempt ? "exempté" : joue ? jeuCourt(duel.raceTo) : `à jouer · ${jeuCourt(duel.raceTo)}`}
      </span>

      {/* Le trait qui relie au tour suivant : il tient dans l'écart entre
          deux colonnes, sans une seule position absolue à calculer. */}
      {!dernier ? (
        <span aria-hidden className="pointer-events-none absolute top-1/2 -right-4 h-px w-4 bg-line lg:-right-6 lg:w-6" />
      ) : null}
    </div>
  );
}

function Cote({
  place,
  score,
  gagnant,
  joue,
  exempt,
}: {
  place: Place;
  score: number;
  gagnant: boolean;
  joue: boolean;
  exempt?: boolean;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 px-3 py-2.5 text-[13px]",
        gagnant ? "font-semibold text-gold-text" : joue ? "text-muted" : "text-dim",
      )}
    >
      <span className="w-5 shrink-0 text-[10px] text-faint tabular-nums">
        {place?.seed ? `#${place.seed}` : ""}
      </span>
      <span className="min-w-0 grow truncate">
        {place ? place.nom : exempt ? "—" : "à désigner"}
      </span>
      {joue ? <span className="shrink-0 tabular-nums">{score}</span> : null}
    </span>
  );
}
