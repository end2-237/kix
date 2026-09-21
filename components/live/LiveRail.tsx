"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const [open, setOpen] = useState(true);
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
          onClick={() => setOpen((v) => !v)}
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
                <Image
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
