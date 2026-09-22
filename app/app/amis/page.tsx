import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { BoutonAmi } from "@/components/joueur/BoutonAmi";
import { RechercheJoueur } from "@/components/joueur/RechercheJoueur";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, UserIcon } from "@/components/icons";
import { mesAmis } from "@/lib/joueurs";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes amis" };

/**
 * La liste d'amis.
 *
 * Elle sert à une chose précise : savoir qu'un proche est à la table
 * maintenant. Les demandes reçues passent donc devant — une demande qui
 * dort, c'est une notification de match qui n'arrivera jamais.
 */
export default async function AmisPage() {
  const moi = await requireUser();
  const { amis, recues, envoyees } = await mesAmis(moi.id);

  return (
    <>
      <ScreenHeader
        title="Mes amis"
        subtitle="On te prévient dès qu'un ami se met à jouer."
        action={
          <Link href="/app/classement" className="press text-[12px] text-gold-text">
            Classement
          </Link>
        }
      />

      <RechercheJoueur />

      {recues.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-semibold">
            Demandes reçues · {recues.length}
          </h2>
          {recues.map(({ lien, autre }) => (
            <Card key={lien.id} tone="gold" shape="panel" className="flex flex-col gap-3 p-3.5">
              <Tete joueur={autre!} />
              <BoutonAmi autreId={autre!.id} nom={autre!.name} etat="recue" lienId={lien.id} />
            </Card>
          ))}
        </section>
      ) : null}

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[15px] font-semibold">
          Mes amis {amis.length > 0 ? `· ${amis.length}` : ""}
        </h2>
        {amis.length === 0 ? (
          <Card tone="dashed" shape="panel" className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <span className="grid h-13 w-13 place-items-center rounded-full bg-surface-2 text-muted">
              <UserIcon size={22} />
            </span>
            <p className="max-w-sm text-[13px] text-muted">
              Personne encore. Cherche un joueur par son nom : dès qu&apos;il accepte, tu sauras quand il
              est à la table.
            </p>
          </Card>
        ) : (
          amis.map(({ lien, autre }) => (
            <Link key={lien.id} href={`/app/joueurs/${autre!.id}`} className="press block">
              <Card shape="panel" className="flex items-center gap-3 px-3.5 py-3">
                <Tete joueur={autre!} />
                <ArrowRightIcon size={15} className="shrink-0 text-muted" />
              </Card>
            </Link>
          ))
        )}
      </section>

      {envoyees.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-semibold">Demandes envoyées</h2>
          {envoyees.map(({ lien, autre }) => (
            <Card key={lien.id} shape="panel" className="flex items-center gap-3 px-3.5 py-3">
              <Tete joueur={autre!} />
              <span className="shrink-0 text-[11.5px] text-muted">en attente</span>
            </Card>
          ))}
        </section>
      ) : null}
    </>
  );
}

function Tete({ joueur }: { joueur: { id: string; name: string; avatar: string | null; points: number } }) {
  return (
    <span className="flex min-w-0 grow items-center gap-3">
      {joueur.avatar ? (
        <Photo
          src={joueur.avatar}
          alt={joueur.name}
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-[12px] font-semibold">
          {joueur.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-[13.5px] font-semibold">{joueur.name}</span>
        <span className="text-[11.5px] text-muted">{joueur.points} points</span>
      </span>
    </span>
  );
}
