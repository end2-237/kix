import { getLiveBoard, liveSignature } from "@/lib/live";
import { eventStream } from "@/lib/sse";

export const dynamic = "force-dynamic";

/** Flux du hub : tous les matchs en cours, poussés dès qu'un score bouge. */
export async function GET(request: Request) {
  return eventStream({
    signal: request.signal,
    signature: liveSignature,
    payload: async () => {
      const board = await getLiveBoard();
      return {
        live: board.live.map(summary),
        soon: board.soon.map(summary),
      };
    },
  });
}

function summary({ match, a, b, venue, table }: Awaited<ReturnType<typeof getLiveBoard>>["live"][number]) {
  return {
    id: match.id,
    status: match.status,
    scoreA: match.scoreA,
    scoreB: match.scoreB,
    target: match.target,
    turnId: match.turnId,
    kind: match.kind,
    label: match.label,
    a: { id: a.id, name: a.name, avatar: a.avatar },
    b: { id: b.id, name: b.name, avatar: b.avatar },
    venue: venue.name,
    table,
  };
}
