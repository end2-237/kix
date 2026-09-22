import Image from "next/image";
import Link from "next/link";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ArrowRightIcon, TrophyIcon } from "@/components/icons";
import { duree, getMesTournois, getTournaments } from "@/lib/tournaments";
import { CANDIDATURES, DISCIPLINES, ETATS } from "@/lib/tournois";
import { requireUser } from "@/lib/session";
import { f } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tournois" };

export default async function TournoisPage() {
  const user = await requireUser();
  const [affiche, miens] = await Promise.all([getTournaments(), getMesTournois(user.id)]);

  const engage = miens.filter((m) => m.player.status !== "retire");

  return (
    <>
      <ScreenHeader
        title="Tournois"
        subtitle="Des tableaux à élimination directe, du premier tour à la finale."
        action={
          <Link href="/app/classement" className="press text-[12px] text-gold-text">
            Classement
          </Link>
        }
      />

      {engage.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-semibold">Mes engagements</h2>
          {engage.map(({ player, tournament }) => (
            <Link key={player.id} href={`/app/tournois/${tournament.slug}`} className="press block">
              <Card tone="gold" shape="panel" className="flex items-center gap-3 p-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-gold-ink">
                  <TrophyIcon size={18} />
                </span>
                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="truncate text-[14px] font-semibold">{tournament.title}</span>
                  <span className="truncate text-[12px] text-muted">
                    {CANDIDATURES[player.status] ?? player.status}
                    {player.seed ? ` · tête de série n°${player.seed}` : ""}
                    {player.fee > 0 && player.payment !== "paye" ? " · droit à régler" : ""}
                  </span>
                </span>
                <ArrowRightIcon size={16} className="shrink-0 text-muted" />
              </Card>
            </Link>
          ))}
        </section>
      ) : null}

      {affiche.length === 0 ? (
        <Card tone="dashed" shape="panel" className="flex flex-col items-center gap-3 px-5 py-12 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-muted">
            <TrophyIcon size={24} />
          </span>
          <h2 className="text-lg">Aucun tournoi annoncé</h2>
          <p className="max-w-sm text-[13px] text-muted">
            Les salles partenaires ouvrent leurs tableaux ici. Reviens avant la prochaine édition.
          </p>
        </Card>
      ) : (
        <section className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
          {affiche.map(({ tournament, venue, acceptes }) => (
            <Link key={tournament.id} href={`/app/tournois/${tournament.slug}`} className="press block">
              <Card shape="panel" className="flex flex-col gap-3 overflow-hidden p-3.5">
                <div className="flex gap-3.5">
                  <span className="relative h-18 w-18 shrink-0 overflow-hidden rounded-card">
                    <Image src={tournament.image} alt="" fill sizes="72px" className="object-cover" />
                  </span>
                  <span className="flex min-w-0 grow flex-col gap-1">
                    <span className="truncate text-[15px] font-semibold">{tournament.title}</span>
                    <span className="truncate text-[12px] text-muted">
                      {DISCIPLINES[tournament.discipline] ?? tournament.discipline} · {tournament.size} places
                      {venue ? ` · ${venue.name}` : ""}
                    </span>
                    <span className="truncate text-[12px] text-dim">{duree(tournament)}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip tone={tournament.status === "inscriptions" ? "solid" : "neutral"} className="text-[11px]">
                    {ETATS[tournament.status] ?? tournament.status}
                  </Chip>
                  {tournament.prizePool > 0 ? (
                    <Chip tone="neutral" className="text-[11px]">
                      Dotation {f(tournament.prizePool)}
                    </Chip>
                  ) : null}
                  <Chip tone="neutral" className="text-[11px]">
                    {Number(acceptes)} joueur{Number(acceptes) > 1 ? "s" : ""} retenu
                    {Number(acceptes) > 1 ? "s" : ""}
                  </Chip>
                </div>
              </Card>
            </Link>
          ))}
        </section>
      )}
    </>
  );
}
