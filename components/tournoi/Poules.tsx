import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { CheckIcon, ClockIcon } from "@/components/icons";
import { nomDeLaPoule, type ResultatPoule } from "@/lib/poules";
import { cn } from "@/lib/cn";
import { jeuCourt } from "@/lib/regles";

export type LignePoule = ResultatPoule & {
  nom: string;
  seed: number | null;
  /** Le compte derrière le nom : la ligne mène à son profil. */
  userId: string | null;
  qualifie: boolean;
};

export type DuelDePoule = {
  id: string;
  groupe: number;
  nomA: string;
  nomB: string;
  scoreA: number;
  scoreB: number;
  raceTo: number;
  termine: boolean;
  gagnantA: boolean;
};

/**
 * Les poules : qui est avec qui, où ils en sont, et ce qu'il reste à jouer.
 *
 * Trois questions, une seule page. Un joueur qui arrive à 20 h veut savoir
 * sa poule, sa place, et à quelle heure il rejoue — les faire chercher dans
 * trois écrans différents, c'est les faire ne rien regarder.
 *
 * Le classement se lit aux victoires, puis à la différence de manches : la
 * colonne « diff. » n'est pas une coquetterie, c'est elle qui départage la
 * moitié des poules.
 */
export function Poules({
  classements,
  duels,
  qualifiesParPoule,
}: {
  classements: LignePoule[][];
  duels: DuelDePoule[];
  qualifiesParPoule: number;
}) {
  if (classements.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
      {classements.map((lignes, i) => {
        const groupe = i + 1;
        const duelsDuGroupe = duels.filter((d) => d.groupe === groupe);
        const joues = duelsDuGroupe.filter((d) => d.termine);
        const aVenir = duelsDuGroupe.filter((d) => !d.termine);

        return (
          <Card key={groupe} shape="panel" className="flex flex-col gap-3 p-3.5" id={`poule-${groupe}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-[14px] font-semibold">Poule {nomDeLaPoule(groupe)}</h3>
              <span className="text-[11.5px] text-muted">
                {joues.length}/{duelsDuGroupe.length} duel{duelsDuGroupe.length > 1 ? "s" : ""} joué
                {joues.length > 1 ? "s" : ""}
              </span>
            </div>

            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr className="text-[10px] tracking-[0.08em] text-muted uppercase">
                  <th className="w-6 pb-1.5 text-left font-medium">#</th>
                  <th className="pb-1.5 text-left font-medium">Joueur</th>
                  <th className="w-8 pb-1.5 text-right font-medium">J</th>
                  <th className="w-8 pb-1.5 text-right font-medium">V</th>
                  <th className="w-10 pb-1.5 text-right font-medium">Diff.</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l, rang) => (
                  <tr
                    key={l.playerId}
                    className={cn(
                      "border-t border-line/70",
                      l.qualifie && "text-gold-text",
                    )}
                  >
                    <td className="py-2 tabular-nums">{rang + 1}</td>
                    <td className="max-w-0 truncate py-2 pr-2">
                      {l.userId ? (
                        <Link href={`/app/joueurs/${l.userId}`} className="press truncate underline-offset-2 hover:underline">
                          <span className={cn(l.qualifie && "font-semibold")}>{l.nom}</span>
                        </Link>
                      ) : (
                        <span className={cn("truncate", l.qualifie && "font-semibold")}>{l.nom}</span>
                      )}
                      {l.seed ? <span className="ml-1.5 text-[10px] text-faint">#{l.seed}</span> : null}
                    </td>
                    <td className="py-2 text-right tabular-nums">{l.joues}</td>
                    <td className="py-2 text-right font-semibold tabular-nums">{l.victoires}</td>
                    <td className="py-2 text-right tabular-nums">
                      {l.difference > 0 ? `+${l.difference}` : l.difference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="text-[10.5px] text-faint">
              Les {qualifiesParPoule} premier{qualifiesParPoule > 1 ? "s" : ""} sortent de la poule.
            </p>

            {aVenir.length > 0 ? (
              <div className="flex flex-col gap-1.5 border-t border-line pt-2.5">
                <span className="label-caps text-[10px]">À jouer</span>
                {aVenir.map((d) => (
                  <span key={d.id} className="flex items-center gap-2 text-[12px] text-dim">
                    <ClockIcon size={12} className="shrink-0 text-faint" />
                    <span className="min-w-0 grow truncate">
                      {d.nomA} <span className="text-faint">contre</span> {d.nomB}
                    </span>
                    <span className="shrink-0 text-[10.5px] text-faint">{jeuCourt(d.raceTo)}</span>
                  </span>
                ))}
              </div>
            ) : null}

            {joues.length > 0 ? (
              <div className="flex flex-col gap-1.5 border-t border-line pt-2.5">
                <span className="label-caps text-[10px]">Résultats</span>
                {joues.map((d) => (
                  <span key={d.id} className="flex items-center gap-2 text-[12px]">
                    <CheckIcon size={12} className="shrink-0 text-jade-text" />
                    <span className="min-w-0 grow truncate">
                      <span className={d.gagnantA ? "font-semibold" : "text-muted"}>{d.nomA}</span>
                      <span className="text-faint"> — </span>
                      <span className={!d.gagnantA ? "font-semibold" : "text-muted"}>{d.nomB}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {d.scoreA} — {d.scoreB}
                    </span>
                  </span>
                ))}
              </div>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}

/**
 * Le programme d'un tournoi : ce qui vient, et ce qui est fait.
 *
 * Distinct des poules, parce qu'il traverse aussi le tableau — un joueur
 * qualifié veut son prochain duel sans avoir à relire son classement.
 */
export type LigneProgramme = {
  id: string;
  quand: string;
  nomA: string;
  nomB: string;
  scoreA: number;
  scoreB: number;
  raceTo: number;
  termine: boolean;
  gagnantA: boolean;
};

export function Programme({ aVenir, joues }: { aVenir: LigneProgramme[]; joues: LigneProgramme[] }) {
  if (aVenir.length === 0 && joues.length === 0) return null;

  return (
    <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
      <Card shape="panel" className="flex flex-col gap-2.5 p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[14px] font-semibold">Prochains duels</h3>
          <Chip tone="neutral" className="text-[10.5px]">{aVenir.length}</Chip>
        </div>
        {aVenir.length === 0 ? (
          <p className="py-3 text-center text-[12.5px] text-muted">Tout est joué.</p>
        ) : (
          aVenir.slice(0, 12).map((d) => (
            <span key={d.id} className="flex items-center gap-2 text-[12.5px]">
              <span className="w-16 shrink-0 text-[10.5px] text-faint">{d.quand}</span>
              <span className="min-w-0 grow truncate text-dim">
                {d.nomA} <span className="text-faint">contre</span> {d.nomB}
              </span>
              <span className="shrink-0 text-[10.5px] text-faint">{jeuCourt(d.raceTo)}</span>
            </span>
          ))
        )}
      </Card>

      <Card shape="panel" className="flex flex-col gap-2.5 p-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[14px] font-semibold">Déjà joués</h3>
          <Chip tone="neutral" className="text-[10.5px]">{joues.length}</Chip>
        </div>
        {joues.length === 0 ? (
          <p className="py-3 text-center text-[12.5px] text-muted">Aucun résultat pour l&apos;instant.</p>
        ) : (
          joues.slice(0, 12).map((d) => (
            <span key={d.id} className="flex items-center gap-2 text-[12.5px]">
              <span className="w-16 shrink-0 text-[10.5px] text-faint">{d.quand}</span>
              <span className="min-w-0 grow truncate">
                <span className={d.gagnantA ? "font-semibold" : "text-muted"}>{d.nomA}</span>
                <span className="text-faint"> — </span>
                <span className={!d.gagnantA ? "font-semibold" : "text-muted"}>{d.nomB}</span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {d.scoreA} — {d.scoreB}
              </span>
            </span>
          ))
        )}
      </Card>
    </div>
  );
}
