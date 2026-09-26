"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Photo } from "@/components/ui/Photo";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { CheckIcon } from "@/components/icons";
import { repondreDemande } from "@/lib/actions";

/**
 * Les demandes d'entrée, quand la bande est sur approbation.
 *
 * Elles n'apparaissent qu'au chef, et se règlent d'un geste. Le classement du
 * demandeur est affiché : c'est la première chose qu'on regarde avant
 * d'ouvrir sa porte à un joueur qu'on ne connaît pas.
 */
export function Demandes({
  crewId,
  demandes,
}: {
  crewId: string;
  demandes: { id: string; name: string; avatar: string | null; points: number }[];
}) {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [pending, start] = useTransition();

  const repondre = (userId: string, nom: string, oui: boolean) =>
    start(async () => {
      const res = await repondreDemande(crewId, userId, oui);
      if (!res.ok) {
        notify("Impossible", { detail: res.error, tone: "warn" });
        return;
      }
      notify(oui ? `${nom} entre dans la bande` : "Demande écartée", { tone: oui ? "jade" : undefined });
      router.refresh();
    });

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-[15px] font-semibold">
        Demandes d&apos;entrée
        <span className="ml-2 text-[13px] text-muted">{demandes.length}</span>
      </h2>

      {demandes.map((d) => (
        <Card key={d.id} shape="panel" className="flex items-center gap-3 p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-2 text-[12px] font-semibold text-dim">
            {d.avatar ? (
              <Photo src={d.avatar} alt="" width={40} height={40} className="h-10 w-10 object-cover" />
            ) : (
              d.name.slice(0, 2).toUpperCase()
            )}
          </span>
          <span className="flex min-w-0 grow flex-col gap-0.5">
            <Link href={`/app/joueurs/${d.id}`} className="truncate text-[14px] font-semibold hover:underline">
              {d.name}
            </Link>
            <span className="text-[11.5px] text-muted">{d.points} points</span>
          </span>
          <button
            onClick={() => repondre(d.id, d.name, true)}
            disabled={pending}
            className="press flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-gold px-3.5 text-[12px] font-semibold text-gold-ink disabled:opacity-50"
          >
            {pending ? <Spinner size={13} /> : <CheckIcon size={14} />} Accepter
          </button>
          <button
            onClick={() => repondre(d.id, d.name, false)}
            disabled={pending}
            className="press h-10 shrink-0 rounded-full border border-line px-3 text-[12px] text-muted hover:text-warn disabled:opacity-50"
          >
            Refuser
          </button>
        </Card>
      ))}
    </section>
  );
}
