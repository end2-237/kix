"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Photo } from "@/components/ui/Photo";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useSnackbar } from "@/components/ui/Snackbar";
import { PlusIcon, SearchIcon } from "@/components/icons";
import { chercherDesJoueurs, demanderAmi } from "@/lib/actions";

export type Trouve = { id: string; name: string; avatar: string | null; points: number; code: string };

/**
 * Chercher quelqu'un, par son nom ou par son code à six chiffres.
 *
 * Le code est le bon chemin : « Blaise » remonte cinq homonymes, et rien
 * n'oblige personne à inscrire son vrai nom. Jamais par numéro de téléphone —
 * cela dirait si un numéro a un compte chez nous, ce qui n'est l'affaire de
 * personne.
 */
export function RechercheJoueur() {
  const router = useRouter();
  const { notify } = useSnackbar();
  const [terme, setTerme] = useState("");
  const [resultats, setResultats] = useState<Trouve[]>([]);
  const [cherche, chercher] = useTransition();
  const [envoi, envoyer] = useTransition();

  function lancer(valeur: string) {
    setTerme(valeur);
    if (valeur.trim().length < 2) {
      setResultats([]);
      return;
    }
    chercher(async () => setResultats(await chercherDesJoueurs(valeur)));
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label className="relative flex items-center">
        <SearchIcon size={16} className="absolute left-4 text-muted" />
        <input
          value={terme}
          onChange={(e) => lancer(e.target.value)}
          placeholder="Un nom, ou un code à six chiffres"
          className="h-12 w-full rounded-full border border-line bg-surface pr-4 pl-11 text-[13.5px] text-ink outline-none focus:border-gold"
        />
        {cherche ? <Spinner size={15} className="absolute right-4 text-muted" /> : null}
      </label>

      {terme.trim().length >= 2 && resultats.length === 0 && !cherche ? (
        <p className="px-1 text-[12.5px] text-muted">
          {/^\d{6}$/.test(terme.trim()) ? "Aucun joueur ne porte ce code." : "Personne de ce nom."}
        </p>
      ) : null}

      {resultats.map((j) => (
        <Card key={j.id} shape="panel" className="flex items-center gap-3 px-3.5 py-2.5">
          <Link href={`/app/joueurs/${j.id}`} className="flex min-w-0 grow items-center gap-3">
            {j.avatar ? (
              <Photo src={j.avatar} alt={j.name} width={36} height={36} className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold">
                {j.name.slice(0, 2).toUpperCase()}
              </span>
            )}
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-[13.5px] font-semibold">{j.name}</span>
              <span className="text-[11.5px] text-muted">
                {j.points} points · code {j.code}
              </span>
            </span>
          </Link>
          <button
            aria-label={`Ajouter ${j.name}`}
            disabled={envoi}
            onClick={() =>
              envoyer(async () => {
                const res = await demanderAmi(j.id);
                if (!res.ok) notify("Impossible", { detail: res.error, tone: "warn" });
                else {
                  notify(res.etat === "amis" ? `Tu es ami avec ${j.name}` : "Demande envoyée", { tone: "jade" });
                  router.refresh();
                }
              })
            }
            className="press grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold text-gold-ink transition hover:brightness-105 disabled:opacity-50"
          >
            {envoi ? <Spinner size={14} /> : <PlusIcon size={16} />}
          </button>
        </Card>
      ))}
    </div>
  );
}
