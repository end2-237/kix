import Link from "next/link";
import { Photo } from "@/components/ui/Photo";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { BoutonAmi } from "@/components/joueur/BoutonAmi";
import { Inviter, ReponseInvitation } from "@/components/joueur/Inviter";
import { RechercheJoueur } from "@/components/joueur/RechercheJoueur";
import { Card } from "@/components/ui/Card";
import { ArrowRightIcon, UserIcon } from "@/components/icons";
import { mesAmis } from "@/lib/joueurs";
import { invitationsEnvoyees, invitationsRecues, mesGroupes, ouJeJoue } from "@/lib/bande";
import { getVenues } from "@/lib/queries";
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
const quand = (d: Date) => {
  const minutes = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (minutes < 60) return `il y a ${Math.max(1, minutes)} min`;
  const heures = Math.round(minutes / 60);
  return heures < 24 ? `il y a ${heures} h` : `il y a ${Math.round(heures / 24)} j`;
};

export default async function AmisPage() {
  const moi = await requireUser();
  const [{ amis, recues, envoyees }, invitations, envois, groupes, salles, partie] = await Promise.all([
    mesAmis(moi.id),
    invitationsRecues(moi.id),
    invitationsEnvoyees(moi.id),
    mesGroupes(moi.id),
    getVenues(),
    ouJeJoue(moi.id),
  ]);

  const enAttente = invitations.filter((i) => i.invitation.status === "envoyee");

  return (
    <>
      <ScreenHeader
        title="Mes amis"
        subtitle="On te prévient dès qu'un ami se met à jouer."
        action={
          <Link href="/app/groupes" className="press text-[12px] text-gold-text">
            Mes groupes
          </Link>
        }
      />

      <Inviter
        amis={amis.map(({ autre }) => ({ id: autre!.id, name: autre!.name }))}
        groupes={groupes.map(({ crew }) => ({ id: crew.id, name: crew.name }))}
        salles={salles.map((v) => ({ id: v.id, name: v.name }))}
        salleEnCours={partie ? { id: partie.venue.id, name: partie.venue.name } : null}
        matchEnCours={partie?.match.id ?? null}
      />

      {invitations.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-semibold">
            On t&apos;invite {enAttente.length > 0 ? `· ${enAttente.length}` : ""}
          </h2>
          {invitations.slice(0, 6).map(({ invitation, de, venue, crew }) => (
            <Card
              key={invitation.id}
              tone={invitation.status === "envoyee" ? "gold" : "glass"}
              shape="panel"
              className="flex flex-col gap-2.5 p-3.5"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[13.5px] font-semibold">
                  {crew ? `${crew.name} · ${de.name}` : de.name}
                  {venue ? ` — ${venue.name}` : ""}
                </span>
                <span className="text-[12px] text-dim text-pretty">
                  {invitation.message || "Rejoins-nous."}
                </span>
                <span className="text-[11px] text-faint">{quand(invitation.createdAt)}</span>
              </span>
              <ReponseInvitation id={invitation.id} status={invitation.status} />
            </Card>
          ))}
        </section>
      ) : null}

      {envois.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-semibold">Mes invitations</h2>
          {envois.map((e) => (
            <Card key={e.batchId} shape="panel" className="flex flex-col gap-1 px-3.5 py-3">
              <span className="text-[12.5px]">
                {e.message || "Rejoins-nous."}
                {e.venue ? <span className="text-muted"> · {e.venue}</span> : null}
              </span>
              <span className="text-[11.5px] text-muted">
                {e.destinataires.filter((d) => d.status === "acceptee").length} sur{" "}
                {e.destinataires.length} {e.destinataires.length > 1 ? "viennent" : "vient"} ·{" "}
                {e.destinataires.map((d) => d.nom).join(", ")}
              </span>
            </Card>
          ))}
        </section>
      ) : null}

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
