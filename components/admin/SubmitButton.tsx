"use client";

import { useFormStatus } from "react-dom";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

/**
 * Le bouton d'envoi d'un formulaire d'administration.
 *
 * Il se désarme pendant l'envoi. Sans cela, deux appuis — le pouce hésitant
 * sur un téléphone, le réseau qui traîne — créaient deux soirées, deux
 * articles, deux cours. `useFormStatus` lit l'état du formulaire parent : il
 * n'y a rien à câbler, et le bouton sait tout seul quand il travaille.
 *
 * Ce n'est que la moitié du travail : un double envoi peut aussi venir d'un
 * rechargement ou d'une requête rejouée, et le serveur s'en garde de son côté.
 */
export function SubmitButton({ children = "Enregistrer" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "flex h-11 items-center gap-2 rounded-full bg-gold px-6 text-[13px] font-semibold text-gold-ink transition hover:brightness-105",
        pending && "cursor-progress opacity-60",
      )}
    >
      {pending ? <Spinner size={14} /> : null}
      {children}
    </button>
  );
}
