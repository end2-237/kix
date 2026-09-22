import { PageHead, Pill, Table, Td } from "@/components/admin/AdminUI";
import { Card } from "@/components/ui/Card";
import { getVendeurs } from "@/lib/seller";
import { requireRole } from "@/lib/session";
import { displayPhone } from "@/lib/phone";
import { f, fcfa } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendeurs" };

/**
 * La place de marché, vue de la plateforme.
 *
 * « Ce qu'on doit » est calculé depuis les lignes de vente payées, où la
 * commission est figée à la transaction — jamais recalculé depuis le taux du
 * jour, qui a pu changer depuis.
 */
export default async function AdminVendeurs() {
  await requireRole("admin");
  const vendeurs = await getVendeurs();
  const du = vendeurs.reduce((n, v) => n + Number(v.du), 0);

  return (
    <>
      <PageHead
        title="Vendeurs"
        subtitle={`${vendeurs.length} compte${vendeurs.length > 1 ? "s" : ""} vendeur · ${fcfa(du)} à reverser`}
      />

      {vendeurs.length === 0 ? (
        <Card tone="dashed" shape="panel" className="px-5 py-12 text-center text-[13px] text-muted">
          Aucun vendeur. Donne le rôle « Vendeur » à un compte depuis la page Utilisateurs.
        </Card>
      ) : (
        <Table head={["Vendeur", "Téléphone", "Articles", "À reverser"]}>
          {vendeurs.map(({ seller, articles, du: solde }) => (
            <tr key={seller.id}>
              <Td className="font-semibold">{seller.name}</Td>
              <Td>{displayPhone(seller.phone)}</Td>
              <Td>{Number(articles)}</Td>
              <Td>
                <Pill tone={Number(solde) > 0 ? "gold" : "neutral"}>{f(Number(solde))}</Pill>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {/* Dit plutôt que caché : la page annonce une dette, elle ne la règle
          pas. Laisser croire le contraire ferait attendre un vendeur pour
          rien. */}
      <Card shape="panel" className="flex flex-col gap-1.5 p-4">
        <span className="text-[13px] font-semibold">Les reversements ne sont pas automatisés</span>
        <span className="text-[12.5px] leading-5 text-muted">
          Ce tableau dit ce qui est dû, à partir des ventes encaissées. Le virement se fait encore à la main — un
          versement par pawaPay depuis la plateforme reste à construire, et suppose une trésorerie dédiée.
        </span>
      </Card>
    </>
  );
}
