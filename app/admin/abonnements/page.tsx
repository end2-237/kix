import { Drawer, Field, PageHead, Pill, Select, SubmitButton, Switch, Table, Td, TextArea } from "@/components/admin/AdminUI";
import { savePlan } from "@/lib/actions";
import { avantages, getAbonnes, getPlans } from "@/lib/membres";
import { requireRole } from "@/lib/session";
import { f, fcfa } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Abonnements" };

const badges = [
  { value: "", label: "Aucun" },
  { value: "Populaire", label: "Populaire" },
  { value: "Meilleur prix", label: "Meilleur prix" },
  { value: "Nouveau", label: "Nouveau" },
];

const jour = (d: Date | null) =>
  d ? d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—";

export default async function AdminAbonnements() {
  await requireRole("admin");
  const [plans, abonnes] = await Promise.all([getPlans(true), getAbonnes()]);

  const actifs = abonnes.filter((a) => a.actif);
  const recette = abonnes.reduce((n, a) => n + Number(a.paye), 0);

  return (
    <>
      <PageHead
        title="Abonnements"
        subtitle="Les formules, et qui les a prises. L'abonnement ouvre les directs réservés et dispense du billet vidéo."
      />

      <div className="grid grid-cols-3 gap-2.5">
        <Chiffre valeur={String(actifs.length)} quoi="abonnés en cours" />
        <Chiffre valeur={String(abonnes.length - actifs.length)} quoi="abonnements échus" />
        <Chiffre valeur={fcfa(recette)} quoi="encaissé" />
      </div>

      <Drawer summary="+ Nouvelle formule">
        <form action={savePlan} className="grid gap-3 pt-3 lg:grid-cols-3">
          <Field label="Nom" name="name" required placeholder="Master Break · 3 mois" className="lg:col-span-2" />
          <Select label="Badge" name="badge" options={badges} />
          <Field label="Durée (mois)" name="months" type="number" min={1} defaultValue={1} />
          <Field label="Prix (F)" name="price" type="number" min={0} defaultValue={2000} />
          <Field label="Ordre" name="sort" type="number" defaultValue={0} />
          <Field label="Mention" name="hint" placeholder="Sans reconduction automatique" className="lg:col-span-3" />
          <TextArea
            label="Avantages (séparés par |)"
            name="perks"
            rows={2}
            className="lg:col-span-3"
          />
          <div className="flex items-center gap-4 lg:col-span-3">
            <Switch label="Proposée" name="active" />
            <SubmitButton>Créer la formule</SubmitButton>
          </div>
        </form>
      </Drawer>

      <Table head={["Formule", "Durée", "Prix", "Par mois", "Avantages", "État", ""]}>
        {plans.map((plan) => (
          <tr key={plan.id}>
            <Td className="font-semibold">{plan.name}</Td>
            <Td>{plan.months} mois</Td>
            <Td>{f(plan.price)}</Td>
            <Td>{f(Math.round(plan.price / Math.max(1, plan.months)))}</Td>
            <Td>{avantages(plan).length}</Td>
            <Td>
              <Pill tone={plan.active ? (plan.badge ? "gold" : "jade") : "neutral"}>
                {plan.active ? (plan.badge ?? "Proposée") : "Retirée"}
              </Pill>
            </Td>
            <Td>
              <Drawer summary="▸ Éditer">
                <form action={savePlan} className="grid gap-3 pt-3 lg:grid-cols-3">
                  <input type="hidden" name="id" value={plan.id} />
                  <input type="hidden" name="slug" value={plan.slug} />
                  <Field label="Nom" name="name" defaultValue={plan.name} className="lg:col-span-2" />
                  <Select label="Badge" name="badge" defaultValue={plan.badge ?? ""} options={badges} />
                  <Field label="Durée (mois)" name="months" type="number" min={1} defaultValue={plan.months} />
                  <Field label="Prix (F)" name="price" type="number" min={0} defaultValue={plan.price} />
                  <Field label="Ordre" name="sort" type="number" defaultValue={plan.sort} />
                  <Field label="Mention" name="hint" defaultValue={plan.hint} className="lg:col-span-3" />
                  <TextArea
                    label="Avantages (séparés par |)"
                    name="perks"
                    rows={2}
                    defaultValue={plan.perks}
                    className="lg:col-span-3"
                  />
                  <div className="flex items-center gap-4 lg:col-span-3">
                    <Switch label="Proposée" name="active" defaultChecked={plan.active} />
                    <SubmitButton />
                  </div>
                </form>
              </Drawer>
            </Td>
          </tr>
        ))}
      </Table>

      <PageHead title="Les abonnés" subtitle="Par échéance la plus lointaine." />

      <Table head={["Abonné", "Téléphone", "Échéance", "Renouvellements", "Total réglé", "État"]}>
        {abonnes.map((a) => {
          return (
            <tr key={a.id}>
              <Td className="font-semibold">{a.name}</Td>
              <Td>{a.phone}</Td>
              <Td>{jour(a.memberUntil)}</Td>
              <Td>{Number(a.renouvellements)}</Td>
              <Td>{f(Number(a.paye))}</Td>
              <Td>
                <Pill tone={a.actif ? "jade" : "neutral"}>{a.actif ? "En cours" : "Échu"}</Pill>
              </Td>
            </tr>
          );
        })}
      </Table>
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
