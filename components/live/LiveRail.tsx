"use client";

import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

/* --------------------------------------------- mémoire du pliage, hors React

   Une préférence d'affichage vit dans le navigateur, pas dans un état de
   composant : elle doit survivre à la navigation. */

const PLIAGE = "mb.direct.rail";
const abonnes = new Set<() => void>();

const sAbonner = (prevenir: () => void) => {
  abonnes.add(prevenir);
  return () => abonnes.delete(prevenir);
};

const lirePliage = () => {
  try {
    return localStorage.getItem(PLIAGE) === "1";
  } catch {
    // Navigation privée ou stockage bloqué : la colonne s'ouvre, sans plus.
    return false;
  }
};

function ecrirePliage(plie: boolean) {
  try {
    localStorage.setItem(PLIAGE, plie ? "1" : "0");
  } catch {
    /* rien à retenir, tant pis */
  }
  abonnes.forEach((prevenir) => prevenir());
}
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

export type RailItem = {
  id: string;
  title: string;
  venue: string;
  image: string;
  category: string;
  viewers: number;
};

const count = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(".0", "").replace(".", ",")} k` : String(n);

/**
 * La colonne des directs en cours, toujours sous la main.
 *
 * Repliée, elle ne garde que les vignettes et le compteur : c'est la colonne
 * qu'on laisse ouverte pendant qu'on regarde autre chose.
 */
export function LiveRail({ items }: { items: RailItem[] }) {
  // Repliée, la colonne doit le rester : elle se rouvrait à chaque direct
  // ouvert, si bien qu'on la refermait dix fois par soirée et que le contenu
  // sautait de deux cents pixels à chaque fois. C'est ce qui passait pour un
  // bug d'affichage.
  //
  // Le stockage local est une source extérieure à React : `useSyncExternalStore`
  // la lit sans passer par un effet, et sans déclencher le rendu en cascade
  // qu'un `setState` synchrone provoquerait.
  const plie = useSyncExternalStore(sAbonner, lirePliage, () => false);
  const open = !plie;
  const basculer = () => ecrirePliage(!plie);

  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col gap-1 border-r border-line bg-surface/60 py-3 xl:flex",
        open ? "w-60" : "w-[72px]",
      )}
    >
      <div className={cn("flex items-center px-3 pb-2", open ? "justify-between" : "justify-center")}>
        {open ? (
          <span className="label-caps text-[11px] text-ink">Salles en direct</span>
        ) : null}
        <button
          onClick={basculer}
          aria-label={open ? "Replier la colonne" : "Déplier la colonne"}
          className="press grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
        >
          {open ? <ChevronLeftIcon size={16} /> : <ChevronRightIcon size={16} />}
        </button>
      </div>

      <div className="flex flex-col gap-0.5 overflow-y-auto px-1.5">
        {items.map((item) => {
          const active = pathname === `/direct/${item.id}`;
          return (
            <Link
              key={item.id}
              href={`/direct/${item.id}`}
              title={`${item.title} — ${item.venue}`}
              className={cn(
                "flex items-center gap-2.5 rounded-card px-1.5 py-2 transition",
                active ? "bg-gold/12" : "hover:bg-surface-2",
                !open && "justify-center",
              )}
            >
              <span className="relative shrink-0">
                <Photo
                  src={item.image}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg bg-live" />
              </span>

              {open ? (
                <>
                  <span className="flex min-w-0 grow flex-col">
                    <span className="truncate text-[13px] font-semibold">{item.venue}</span>
                    <span className="truncate text-[11.5px] text-muted">{item.category}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[11.5px] text-muted tabular-nums">
                    <span className="h-1.5 w-1.5 rounded-full bg-live" />
                    {count(item.viewers)}
                  </span>
                </>
              ) : null}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
