"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import Image from "next/image";
import { StreamCard, type CardData } from "@/components/live/StreamCard";
import { ChevronRightIcon } from "@/components/icons";
import { cn } from "@/lib/cn";

/**
 * Un rayon de la vitrine : quatre vignettes de front sur grand écran, un
 * défilement au doigt sur téléphone, et « Afficher tout » qui déplie le reste.
 */
export function Shelf({
  title,
  href,
  cards,
  accent,
}: {
  title: string;
  href: string;
  cards: CardData[];
  accent?: boolean;
}) {
  const [all, setAll] = useState(false);
  const row = useRef<HTMLDivElement>(null);
  const visible = all ? cards : cards.slice(0, 4);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold">
          <Link href={href} className={cn("transition hover:underline", accent && "text-gold-text")}>
            {title}
          </Link>
        </h2>
        {cards.length > 4 ? (
          <button
            onClick={() => setAll((v) => !v)}
            className="press flex items-center gap-1 text-[12.5px] text-gold-text transition hover:underline"
          >
            {all ? "Réduire" : "Afficher tout"}
            <ChevronRightIcon size={13} className={cn("transition", all && "rotate-90")} />
          </button>
        ) : null}
      </div>

      <div
        ref={row}
        className={cn(
          "grid gap-x-4 gap-y-6",
          "grid-cols-[repeat(auto-fill,minmax(230px,1fr))]",
        )}
      >
        {visible.map((card) => (
          <StreamCard key={card.id} card={card} />
        ))}
      </div>
    </section>
  );
}

export type Rubric = { id: string; label: string; image: string; live: number };

/**
 * Les rubriques, en tuiles — l'entrée par discipline plutôt que par direct.
 * C'est la rangée qu'on regarde quand on ne cherche personne en particulier.
 */
export function Rubrics({ items }: { items: Rubric[] }) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[15px] font-semibold">Par discipline</h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
        {items.map((item) => (
          <Link key={item.id} href={`/direct?rayon=${item.id}`} className="group flex flex-col gap-2">
            <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-surface-2">
              <Image
                src={item.image}
                alt=""
                fill
                sizes="160px"
                className="object-cover opacity-70 transition duration-500 group-hover:scale-[1.05] group-hover:opacity-90"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2.5">
                <span className="text-[12.5px] font-semibold text-white">{item.label}</span>
              </span>
            </div>
            <span className="text-[11.5px] text-muted tabular-nums">
              {item.live} en direct
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
