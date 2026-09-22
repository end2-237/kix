import { Photo } from "@/components/ui/Photo";
import Link from "next/link";
import { LockIcon } from "@/components/icons";
import { cn } from "@/lib/cn";
import { f } from "@/lib/format";

export type CardData = {
  id: string;
  title: string;
  venue: string;
  image: string;
  poster: string;
  status: string;
  viewers: number;
  level: string;
  access: string;
  price: number;
  discipline: string;
  match: { a: string; b: string; scoreA: number; scoreB: number } | null;
};

const count = (n: number) =>
  n >= 1000 ? `${(n / 1000).toFixed(1).replace(".0", "").replace(".", ",")} k` : String(n);

/** La vignette d'un direct : miniature, état, titre, salle, étiquettes. */
export function StreamCard({ card, className }: { card: CardData; className?: string }) {
  const live = card.status === "live";

  return (
    <Link href={`/direct/${card.id}`} className={cn("group flex flex-col gap-2", className)}>
      <div className="relative aspect-video overflow-hidden rounded-card bg-black">
        <Photo
          src={card.poster}
          alt=""
          fill
          sizes="(min-width:1280px) 22vw, (min-width:768px) 32vw, 80vw"
          className="object-cover opacity-70 transition duration-500 group-hover:scale-[1.04] group-hover:opacity-90"
        />

        <span
          className={cn(
            "absolute top-2 left-2 rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.06em] uppercase",
            live ? "bg-warn text-bg" : "bg-black/70 text-white/80",
          )}
        >
          {live ? "Live" : "Replay"}
        </span>

        {card.access !== "free" ? (
          <span className="absolute top-2 right-2 flex items-center gap-1 rounded-[4px] bg-black/70 px-1.5 py-0.5 text-[10px] text-gold-text backdrop-blur-sm">
            <LockIcon size={9} />
            {card.access === "ppv" ? f(card.price) : "Abonnés"}
          </span>
        ) : null}

        {live ? (
          <span className="absolute bottom-2 left-2 rounded-[4px] bg-black/70 px-1.5 py-0.5 text-[10.5px] text-white tabular-nums backdrop-blur-sm">
            {count(card.viewers)} spectateurs
          </span>
        ) : null}

        {card.match ? (
          <span className="absolute right-2 bottom-2 rounded-[4px] bg-black/70 px-1.5 py-0.5 text-[10.5px] font-bold text-white tabular-nums backdrop-blur-sm">
            {card.match.scoreA} – {card.match.scoreB}
          </span>
        ) : null}
      </div>

      <div className="flex gap-2.5">
        <Photo
          src={card.image}
          alt=""
          width={34}
          height={34}
          className="mt-0.5 h-[34px] w-[34px] shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[13px] font-semibold transition group-hover:text-gold-text">
            {card.match ? `${card.match.a} vs ${card.match.b}` : card.title}
          </span>
          <span className="truncate text-[12px] text-muted">{card.venue}</span>
          {/* La seconde ligne n'apparaît que si elle dit autre chose. */}
          {card.match ? <span className="truncate text-[12px] text-muted">{card.title}</span> : null}
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Tag>{card.discipline}</Tag>
            <Tag>{card.level}</Tag>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] text-dim transition hover:bg-gold/15 hover:text-gold-text">
      {children}
    </span>
  );
}
