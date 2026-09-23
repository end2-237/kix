"use client";

import { PinIcon, TruckIcon } from "@/components/icons";
import { useRecuperation, type Recuperation as Mode } from "@/lib/cart";
import { DELIVERY_FEE } from "@/lib/constants";
import { f } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Retrait en salle ou livraison.
 *
 * Le même réglage, au rayon comme au panier : ce qu'on touche en haut de la
 * boutique est ce qu'on retrouve au moment de payer. Avant, les deux
 * pastilles du rayon n'étaient que du décor — on cliquait dessus sans effet,
 * ce qui est la pire chose qu'un bouton puisse faire.
 */
export function Recuperation({ className }: { className?: string }) {
  const { mode, setRecuperation } = useRecuperation();

  return (
    <div className={cn("glass flex gap-2.5 rounded-full p-1.5", className)}>
      <Choix
        actif={mode === "pickup"}
        onClick={() => setRecuperation("pickup")}
        icone={<PinIcon size={15} />}
        libelle="Retrait en salle · gratuit"
      />
      <Choix
        actif={mode === "delivery"}
        onClick={() => setRecuperation("delivery")}
        icone={<TruckIcon size={15} />}
        libelle={`Livraison · ${f(DELIVERY_FEE)}`}
      />
    </div>
  );
}

function Choix({
  actif,
  onClick,
  icone,
  libelle,
}: {
  actif: boolean;
  onClick: () => void;
  icone: React.ReactNode;
  libelle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={cn(
        "press flex h-11 grow items-center justify-center gap-1.5 truncate rounded-full px-2 text-xs transition",
        actif ? "border border-gold/40 bg-gold/15 font-semibold text-gold-text" : "text-muted hover:text-ink",
      )}
    >
      {icone}
      {libelle}
    </button>
  );
}

export type { Mode };
