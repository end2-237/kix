import { Drawer, Field, PageHead, Pill, SubmitButton, Table, Td } from "@/components/admin/AdminUI";
import { deletePack, savePack } from "@/lib/actions";
import { db, packs } from "@/db";
import { f } from "@/lib/format";

export const metadata = { title: "Packs de jetons" };

export default async function AdminPacks() {
  const rows = await db.select().from(packs).orderBy(packs.sort);

  return (
    <>
      <PageHead
        title="Packs de jetons"
        subtitle="Le prix d'entrée du produit : ce que le client voit sur l'écran de recharge."
      />

      <Drawer summary="+ Nouveau pack">
        <form action={savePack} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Jetons" name="tokens" type="number" defaultValue={3} />
          <Field label="Prix (F)" name="price" type="number" defaultValue={1000} />
          <Field label="Jetons offerts" name="bonus" type="number" defaultValue={0} />
          <Field label="Ordre" name="sort" type="number" defaultValue={1} />
          <Field label="Accroche" name="hint" className="lg:col-span-2" />
          <Field label="Badge" name="badge" placeholder="Le plus pris" />
          <input type="hidden" name="active" value="on" />
          <div className="flex items-end">
            <SubmitButton>Créer le pack</SubmitButton>
          </div>
        </form>
      </Drawer>

      <Table head={["Pack", "Prix", "Prix / partie", "Offerts", "Badge", "État", ""]}>
        {rows.map((pack) => (
          <tr key={pack.id}>
            <Td className="font-semibold">
              {pack.tokens} jeton{pack.tokens > 1 ? "s" : ""}
            </Td>
            <Td className="font-semibold">{f(pack.price)}</Td>
            <Td className="text-muted">{f(Math.round(pack.price / (pack.tokens + pack.bonus)))}</Td>
            <Td>{pack.bonus > 0 ? `+${pack.bonus}` : "—"}</Td>
            <Td className="text-muted">{pack.badge ?? "—"}</Td>
            <Td>
              <Pill tone={pack.active ? "green" : "neutral"}>{pack.active ? "Actif" : "Retiré"}</Pill>
            </Td>
            <Td>
              <div className="flex items-center gap-2">
                <details className="relative">
                  <summary className="cursor-pointer rounded-full border border-line px-3 py-1.5 text-[11px] marker:hidden">
                    Éditer
                  </summary>
                  <form
                    action={savePack}
                    className="absolute right-0 z-10 mt-2 grid w-72 gap-3 border border-line bg-bg p-4 shadow-[var(--kix-shadow)]"
                  >
                    <input type="hidden" name="id" value={pack.id} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Jetons" name="tokens" type="number" defaultValue={pack.tokens} />
                      <Field label="Prix (F)" name="price" type="number" defaultValue={pack.price} />
                      <Field label="Offerts" name="bonus" type="number" defaultValue={pack.bonus} />
                      <Field label="Ordre" name="sort" type="number" defaultValue={pack.sort} />
                    </div>
                    <Field label="Accroche" name="hint" defaultValue={pack.hint} />
                    <Field label="Badge" name="badge" defaultValue={pack.badge} />
                    <input type="hidden" name="active" value="on" />
                    <SubmitButton />
                  </form>
                </details>
                <form action={deletePack}>
                  <input type="hidden" name="id" value={pack.id} />
                  <button className="rounded-full border border-line px-3 py-1.5 text-[11px] text-muted hover:text-amber">
                    Retirer
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
