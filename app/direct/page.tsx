import Link from "next/link";
import { Featured } from "@/components/live/Featured";
import { Rubrics, Shelf } from "@/components/live/Shelf";
import { StreamCard, type CardData } from "@/components/live/StreamCard";
import { Card } from "@/components/ui/Card";
import { ChevronLeftIcon } from "@/components/icons";
import { disciplineLabel, getShowcase, levelLabel, type StreamCard as Card_, type StreamLevel } from "@/lib/stream";

export const dynamic = "force-dynamic";
export const metadata = { title: "Les directs" };

const toCard = ({ stream, venue, match }: Card_): CardData => ({
  id: stream.id,
  title: stream.title,
  venue: venue.name,
  image: venue.image,
  poster: stream.poster ?? venue.image,
  status: stream.status,
  viewers: stream.viewers,
  level: levelLabel[stream.level as StreamLevel] ?? stream.level,
  access: stream.access,
  price: stream.price,
  discipline: disciplineLabel[stream.discipline] ?? stream.discipline,
  match: match ? { a: match.a, b: match.b, scoreA: match.scoreA, scoreB: match.scoreB } : null,
});

export default async function DirectShowcase({
  searchParams,
}: {
  searchParams: Promise<{ rayon?: string }>;
}) {
  const [{ rayon }, showcase] = await Promise.all([searchParams, getShowcase()]);

  // Un rayon demandé se déplie seul, le reste de la vitrine s'efface.
  if (rayon) {
    const shelf = showcase.shelves.find((s) => s.id === rayon);
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Link
            href="/direct"
            className="press flex items-center gap-1.5 text-[13px] text-muted transition hover:text-ink"
          >
            <ChevronLeftIcon size={15} /> Toute la vitrine
          </Link>
        </div>
        <h1 className="text-[26px]">{shelf?.title ?? "Rayon"}</h1>
        {shelf ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-x-4 gap-y-6">
            {shelf.cards.map((card) => (
              <StreamCard key={card.stream.id} card={toCard(card)} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-muted">Ce rayon est vide pour l&apos;instant.</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-[24px] lg:text-[28px]">Les directs</h1>
          <p className="text-[13px] text-muted">
            Les tables filmées des salles partenaires, en direct et en rediffusion.
          </p>
        </div>
      </header>

      {showcase.rail.length === 0 ? (
        <Card tone="dashed" shape="panel" className="px-5 py-12 text-center text-[13px] text-muted">
          Aucune caméra allumée pour l&apos;instant.
        </Card>
      ) : (
        <Featured cards={showcase.featured.map(toCard)} />
      )}

      <Rubrics items={showcase.rubrics} />

      {showcase.shelves.map((shelf, i) => (
        <Shelf
          key={shelf.id}
          title={shelf.title}
          href={shelf.href}
          cards={shelf.cards.map(toCard)}
          accent={i === 0}
        />
      ))}

      {showcase.replays.length > 0 ? (
        <Shelf title="Rediffusions" href="/direct?rayon=replays" cards={showcase.replays.map(toCard)} />
      ) : null}
    </div>
  );
}
