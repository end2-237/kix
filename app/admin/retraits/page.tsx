import { PageHead, Pill, Table, Td } from "@/components/admin/AdminUI";
import { TraiterRetrait } from "@/components/caisse/Retrait";
import { ETATS_RETRAIT, MOYENS, getRetraits } from "@/lib/caisse";
import { requireRole } from "@/lib/session";
import { displayPhone } from "@/lib/phone";
import { f, fcfa } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Retraits" };

const jour = (d: Date | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

/**
 * Les demandes de versement.
 *
 * Les demandes en attente passent devant, toujours : c'est de l'argent que
 * quelqu'un attend, et une salle qui attend son versement est une salle qui
 * cesse de vendre des jetons.
 */
export default async function AdminRetraits() {
  await requireRole("admin");
  const lignes = await getRetraits();

  const attente = lignes.filter((l) => l.payout.status === "demande");
  const duesTotal = attente.reduce((n, l) => n + l.payout.amount, 0);
  const verse = lignes.filter((l) => l.payout.status === "paye").reduce((n, l) => n + l.payout.amount, 0);

  return (
    <>
      <PageHead
        title="Retraits"
        subtitle="Ce que les salles et les vendeurs demandent à se faire verser. Le versement se fait chez l'opérateur, puis se note ici."
      />

      <div className="grid grid-cols-3 gap-2.5">
        <Chiffre valeur={String(attente.length)} quoi="demandes en attente" />
        <Chiffre valeur={fcfa(duesTotal)} quoi="à verser" />
        <Chiffre valeur={fcfa(verse)} quoi="déjà versé" />
      </div>

      <Table head={["Demandeur", "Pour", "Montant", "Moyen", "Demandé", "État", ""]}>
        {lignes.map(({ payout, user, venue }) => (
          <tr key={payout.id}>
            <Td className="font-semibold">
              {user.name}
              {payout.note ? <span className="block text-[11px] text-muted">{payout.note}</span> : null}
            </Td>
            <Td>{venue ? venue.name : "Ventes de la boutique"}</Td>
            <Td className="font-semibold">{f(payout.amount)}</Td>
            <Td>
              {MOYENS[payout.method] ?? payout.method}
              {payout.phone ? <span className="block text-[11px] text-muted">{displayPhone(payout.phone)}</span> : null}
            </Td>
            <Td>{jour(payout.createdAt)}</Td>
            <Td>
              <Pill tone={payout.status === "paye" ? "jade" : payout.status === "refuse" ? "warn" : "gold"}>
                {ETATS_RETRAIT[payout.status] ?? payout.status}
              </Pill>
              {payout.reference ? <span className="block text-[11px] text-muted">{payout.reference}</span> : null}
            </Td>
            <Td>{payout.status === "demande" ? <TraiterRetrait id={payout.id} /> : null}</Td>
          </tr>
        ))}
      </Table>

      {lignes.length === 0 ? (
        <p className="px-1 text-[13px] text-muted">Aucune demande pour l&apos;instant.</p>
      ) : null}
    </>
  );
}

function Chiffre({ valeur, quoi }: { valeur: string; quoi: string }) {
  return (
    <div className="flex flex-col gap-0.5 border border-line bg-surface px-3.5 py-3">
      <span className="text-[17px] leading-tight font-bold tracking-[-0.02em] tabular-nums">{valeur}</span>
      <span className="text-[11px] leading-tight text-muted">{quoi}</span>
    </div>
  );
}
