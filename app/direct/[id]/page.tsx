import { notFound } from "next/navigation";
import Link from "next/link";
import { WatchStream, type WatchGate } from "@/components/live/WatchStream";
import { Card } from "@/components/ui/Card";
import { ChevronLeftIcon, PinIcon, UserIcon } from "@/components/icons";
import { computeStats, getMatch, getMatchEvents } from "@/lib/live";
import { accessLabel, canWatch, getStream, levelLabel, type StreamAccess, type StreamLevel } from "@/lib/stream";
import type { LiveState } from "@/components/live/MatchLive";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const card = await getStream((await params).id);
  return { title: card?.stream.title ?? "Direct" };
}

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const card = await getStream(id);
  if (!card) notFound();

  const access = await canWatch(user, card.stream);
  const gate: WatchGate = access.ok ? { open: true } : { open: false, reason: access.reason, price: access.price };

  // Le direct peut être rattaché à un match : on prépare alors l'habillage.
  let match = null;
  if (card.stream.matchId) {
    const game = await getMatch(card.stream.matchId);
    if (game) {
      const events = await getMatchEvents(game.match.id);
      const initial: LiveState = {
        id: game.match.id,
        status: game.match.status,
        scoreA: game.match.scoreA,
        scoreB: game.match.scoreB,
        target: game.match.target,
        turnId: game.match.turnId,
        winnerId: game.match.winnerId,
        stats: computeStats(game.match, events),
        events: [],
      };
      match = {
        id: game.match.id,
        a: game.a.name,
        b: game.b.name,
        aId: game.a.id,
        bId: game.b.id,
        initial,
      };
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <Link href="/direct" className="press flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
          <ChevronLeftIcon size={15} /> Tous les directs
        </Link>
        <span className="text-[12.5px] text-muted">{card.venue.name}</span>
      </div>

      <h1 className="text-[22px] lg:text-[26px]">{card.stream.title}</h1>

      <WatchStream
        streamId={card.stream.id}
        title={card.stream.title}
        gate={gate}
        phone={user.phone}
        live={card.stream.status === "live"}
        poster={card.venue.image}
        match={match}
      />

      <Card shape="square" tone="dashed" className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3.5 text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <PinIcon size={13} /> {card.venue.name}
        </span>
        <span>{levelLabel[card.stream.level as StreamLevel] ?? card.stream.level}</span>
        <span>{accessLabel[card.stream.access as StreamAccess] ?? card.stream.access}</span>
        {card.stream.status === "live" ? (
          <span className="flex items-center gap-1.5">
            <UserIcon size={13} /> {card.stream.viewers} spectateurs
          </span>
        ) : (
          <span>Pic de {card.stream.peakViewers} spectateurs</span>
        )}
      </Card>
    </div>
  );
}
