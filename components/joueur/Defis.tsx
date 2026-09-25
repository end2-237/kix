"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Photo } from "@/components/ui/Photo";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CheckIcon, PinIcon, TargetIcon } from "@/components/icons";
import { changerLeLieu, repondreDefi } from "@/lib/actions";
import { nomDuJeu } from "@/lib/regles";
import { cn } from "@/lib/cn";

export type DefiVue = {
  id: string;
  statut: string;
  adversaire: { id: string; name: string; avatar: string | null };
  salle: { id: string; name: string } | null;
  target: number;
  message: string;
  aMoiDeRepondre: boolean;
  jeLance: boolean;
  matchId: string | null;
};

/**
 * Mes défis.
 *
 * Trois gestes possibles, jamais plus : accepter, proposer une autre salle, ou
 * laisser tomber. Celui qui vient de proposer attend — on le lui dit, plutôt
 * que de lui montrer un bouton « accepter » qui refuserait.
 */
export function Defis({ defis, salles }: { defis: DefiVue[]; salles: { id: string; name: string }[] }) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [pending, start] = useTransition();
  const [lieu, setLieu] = useState<DefiVue | null>(null);

  const faire = (fn: () => Promise<{ ok: boolean; error?: string }>, mot: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) {
        notify("Impossible", { detail: res.error, tone: "warn" });
        return;
      }
      setLieu(null);
      notify(mot, { tone: "jade" });
      router.refresh();
    });

  if (defis.length === 0) {
    return (
      <Card tone="dashed" shape="panel" className="flex flex-col items-center gap-2 px-5 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-muted">
          <TargetIcon size={20} />
        </span>
        <p className="text-[13px] text-muted">
          Aucun défi. Ouvre la fiche d&apos;un joueur au classement pour lui en lancer un.
        </p>
        <Link href="/app/classement" className="press text-[12.5px] text-gold-text">
          Voir le classement →
        </Link>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {defis.map((d) => (
          <Card key={d.id} shape="panel" className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 text-[12px] font-semibold text-dim">
                {d.adversaire.avatar ? (
                  <Photo src={d.adversaire.avatar} alt="" width={44} height={44} className="h-11 w-11 object-cover" />
                ) : (
                  d.adversaire.name.slice(0, 2).toUpperCase()
                )}
              </span>
              <span className="flex min-w-0 grow flex-col gap-0.5">
                <Link href={`/app/joueurs/${d.adversaire.id}`} className="truncate text-[14.5px] font-semibold hover:underline">
                  {d.jeLance ? `Tu défies ${d.adversaire.name}` : `${d.adversaire.name} te défie`}
                </Link>
                <span className="flex flex-wrap items-center gap-x-2 text-[12px] text-muted">
                  <span className="flex items-center gap-1">
                    <PinIcon size={12} /> {d.salle?.name ?? "salle à fixer"}
                  </span>
                  <span>· {nomDuJeu(d.target)}</span>
                </span>
              </span>
              <Etat statut={d.statut} attend={d.aMoiDeRepondre} />
            </div>

            {d.message ? <p className="text-[12.5px] text-dim">« {d.message} »</p> : null}

            {d.statut === "accepte" && d.matchId ? (
              <Link
                href={`/app/live/${d.matchId}`}
                className="press flex h-11 items-center justify-center gap-2 rounded-full bg-gold text-[13px] font-semibold text-gold-ink"
              >
                <CheckIcon size={15} /> Ouvrir la feuille de match
              </Link>
            ) : d.statut === "propose" ? (
              <div className="flex flex-wrap gap-2">
                {d.aMoiDeRepondre ? (
                  <button
                    onClick={() => faire(() => repondreDefi(d.id, "accepte"), "Défi accepté")}
                    disabled={pending}
                    className="press flex h-11 grow items-center justify-center gap-2 rounded-full bg-gold text-[13px] font-semibold text-gold-ink disabled:opacity-50"
                  >
                    {pending ? <Spinner size={14} /> : <CheckIcon size={15} />} Accepter
                  </button>
                ) : (
                  <span className="flex h-11 grow items-center justify-center rounded-full border border-line text-[12.5px] text-muted">
                    En attente de sa réponse
                  </span>
                )}
                <button
                  onClick={() => setLieu(d)}
                  disabled={pending}
                  className="press h-11 rounded-full border border-line px-4 text-[12.5px] text-dim hover:text-ink disabled:opacity-50"
                >
                  Autre salle
                </button>
                <button
                  onClick={() =>
                    faire(
                      () => repondreDefi(d.id, d.jeLance ? "annule" : "refuse"),
                      d.jeLance ? "Défi annulé" : "Défi décliné",
                    )
                  }
                  disabled={pending}
                  className="press h-11 rounded-full border border-line px-4 text-[12.5px] text-muted hover:text-warn disabled:opacity-50"
                >
                  {d.jeLance ? "Annuler" : "Décliner"}
                </button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>

      <Sheet open={Boolean(lieu)} onClose={() => setLieu(null)} title="Proposer une autre salle">
        <div className="flex flex-col gap-2">
          <p className="text-[12.5px] text-muted">
            {lieu?.adversaire.name} recevra la nouvelle adresse, et ce sera à lui de dire oui.
          </p>
          {salles.map((v) => (
            <button
              key={v.id}
              onClick={() => lieu && faire(() => changerLeLieu(lieu.id, v.id), "Nouvelle salle proposée")}
              disabled={pending || lieu?.salle?.id === v.id}
              className={cn(
                "press flex h-12 items-center justify-between gap-3 rounded-panel border px-4 text-[13.5px] transition",
                lieu?.salle?.id === v.id ? "border-gold/45 bg-gold/10 text-gold-text" : "border-line hover:bg-surface-2",
              )}
            >
              {v.name}
              {lieu?.salle?.id === v.id ? <span className="text-[11.5px]">proposée</span> : <PinIcon size={15} className="text-muted" />}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}

function Etat({ statut, attend }: { statut: string; attend: boolean }) {
  const mot =
    statut === "accepte" ? "accepté" : statut === "refuse" ? "décliné" : statut === "annule" ? "annulé" : attend ? "à toi" : "en attente";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-0.5 text-[10.5px]",
        statut === "accepte"
          ? "border-jade/40 bg-jade/12 text-jade-text"
          : attend && statut === "propose"
            ? "border-gold/45 bg-gold/12 text-gold-text"
            : "border-line text-muted",
      )}
    >
      {mot}
    </span>
  );
}
