import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { FormulaireGroupe } from "@/components/joueur/Groupe";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ArrowRightIcon, UserIcon } from "@/components/icons";
import { getGroupes } from "@/lib/bande";
import { getVenues } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Les groupes" };

/**
 * Les groupes de billard.
 *
 * Une salle, c'est d'abord une bande. L'application connaissait des joueurs
 * isolés et des amitiés deux à deux ; il lui manquait le « nous ».
 */
export default async function GroupesPage() {
  const moi = await requireUser();
  const [groupes, salles] = await Promise.all([getGroupes(moi.id), getVenues()]);

  const miens = groupes.filter((g) => g.estMembre);
  const autres = groupes.filter((g) => !g.estMembre);

  return (
    <>
      <ScreenHeader
        title="Les groupes"
        subtitle="Ta bande du jeudi soir : un nom, une photo, et tout le monde d'un coup."
        action={
          <Link href="/app/amis" className="press text-[12px] text-gold-text">
            Mes amis
          </Link>
        }
      />

      <FormulaireGroupe salles={salles.map((v) => ({ id: v.id, name: v.name }))} />

      {miens.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-semibold">Mes groupes</h2>
          {miens.map((g) => (
            <Carte key={g.crew.id} groupe={g} />
          ))}
        </section>
      ) : null}

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[15px] font-semibold">
          {miens.length > 0 ? "Les autres bandes" : "Les bandes"}
        </h2>
        {autres.length === 0 ? (
          <Card tone="dashed" shape="panel" className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <span className="grid h-13 w-13 place-items-center rounded-full bg-surface-2 text-muted">
              <UserIcon size={22} />
            </span>
            <p className="max-w-sm text-[13px] text-muted">
              {miens.length > 0
                ? "Aucune autre bande pour l'instant."
                : "Personne n'a encore créé de groupe. Donne un nom au tien."}
            </p>
          </Card>
        ) : (
          autres.map((g) => <Carte key={g.crew.id} groupe={g} />)
        )}
      </section>
    </>
  );
}

function Carte({ groupe }: { groupe: Awaited<ReturnType<typeof getGroupes>>[number] }) {
  const { crew, venue, membres, estMembre, estChef } = groupe;
  return (
    <Link href={`/app/groupes/${crew.slug}`} className="press block">
      <Card tone={estMembre ? "gold" : "glass"} shape="panel" className="flex items-center gap-3 p-3.5">
        {crew.image ? (
          <Photo src={crew.image} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-2 text-[13px] font-bold">
            {crew.name.slice(0, 2).toUpperCase()}
          </span>
        )}
        <span className="flex min-w-0 grow flex-col gap-0.5">
          <span className="truncate text-[14px] font-semibold">{crew.name}</span>
          <span className="truncate text-[11.5px] text-muted">
            {membres} membre{membres > 1 ? "s" : ""}
            {venue ? ` · ${venue.name}` : ""}
            {crew.devise ? ` · ${crew.devise}` : ""}
          </span>
        </span>
        {estChef ? (
          <Chip tone="solid" className="shrink-0 text-[10px]">
            Chef
          </Chip>
        ) : null}
        <ArrowRightIcon size={15} className="shrink-0 text-muted" />
      </Card>
    </Link>
  );
}
