import { Drawer, Field, PageHead, Pill, Select, SubmitButton, Table, Td, TextArea } from "@/components/admin/AdminUI";
import { deleteEvent, saveEvent } from "@/lib/actions";
import { getAllEvents, getAllVenues } from "@/lib/queries";
import { f } from "@/lib/format";

export const metadata = { title: "Événements" };

export default async function AdminEvents() {
  const [rows, venues] = await Promise.all([getAllEvents(), getAllVenues()]);
  const venueOptions = venues.map((v) => ({ value: v.id, label: v.name }));

  return (
    <>
      <PageHead title="Événements" subtitle="Tournois et soirées : capacité, prix du billet, salle d'accueil." />

      <Drawer summary="+ Nouvel événement">
        <form action={saveEvent} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Titre" name="title" required className="lg:col-span-2" />
          <Field label="Sous-titre" name="subtitle" className="lg:col-span-2" />
          <Field label="Jour" name="day" placeholder="Samedi 03 octobre" />
          <Field label="Horaires" name="hours" placeholder="18:00 → 23:30" />
          <Field label="Check-in" name="checkin" placeholder="dès 17:30" />
          <Select label="Salle" name="venueId" options={venueOptions} />
          <Field label="Prix (F)" name="price" type="number" defaultValue={3000} />
          <Field label="Capacité" name="capacity" type="number" defaultValue={120} />
          <Field label="Image" name="image" defaultValue="/img/crowd-lights.jpg" />
          <Field label="Tags (virgules)" name="tags" placeholder="Tournoi 8-ball,32 joueurs" />
          <Field label="Adresse" name="address" className="lg:col-span-2" />
          <TextArea label="Description" name="description" className="lg:col-span-4" />
          <input type="hidden" name="active" value="on" />
          <div className="flex items-end">
            <SubmitButton>Créer l&apos;événement</SubmitButton>
          </div>
        </form>
      </Drawer>

      <Table head={["Événement", "Salle", "Date", "Billet", "Inscrits", "Vendus", "État", ""]}>
        {rows.map(({ event, venue, sold }) => (
          <tr key={event.id}>
            <Td>
              <span className="flex flex-col">
                <span className="font-semibold">{event.title}</span>
                <span className="text-[11px] text-muted">{event.subtitle}</span>
              </span>
            </Td>
            <Td className="text-muted">{venue?.name ?? "—"}</Td>
            <Td className="text-muted">{event.day}</Td>
            <Td className="font-semibold">{f(event.price)}</Td>
            <Td>
              {event.attendees} / {event.capacity}
            </Td>
            <Td>{sold}</Td>
            <Td>
              <Pill tone={event.active ? "gold" : "neutral"}>{event.active ? "Publié" : "Archivé"}</Pill>
            </Td>
            <Td>
              <div className="flex items-center gap-2">
                <details className="relative">
                  <summary className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-[11px] marker:hidden">
                    Éditer
                  </summary>
                  <form
                    action={saveEvent}
                    className="absolute right-0 z-10 mt-2 grid w-80 gap-3 border border-line bg-bg p-4 shadow-[var(--mb-shadow)]"
                  >
                    <input type="hidden" name="id" value={event.id} />
                    <input type="hidden" name="slug" value={event.slug} />
                    <Field label="Titre" name="title" defaultValue={event.title} />
                    <Field label="Sous-titre" name="subtitle" defaultValue={event.subtitle} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Jour" name="day" defaultValue={event.day} />
                      <Field label="Horaires" name="hours" defaultValue={event.hours} />
                      <Field label="Prix (F)" name="price" type="number" defaultValue={event.price} />
                      <Field label="Capacité" name="capacity" type="number" defaultValue={event.capacity} />
                    </div>
                    <Select label="Salle" name="venueId" defaultValue={event.venueId} options={venueOptions} />
                    <Field label="Check-in" name="checkin" defaultValue={event.checkin} />
                    <Field label="Tags" name="tags" defaultValue={event.tags} />
                    <Field label="Image" name="image" defaultValue={event.image} />
                    <Field label="Adresse" name="address" defaultValue={event.address} />
                    <TextArea label="Description" name="description" defaultValue={event.description} />
                    <input type="hidden" name="active" value="on" />
                    <SubmitButton />
                  </form>
                </details>
                <form action={deleteEvent}>
                  <input type="hidden" name="id" value={event.id} />
                  <button className="rounded-full border border-line px-3 py-1.5 text-[11px] text-muted hover:text-warn">
                    Archiver
                  </button>
                </form>
              </div>
            </Td>
          </tr>
        ))}
      </Table>
    </>
  );
}
