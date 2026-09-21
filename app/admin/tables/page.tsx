import { Drawer, Field, PageHead, Pill, SubmitButton, Table, Td } from "@/components/admin/AdminUI";
import { deleteTable, saveTable } from "@/lib/actions";
import { getAllVenues, getVenueTables } from "@/lib/queries";
import { f } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tables" };

const kinds = ["pool", "snooker", "billard français"];

export default async function AdminTables() {
  const venues = await getAllVenues();
  const perVenue = await Promise.all(
    venues.map(async (venue) => ({ venue, tables: await getVenueTables(venue.id) })),
  );

  return (
    <>
      <PageHead
        title="Tables et acomptes"
        subtitle="Une ligne par table réelle : type, tarif horaire et acompte demandé pour la retenir."
      />

      <Drawer summary="+ Nouvelle table">
        <form action={saveTable} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] tracking-[0.1em] text-muted uppercase">Salle</span>
            <select
              name="venueId"
              required
              className="h-11 rounded-none border border-line bg-surface px-3 text-[13px] text-ink outline-none focus:border-gold"
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <Field label="Numéro" name="label" placeholder="T09" required />
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] tracking-[0.1em] text-muted uppercase">Type</span>
            <select
              name="kind"
              className="h-11 rounded-none border border-line bg-surface px-3 text-[13px] text-ink outline-none focus:border-gold"
            >
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <Field label="Places" name="seats" type="number" defaultValue={4} />
          <Field label="Tarif horaire (F)" name="hourlyRate" type="number" defaultValue={2000} />
          <Field label="Acompte (F)" name="deposit" type="number" defaultValue={1000} />
          <Field label="Ordre" name="sort" type="number" defaultValue={0} />
          <input type="hidden" name="active" value="on" />
          <div className="flex items-end">
            <SubmitButton>Créer la table</SubmitButton>
          </div>
        </form>
      </Drawer>

      {perVenue.map(({ venue, tables }) => (
        <section key={venue.id} className="flex flex-col gap-3">
          <h2 className="text-[15px]">
            {venue.name} <span className="text-[12px] text-muted">· {tables.length} tables</span>
          </h2>

          <Table head={["Table", "Type", "Places", "Tarif/h", "Acompte", "État", ""]}>
            {tables.map((table) => (
              <tr key={table.id}>
                <Td className="font-semibold">{table.label}</Td>
                <Td className="text-muted capitalize">{table.kind}</Td>
                <Td>{table.seats}</Td>
                <Td>{table.hourlyRate ? f(table.hourlyRate) : "au jeton"}</Td>
                <Td>{f(table.deposit)}</Td>
                <Td>
                  <Pill tone={table.active ? (table.status === "free" ? "jade" : "gold") : "neutral"}>
                    {!table.active
                      ? "Retirée"
                      : table.status === "free"
                        ? "Libre"
                        : table.status === "closed"
                          ? "Fermée"
                          : table.status === "reserved"
                            ? "Réservée"
                            : "En jeu"}
                  </Pill>
                </Td>
                <Td>
                  <div className="flex items-center justify-end gap-2">
                    <details className="relative">
                      <summary className="cursor-pointer text-[12px] text-gold-text">Éditer</summary>
                      <form
                        action={saveTable}
                        className="absolute right-0 z-20 mt-2 grid w-[20rem] gap-2.5 border border-line bg-bg-2 p-3.5 shadow-xl"
                      >
                        <input type="hidden" name="id" value={table.id} />
                        <input type="hidden" name="venueId" value={venue.id} />
                        <Field label="Numéro" name="label" defaultValue={table.label} />
                        <Field label="Places" name="seats" type="number" defaultValue={table.seats} />
                        <Field label="Tarif horaire (F)" name="hourlyRate" type="number" defaultValue={table.hourlyRate} />
                        <Field label="Acompte (F)" name="deposit" type="number" defaultValue={table.deposit} />
                        <label className="flex items-center gap-2 text-[12px] text-muted">
                          <input type="checkbox" name="active" defaultChecked={table.active} />
                          Ouverte à la réservation
                        </label>
                        <input type="hidden" name="kind" value={table.kind} />
                        <input type="hidden" name="sort" value={table.sort} />
                        <SubmitButton>Enregistrer</SubmitButton>
                      </form>
                    </details>
                    <form action={deleteTable}>
                      <input type="hidden" name="id" value={table.id} />
                      <button className="text-[12px] text-muted hover:text-warn">Retirer</button>
                    </form>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </section>
      ))}
    </>
  );
}
