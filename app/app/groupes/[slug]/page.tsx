import Link from "next/link";
import { notFound } from "next/navigation";
import { Photo } from "@/components/ui/Photo";
import { BoutonGroupe, FormulaireGroupe, SupprimerGroupe } from "@/components/joueur/Groupe";
import { InviterAuGroupe } from "@/components/joueur/InviterAuGroupe";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ChevronLeftIcon, PinIcon } from "@/components/icons";
import { amisInvitables, getGroupe, membresDuGroupe } from "@/lib/bande";
import { getVenues } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lu = await getGroupe(slug);
  return { title: lu?.crew.name ?? "Groupe" };
}

export default async function FicheGroupe({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [lu, moi] = await Promise.all([getGroupe(slug), requireUser()]);
  if (!lu) notFound();

  const { crew, venue } = lu;
  const [membres, salles, invitables] = await Promise.all([
    membresDuGroupe(crew.id),
    getVenues(),
    amisInvitables(moi.id, crew.id),
  ]);

  const dedans = membres.filter((m) => m.membre.status === "membre");
  const attendus = membres.filter((m) => m.membre.status === "invite");
  const suisMembre = dedans.some((m) => m.user.id === moi.id);
  const suisInvite = attendus.some((m) => m.user.id === moi.id);
  const suisChef = crew.ownerId === moi.id;

  return (
    <>
      <div className="flex items-center gap-3 lg:hidden">
        <Link
          href="/app/groupes"
          aria-label="Retour"
          className="press grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-muted"
        >
          <ChevronLeftIcon size={17} />
        </Link>
        <span className="text-[13px] text-muted">Groupe de billard</span>
      </div>

      <Card tone="gold" shape="panel" className="flex flex-col gap-4 p-5">
        <div className="flex items-center gap-4">
          {crew.image ? (
            <Photo
              src={crew.image}
              alt={crew.name}
              width={72}
              height={72}
              className="h-18 w-18 shrink-0 rounded-full border-2 border-gold object-cover"
            />
          ) : (
            <span className="grid h-18 w-18 shrink-0 place-items-center rounded-full bg-surface-2 text-[20px] font-bold">
              {crew.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="flex min-w-0 grow flex-col gap-1">
            <h1 className="truncate text-[22px] leading-tight">{crew.name}</h1>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted">
              <span>
                {dedans.length} membre{dedans.length > 1 ? "s" : ""}
              </span>
              {venue ? (
                <span className="flex items-center gap-1.5">
                  <PinIcon size={12} /> {venue.name}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {crew.devise ? <p className="text-[13.5px] text-pretty italic">« {crew.devise} »</p> : null}

        <div className="flex flex-wrap items-center gap-2">
          <BoutonGroupe crewId={crew.id} membre={suisMembre} chef={suisChef} invite={suisInvite} />
          {suisMembre || suisChef ? (
            <InviterAuGroupe crewId={crew.id} nomDuGroupe={crew.name} amis={invitables} />
          ) : null}
          {suisChef ? (
            <FormulaireGroupe
              salles={salles.map((v) => ({ id: v.id, name: v.name }))}
              groupe={{
                id: crew.id,
                name: crew.name,
                image: crew.image,
                devise: crew.devise,
                venueId: crew.venueId,
              }}
            />
          ) : null}
        </div>

        {suisChef ? <SupprimerGroupe crewId={crew.id} nom={crew.name} membres={dedans.length} /> : null}
      </Card>

      <section className="flex flex-col gap-2.5">
        <h2 className="text-[15px] font-semibold">La bande</h2>
        {dedans.map(({ membre, user }) => (
          <Link key={membre.id} href={`/app/joueurs/${user.id}`} className="press block">
            <Card shape="panel" className="flex items-center gap-3 px-3.5 py-3">
              {user.avatar ? (
                <Photo
                  src={user.avatar}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-[12px] font-semibold">
                  {user.name.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="flex min-w-0 grow flex-col gap-0.5">
                <span className="truncate text-[13.5px] font-semibold">{user.name}</span>
                <span className="text-[11.5px] text-muted">{user.points} points</span>
              </span>
              {membre.role === "chef" ? (
                <Chip tone="solid" className="shrink-0 text-[10px]">
                  Chef
                </Chip>
              ) : null}
            </Card>
          </Link>
        ))}
      </section>

      {attendus.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-semibold">Invitations en attente · {attendus.length}</h2>
          {attendus.map(({ membre, user }) => (
            <Card key={membre.id} tone="dashed" shape="panel" className="flex items-center gap-3 px-3.5 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-[12px] font-semibold">
                {user.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="flex min-w-0 grow flex-col gap-0.5">
                <span className="truncate text-[13.5px]">{user.name}</span>
                <span className="text-[11.5px] text-muted">n&apos;a pas encore répondu</span>
              </span>
            </Card>
          ))}
        </section>
      ) : null}

      <p className="text-[11.5px] leading-5 text-muted">
        Un groupe sert d&apos;abord à inviter tout le monde d&apos;un coup depuis la page des amis. Ce
        qu&apos;il apportera de plus se décidera en le voyant vivre.
      </p>
    </>
  );
}
