import { ScreensAdmin, type ScreenRow } from "@/components/live/ScreensAdmin";
import { Card } from "@/components/ui/Card";
import { enLigne, getVenueScreens } from "@/lib/screens";
import { getVenueStreams } from "@/lib/stream";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Les écrans" };

/**
 * Les téléviseurs de la salle.
 *
 * On ne découvre rien : un navigateur ne peut pas parcourir le réseau local.
 * Ce sont les écrans qui s'annoncent, et cette page sert à les adopter puis à
 * décider de ce que chacun montre.
 */
export default async function GerantEcrans({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const manager = await requireRole("manager", "admin");
  if (!manager.venueId) {
    return (
      <Card shape="panel" className="flex flex-col gap-2 p-6">
        <h1 className="text-xl">Aucune salle rattachée</h1>
        <p className="text-[13px] text-muted">Rattache ce compte à une salle pour piloter ses écrans.</p>
      </Card>
    );
  }

  // Le QR affiché sur le téléviseur porte `?code=` : scanné avec l'appareil
  // photo du téléphone, il ouvre cette page déjà remplie.
  const { code } = await searchParams;

  const [ecrans, directs] = await Promise.all([getVenueScreens(manager.venueId), getVenueStreams(manager.venueId)]);

  const rows: ScreenRow[] = ecrans.map((e) => ({
    id: e.id,
    name: e.name,
    online: enLigne(e),
    lastSeen: e.lastSeenAt?.toISOString() ?? null,
    streamId: e.streamId,
  }));

  const choix = directs.map(({ stream }) => ({
    id: stream.id,
    title: stream.title,
    live: stream.status === "live",
  }));

  return <ScreensAdmin rows={rows} streams={choix} prefill={code ?? ""} />;
}
