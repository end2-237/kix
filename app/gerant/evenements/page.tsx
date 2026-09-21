import { EventsAdmin, type EventRowView } from "@/components/gerant/EventsAdmin";
import { Card } from "@/components/ui/Card";
import { getVenueEvents } from "@/lib/queries";
import { requireRole } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Les événements" };

/**
 * L'agenda de la salle, et ce qu'il rapporte.
 *
 * Le gérant créait des événements sans jamais pouvoir les suivre : ni recette,
 * ni places vendues, ni liste de qui vient. C'est cette page.
 */
export default async function GerantEvenements() {
  const manager = await requireRole("manager", "admin");
  if (!manager.venueId) {
    return (
      <Card shape="panel" className="flex flex-col gap-2 p-6">
        <h1 className="text-xl">Aucune salle rattachée</h1>
        <p className="text-[13px] text-muted">Rattache ce compte à une salle pour tenir son agenda.</p>
      </Card>
    );
  }

  const lignes = await getVenueEvents(manager.venueId);

  const rows: EventRowView[] = lignes.map(({ event, vendus, entres, attente, recette }) => ({
    id: event.id,
    slug: event.slug,
    title: event.title,
    day: event.day,
    hours: event.hours,
    price: event.price,
    capacity: event.capacity,
    image: event.image,
    active: event.active,
    vendus: Number(vendus),
    entres: Number(entres),
    attente: Number(attente),
    recette: Number(recette),
  }));

  return <EventsAdmin rows={rows} />;
}
