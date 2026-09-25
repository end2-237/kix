import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { MatchLive, type LiveState } from "@/components/live/MatchLive";
import { computeStats, getHeadToHead, getMatch, getMatchEvents } from "@/lib/live";
import { Arbitre } from "@/components/joueur/Arbitre";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const card = await getMatch((await params).id);
  return { title: card ? `${card.a.name} – ${card.b.name}` : "Match" };
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const card = await getMatch(id);
  if (!card) notFound();

  // Les deux joueurs d'un duel désignent eux-mêmes qui tiendra la feuille.
  const duel = card.match.label === "Défi";
  const jeJoue = user.id === card.a.id || user.id === card.b.id;

  const { mesAmis } = await import("@/lib/joueurs");
  const { arbitresDuMatch } = await import("@/lib/live");
  const [carnet, arbitres] =
    duel && jeJoue
      ? await Promise.all([mesAmis(user.id), arbitresDuMatch(card.match.id)])
      : [null, [] as { id: string; name: string }[]];

  // On ne propose pas son adversaire comme arbitre de sa propre rencontre.
  const amis = (carnet?.amis ?? [])
    .map((a) => a.autre)
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .filter((a) => a.id !== card.a.id && a.id !== card.b.id)
    .map((a) => ({ id: a.id, name: a.name, avatar: a.avatar }));

  const [events, h2h] = await Promise.all([
    getMatchEvents(id),
    getHeadToHead(card.match.playerAId, card.match.playerBId, id),
  ]);

  const initial: LiveState = {
    id: card.match.id,
    status: card.match.status,
    scoreA: card.match.scoreA,
    scoreB: card.match.scoreB,
    target: card.match.target,
    turnId: card.match.turnId,
    winnerId: card.match.winnerId,
    stats: computeStats(card.match, events),
    events: events.slice(0, 40).map((e) => ({
      id: e.id,
      kind: e.kind,
      playerId: e.playerId,
      detail: e.detail,
      scoreA: e.scoreA,
      scoreB: e.scoreB,
      at: e.createdAt.toISOString(),
    })),
  };

  return (
    <>
      <ScreenHeader
        title={`${card.a.name} – ${card.b.name}`}
        subtitle={`${card.venue.name}${card.table ? ` · table ${card.table}` : ""}`}
        back="/app/live"
      />

      <MatchLive
        initial={initial}
        a={{ id: card.a.id, name: card.a.name, avatar: card.a.avatar }}
        b={{ id: card.b.id, name: card.b.name, avatar: card.b.avatar }}
        h2h={{ played: h2h.played, winsA: h2h.winsA, winsB: h2h.winsB }}
        label={card.match.label}
        venue={card.venue.name}
        kind={card.match.kind}
      />

      {duel && jeJoue && card.match.status !== "done" && card.match.status !== "cancelled" ? (
        <Arbitre matchId={card.match.id} amis={amis} arbitres={arbitres} />
      ) : null}
    </>
  );
}
