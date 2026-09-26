import Link from "next/link";
import { ScreenHeader } from "@/components/mb/AppHeader";
import { Photo } from "@/components/ui/Photo";
import { Card } from "@/components/ui/Card";
import { LiveDot } from "@/components/live/LiveDot";
import { Suivre } from "@/components/live/Suivre";
import { BoltIcon } from "@/components/icons";
import { directsDeMesDiffuseurs, mesDiffuseurs } from "@/lib/suivis";
import { disciplineLabel } from "@/lib/stream";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes diffuseurs" };

/**
 * Les comptes que l'on suit, et ce qu'ils diffusent.
 *
 * La vitrine des directs montre ce qu'il y a ; cette page montre ce qu'on a
 * choisi. C'est la différence entre allumer la télévision et ouvrir la chaîne
 * qu'on regarde — et la raison d'être du bouton « Suivre ».
 */
export default async function MesDiffuseurs() {
  const moi = await requireUser();
  const [gens, directs] = await Promise.all([mesDiffuseurs(moi.id), directsDeMesDiffuseurs(moi.id)]);

  return (
    <>
      <ScreenHeader
        title="Mes diffuseurs"
        subtitle="Les comptes que tu suis, et leurs caméras."
        back="/direct"
      />

      {gens.length === 0 ? (
        <Card tone="dashed" shape="panel" className="flex flex-col gap-2 px-5 py-8">
          <h2 className="text-[15px]">Tu ne suis personne</h2>
          <p className="text-[13px] leading-6 text-muted">
            Sur la page d&apos;un direct tenu par un joueur, le bouton{" "}
            <span className="text-ink">Suivre</span> te prévient dès que sa caméra s&apos;allume. Plus besoin de
            tomber dessus par hasard.
          </p>
          <Link href="/direct" className="press w-fit text-[12.5px] text-gold-text">
            Voir la vitrine des directs →
          </Link>
        </Card>
      ) : null}

      {directs.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <BoltIcon size={16} /> Leurs directs
          </h2>
          {directs.map(({ stream, venue }) => (
            <Link key={stream.id} href={`/direct/${stream.id}`} className="press block">
              <Card shape="panel" className="flex items-center gap-3 px-3.5 py-3">
                <Photo
                  src={stream.poster ?? venue.image}
                  alt={stream.title}
                  width={64}
                  height={40}
                  className="h-10 w-16 shrink-0 rounded-lg object-cover"
                />
                <span className="flex min-w-0 grow flex-col gap-0.5">
                  <span className="truncate text-[13.5px] font-semibold">{stream.title}</span>
                  <span className="truncate text-[11.5px] text-muted">
                    {venue.name} · {disciplineLabel[stream.discipline] ?? stream.discipline}
                  </span>
                </span>
                {stream.status === "live" ? (
                  <span className="flex shrink-0 items-center gap-2 text-[11.5px] text-muted">
                    <LiveDot /> {stream.viewers}
                  </span>
                ) : (
                  <span className="shrink-0 text-[11.5px] text-faint">Rediffusion</span>
                )}
              </Card>
            </Link>
          ))}
        </section>
      ) : null}

      {gens.length > 0 ? (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-[15px] font-semibold">
            {gens.length} diffuseur{gens.length > 1 ? "s" : ""} suivi{gens.length > 1 ? "s" : ""}
          </h2>
          {gens.map((d) => (
            <Card key={d.id} shape="panel" className="flex items-center gap-3 px-3.5 py-3">
              <Link href={`/app/joueurs/${d.id}`} className="press flex min-w-0 grow items-center gap-3">
                {d.avatar ? (
                  <Photo
                    src={d.avatar}
                    alt={d.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-[12px] font-semibold">
                    {d.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-[13.5px] font-semibold">{d.name}</span>
                  <span className="text-[11.5px] text-muted">
                    {d.abonnes} abonné{d.abonnes > 1 ? "s" : ""} · {d.directs} direct{d.directs > 1 ? "s" : ""}
                  </span>
                </span>
              </Link>
              {d.enDirect ? (
                <Link href={`/direct/${d.enDirect.id}`} className="press shrink-0">
                  <LiveDot />
                </Link>
              ) : (
                <Suivre hostId={d.id} nom={d.name} suivi abonnes={d.abonnes} compact />
              )}
            </Card>
          ))}
        </section>
      ) : null}
    </>
  );
}
