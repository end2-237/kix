import { computeStats, getMatch, getMatchEvents, matchSignature } from "@/lib/live";
import { eventStream } from "@/lib/sse";

export const dynamic = "force-dynamic";

/** Flux d'un match : score, joueur à la table, frise et statistiques. */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  return eventStream({
    signal: request.signal,
    signature: () => matchSignature(id),
    payload: async () => {
      const card = await getMatch(id);
      if (!card) return null;
      const events = await getMatchEvents(id);
      return {
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
    },
  });
}
