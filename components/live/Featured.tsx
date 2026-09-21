"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { StreamPlayer } from "@/components/live/StreamPlayer";
import { ChevronLeftIcon, ChevronRightIcon, PinIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { CardData } from "@/components/live/StreamCard";

const count = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(".0", "").replace(".", ",")} k` : String(n);

/**
 * La tête de vitrine : le direct du moment se joue vraiment, avec sa fiche à
 * côté. Les flèches font défiler les autres — c'est ce qui donne à la page son
 * air de chaîne plutôt que de catalogue.
 */
export function Featured({ cards }: { cards: CardData[] }) {
  const [index, setIndex] = useState(0);
  if (cards.length === 0) return null;

  const card = cards[Math.min(index, cards.length - 1)];
  const move = (step: number) => setIndex((i) => (i + step + cards.length) % cards.length);

  return (
    <section className="relative flex flex-col gap-3">
      <div className="flex items-stretch gap-3">
        {cards.length > 1 ? (
          <Arrow onClick={() => move(-1)} label="Direct précédent">
            <ChevronLeftIcon size={18} />
          </Arrow>
        ) : null}

        <div className="flex min-w-0 grow flex-col gap-3 lg:flex-row">
          <div className="min-w-0 grow">
            <StreamPlayer
              key={card.id}
              streamId={card.id}
              title={card.title}
              poster={card.poster}
              live={card.status === "live"}
              overlay={null}
            />
          </div>

          {/* La fiche du direct, à droite comme sur une page de chaîne. */}
          <aside className="flex shrink-0 flex-col gap-3 rounded-card border border-line bg-surface p-4 lg:w-64">
            <div className="flex items-center gap-2.5">
              <Image
                src={card.image}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-live/60"
              />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13.5px] font-semibold">{card.venue}</span>
                <span className="flex items-center gap-1 text-[11.5px] text-live tabular-nums">
                  <span className="live-dot h-1.5 w-1.5 rounded-full bg-live text-live" />
                  {count(card.viewers)} spectateurs
                </span>
              </span>
            </div>

            <p className="text-[13px] leading-5">
              {card.match ? `${card.match.a} vs ${card.match.b}` : card.title}
            </p>

            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] text-gold-text">{card.discipline}</span>
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-dim">{card.level}</span>
            </div>

            <span className="flex items-center gap-1.5 text-[11.5px] text-muted">
              <PinIcon size={12} /> {card.venue}
            </span>

            <Link
              href={`/direct/${card.id}`}
              className="press go mt-auto flex h-11 items-center justify-center gap-2 rounded-full bg-gold text-[13px] font-semibold text-gold-ink"
            >
              Regarder en grand
            </Link>
          </aside>
        </div>

        {cards.length > 1 ? (
          <Arrow onClick={() => move(1)} label="Direct suivant">
            <ChevronRightIcon size={18} />
          </Arrow>
        ) : null}
      </div>

      {cards.length > 1 ? (
        <div className="flex justify-center gap-1.5">
          {cards.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setIndex(i)}
              aria-label={`Direct ${i + 1}`}
              className={cn(
                "press h-1 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-gold" : "w-2 bg-line-strong hover:bg-muted",
              )}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Arrow({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="press hidden w-9 shrink-0 items-center justify-center rounded-card text-muted transition hover:bg-surface-2 hover:text-ink lg:flex"
    >
      {children}
    </button>
  );
}
