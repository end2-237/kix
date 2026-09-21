import { NewStreamButton, StreamAdmin, type StreamRow } from "@/components/live/StreamAdmin";
import { Card } from "@/components/ui/Card";
import { createStream } from "@/lib/actions";
import { getVenueMatches } from "@/lib/live";
import { accessLabel, getVenueStreams, ingest, levelLabel, media, type StreamAccess, type StreamLevel } from "@/lib/stream";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Les directs" };

export default async function GerantDirect() {
  const manager = await requireRole("manager", "admin");
  if (!manager.venueId) {
    return (
      <Card shape="panel" className="flex flex-col gap-2 p-6">
        <h1 className="text-xl">Aucune salle rattachée</h1>
        <p className="text-[13px] text-muted">Rattache ce compte à une salle pour filmer ses tables.</p>
      </Card>
    );
  }

  const venueId = manager.venueId;
  const [cards, games] = await Promise.all([getVenueStreams(venueId), getVenueMatches(venueId)]);

  const rows: StreamRow[] = cards.map(({ stream, match }) => ({
    id: stream.id,
    title: stream.title,
    level: stream.level,
    levelLabel: levelLabel[stream.level as StreamLevel] ?? stream.level,
    access: stream.access,
    accessLabel: accessLabel[stream.access as StreamAccess] ?? stream.access,
    price: stream.price,
    status: stream.status,
    viewers: stream.viewers,
    peakViewers: stream.peakViewers,
    match: match ? `${match.a} vs ${match.b}` : null,
    ingest: ingest(stream),
  }));

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl lg:text-[26px]">Les directs</h1>
          <p className="text-[13px] text-muted">
            Filme une table depuis un téléphone, une caméra fixe ou une régie. Le score du match s&apos;incruste tout
            seul.
          </p>
        </div>
        <NewStreamButton
          matches={games.map(({ match, a, b }) => ({ id: match.id, label: `${a.name} vs ${b.name}` }))}
          onCreate={async (form) => {
            "use server";
            const result = await createStream(form);
            return result.ok ? { ok: true } : { ok: false, error: result.error };
          }}
        />
      </header>

      {!media().configured ? (
        <Card tone="dashed" shape="square" className="px-4 py-3.5 text-[12.5px] text-muted">
          Le serveur média n&apos;est pas encore configuré (<code className="text-gold-text">MB_MEDIA_URL</code>). Les
          directs se créent, mais rien ne sera diffusé tant que MediaMTX n&apos;est pas branché.
        </Card>
      ) : null}

      <StreamAdmin rows={rows} />
    </>
  );
}
