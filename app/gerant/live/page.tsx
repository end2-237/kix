import { MatchAdmin, NewMatchButton, type MatchLine } from "@/components/live/MatchAdmin";
import { Card } from "@/components/ui/Card";
import { getOfficials, getVenueMatches } from "@/lib/live";
import { getAllUsers, getVenueTables } from "@/lib/queries";
import { requireRole } from "@/lib/session";
import { createMatch } from "@/lib/actions";
import { db, venues } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Matchs" };

export default async function GerantLive() {
  const manager = await requireRole("manager", "admin");
  if (!manager.venueId) {
    return (
      <Card shape="panel" className="flex flex-col gap-2 p-6">
        <h1 className="text-xl">Aucune salle rattachée</h1>
        <p className="text-[13px] text-muted">Rattache ce compte à une salle pour organiser ses matchs.</p>
      </Card>
    );
  }

  const venueId = manager.venueId;
  const [cards, people, tables, venue] = await Promise.all([
    getVenueMatches(venueId),
    getAllUsers(),
    getVenueTables(venueId),
    db.select({ selfScoring: venues.selfScoring }).from(venues).where(eq(venues.id, venueId)).limit(1),
  ]);

  const lines: MatchLine[] = await Promise.all(
    cards.map(async ({ match, a, b, table }) => {
      const officials = await getOfficials(match);
      return {
        id: match.id,
        status: match.status,
        label: match.label,
        kind: match.kind,
        target: match.target,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        a: { id: a.id, name: a.name, avatar: a.avatar },
        b: { id: b.id, name: b.name, avatar: b.avatar },
        table,
        eventId: match.eventId,
        officials: officials.map((o) => ({
          id: o.official.id,
          name: o.user.name,
          scope: (o.official.eventId ? "event" : "match") as "match" | "event",
        })),
      };
    }),
  );

  const players = people
    .filter((u) => u.role !== "admin")
    .map((u) => ({ id: u.id, name: u.name, avatar: u.avatar }));

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl lg:text-[26px]">Les matchs</h1>
          <p className="text-[13px] text-muted">
            Crée une rencontre, confie la feuille, et le score part en direct dans l&apos;app.
          </p>
        </div>
        <NewMatchButton
          players={players}
          tables={tables.map((t) => ({ id: t.id, label: t.label }))}
          venueId={venueId}
          onCreate={async (form) => {
            "use server";
            const result = await createMatch(form);
            return result.ok ? { ok: true } : { ok: false, error: result.error };
          }}
        />
      </header>

      <MatchAdmin
        matches={lines}
        players={players}
        selfScoring={Boolean(venue[0]?.selfScoring)}
        venueId={venueId}
      />
    </>
  );
}
