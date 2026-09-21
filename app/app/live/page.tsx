import { ScreenHeader } from "@/components/mb/AppHeader";
import { LiveBoard, type BoardMatch } from "@/components/live/LiveBoard";
import { getLiveBoard, type MatchCard } from "@/lib/live";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Master Break Live" };

/** Le serveur rend le premier état ; le flux SSE prend ensuite le relais. */
const toBoard = ({ match, a, b, venue, table }: MatchCard): BoardMatch => ({
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
});

export default async function LivePage() {
  await requireUser();
  const board = await getLiveBoard();

  return (
    <>
      <ScreenHeader
        title="Master Break Live"
        subtitle="Les scores des salles partenaires, manche par manche, en temps réel."
      />

      <LiveBoard
        initial={{ live: board.live.map(toBoard), soon: board.soon.map(toBoard) }}
        recent={board.recent.map(toBoard)}
      />
    </>
  );
}
