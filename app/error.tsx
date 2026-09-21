"use client";

import Link from "next/link";
import { useEffect } from "react";
import { MasterMark } from "@/components/icons";

/**
 * Écran d'erreur d'un segment. Sans lui, Next affiche « A server error
 * occurred », qui ne dit rien à personne : ni au joueur, qui ne sait pas s'il
 * doit réessayer, ni à l'exploitant, qui n'a pas d'empreinte à chercher dans
 * ses journaux.
 */
export default function ErrorScreen({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[mb] rendu interrompu :", error);
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-5 px-5 text-center">
      <MasterMark size={40} />

      <div className="flex max-w-md flex-col gap-2">
        <h1 className="text-[24px]">Ça n&apos;a pas voulu s&apos;afficher</h1>
        <p className="text-[13.5px] leading-6 text-muted">
          Le serveur n&apos;a pas pu préparer cette page. Réessaie : si ça recommence, c&apos;est de notre
          côté, pas du tien.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={reset}
          className="press go flex h-12 items-center gap-2 rounded-full bg-gold px-6 text-sm font-semibold text-gold-ink"
        >
          Réessayer
        </button>
        <Link
          href="/app"
          className="press flex h-12 items-center rounded-full border border-line px-5 text-sm text-dim hover:text-ink"
        >
          Retour à l&apos;accueil
        </Link>
      </div>

      {error.digest ? (
        <p className="text-[11px] text-dim">
          Référence de l&apos;incident : <span className="font-mono text-muted">{error.digest}</span>
        </p>
      ) : null}
    </div>
  );
}
